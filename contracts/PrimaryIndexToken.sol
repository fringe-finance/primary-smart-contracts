// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "./openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

import "./openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./interfaces/IPriceProviderAggregator.sol";
import "./bToken/BLendingToken.sol";
import "./interfaces/IPrimaryIndexTokenLeverage.sol";

contract PrimaryIndexToken is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for ERC20Upgradeable;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    string public name;

    string public symbol;

    IPriceProviderAggregator public priceOracle; // address of price oracle with interface of PriceProviderAggregator

    address[] public projectTokens;
    mapping(address => ProjectTokenInfo) public projectTokenInfo; // project token address => ProjectTokenInfo

    address[] public lendingTokens;
    mapping(address => LendingTokenInfo) public lendingTokenInfo; // lending token address => LendingTokenInfo

    mapping(address => uint256) public totalDepositedProjectToken; // tokenAddress => PRJ token staked
    mapping(address => mapping(address => mapping(address => DepositPosition))) depositPosition; // user address => PRJ token address => lendingToken address => DepositPosition
    mapping(address => mapping(address => mapping(address => BorrowPosition))) public borrowPosition; // user address => project token address => lending token address => BorrowPosition

    mapping(address => mapping(address => uint256)) public totalBorrow; //project token address => total borrow by project token [] = prjToken
    mapping(address => mapping(address => uint256)) public borrowLimit; //project token address => limit of borrowing; [borrowLimit]=$
    mapping(address => uint256) public borrowLimitPerCollateral; //project token address => limit of borrowing; [borrowLimit]=$

    mapping(address => uint256) public totalBorrowPerLendingToken; //lending token address => total borrow by lending token [] - irrespective of the collateral assets used
    mapping(address => uint256) public borrowLimitPerLendingToken; //lending token address => limit of borrowing; [borrowLimit]=$
    mapping(address => mapping(address => address)) public lendingTokenPerCollateral; // user address => project token address => lending token address 
    address public usdcToken;

    mapping(address => bool) public isRelatedContract;

    IPrimaryIndexTokenLeverage public primaryIndexTokenLeverage;

    address public primaryIndexTokenModerator;

    struct Ratio {
        uint8 numerator;
        uint8 denominator;
    }

    struct ProjectTokenInfo {
        bool isListed;
        bool isDepositPaused; // true - paused, false - not paused
        bool isWithdrawPaused; // true - paused, false - not paused
        Ratio loanToValueRatio; 
        Ratio liquidationThresholdFactor;
        Ratio liquidationIncentive;
    }

    struct LendingTokenInfo {
        bool isListed;
        bool isPaused;
        BLendingToken bLendingToken;
    }

    // prjToken
    struct DepositPosition {
        uint256 depositedProjectTokenAmount;
    }

    // lendingToken
    struct BorrowPosition {
        uint256 loanBody;   // [loanBody] = lendingToken
        uint256 accrual;   // [accrual] = lendingToken
    }

    event Deposit(address indexed who, address indexed tokenPrj, address lendingToken, uint256 prjDepositAmount, address indexed beneficiary);

    event Withdraw(address indexed who, address indexed tokenPrj, address lendingToken, uint256 prjWithdrawAmount, address indexed beneficiary);

    event Supply(address indexed who, address indexed supplyToken, uint256 supplyAmount, address indexed supplyBToken, uint256 amountSupplyBTokenReceived);

    event Redeem(address indexed who, address indexed redeemToken, address indexed redeemBToken, uint256 redeemAmount);

    event RedeemUnderlying(address indexed who, address indexed redeemToken, address indexed redeemBToken, uint256 redeemAmountUnderlying);

    event Borrow(address indexed who, address indexed borrowToken, uint256 borrowAmount, address indexed prjAddress, uint256 prjAmount);

    event RepayBorrow(address indexed who, address indexed borrowToken, uint256 borrowAmount, address indexed prjAddress, bool isPositionFullyRepaid);

    function initialize() public initializer {
        name = "Primary Index Token";
        symbol = "PIT";
        __AccessControl_init();
        __ReentrancyGuard_init_unchained();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "PIT: Caller is not the Admin");
        _;
    }

    modifier isProjectTokenListed(address projectToken) {
        require(projectTokenInfo[projectToken].isListed, "PIT: project token is not listed");
        _;
    }

    modifier isLendingTokenListed(address lendingToken) {
        require(lendingTokenInfo[lendingToken].isListed, "PIT: lending token is not listed");
        _;
    }

    modifier onlyRelatedContracts() {
        require(isRelatedContract[msg.sender], "PIT: caller is not related Contract");
        _;
    }

    modifier onlyModeratorContract() {
        require(msg.sender == primaryIndexTokenModerator, "PIT: caller is not primaryIndexTokenModerator");
        _;
    }

    //************* ADMIN CONTRACT FUNCTIONS ********************************
    function setprimaryIndexTokenModerator(address newModeratorContract) public onlyAdmin {
        require(newModeratorContract != address(0), "PIT: invalid address");
        primaryIndexTokenModerator = newModeratorContract;
    }

    //************* MODERATOR CONTRACT FUNCTIONS ********************************
    function setPriceOracle(address _priceOracle) public onlyModeratorContract {
        priceOracle = IPriceProviderAggregator(_priceOracle);
    }

    function setPrimaryIndexTokenLeverage(address newPrimaryIndexTokenLeverage) public onlyModeratorContract {
        primaryIndexTokenLeverage = IPrimaryIndexTokenLeverage(newPrimaryIndexTokenLeverage);
    }

    function setRelatedContract(address relatedContract, bool isRelated) public onlyModeratorContract {
        isRelatedContract[relatedContract] = isRelated;
    }

    function getRelatedContract(address relatedContract) public view returns(bool) {
        return isRelatedContract[relatedContract];
    }

    function removeProjectToken(
        uint256 _projectTokenId,
        address projectToken
    ) public onlyModeratorContract {
        require(projectTokens[_projectTokenId] == projectToken, "PIT: invalid address");
        delete projectTokenInfo[projectToken];
        projectTokens[_projectTokenId] = projectTokens[projectTokens.length - 1];
        projectTokens.pop();
    }

    function removeLendingToken(
        uint256 _lendingTokenId,
        address lendingToken
    ) public onlyModeratorContract {
        require(lendingTokens[_lendingTokenId] == lendingToken, "PIT: invalid address");
        delete lendingTokenInfo[lendingToken];

        lendingTokens[_lendingTokenId] = lendingTokens[lendingTokens.length - 1];
        lendingTokens.pop();
    }
    function setUSDCToken(address usdc) public onlyModeratorContract {
        usdcToken = usdc;
    }

    function setBorrowLimitPerCollateral(address projectToken,uint256 _borrowLimit) public onlyModeratorContract {
        borrowLimitPerCollateral[projectToken] = _borrowLimit;
    }

    function setBorrowLimitPerLendingAsset(address lendingToken, uint256 _borrowLimit) public onlyModeratorContract {
        borrowLimitPerLendingToken[lendingToken] = _borrowLimit;
    }

    function setTotalBorrowPerLendingToken(address lendingToken, uint totalBorrowAmount) public onlyModeratorContract {
        totalBorrowPerLendingToken[lendingToken] = totalBorrowAmount;
    }

    function setProjectTokenInfo(
        address _projectToken,
        uint8 _loanToValueRatioNumerator,
        uint8 _loanToValueRatioDenominator,
        uint8 _liquidationThresholdFactorNumerator,
        uint8 _liquidationThresholdFactorDenominator,
        uint8 _liquidationIncentiveNumerator,
        uint8 _liquidationIncentiveDenominator
    ) public onlyModeratorContract {
        ProjectTokenInfo storage info = projectTokenInfo[_projectToken];
        if(!info.isListed){ 
            projectTokens.push(_projectToken);
            info.isListed = true;
        }
        info.loanToValueRatio = Ratio(_loanToValueRatioNumerator, _loanToValueRatioDenominator);
        info.liquidationThresholdFactor = Ratio(_liquidationThresholdFactorNumerator, _liquidationThresholdFactorDenominator);
        info.liquidationIncentive = Ratio(_liquidationIncentiveNumerator, _liquidationIncentiveDenominator);
    }

    function setPausedProjectToken(
        address _projectToken, 
        bool _isDepositPaused, 
        bool _isWithdrawPaused
    ) public onlyModeratorContract {
        projectTokenInfo[_projectToken].isDepositPaused = _isDepositPaused;
        projectTokenInfo[_projectToken].isWithdrawPaused = _isWithdrawPaused;
    } 

    function setLendingTokenInfo(
        address _lendingToken, 
        address _bLendingToken,
        bool _isPaused
    ) public onlyModeratorContract {
        if(!lendingTokenInfo[_lendingToken].isListed){
            lendingTokens.push(_lendingToken);
            lendingTokenInfo[_lendingToken].isListed = true;
        }
        
        LendingTokenInfo storage info = lendingTokenInfo[_lendingToken];
        
        info.isPaused = _isPaused;
        info.bLendingToken = BLendingToken(_bLendingToken);
    }

    function setPausedLendingToken(address _lendingToken, bool _isPaused) public onlyModeratorContract isLendingTokenListed(_lendingToken) {
        lendingTokenInfo[_lendingToken].isPaused = _isPaused;
    }

    //************* PUBLIC FUNCTIONS ********************************
    //************* Deposit FUNCTION ********************************

    function deposit(address projectToken, uint256 projectTokenAmount) public isProjectTokenListed(projectToken) nonReentrant() {
        _deposit(projectToken, projectTokenAmount, msg.sender, msg.sender);
    }

    function depositFromRelatedContracts(address projectToken, uint256 projectTokenAmount, address user, address beneficiary) public isProjectTokenListed(projectToken) nonReentrant() onlyRelatedContracts() {
        _deposit(projectToken, projectTokenAmount, user, beneficiary);
    }

    function _deposit(address projectToken, uint256 projectTokenAmount, address user, address beneficiary) internal {
        require(!projectTokenInfo[projectToken].isDepositPaused, "PIT: projectToken is paused");
        require(projectTokenAmount > 0, "PIT: projectTokenAmount==0");
        ERC20Upgradeable(projectToken).safeTransferFrom(user, address(this), projectTokenAmount);
        _calcDepositPosition(projectToken, projectTokenAmount, beneficiary);
        emit Deposit(user, projectToken, usdcToken, projectTokenAmount, beneficiary);
    }

    function calcAndTransferDepositPosition(address projectToken, uint256 projectTokenAmount, address user, address receiver) external isProjectTokenListed(projectToken) onlyRelatedContracts() nonReentrant returns(uint256) {
        DepositPosition storage _depositPosition = depositPosition[user][projectToken][usdcToken];
        _depositPosition.depositedProjectTokenAmount -= projectTokenAmount;
        totalDepositedProjectToken[projectToken] -= projectTokenAmount;
        ERC20Upgradeable(projectToken).safeTransfer(receiver, projectTokenAmount);
        return projectTokenAmount;
    }

    function calcDepositPosition(address projectToken, uint256 projectTokenAmount, address user) public isProjectTokenListed(projectToken) onlyRelatedContracts() onlyRelatedContracts() nonReentrant {
        _calcDepositPosition(projectToken, projectTokenAmount, user);
    }

    function _calcDepositPosition(address projectToken, uint256 projectTokenAmount, address beneficiary) internal {
        DepositPosition storage _depositPosition = depositPosition[beneficiary][projectToken][usdcToken]; //beneficiary = msg.sender
        _depositPosition.depositedProjectTokenAmount += projectTokenAmount;
        totalDepositedProjectToken[projectToken] += projectTokenAmount;
    }

    //************* Withdraw FUNCTION ********************************
    function withdraw(address projectToken, uint256 projectTokenAmount) public isProjectTokenListed(projectToken) nonReentrant {
        _withdraw(projectToken, projectTokenAmount, msg.sender, msg.sender);
    }

    function withdrawFromRelatedContracts(address projectToken, uint256 projectTokenAmount, address user, address beneficiar) public isProjectTokenListed(projectToken) nonReentrant returns(uint256) {
        return _withdraw(projectToken, projectTokenAmount, user, beneficiar);
    }

    function _withdraw(address projectToken, uint256 projectTokenAmount, address user, address beneficiar) internal returns(uint256){
        require(!projectTokenInfo[projectToken].isWithdrawPaused, "PIT: projectToken is paused");
        DepositPosition storage _depositPosition = depositPosition[user][projectToken][usdcToken];
        require(projectTokenAmount > 0 && _depositPosition.depositedProjectTokenAmount > 0, "PIT: invalid PRJ token amount or depositPosition doesn't exist");
        address actualLendingToken = getLendingToken(user, projectToken);
        uint256 _totalOutstanding;
        if(actualLendingToken != address(0) && borrowPosition[user][projectToken][actualLendingToken].loanBody > 0) {
            updateInterestInBorrowPositions(user, actualLendingToken);
            _totalOutstanding = actualLendingToken == address(0) ? 0 : totalOutstandingInUSD(user, projectToken, actualLendingToken);
        }

        if (projectTokenAmount == type(uint256).max) {
            if (borrowPosition[user][projectToken][actualLendingToken].loanBody > 0) {
                uint256 depositedProjectTokenAmount = _depositPosition.depositedProjectTokenAmount;
                uint256 collateralAvailableToWithdraw = getCollateralAvailableToWithdraw(user, projectToken);
                if (depositedProjectTokenAmount >= collateralAvailableToWithdraw){
                    projectTokenAmount = collateralAvailableToWithdraw;
                } else {
                    revert("Position under liquidation");
                }
            } else {
                projectTokenAmount = _depositPosition.depositedProjectTokenAmount;
            }
        }
        require(projectTokenAmount <= _depositPosition.depositedProjectTokenAmount, "PIT: try to withdraw more than available");
        _depositPosition.depositedProjectTokenAmount -= projectTokenAmount;
        if (_totalOutstanding >  0) {
            (uint256 healthFactorNumerator, uint256 healthFactorDenominator) = healthFactor(user, projectToken, actualLendingToken);
            if (healthFactorNumerator < healthFactorDenominator) {
                revert("PIT: withdrawable amount makes healthFactor<1");
            }
        }
        totalDepositedProjectToken[projectToken] -= projectTokenAmount;
        ERC20Upgradeable(projectToken).safeTransfer(beneficiar, projectTokenAmount);
        emit Withdraw(user, projectToken, actualLendingToken, projectTokenAmount, beneficiar);
        return projectTokenAmount;
    }

    //************* supply FUNCTION ********************************

    function supply(address lendingToken, uint256 lendingTokenAmount) public isLendingTokenListed(lendingToken) nonReentrant {
        _supply(lendingToken, lendingTokenAmount, msg.sender);
    }

    function supplyFromRelatedContract(address lendingToken, uint256 lendingTokenAmount, address user) public isLendingTokenListed(lendingToken) onlyRelatedContracts() nonReentrant {
        _supply(lendingToken, lendingTokenAmount, user);
    }

    function getCollateralAvailableToWithdraw(address account, address projectToken) public view returns(uint collateralProjectToWithdraw) {
        Ratio memory lvr = projectTokenInfo[projectToken].loanToValueRatio;
        uint depositRemaining = pitRemaining(account, projectToken); 
        collateralProjectToWithdraw = depositRemaining * lvr.denominator * (10 ** ERC20Upgradeable(projectToken).decimals()) / getTokenEvaluation(projectToken, 10 ** ERC20Upgradeable(projectToken).decimals()) / lvr.numerator;
    }

    function _supply(address lendingToken, uint256 lendingTokenAmount, address user) internal isLendingTokenListed(lendingToken) {
        require(!lendingTokenInfo[lendingToken].isPaused, "PIT: lending token is paused");
        require(lendingTokenAmount > 0, "PIT: lendingTokenAmount==0");

        (uint256 mintError, uint256 mintedAmount) = lendingTokenInfo[lendingToken].bLendingToken.mintTo(user, lendingTokenAmount);
        require(mintError == 0,"PIT: mintError!=0");
        require(mintedAmount > 0, "PIT: mintedAmount==0");

        emit Supply(user, lendingToken, lendingTokenAmount, address(lendingTokenInfo[lendingToken].bLendingToken), mintedAmount);
    }

    //************* redeem FUNCTION ********************************
    function redeem(address lendingToken, uint256 bLendingTokenAmount) public isLendingTokenListed(lendingToken) nonReentrant {
        _redeem(lendingToken, bLendingTokenAmount, msg.sender);
    }

    function redeemFromRelatedContract(address lendingToken, uint256 bLendingTokenAmount, address user) public isLendingTokenListed(lendingToken) onlyRelatedContracts() nonReentrant {
        _redeem(lendingToken, bLendingTokenAmount, user);
    }

    function _redeem(address lendingToken, uint256 bLendingTokenAmount, address user) internal {
        require(!lendingTokenInfo[lendingToken].isPaused, "PIT: lending token is paused");
        require(bLendingTokenAmount > 0, "PIT: bLendingTokenAmount==0");

        uint256 redeemError = lendingTokenInfo[lendingToken].bLendingToken.redeemTo(user, bLendingTokenAmount);
        require(redeemError == 0,"PIT: redeemError!=0. redeem>=supply.");

        emit Redeem(user, lendingToken, address(lendingTokenInfo[lendingToken].bLendingToken), bLendingTokenAmount);
    }

    //************* redeemUnderlying FUNCTION ********************************

    function redeemUnderlying(address lendingToken, uint256 lendingTokenAmount) public isLendingTokenListed(lendingToken) nonReentrant {
        _redeemUnderlying(lendingToken, lendingTokenAmount, msg.sender);
    }

    function redeemUnderlyingFromRelatedContract(address lendingToken, uint256 lendingTokenAmount, address user) public isLendingTokenListed(lendingToken) onlyRelatedContracts() nonReentrant {
        _redeemUnderlying(lendingToken, lendingTokenAmount, user);
    }

    function _redeemUnderlying(address lendingToken, uint256 lendingTokenAmount, address user) internal {
        require(!lendingTokenInfo[lendingToken].isPaused, "PIT: lending token is paused");
        require(lendingTokenAmount > 0, "PIT: lendingTokenAmount==0");

        uint256 redeemUnderlyingError = lendingTokenInfo[lendingToken].bLendingToken.redeemUnderlyingTo(user, lendingTokenAmount);
        require(redeemUnderlyingError == 0,"PIT:redeem>=supply");

        emit RedeemUnderlying(user, lendingToken, address(lendingTokenInfo[lendingToken].bLendingToken), lendingTokenAmount);
    }

    //************* borrow FUNCTION ********************************

    function borrow(address projectToken, address lendingToken, uint256 lendingTokenAmount) public isProjectTokenListed(projectToken) isLendingTokenListed(lendingToken) nonReentrant {
        _borrow(projectToken, lendingToken, lendingTokenAmount, msg.sender);
    } 

    function borrowFromRelatedContract(address projectToken, address lendingToken, uint256 lendingTokenAmount, address user) public isProjectTokenListed(projectToken) isLendingTokenListed(lendingToken) nonReentrant onlyRelatedContracts {
        _borrow(projectToken, lendingToken, lendingTokenAmount, user);
    } 

    function _borrow(address projectToken, address lendingToken, uint256 lendingTokenAmount, address user) internal {
        require(!primaryIndexTokenLeverage.isLeveragePosition(user, projectToken), "PIT: invalid position");
        address _lendingToken = lendingTokenPerCollateral[user][projectToken];
        uint borrowedUSD = totalOutstanding(user, projectToken, usdcToken);
        if (borrowedUSD > 0) {
            require(lendingToken == usdcToken, "PIT: invalid lending token");
        } else if(_lendingToken != address(0)) {
            require(lendingToken == _lendingToken, "PIT: invalid lending token");  
        }
        updateInterestInBorrowPositions(user, lendingToken);
        if (lendingTokenAmount == type(uint256).max) {
            lendingTokenAmount = convertPitRemaining(user, projectToken, lendingToken);
        }
        require(getTokenEvaluation(lendingToken, lendingTokenAmount) <= pitRemaining(user, projectToken), "PIT: lendingTokenAmount exceeds pitRemaining");
        require(getTotalBorrowPerCollateral(projectToken) + getTokenEvaluation(lendingToken, lendingTokenAmount) <= borrowLimitPerCollateral[projectToken], "PIT: totalBorrow exceeded borrowLimit per collateral asset");
        require(getTotalBorrowPerLendingToken(lendingToken) + getTokenEvaluation(lendingToken, lendingTokenAmount) <= borrowLimitPerLendingToken[lendingToken], "PIT: totalBorrow exceeded borrowLimit per lending asset");
        
        _calcBorrowPosition(user, projectToken, lendingToken, lendingTokenAmount, _lendingToken); 
        
        emit Borrow(user, lendingToken, lendingTokenAmount, projectToken, depositPosition[user][projectToken][usdcToken].depositedProjectTokenAmount);
    }

    function calcBorrowPosition(address borrower, address projectToken, address lendingToken, uint256 lendingTokenAmount, address currentLendingToken) external onlyRelatedContracts() nonReentrant {
        _calcBorrowPosition(borrower, projectToken, lendingToken, lendingTokenAmount, currentLendingToken); 
    }

    function _calcBorrowPosition(address borrower, address projectToken, address lendingToken, uint256 lendingTokenAmount, address currentLendingToken) internal {
        BorrowPosition storage _borrowPosition = borrowPosition[borrower][projectToken][lendingToken];
        LendingTokenInfo memory info = lendingTokenInfo[lendingToken];
        _borrowPosition.loanBody += lendingTokenAmount;
        totalBorrow[projectToken][lendingToken] += lendingTokenAmount;
        totalBorrowPerLendingToken[lendingToken] += lendingTokenAmount;

        if(currentLendingToken == address(0)) {
            lendingTokenPerCollateral[borrower][projectToken]  = lendingToken;
        }
        info.bLendingToken.borrowTo(borrower, lendingTokenAmount);
    }

    //************* repay FUNCTION ********************************
    
    function repay(address projectToken, address lendingToken, uint256 lendingTokenAmount) public isProjectTokenListed(projectToken) isLendingTokenListed(lendingToken) returns (uint256) {
        require(lendingTokenAmount > 0, "PIT: lendingTokenAmount==0");
        return _repay(msg.sender, msg.sender, projectToken, lendingToken, lendingTokenAmount);
    }

    function repayFromRelatedContract(address projectToken, address lendingToken, uint256 lendingTokenAmount, address repairer, address borrower) public isProjectTokenListed(projectToken) isLendingTokenListed(lendingToken) returns (uint256) {
        require(lendingTokenAmount > 0, "PIT: lendingTokenAmount==0");
        return _repay(repairer, borrower, projectToken, lendingToken, lendingTokenAmount); // under normal conditions: repairer == borrower
    }

    function _repay(address repairer, address borrower, address projectToken, address lendingToken, uint256 lendingTokenAmount) internal returns (uint256) {
        uint256 borrowPositionsAmount = 0;
        for(uint256 i = 0; i < projectTokens.length; i++) { 
            if (borrowPosition[borrower][projectTokens[i]][lendingToken].loanBody > 0) {
                borrowPositionsAmount++;
            }
        }
        BorrowPosition storage _borrowPosition = borrowPosition[borrower][projectToken][lendingToken];
        if (borrowPositionsAmount == 0 || _borrowPosition.loanBody == 0) {
            revert("PIT: no borrow position");
        }
        LendingTokenInfo memory info = lendingTokenInfo[lendingToken];
        updateInterestInBorrowPositions(borrower, lendingToken);
        uint256 amountRepaid;
        bool isPositionFullyRepaid;
        uint256 _totalOutstanding = totalOutstanding(borrower, projectToken, lendingToken);        
        if (borrowPositionsAmount == 1) {
            if (lendingTokenAmount > info.bLendingToken.borrowBalanceStored(borrower) || 
                lendingTokenAmount >= _totalOutstanding || 
                lendingTokenAmount == type(uint256).max) {
                amountRepaid = _repayTo(repairer, borrower, info, type(uint256).max);   
                isPositionFullyRepaid = _repayFully(borrower, projectToken, lendingToken, _borrowPosition);
            } else {
                uint256 lendingTokenAmountToRepay = lendingTokenAmount;
                amountRepaid = _repayTo(repairer, borrower, info, lendingTokenAmountToRepay);   
                isPositionFullyRepaid = _repayPartialy(projectToken, lendingToken, lendingTokenAmountToRepay, _borrowPosition);
            }
        } else {
            if (lendingTokenAmount >= _totalOutstanding || lendingTokenAmount == type(uint256).max) {
                amountRepaid = _repayTo(repairer, borrower, info, _totalOutstanding);   
                isPositionFullyRepaid = _repayFully(borrower, projectToken, lendingToken, _borrowPosition);
            } else {
                uint256 lendingTokenAmountToRepay = lendingTokenAmount;
                amountRepaid = _repayTo(repairer, borrower, info, lendingTokenAmountToRepay); 
                isPositionFullyRepaid = _repayPartialy(projectToken, lendingToken, lendingTokenAmountToRepay, _borrowPosition);
            }
        }

        emit RepayBorrow(borrower, lendingToken, amountRepaid, projectToken, isPositionFullyRepaid);
        return amountRepaid;
    }

    function _repayFully(address borrower, address projectToken, address lendingToken, BorrowPosition storage _borrowPosition) internal returns(bool) {
        totalBorrow[projectToken][lendingToken] -= _borrowPosition.loanBody;
        totalBorrowPerLendingToken[lendingToken] -= _borrowPosition.loanBody;
        _borrowPosition.loanBody = 0;
        _borrowPosition.accrual = 0;
        delete lendingTokenPerCollateral[borrower][projectToken];
        if(primaryIndexTokenLeverage.isLeveragePosition(borrower, projectToken)){
            primaryIndexTokenLeverage.deleteLeveragePosition(borrower, projectToken);
        }
        return true;
    }

    function _repayPartialy(address projectToken, address lendingToken, uint lendingTokenAmountToRepay, BorrowPosition storage _borrowPosition) internal returns(bool) {
        if (lendingTokenAmountToRepay > _borrowPosition.accrual) {
            lendingTokenAmountToRepay -= _borrowPosition.accrual;
            _borrowPosition.accrual = 0;
            totalBorrow[projectToken][lendingToken] -= lendingTokenAmountToRepay;
            totalBorrowPerLendingToken[lendingToken] -= lendingTokenAmountToRepay;
            _borrowPosition.loanBody -= lendingTokenAmountToRepay;
        } else {
            _borrowPosition.accrual -= lendingTokenAmountToRepay;
        }
        return false;
    }

    function _repayTo(address repairer, address borrower, LendingTokenInfo memory info, uint lendingTokenAmountToRepay) internal returns(uint amountRepaid) {
        (, amountRepaid) = info.bLendingToken.repayTo(repairer, borrower, lendingTokenAmountToRepay);
    }

    function updateInterestInBorrowPositions(address account, address lendingToken) public {
        uint256 cumulativeLoanBody = 0;
        uint256 cumulativeTotalOutstanding = 0;
        for(uint256 i = 0; i < projectTokens.length; i++) {
            BorrowPosition memory _borrowPosition = borrowPosition[account][projectTokens[i]][lendingToken];
            cumulativeLoanBody += _borrowPosition.loanBody;
            cumulativeTotalOutstanding += _borrowPosition.loanBody + _borrowPosition.accrual;
        }
        if (cumulativeLoanBody == 0) {
            return;
        }
        uint256 currentBorrowBalance = lendingTokenInfo[lendingToken].bLendingToken.borrowBalanceCurrent(account);
        if (currentBorrowBalance >= cumulativeTotalOutstanding){
            uint256 estimatedAccrual = currentBorrowBalance - cumulativeTotalOutstanding;
            BorrowPosition storage _borrowPosition;
            for(uint i = 0; i < projectTokens.length; i++) {
                _borrowPosition = borrowPosition[account][projectTokens[i]][lendingToken];
                _borrowPosition.accrual += estimatedAccrual * _borrowPosition.loanBody / cumulativeLoanBody;
            }
        }
    }

    //************* VIEW FUNCTIONS ********************************
    // pit = $ * LVR
    function pit(address account, address projectToken) public view returns (uint256) {
        uint8 lvrNumerator = projectTokenInfo[projectToken].loanToValueRatio.numerator;
        uint8 lvrDenominator = projectTokenInfo[projectToken].loanToValueRatio.denominator;
        uint256 evaluation = getTokenEvaluation(projectToken, depositPosition[account][projectToken][usdcToken].depositedProjectTokenAmount * lvrNumerator / lvrDenominator);
        return evaluation;
    }

    function getLendingToken(address user, address projectToken) public view returns(address actualLendingToken) {

        uint borrowedUSD = totalOutstanding(user, projectToken, usdcToken);

        address currentLendingToken = lendingTokenPerCollateral[user][projectToken];

        if (currentLendingToken != address(0)) {
            actualLendingToken = currentLendingToken;
        } else {
            actualLendingToken = borrowedUSD > 0 ? usdcToken : address(0);
        }
    }

    function pitRemaining(address account, address projectToken) public view returns (uint256) {
        address lendingToken = getLendingToken(account, projectToken);
        uint256 _pit = pit(account, projectToken);
        uint remaining;
        if(_pit > 0) {
            remaining = lendingToken == address(0) ? _pit : _pitRemaining(account, projectToken, lendingToken, _pit);
        } else {
            return 0;
        }
        return remaining;
    }

    function _pitRemaining(address account, address projectToken, address lendingToken, uint256 _pit) internal view returns (uint256) {
        uint256 _totalOutstandingInUSD = totalOutstandingInUSD(account, projectToken, lendingToken);
        if (_pit >= _totalOutstandingInUSD) {
            return _pit - _totalOutstandingInUSD;
        } else {
            return 0;
        }
    }

    // function liquidationThreshold(address account, address projectToken, address lendingToken) public view returns (uint256) {
    //     ProjectTokenInfo memory info = projectTokenInfo[projectToken];   
    //     uint256 liquidationThresholdFactorNumerator = info.liquidationThresholdFactor.numerator;
    //     uint256 liquidationThresholdFactorDenominator = info.liquidationThresholdFactor.denominator;
    //     uint256 _totalOutstanding = totalOutstandingInUSD(account, projectToken, lendingToken);
    //     return _totalOutstanding * liquidationThresholdFactorNumerator / liquidationThresholdFactorDenominator;
    // }

    function totalOutstanding(address account, address projectToken, address lendingToken) public view returns (uint256) {
        BorrowPosition memory _borrowPosition = borrowPosition[account][projectToken][lendingToken];
        return _borrowPosition.loanBody + _borrowPosition.accrual;
    }

    function healthFactor(address account, address projectToken, address lendingToken) public view returns (uint256 numerator, uint256 denominator) {
        numerator = pit(account, projectToken);
        denominator = totalOutstandingInUSD(account, projectToken, lendingToken);
    }

    function getTokenEvaluation(address token, uint256 tokenAmount) public view returns (uint256) {
        return priceOracle.getEvaluation(token, tokenAmount);
    }

    function lendingTokensLength() public view returns (uint256) {
        return lendingTokens.length;
    }

    function projectTokensLength() public view returns (uint256) {
        return projectTokens.length;
    }

    function getPosition(address account, address projectToken, address lendingToken) public view returns (uint256 depositedProjectTokenAmount, uint256 loanBody, uint256 accrual, uint256 healthFactorNumerator, uint256 healthFactorDenominator) {
        depositedProjectTokenAmount = getDepositedAmount(projectToken, account);
        loanBody = borrowPosition[account][projectToken][lendingToken].loanBody;
        uint256 cumulativeTotalOutstanding = 0;
        uint256 cumulativeLoanBody = 0;
        for(uint256 i = 0; i < projectTokens.length; i++) {
            cumulativeLoanBody += borrowPosition[account][projectTokens[i]][lendingToken].loanBody;
            cumulativeTotalOutstanding += totalOutstanding(account, projectTokens[i], lendingToken);

        }
        uint256 estimatedBorrowBalance = lendingTokenInfo[lendingToken].bLendingToken.getEstimatedBorrowBalanceStored(account);
        accrual = borrowPosition[account][projectToken][lendingToken].accrual;
        if (estimatedBorrowBalance >= cumulativeTotalOutstanding && cumulativeLoanBody > 0) {
            accrual += loanBody * (estimatedBorrowBalance - cumulativeTotalOutstanding) / cumulativeLoanBody;
        }
        healthFactorNumerator = pit(account, projectToken);
        uint amount = loanBody + accrual;
        healthFactorDenominator = getTokenEvaluation(lendingToken, amount);
    }

    function decimals() public pure returns (uint8) {
        return 6;
    }

    function getDepositedAmount(address projectToken, address user) public view returns (uint) {
        return depositPosition[user][projectToken][usdcToken].depositedProjectTokenAmount;
    }

    function getTotalBorrowPerCollateral(address projectToken) public view returns (uint) {
        require(lendingTokensLength() > 0, "PIT: list lendingTokens is empty");
        uint totalBorrowInUSD;
        for(uint i = 0; i < lendingTokensLength(); i++) {
            uint amount = totalBorrow[projectToken][lendingTokens[i]];
            totalBorrowInUSD += getTokenEvaluation(lendingTokens[i], amount);
        }
        return totalBorrowInUSD;
    }

    function getTotalBorrowPerLendingToken(address lendingToken) public view returns (uint) {
        uint amount = totalBorrowPerLendingToken[lendingToken];
        return getTokenEvaluation(lendingToken, amount);
    }

    // convert outstanding of each user to $ 
    function totalOutstandingInUSD(address account, address projectToken, address lendingToken) public view returns (uint256) {
        uint256 amount = totalOutstanding(account, projectToken, lendingToken);
        return getTokenEvaluation(lendingToken, amount);
    }

    function convertPitRemaining(address account, address projectToken, address lendingToken) public view returns(uint256) {
        uint256 pitRemainingValue = pitRemaining(account, projectToken);
        uint8 lendingTokenDecimals = ERC20Upgradeable(lendingToken).decimals();
        uint256 lendingTokenAmount = pitRemainingValue * (10 ** lendingTokenDecimals) / getTokenEvaluation(lendingToken, 10 ** lendingTokenDecimals); 
        return lendingTokenAmount;
    }
}
