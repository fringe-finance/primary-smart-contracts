// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "./openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

import "./openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./interfaces/IPriceProviderAggregator.sol";
import "./bToken/BLendingToken.sol";

contract PrimaryIndexToken is Initializable,
                                        ERC20Upgradeable,
                                        PausableUpgradeable,
                                        AccessControlUpgradeable,
                                        ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for ERC20Upgradeable;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    address public basicToken;  // address of USDC by default or any stablecoin

    address public priceOracle; // address of price oracle with interface of PriceProviderAggregator

    address[] public projectTokens;

    address[] public lendingTokens;

    mapping(address => Ratio) public lvr; // project token address => Lvr (Loan to Value Ratio)
    mapping(address => Ratio) public ltf; // project token address => Ltf (Liquidation Threshold Factor)
    mapping(address => Ratio) public prjSales; // project token address => PRJ sale info
    mapping(address => uint256) public totalStakedPrj; // tokenAddress => PRJ token staked
    mapping(address => mapping(uint256 => UserDepositPosition)) public userDepositPosition; // user address => PRJ token index => UserDepositPosition
    mapping(address => address) public bLendingTokensList; // underlying token address => BLendingToken address
    
    mapping(address => mapping(uint256 => mapping(uint256 => UserBorrowPosition))) public userBorrowPosition; //user address => lending tokens index => project token collateral => UserBorrowPosition
    mapping(address => bool) public isProjectTokenListed;   // project token address => isListed
    mapping(address => uint256) public indexProjectToken;   // project token address => index of project token in list `projectTokens`
    mapping(address => uint256) public indexLendingToken;   // lending token address => index of lending token in list `lendingTokens`

    struct Ratio{
        uint8 numerator;
        uint8 denominator;
    }
    
    struct UserDepositPosition{
        uint256 amountProjectTokenAvailable;
    }

    struct UserBorrowPosition{
        uint256 amountBorrowed;
        uint256 amountPit;
    }


    event AddPrjToken(address indexed who, address indexed tokenPrj);

    event LoanToValueRatioSet(address indexed who, address indexed tokenPrj, uint8 lvrNumerator, uint8 lvrDenominator);

    event LiquidationThresholdFactorSet(address indexed who, address indexed tokenPrj, uint8 ltfNumerator, uint8 ltfDenominator);

    event PrjSaleSet(address indexed who, address indexed tokenPrj, uint8 saleNumerator, uint8 saleDenominator);

    event Deposit(address indexed who, uint256 tokenPrjId, address indexed tokenPrj, uint256 prjDepositAmount, address indexed beneficiar);

    event Withdraw(address indexed who, uint256 tokenPrjId, address indexed tokenPrj, uint256 prjWithdrawAmount, address indexed beneficiar);

    event Supply(address indexed who, uint256 supplyTokenId, address indexed supplyToken, uint256 supplyAmount, address indexed supplyBToken, uint256 amountSupplyBTokenReceived);

    event Redeem(address indexed who, uint256 redeemTokenId, address indexed redeemToken, address indexed redeemBToken, uint256 redeemAmount);
    
    event RedeemUnderlying(address indexed who, uint256 redeemTokenId, address indexed redeemToken, address indexed redeemBToken, uint256 redeemAmountUnderlying);

    event Borrow(address indexed who, uint256 borrowTokenId, address indexed borrowToken, uint256 borrowAmount, address indexed prjAddress, uint256 prjAmount);

    event RepayBorrow(address indexed who, uint256 borrowTokenId, address indexed borrowToken, uint256 borrowAmount, address indexed prjAddress, bool isPositionFullyRepaid);

    event Liquidate(address indexed liquidator, address indexed borrower, uint256 lendingTokenId, uint256 prjId, uint256 amountPrjLiquidated);

    function init(address _basicToken, address _moderator) public initializer{
        basicToken = _basicToken;
        __ERC20_init("Primary Index Token", "PIT");
        __Pausable_init_unchained();
        __AccessControl_init_unchained();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, _moderator);
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not the Admin");
        _;
    }

    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "Caller is not the Moderator");
        _;
    }

    //************* ADMIN FUNCTIONS ********************************

    function addProjectToken(address _projectToken,
                             uint8 _lvrNumerator, uint8 _lvrDenominator, 
                             uint8 _ltfNumerator, uint8 _ltfDenominator,
                             uint8 _saleNumerator, uint8 _saleDenominator
                             ) public onlyAdmin {
        require(_lvrNumerator <= _lvrDenominator, "PIT: _lvrNumerator <= _lvrDenominator!");
        indexProjectToken[_projectToken] = projectTokens.length;
        projectTokens.push(_projectToken);
        emit AddPrjToken(msg.sender, _projectToken);
        _setLvr(_projectToken, _lvrNumerator, _lvrDenominator);
        _setLtf(_projectToken, _ltfNumerator, _ltfDenominator);
        _setPrjSale(_projectToken, _saleNumerator, _saleDenominator);
        isProjectTokenListed[_projectToken] = true;
    }

    function addLendingToken(address _lendingToken, address _bLendingToken) public onlyAdmin {
        require(_lendingToken != address(0) && _bLendingToken != address(0), "PIT: invalid input!");
        require(bLendingTokensList[_lendingToken] == address(0), "PIT: lendingToken is listed");
        indexLendingToken[_lendingToken] = lendingTokens.length;
        lendingTokens.push(_lendingToken);
        bLendingTokensList[_lendingToken] = _bLendingToken;
    }

    function setPriceOracle(address _priceOracle) public onlyAdmin{
        priceOracle = _priceOracle;
    }

    function grandModerator(address newModerator) public onlyAdmin{
        grantRole(MODERATOR_ROLE, newModerator);
    }

    function revokeModerator(address moderator) public onlyAdmin{
        revokeRole(MODERATOR_ROLE, moderator);
    }
    
    //************* MODERATOR FUNCTIONS ********************************

    function setLvr(address _projectToken, uint8 _lvrNumerator, uint8 _lvrDenominator) public onlyModerator{
        require(_lvrNumerator <= _lvrDenominator && _lvrDenominator > 0, "PIT: _lvrNumerator <= _lvrDenominator!");
        _setLvr(_projectToken, _lvrNumerator, _lvrDenominator);
    }

    function setLtf(address _projectToken, uint8 _ltfNumerator, uint8 _ltfDenominator) public onlyModerator{
        require(_ltfNumerator >= _ltfDenominator && _ltfDenominator > 0, "PIT: _ltfNumerator >= _ltfDenominator!");
        _setLtf(_projectToken, _ltfNumerator, _ltfDenominator);
    }

    function setPrjSale(address _projectToken, uint8 _saleNumerator, uint8 _saleDenominator) public onlyModerator{
        require(_saleNumerator <= _saleDenominator && _saleDenominator > 0, "PIT: _saleNumerator <= _saleDenominator!");
        _setPrjSale(_projectToken,_saleNumerator, _saleDenominator);
    }

    function _setLvr(address _projectToken, uint8 _lvrNumerator, uint8 _lvrDenominator) private {
        lvr[_projectToken] = Ratio({numerator:_lvrNumerator, denominator:_lvrDenominator});
        emit LoanToValueRatioSet(msg.sender, _projectToken, _lvrNumerator, _lvrDenominator);
    }

    function _setLtf(address _projectToken, uint8 _ltfNumerator, uint8 _ltfDenominator) private {
        ltf[_projectToken] = Ratio({numerator:_ltfNumerator, denominator:_ltfDenominator});
        emit LiquidationThresholdFactorSet(msg.sender, _projectToken, _ltfNumerator, _ltfDenominator);
    }

    function _setPrjSale(address _projectToken, uint8 _saleNumerator, uint8 _saleDenominator) private {
        prjSales[_projectToken] = Ratio({numerator:_saleNumerator, denominator:_saleDenominator});
        emit PrjSaleSet(msg.sender, _projectToken, _saleNumerator, _saleDenominator);
    }

    function pause() public onlyModerator {
        _pause();
    }

    function unpause() public onlyModerator{
        _unpause();
    }
  
    //************* PUBLIC FUNCTIONS ********************************

    function deposit(uint256 prjId, uint256 amountProjectToken) public {
        depositTo(prjId, amountProjectToken, msg.sender);
    }

    function depositTo(uint256 prjId, uint256 amountProjectToken, address beneficiar) public nonReentrant {
        require(prjId < projectTokens.length && amountProjectToken > 0, "PIT: invalid input");
        address tokenPrj = projectTokens[prjId];
        UserDepositPosition storage beneficiarDepositPosition = userDepositPosition[beneficiar][prjId];
        ERC20Upgradeable(tokenPrj).safeTransferFrom(msg.sender, address(this), amountProjectToken);
        beneficiarDepositPosition.amountProjectTokenAvailable += amountProjectToken;
        totalStakedPrj[tokenPrj] += amountProjectToken;
        emit Deposit(msg.sender, prjId, tokenPrj, amountProjectToken, beneficiar);
    }

    function withdraw(uint256 prjId, uint256 amountPrj) public {
        withdrawTo(prjId, amountPrj, msg.sender);
    }

    function withdrawTo(uint256 prjId, uint256 amountPrj, address beneficiar) public nonReentrant whenNotPaused {
        require(prjId < projectTokens.length && amountPrj > 0 && amountPrj <= userDepositPosition[msg.sender][prjId].amountProjectTokenAvailable, "PIT: invalid input");
        address tokenPrj = projectTokens[prjId];

        UserDepositPosition storage msgSenderPrjPosition = userDepositPosition[msg.sender][prjId];
        for(uint256 lendingTokenId = 0; lendingTokenId < lendingTokens.length; lendingTokenId++){
            UserBorrowPosition storage msgSenderBorrowPosition = userBorrowPosition[msg.sender][lendingTokenId][prjId];
            if(msgSenderBorrowPosition.amountBorrowed > 0){
                msgSenderPrjPosition.amountProjectTokenAvailable -= amountPrj;
                (uint256 newNum, uint256 newDenom) = healthFactorForPosition(msg.sender, lendingTokenId, prjId);
                if(newNum < newDenom){
                    revert("PIT: the new account health is less than 1 when withdrawing this amount of PRJ");
                }
                totalStakedPrj[tokenPrj] -= amountPrj;
                ERC20Upgradeable(tokenPrj).safeTransfer(beneficiar, amountPrj);
                emit Withdraw(msg.sender, prjId, tokenPrj, amountPrj, beneficiar);
                return;
            }
        }
        msgSenderPrjPosition.amountProjectTokenAvailable -= amountPrj;
        totalStakedPrj[tokenPrj] -= amountPrj;
        ERC20Upgradeable(tokenPrj).safeTransfer(beneficiar, amountPrj);
        emit Withdraw(msg.sender, prjId, tokenPrj, amountPrj, beneficiar);
        return;
    }

    function supply(uint256 lendingTokenId, uint256 amountLendingToken) public {
        require(lendingTokenId < lendingTokens.length && amountLendingToken > 0, "PIT: invalid input");
        address lendingToken = lendingTokens[lendingTokenId];
        address bLendingToken = bLendingTokensList[lendingToken];
        
        (uint256 mintError, uint256 mintedAmount) = BLendingToken(bLendingToken).mintTo(msg.sender,amountLendingToken);
        require(mintError == 0,"PIT:minting error");

        emit Supply(msg.sender, lendingTokenId, lendingToken, amountLendingToken,bLendingToken,mintedAmount);
    }

    function redeem(uint256 lendingTokenId, uint256 amountBLendingToken) public {
        require(lendingTokenId < lendingTokens.length && amountBLendingToken > 0, "PIT: invalid input");
        address lendingToken = lendingTokens[lendingTokenId];
        address bLendingToken = bLendingTokensList[lendingToken];
        
        (uint256 redeemError) = BLendingToken(bLendingToken).redeemTo(msg.sender, amountBLendingToken);
        require(redeemError == 0,"PIT: redeemError!=0. redeem>=supply.");
     
        emit Redeem(msg.sender, lendingTokenId, lendingToken, bLendingToken, amountBLendingToken);
    }

    function redeemUnderlying(uint256 lendingTokenId, uint256 amountLendingToken) public {
        require(lendingTokenId < lendingTokens.length && amountLendingToken > 0, "PIT: invalid input");
        address lendingToken = lendingTokens[lendingTokenId];
        address bLendingToken = bLendingTokensList[lendingToken];

        uint256 redeemUnderlyingError = BLendingToken(bLendingToken).redeemUnderlyingTo(msg.sender, amountLendingToken);
        require(redeemUnderlyingError == 0,"PIT:redeem>=supply");

        emit RedeemUnderlying(msg.sender, lendingTokenId, lendingToken, bLendingToken, amountLendingToken);
    }

    function borrow(uint256 lendingTokenId, uint256 amountLendingToken, address projectToken, uint256 amountProjectToken) public {
        require(lendingTokenId < lendingTokens.length && amountLendingToken > 0, "PIT: invalid input");
        require(isProjectTokenListed[projectToken],"PIT: projectToken not listed");
        address lendingToken = lendingTokens[lendingTokenId];
        address bLendingToken = bLendingTokensList[lendingToken];
        uint256 projectTokenId = indexProjectToken[projectToken];
        UserBorrowPosition storage msgSenderBorrowPosition = userBorrowPosition[msg.sender][lendingTokenId][projectTokenId];
        uint256 borrowError;
        if(msgSenderBorrowPosition.amountBorrowed == 0){
            uint256 currentBalancePitOfMsgSender = balanceOfPitPosition(msg.sender, projectTokenId);
            require(amountLendingToken <= currentBalancePitOfMsgSender, "PIT: borrow > pitPosition");
            
            borrowError = BLendingToken(bLendingToken).borrowTo(projectToken, msg.sender, amountLendingToken);
            
            msgSenderBorrowPosition.amountBorrowed += amountLendingToken;
            msgSenderBorrowPosition.amountPit = currentBalancePitOfMsgSender;

        }else{
            msgSenderBorrowPosition.amountPit = balanceOfPitPosition(msg.sender, projectTokenId);
            require(amountLendingToken + msgSenderBorrowPosition.amountBorrowed <= msgSenderBorrowPosition.amountPit,"PIT: should amountLendingToken+borrow<amountPIT");

            borrowError = BLendingToken(bLendingToken).borrowTo(projectToken, msg.sender, amountLendingToken);
            msgSenderBorrowPosition.amountBorrowed += amountLendingToken;

            uint256 borrowedPositions = 0;
            uint256 cumulativeBorrowBalance = 0;
            for(uint256 prjId = 0; prjId < projectTokens.length;prjId++){
                UserBorrowPosition storage borrowPosition = userBorrowPosition[msg.sender][lendingTokenId][prjId];
                if(borrowPosition.amountBorrowed > 0){
                    cumulativeBorrowBalance += borrowPosition.amountBorrowed;
                    borrowedPositions++;
                }
            }
            uint256 currentBorrowBalance = BLendingToken(bLendingToken).borrowBalanceCurrent(msg.sender);
            uint256 estimateInterest = (currentBorrowBalance - cumulativeBorrowBalance)/borrowedPositions;
            uint256 lendingTokenIdCopy = lendingTokenId;
            for(uint256 prjId = 0; prjId < projectTokens.length;prjId++){
                UserBorrowPosition storage borrowPosition = userBorrowPosition[msg.sender][lendingTokenIdCopy][prjId];
                if(borrowPosition.amountBorrowed > 0){
                    borrowPosition.amountBorrowed += estimateInterest;
                    borrowPosition.amountPit = balanceOfPitPosition(msg.sender,prjId);
                }
            }
        }
        require(borrowError == 0,"PIT: borrow more than PIT balance or no liquidity.");

        emit Borrow(msg.sender,lendingTokenId, lendingToken, amountLendingToken, projectToken, amountProjectToken);
    }

    function repayBorrow(uint256 lendingTokenId, uint256 amountLendingToken, address projectToken) public {
        require(lendingTokenId < lendingTokens.length && amountLendingToken > 0, "PIT: invalid input");
        address lendingToken = lendingTokens[lendingTokenId];
        address bLendingToken = bLendingTokensList[lendingToken];
        uint256 repayBorrowError;
        uint256 amountRepayed;

        UserBorrowPosition storage msgSenderBorrowPosition = userBorrowPosition[msg.sender][lendingTokenId][indexProjectToken[projectToken]];

        uint256 borrowedPositions = 0;
        uint256 cumulativeBorrowBalance = 0;
        for(uint256 prjId = 0; prjId < projectTokens.length;prjId++){
            UserBorrowPosition storage borrowPosition = userBorrowPosition[msg.sender][lendingTokenId][prjId];
            if(borrowPosition.amountBorrowed > 0){
                cumulativeBorrowBalance += borrowPosition.amountBorrowed;
                borrowedPositions++;
            }
        }
        if(borrowedPositions == 0){
            revert("PIT: no borrow positions");
        }
        uint256 currentBorrowBalance;
        uint256 estimateInterest;
        if(amountLendingToken == type(uint256).max){
            if(borrowedPositions == 1){
                (repayBorrowError, amountRepayed)  = BLendingToken(bLendingToken).repayBorrowTo(projectToken, msg.sender, type(uint256).max);
                require(repayBorrowError == 0 && amountRepayed > 0,"PIT: repayBorrowError!=0");
                uint256 lendingTokenIdCopy0 = lendingTokenId;
                msgSenderBorrowPosition.amountBorrowed = 0;
                msgSenderBorrowPosition.amountPit = 0;
                emit RepayBorrow(msg.sender, lendingTokenIdCopy0, lendingToken, amountRepayed, projectToken, true);
                return;
            }else{
                currentBorrowBalance = BLendingToken(bLendingToken).borrowBalanceCurrent(msg.sender);
                if(currentBorrowBalance > cumulativeBorrowBalance){
                    estimateInterest = (currentBorrowBalance - cumulativeBorrowBalance) / borrowedPositions;
                }else{
                    estimateInterest = 0;
                }

                (repayBorrowError, amountRepayed)  = BLendingToken(bLendingToken).repayBorrowTo(projectToken, msg.sender, msgSenderBorrowPosition.amountBorrowed + estimateInterest);
                require(repayBorrowError == 0 && amountRepayed > 0, "PIT: repayBorrowError!=0");
            
                currentBorrowBalance = BLendingToken(bLendingToken).borrowBalanceCurrent(msg.sender);
                if(currentBorrowBalance > cumulativeBorrowBalance - amountRepayed){
                    estimateInterest = (currentBorrowBalance - (cumulativeBorrowBalance - amountRepayed))/borrowedPositions;
                }else{
                    estimateInterest = 0;
                }

                msgSenderBorrowPosition.amountBorrowed = 0;
                msgSenderBorrowPosition.amountPit = 0;
            }
        }else{
            require(amountLendingToken <= msgSenderBorrowPosition.amountBorrowed, "PIT: amountLendingToken<=amountBorrowed");

            currentBorrowBalance = BLendingToken(bLendingToken).borrowBalanceCurrent(msg.sender);
            
            (repayBorrowError, amountRepayed)  = BLendingToken(bLendingToken).repayBorrowTo(projectToken, msg.sender, amountLendingToken);
            require(repayBorrowError == 0 && amountRepayed > 0, "PIT: repayBorrowError not zero!");
            currentBorrowBalance = BLendingToken(bLendingToken).borrowBalanceCurrent(msg.sender);
            if(currentBorrowBalance > cumulativeBorrowBalance - amountRepayed){
                estimateInterest = (currentBorrowBalance - (cumulativeBorrowBalance - amountRepayed)) / borrowedPositions;
            }else{
                estimateInterest = 0;
            }
            
            msgSenderBorrowPosition.amountBorrowed -= amountLendingToken;
            msgSenderBorrowPosition.amountPit = balanceOfPitPosition(msg.sender,indexProjectToken[projectToken]);
           
        }
        uint256 lendingTokenIdCopy1 = lendingTokenId;

        for(uint256 prjId = 0; prjId < projectTokens.length;prjId++){
            UserBorrowPosition storage borrowPosition = userBorrowPosition[msg.sender][lendingTokenIdCopy1][prjId];
            if(borrowPosition.amountBorrowed > 0){
                borrowPosition.amountBorrowed += estimateInterest;
                borrowPosition.amountPit = balanceOfPitPosition(msg.sender,prjId);
            }
        }

        emit RepayBorrow(msg.sender, lendingTokenIdCopy1, lendingToken, amountRepayed, projectToken, msgSenderBorrowPosition.amountBorrowed == 0);
        
    }
    
    function liquidate(address user, uint256 lendingTokenId, uint256 prjId) public {
        require(prjId < projectTokens.length);
        address lendingToken = lendingTokens[lendingTokenId];
        address bLendingToken = bLendingTokensList[lendingToken];
        address projectToken = projectTokens[prjId];

        UserBorrowPosition storage borrowPosition = userBorrowPosition[user][lendingTokenId][prjId];
        if(borrowPosition.amountBorrowed == 0){
            revert("PIT: no position to liquidate.");
        }

        (uint256 hf_numerator, uint256 hf_denominator) = healthFactorForPosition(user, lendingTokenId, prjId);

        if (hf_numerator >= hf_denominator){
            revert("PIT: health factor bigger than 1. Liquidation is forbidden by this condition.");
        }
        uint256 amountRepayed;
        uint256 borrowedPositions = 0;
        uint256 cumulativeBorrowBalance = 0;
        for(uint256 prjIdInternal = 0; prjIdInternal < projectTokens.length; prjIdInternal++){
            UserBorrowPosition storage cumulativeBorrowPosition = userBorrowPosition[msg.sender][lendingTokenId][prjIdInternal];
            if(cumulativeBorrowPosition.amountBorrowed > 0){
                cumulativeBorrowBalance += cumulativeBorrowPosition.amountBorrowed;
                borrowedPositions++;
            }
        }
        
        if(borrowedPositions == 1){
            (, amountRepayed)  = BLendingToken(bLendingToken).repayBorrowToBorrower(projectToken, msg.sender, user, type(uint256).max);
            require(amountRepayed > 0,"PIT: repayBorrowError!=0");     
        }else{
            uint256 currentBorrowBalance = BLendingToken(bLendingToken).borrowBalanceCurrent(msg.sender);
            uint256 estimateInterest;

            if(currentBorrowBalance > cumulativeBorrowBalance){
                estimateInterest = (currentBorrowBalance - cumulativeBorrowBalance) / borrowedPositions;
            }else{
                estimateInterest = 0;
            }
            address userToLiquidate = user;
            (, amountRepayed)  = BLendingToken(bLendingToken).repayBorrowToBorrower(projectToken, msg.sender, userToLiquidate, borrowPosition.amountBorrowed + estimateInterest);
            require(amountRepayed > 0, "PIT: repayBorrowError!=0");
        
        }

        UserDepositPosition storage depositPosition = userDepositPosition[user][prjId];
        uint256 prjDeposited = depositPosition.amountProjectTokenAvailable;
        ERC20Upgradeable(projectToken).safeTransfer(msg.sender,prjDeposited);
        depositPosition.amountProjectTokenAvailable -= prjDeposited;
        totalStakedPrj[projectToken] -= prjDeposited;
        borrowPosition.amountBorrowed = 0;
        borrowPosition.amountPit = 0;

        emit Liquidate(msg.sender, user, lendingTokenId, prjId, prjDeposited);

    }

    //************* VIEW FUNCTIONS ********************************

    /**
     * @notice returns the amount of PIT of account in position `prjId`
     */
    function balanceOfPitPosition(address account, uint256 prjId) public view returns (uint256){
        address tokenPrj = projectTokens[prjId];
        uint8 lvrNumerator = lvr[tokenPrj].numerator;
        uint8 lvrDenominator = lvr[tokenPrj].denominator;
        uint256 prjInPosition = getDepositedPrjAmount(account, prjId);
        uint256 positionEvaluation = getPrjEvaluationInBasicToken(projectTokens[prjId],prjInPosition);
        return positionEvaluation * lvrNumerator / lvrDenominator;
    }

    function liquidationThresholdForPosition(address account, uint256 prjId) public view returns(uint256){
        address tokenPrj = projectTokens[prjId];
        uint8 ltfNumerator = ltf[tokenPrj].numerator;
        uint8 ltfDenominator = ltf[tokenPrj].denominator;
        uint256 pitCurrentBalance = balanceOfPitPosition(account, prjId);
        return pitCurrentBalance * ltfNumerator / ltfDenominator;
    }

    function healthFactorForPosition(address account,uint256 lendingTokenId,uint256 prjId) public view returns(uint256 numerator, uint256 denominator){
        uint256 lt = liquidationThresholdForPosition(account, prjId);
        uint256 borrowedLendingToken = userBorrowPosition[account][lendingTokenId][prjId].amountBorrowed;
        return (lt,borrowedLendingToken);
    }

    function healthFactor(address account,uint256 lendingTokenId) public view returns(uint256 numerator, uint256 denominator){
        uint256 lt = liquidationThreshold(account);
        uint256 borrowedLendingToken;
        for(uint256 prjId = 0; prjId < projectTokens.length; prjId++){
            borrowedLendingToken += userBorrowPosition[account][lendingTokenId][prjId].amountBorrowed;
        }
        return (lt, borrowedLendingToken);
    }

    function getPrjEvaluationInBasicToken(address projectToken,uint256 amountPrj) public view returns(uint256){
        return IPriceProviderAggregator(priceOracle).getEvaluation(projectToken, amountPrj);
    }

    function getPrjEvaluationInBasicTokenWithSale(address projectToken, uint256 amountPrj) public view returns(uint256){ 
        Ratio storage sale = prjSales[projectToken];
        uint256 amountPrjEvaluationInBasicToken = getPrjEvaluationInBasicToken(projectToken,amountPrj);
        uint256 amoutLendingTokenWithSale = amountPrjEvaluationInBasicToken * sale.numerator / sale.denominator;
        return amoutLendingTokenWithSale;
    }

    function getBToken(address underlying) public view returns(address) {
        return bLendingTokensList[underlying];
    }

    function getDepositedPrjAmount(address account, uint256 prjId) public view returns(uint256){
        return userDepositPosition[account][prjId].amountProjectTokenAvailable;
    }

    function getBorrowPosition(address account, uint256 lendingTokenId, uint256 prjId) public view returns(uint256,uint256){
        UserBorrowPosition storage borrowPosition = userBorrowPosition[account][lendingTokenId][prjId];
        return (borrowPosition.amountBorrowed, borrowPosition.amountPit);
    }

    function liquidationThreshold(address account) public view returns(uint256){
        uint256 lt;
        for(uint256 prjId=0; prjId < projectTokens.length; prjId++){
            lt += liquidationThresholdForPosition(account,prjId);
        }
        return lt;
    }

    /**
     * @notice returns the amount of PIT of account
     */
    function balanceOfPit(address account) public view returns (uint256){
        uint256 pitBalance;
        for(uint256 prjId = 0; prjId < projectTokens.length; prjId++){
            pitBalance += balanceOfPitPosition(account,prjId);
        }
        return pitBalance;
    }

    /**
     * @notice return the pitBalance depending on input prj indexes
     */
    function balanceOfPitDependingOnPrj(address account, uint256[] memory prjIndexes) public view returns(uint256){
        uint256 prjIndexesLength = prjIndexes.length;
        require(prjIndexesLength <= projectTokens.length,"Invalid length of prj Indexes");
        uint256 pitBalance;
        for(uint256 i = 0; i < prjIndexesLength; i++){
            pitBalance += balanceOfPitPosition(account,prjIndexes[i]);
        }
        return pitBalance;
    }

    function totalSupplyPit() public view virtual returns (uint256) {
        uint256 pitTotalSupply;
        address tokenPrj;
        uint8 lvrNumerator;
        uint8 lvrDenominator;
        uint256 basicTokenEvaluation;
        uint256 totalStaked;
        for(uint256 prjId=0; prjId < projectTokens.length; prjId++){
            tokenPrj = projectTokens[prjId];
            lvrNumerator = lvr[tokenPrj].numerator;
            lvrDenominator = lvr[tokenPrj].denominator;
            totalStaked = totalStakedPrj[tokenPrj];
            basicTokenEvaluation = getPrjEvaluationInBasicToken(projectTokens[prjId],totalStaked);
            pitTotalSupply += basicTokenEvaluation * lvrNumerator / lvrDenominator;
        }
        return pitTotalSupply;
    }

    function lendingTokensLength() public view returns (uint256) {
        return lendingTokens.length;
    }

    function decimals() public override view returns(uint8){
        return ERC20Upgradeable(basicToken).decimals();
    }
   
}