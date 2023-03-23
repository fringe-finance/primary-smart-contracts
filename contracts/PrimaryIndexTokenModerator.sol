// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./interfaces/IPriceProviderAggregator.sol";
import "./interfaces/IBLendingToken.sol";
import "./interfaces/IPrimaryIndexToken.sol";

contract PrimaryIndexTokenModerator is Initializable, AccessControlUpgradeable
{
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    IPrimaryIndexToken public primaryIndexToken;

    event AddPrjToken(address indexed tokenPrj, string name, string symbol);
    event RemoveProjectToken(address indexed tokenPrj);
    event AddLendingToken(address indexed lendingToken, string name, string symbol);
    event RemoveLendingToken(address indexed lendingToken);
    event SetPausedProjectToken(address _projectToken, bool _isDepositPaused, bool _isWithdrawPaused);
    event SetPausedLendingToken(address _lendingToken, bool _isPaused);
    event SetBorrowLimitPerCollateral(address projectToken,uint256 _borrowLimit);
    event SetBorrowLimitPerLendingAsset(address lendingToken, uint256 _borrowLimit);
    event SetUSDCToken(address usdc);

    event LoanToValueRatioSet(address indexed tokenPrj, uint8 lvrNumerator, uint8 lvrDenominator);

    event LiquidationThresholdFactorSet(address indexed tokenPrj, uint8 ltfNumerator, uint8 ltfDenominator);

    event LiquidationIncentiveSet(address indexed tokenPrj, uint8 ltfNumerator, uint8 ltfDenominator);

    event GrandModerator(address newModerator);
    event RevokeModerator(address moderator); 
    event SetPrimaryIndexTokenLeverage(address newPrimaryIndexTokenLeverage);
    event SetPriceOracle(address newOracle);
    event AddRelatedContracts(address newRelatedContract);
    event RemoveRelatedContracts(address relatedContract);


    function initialize(address pit) public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        primaryIndexToken = IPrimaryIndexToken(pit);
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not the Admin");
        _;
    }

    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "Caller is not the Moderator");
        _;
    }

        modifier isProjectTokenListed(address _projectToken) {
        require(primaryIndexToken.projectTokenInfo(_projectToken).isListed, "PIT: project token is not listed");
        _;
    }

    modifier isLendingTokenListed(address _lendingToken) {
        require(primaryIndexToken.lendingTokenInfo(_lendingToken).isListed, "PIT: lending token is not listed");
        _;
    }

    //************* ADMIN FUNCTIONS ********************************

    function grandModerator(address newModerator) public onlyAdmin {
        require(newModerator != address(0), "PIT: invalid address");
        grantRole(MODERATOR_ROLE, newModerator);
        emit GrandModerator(newModerator);
    }

    function revokeModerator(address moderator) public onlyAdmin {
        require(moderator != address(0), "PIT: invalid address");
        revokeRole(MODERATOR_ROLE, moderator);
        emit RevokeModerator(moderator);
    }

    function transferAdminship(address newAdmin) public onlyAdmin {
        require(newAdmin != address(0), "PIT: invalid newAdmin");
        grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
        revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function transferAdminshipForPIT(address currentAdmin, address newAdmin) public onlyAdmin {
        require(newAdmin != address(0), "PIT: invalid newAdmin");
        primaryIndexToken.grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
        primaryIndexToken.revokeRole(DEFAULT_ADMIN_ROLE, currentAdmin);
    }

    function addProjectToken(
        address _projectToken,
        uint8 _loanToValueRatioNumerator,
        uint8 _loanToValueRatioDenominator,
        uint8 _liquidationThresholdFactorNumerator,
        uint8 _liquidationThresholdFactorDenominator,
        uint8 _liquidationIncentiveNumerator,
        uint8 _liquidationIncentiveDenominator
    ) public onlyAdmin {
        require(_projectToken != address(0), "invalid _projectToken");

        string memory projectTokenName = ERC20Upgradeable(_projectToken).name();
        string memory projectTokenSymbol = ERC20Upgradeable(_projectToken).symbol();
        emit AddPrjToken(_projectToken, projectTokenName, projectTokenSymbol);
        
        setProjectTokenInfo(
            _projectToken,
            _loanToValueRatioNumerator, 
            _loanToValueRatioDenominator,   
            _liquidationThresholdFactorNumerator,
            _liquidationThresholdFactorDenominator,
            _liquidationIncentiveNumerator, 
            _liquidationIncentiveDenominator
        );

        primaryIndexToken.setPausedProjectToken(_projectToken, false, false);
    }

    function removeProjectToken(
        uint256 _projectTokenId
    ) public onlyAdmin isProjectTokenListed(primaryIndexToken.projectTokens(_projectTokenId)) {
        address projectToken = primaryIndexToken.projectTokens(_projectTokenId);
        require(primaryIndexToken.totalDepositedProjectToken(projectToken) == 0, "PIT: projectToken amount exist on PIT");
        primaryIndexToken.removeProjectToken(_projectTokenId, projectToken);
        emit RemoveProjectToken(projectToken);
    }

    function addLendingToken(
        address _lendingToken, 
        address _bLendingToken,
        bool _isPaused
    ) public onlyAdmin {
        require(_lendingToken != address(0), "invalid _lendingToken");

        string memory lendingTokenName = ERC20Upgradeable(_lendingToken).name();
        string memory lendingTokenSymbol = ERC20Upgradeable(_lendingToken).symbol();
        emit AddLendingToken(_lendingToken, lendingTokenName, lendingTokenSymbol);

        setLendingTokenInfo(
            _lendingToken, 
            _bLendingToken, 
            _isPaused
        );
    }

    function removeLendingToken(
        uint256 _lendingTokenId
    ) public onlyAdmin isLendingTokenListed(primaryIndexToken.lendingTokens(_lendingTokenId)) {
        address lendingToken = primaryIndexToken.lendingTokens(_lendingTokenId);

        for(uint256 i = 0; i < primaryIndexToken.projectTokensLength(); i++) {
            require(primaryIndexToken.totalBorrow(primaryIndexToken.projectTokens(i),lendingToken) == 0, "PIT: exist borrow of lendingToken");
        }
        primaryIndexToken.removeLendingToken(_lendingTokenId, lendingToken);
        emit RemoveLendingToken(lendingToken);
    }

    function setPrimaryIndexTokenLeverage(address newPrimaryIndexTokenLeverage) public onlyAdmin {
        require(newPrimaryIndexTokenLeverage != address(0), "PIT: invalid address");
        primaryIndexToken.setPrimaryIndexTokenLeverage(newPrimaryIndexTokenLeverage);
        emit SetPrimaryIndexTokenLeverage(newPrimaryIndexTokenLeverage);
    }

    function setPriceOracle(address newOracle) public onlyAdmin {
        require(newOracle != address(0), "PIT: invalid address");
        primaryIndexToken.setPriceOracle(newOracle);
        emit SetPriceOracle(newOracle);
    }

    function addRelatedContracts(address newRelatedContract) public onlyAdmin {
        require(newRelatedContract != address(0), "PIT: invalid address");
        primaryIndexToken.setRelatedContract(newRelatedContract, true);
        emit AddRelatedContracts(newRelatedContract);
    }

    function removeRelatedContracts(address relatedContract) public onlyAdmin {
        require(relatedContract != address(0), "PIT: invalid address");
        primaryIndexToken.setRelatedContract(relatedContract, false);
        emit RemoveRelatedContracts(relatedContract);
    }

    //************* MODERATOR FUNCTIONS ********************************

    function setProjectTokenInfo(
        address _projectToken,
        uint8 _loanToValueRatioNumerator,
        uint8 _loanToValueRatioDenominator,
        uint8 _liquidationThresholdFactorNumerator,
        uint8 _liquidationThresholdFactorDenominator,
        uint8 _liquidationIncentiveNumerator,
        uint8 _liquidationIncentiveDenominator
    ) public onlyModerator {
        require(_loanToValueRatioNumerator <= _loanToValueRatioDenominator, "invalid loanToValueRatio");
        require(_liquidationThresholdFactorNumerator >= _liquidationThresholdFactorDenominator, "invalid liquidationTresholdFactor");
        require(_liquidationIncentiveNumerator >= _liquidationIncentiveDenominator, "invalid liquidationIncentive");
        
        primaryIndexToken.setProjectTokenInfo(
            _projectToken, 
            _loanToValueRatioNumerator, 
            _loanToValueRatioDenominator, 
            _liquidationThresholdFactorNumerator, 
            _liquidationThresholdFactorDenominator, 
            _liquidationIncentiveNumerator,
            _liquidationIncentiveDenominator
        );
    
        emit LoanToValueRatioSet(_projectToken, _loanToValueRatioNumerator, _loanToValueRatioDenominator);
        emit LiquidationThresholdFactorSet(_projectToken, _liquidationThresholdFactorNumerator, _liquidationThresholdFactorDenominator);
        emit LiquidationIncentiveSet(_projectToken, _liquidationIncentiveNumerator, _liquidationIncentiveDenominator);
    }

    function setPausedProjectToken(
        address _projectToken, 
        bool _isDepositPaused, 
        bool _isWithdrawPaused
    ) public onlyModerator isProjectTokenListed(_projectToken) {
        primaryIndexToken.setPausedProjectToken(_projectToken, _isDepositPaused, _isWithdrawPaused);
        emit SetPausedProjectToken(_projectToken, _isDepositPaused, _isWithdrawPaused);
    } 

    function setLendingTokenInfo(
        address _lendingToken, 
        address _bLendingToken,
        bool _isPaused
    ) public onlyModerator {
        require(_bLendingToken != address(0), "invalid _bLendingToken");
        primaryIndexToken.setLendingTokenInfo(_lendingToken, _bLendingToken, _isPaused);
        require(IBLendingToken(_bLendingToken).underlying() == _lendingToken, "PIT: underlyingOfbLendingToken!=lendingToken");
        emit SetPausedLendingToken(_lendingToken, _isPaused);
    }

    function setPausedLendingToken(address _lendingToken, bool _isPaused) public onlyModerator isLendingTokenListed(_lendingToken) {
        primaryIndexToken.setPausedLendingToken(_lendingToken, _isPaused);
        emit SetPausedLendingToken(_lendingToken, _isPaused);
    }

    function setTotalBorrowPerLendingToken(address lendingToken) public onlyModerator {
        require(lendingToken != address(0), "PIT: invalid address");
        uint256 total;
        for(uint i=0; i < primaryIndexToken.projectTokensLength(); i++) {
            address projectToken = primaryIndexToken.projectTokens(i);
            total += primaryIndexToken.totalBorrow(projectToken, lendingToken);
        }
        primaryIndexToken.setTotalBorrowPerLendingToken(lendingToken, total);
    }

    function setBorrowLimitPerCollateral(address projectToken,uint256 _borrowLimit) public onlyModerator isProjectTokenListed(projectToken) {
        require(_borrowLimit > 0, "PIT: borrowLimit=0");
        primaryIndexToken.setBorrowLimitPerCollateral(projectToken,_borrowLimit);
        emit SetBorrowLimitPerCollateral(projectToken, _borrowLimit);
    }

    function setBorrowLimitPerLendingAsset(address lendingToken, uint256 _borrowLimit) public onlyModerator isLendingTokenListed(lendingToken) {
        require(_borrowLimit > 0, "PIT: borrowLimit=0");
        primaryIndexToken.setBorrowLimitPerLendingAsset(lendingToken, _borrowLimit);
        emit SetBorrowLimitPerLendingAsset(lendingToken, _borrowLimit);
    }

    function setUSDCToken(address usdc) public onlyModerator {
        require(usdc != address(0), "PIT: borrowLimit=0");
        primaryIndexToken.setUSDCToken(usdc);
        emit SetUSDCToken(usdc);
    }
    
}
