// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./AtomicRepayment/paraswap/interfaces/IParaSwapAugustus.sol";
import "./AtomicRepayment/paraswap/interfaces/IParaSwapAugustusRegistry.sol";
import "./openzeppelin/contracts/utils/math/Math.sol";
import "./interfaces/IPrimaryIndexToken.sol";

contract PrimaryIndexTokenLeverage is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for ERC20Upgradeable;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    uint constant decimalPercent = 1000;
    mapping(address => mapping(address => bool)) public isLeveragePosition;
    IPrimaryIndexToken public primaryIndexToken;
    address public augustusParaswap;
    address public AUGUSTUS_REGISTRY;

    mapping(address => mapping(address => LeverageType)) public typeOfLeveragePosition;

    struct Ratio {
        uint8 numerator;
        uint8 denominator;
    }

    enum LeverageType {
        AMPLIFY,
        MARGIN_TRADE
    }

    event LeveragedBorrow(address indexed user, address projectToken, address lendingToken, uint notionalExposure, uint lendingAmount, uint margin, uint addingAmount, uint totalDepositedAmount, uint amountRecive);

    function initialize(address pit, address _augustusParaswap, address _AUGUSTUS_REGISTRY) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init_unchained();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        primaryIndexToken = IPrimaryIndexToken(pit);
        augustusParaswap = _augustusParaswap;
        AUGUSTUS_REGISTRY = _AUGUSTUS_REGISTRY;
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "PITLeverage: Caller is not the Admin");
        _;
    }

    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "PITLeverage: Caller is not the Moderator");
        _;
    }

    modifier isProjectTokenListed(address _projectToken) {
        require(primaryIndexToken.projectTokenInfo(_projectToken).isListed, "PITLeverage: project token is not listed");
        _;
    }

    modifier isLendingTokenListed(address _lendingToken) {
        require(primaryIndexToken.lendingTokenInfo(_lendingToken).isListed, "PITLeverage: lending token is not listed");
        _;
    }

    modifier isPrimaryIndexToken() {
        require(msg.sender == address(primaryIndexToken), "PITLeverage: caller is not primaryIndexToken");
        _;
    }

    modifier onlyRelatedContracts() {
        require(primaryIndexToken.getRelatedContract(msg.sender), "PITLeverage: caller is not related Contract");
        _;
    }

    function setPrimaryIndexTokenAddress(address _newPrimaryIndexToken) external onlyModerator() {
        primaryIndexToken = IPrimaryIndexToken(_newPrimaryIndexToken);
    }

    function setAugustusParaswap(address augustusParaswap_, address AUGUSTUS_REGISTRY_) public onlyModerator(){
        augustusParaswap = augustusParaswap_;
        AUGUSTUS_REGISTRY = AUGUSTUS_REGISTRY_;
    }

    function getLVR(address _projectToken) public view returns(uint8 lvrNumerator, uint8 lvrDenominator) {
        lvrNumerator = primaryIndexToken.projectTokenInfo(_projectToken).loanToValueRatio.numerator;
        lvrDenominator = primaryIndexToken.projectTokenInfo(_projectToken).loanToValueRatio.denominator;
    }

    function getTokenPrice(address token) public view returns(uint price) {
        uint tokenMultiplier = 10 ** ERC20Upgradeable(token).decimals();
        price = primaryIndexToken.getTokenEvaluation(token, tokenMultiplier);

    }

    function isValidCollateralisation(uint margin, uint exp, uint lvrNumerator, uint lvrDenominator) public pure returns(bool isValid){
        uint ratioNumerator = (margin + exp) * lvrNumerator;
        uint ratioDenominator = exp * lvrDenominator;
        isValid = ratioNumerator > ratioDenominator ? true : false;
    }

    function calculateCollateralTokenCount(address _projectToken, uint notionalValue) public view returns(uint collateralTokenCount) {
        collateralTokenCount = notionalValue * 10 ** ERC20Upgradeable(_projectToken).decimals() / getTokenPrice(_projectToken);
    }

    function calculateLendingTokenCount(address _lendingToken, uint notionalValue) public view returns(uint lendingTokenCount) {
        lendingTokenCount = notionalValue * 10 ** ERC20Upgradeable(_lendingToken).decimals() / getTokenPrice(_lendingToken);
    }


    function calculateHF(uint expAmount, uint margin, uint borrowAmount, uint lvrNumerator, uint lvrDenominator) public pure returns(uint hfNumerator, uint hfDenominator) {
        hfNumerator = (expAmount + margin) * lvrNumerator;
        hfDenominator = borrowAmount * lvrDenominator;
    }

    //Margin = ((Notional / LVR) * (1 + SafetyMargin)) - Notional
    function calculateMargin(address projectToken, uint safetyMarginNumerator, uint safetyMarginDenominator, uint expAmount) public view returns(uint marginAmount) {
        (uint8 lvrNumerator, uint8 lvrDenominator) = getLVR(projectToken);
        uint margin = (expAmount * (lvrDenominator * (safetyMarginDenominator + safetyMarginNumerator) - lvrNumerator * safetyMarginDenominator) / (lvrNumerator * safetyMarginDenominator));
        marginAmount = margin * 10 ** ERC20Upgradeable(projectToken).decimals() / getTokenPrice(projectToken);
    }

    function deleteLeveragePosition(address user, address projectToken) external isPrimaryIndexToken {
        delete isLeveragePosition[user][projectToken];
    }

    //Safety Margin = ((Margin + Notional) / (Notional / LVR)) - 1
    function calculateSafetyMargin(address projectToken, uint margin, uint exp) public view returns(uint safetyMarginNumerator, uint safetyMarginDenominator){
        (uint8 lvrNumerator, uint8 lvrDenominator) = getLVR(projectToken);
        uint marginPrice = primaryIndexToken.getTokenEvaluation(projectToken, margin);
        safetyMarginNumerator = (marginPrice + exp) * lvrNumerator - exp * lvrDenominator;
        safetyMarginDenominator = (exp * lvrDenominator);
    }

    function _deferLiquidityCheck(address user, address projectToken, address lendingToken) internal view {
        uint pit = primaryIndexToken.pit(user, projectToken);
        uint totalOutstandingInUSD = primaryIndexToken.totalOutstandingInUSD(user, projectToken, lendingToken);
        uint newTotalBorrowPerCollateral = primaryIndexToken.getTotalBorrowPerCollateral(projectToken);
        uint borrowLimitPerCollateral =  primaryIndexToken.borrowLimitPerCollateral(projectToken);
        uint newTotalBorrowPerLendingToken = primaryIndexToken.getTotalBorrowPerLendingToken(lendingToken);
        uint borrowLimitPerLendingToken = primaryIndexToken.borrowLimitPerLendingToken(lendingToken);
        require(totalOutstandingInUSD <= pit, "PITLeverage: lendingTokenAmount exceeds pit remaining");
        require(newTotalBorrowPerCollateral <= borrowLimitPerCollateral, "PITLeverage: totalBorrow exceeded borrowLimit per collateral asset");
        require(newTotalBorrowPerLendingToken <= borrowLimitPerLendingToken, "PITLeverage: totalBorrow exceeded borrowLimit per lending asset");
    }

    function _nakedBorrow(address user, address lendingToken, uint lendingTokenAmount, address projectToken, address currentLendingToken) internal {
        primaryIndexToken.updateInterestInBorrowPositions(user, lendingToken);

        primaryIndexToken.calcBorrowPosition(user, projectToken, lendingToken, lendingTokenAmount, currentLendingToken);
        ERC20Upgradeable(lendingToken).safeTransferFrom(user, address(this), lendingTokenAmount);
    }

    function _buyOnParaSwap(address tokenTo, address _target, bytes memory buyCalldata) internal returns (uint amountRecive) {
        uint beforeBalanceTo = ERC20Upgradeable(tokenTo).balanceOf(address(this));
        // solium-disable-next-line security/no-call-value
        (bool success,) = _target.call(buyCalldata);
        if (!success) {
        // Copy revert reason from call
        assembly {
            returndatacopy(0, 0, returndatasize())
            revert(0, returndatasize())
            }
        }
        uint afterBalanceTo = ERC20Upgradeable(tokenTo).balanceOf(address(this));
        amountRecive = afterBalanceTo - beforeBalanceTo;
    }

    function _approve(address token, address tokenTransferProxy, uint tokenAmount) internal {
        if(ERC20Upgradeable(token).allowance(address(this), tokenTransferProxy) <= tokenAmount) {
            ERC20Upgradeable(token).safeApprove(tokenTransferProxy, type(uint256).max);
        }
    }

    function _collateraliseLoan(address user, address projectToken, uint collateralTokenCount, uint marginCollateralCount) internal returns(uint totalCollateral, uint addingAmount){
        addingAmount = calculateAddingAmount(user, projectToken, marginCollateralCount);
        totalCollateral = collateralTokenCount + addingAmount;
        primaryIndexToken.calcDepositPosition(projectToken, totalCollateral, user);
        ERC20Upgradeable(projectToken).safeTransfer(address(primaryIndexToken), collateralTokenCount);
        if(addingAmount > 0) {
            ERC20Upgradeable(projectToken).safeTransferFrom(user, address(primaryIndexToken), addingAmount);
        }
    }

    function calculateAddingAmount(address user, address projectToken, uint marginCollateralCount) public view returns(uint256 addingAmount) {
        uint depositedAmount = primaryIndexToken.getDepositedAmount(projectToken, user);
        addingAmount = marginCollateralCount > depositedAmount ? marginCollateralCount - depositedAmount : 0;
    }
     
    function _checkIsValidPosition(address user, address projectToken, address lendingToken, uint marginCollateralAmount) internal view {
        (uint256 depositedProjectTokenAmount, uint256 loanBody, uint256 accrual, , ) = primaryIndexToken.getPosition(user, projectToken, lendingToken);
        require(!isLeveragePosition[user][projectToken] && loanBody == 0 && accrual == 0 || isLeveragePosition[user][projectToken], "PITLeverage: invalid position");
        require(marginCollateralAmount >= depositedProjectTokenAmount, "PITLeverage: invalid amount");
    }

    function _checkSlippage(uint collateralTokenCount, uint maxSlippage, uint amountRecive) internal pure {
        uint realRate = amountRecive * decimalPercent / collateralTokenCount;
        uint slippage = decimalPercent >= realRate ? decimalPercent - realRate : realRate - decimalPercent;
        require(maxSlippage >= slippage, "PITLeverage: over maxSlippage");
    }

    function leveragedBorrow(address projectToken, address lendingToken, uint notionalExposure, uint marginCollateralAmount, bytes memory buyCalldata, uint8 leverageType) public nonReentrant{
        _leveragedBorrow(projectToken, lendingToken, notionalExposure, marginCollateralAmount, buyCalldata, msg.sender, leverageType);
    }

    function leveragedBorrowFromRelatedContract(address projectToken, address lendingToken, uint notionalExposure, uint marginCollateralAmount, bytes memory buyCalldata, address borrower, uint8 leverageType) public nonReentrant onlyRelatedContracts() {
        _leveragedBorrow(projectToken, lendingToken, notionalExposure, marginCollateralAmount, buyCalldata, borrower, leverageType);
    }

    function _leveragedBorrow(address projectToken, address lendingToken, uint notionalExposure, uint marginCollateralAmount, bytes memory buyCalldata, address borrower, uint8 leverageType) internal {
        address currentLendingToken = primaryIndexToken.getLendingToken(borrower, projectToken);
        if(currentLendingToken != address(0)) {
            require(lendingToken == currentLendingToken, "PITLeverage: invalid lending token");
        }
        require(IParaSwapAugustusRegistry(AUGUSTUS_REGISTRY).isValidAugustus(augustusParaswap), "PITLeverage: INVALID_AUGUSTUS");
        _checkIsValidPosition(borrower, projectToken, lendingToken, marginCollateralAmount);
        
        uint lendingTokenCount = calculateLendingTokenCount(lendingToken, notionalExposure);
        // uint collateralTokenCount = calculateCollateralTokenCount(projectToken, notionalExposure);
        address tokenTransferProxy = IParaSwapAugustus(augustusParaswap).getTokenTransferProxy();

        _nakedBorrow(borrower, lendingToken, lendingTokenCount, projectToken, currentLendingToken);

        _approve(lendingToken, tokenTransferProxy, lendingTokenCount);

        uint amountRecive = _buyOnParaSwap(projectToken, augustusParaswap, buyCalldata);

        // checkSlippage(collateralTokenCount, maxSlippage, amountRecive);

        (uint totalCollateral, uint addingAmount) = _collateraliseLoan(borrower, projectToken, amountRecive, marginCollateralAmount);

        _deferLiquidityCheck(borrower, projectToken, lendingToken);

        if(!isLeveragePosition[borrower][projectToken]){
            isLeveragePosition[borrower][projectToken] = true;
        }
        typeOfLeveragePosition[borrower][projectToken]= LeverageType(leverageType);
        emit LeveragedBorrow(borrower, projectToken, lendingToken, notionalExposure, lendingTokenCount, marginCollateralAmount, addingAmount, totalCollateral, amountRecive);
    }

    function getLeverageType(address borrower, address projectToken) public view returns(uint8) {
        if (isLeveragePosition[borrower][projectToken])
            return uint8(typeOfLeveragePosition[borrower][projectToken]);
        return type(uint8).max;
    }
}
