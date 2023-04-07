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
    event SetPrimaryIndexToken(address indexed oldPrimaryIndexToken, address indexed newPrimaryIndexToken);
    event SetAugustusParaswap(address indexed augustusParaswap, address indexed augustusRegistry);

    /** 
     * @notice Initializes the contract with the given parameters. 
     * @dev This function is called only once when deploying the contract. 
     * @param pit The address of the primary index token contract. 
     * @param _augustusParaswap The address of the ParaSwap Augustus contract. 
     * @param _AUGUSTUS_REGISTRY The address of the ParaSwap Augustus registry contract. 
     */
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

    /** 
     * @notice Updates the primary index token contract address. 
     * @dev Only a moderator can call this function. 
     * @param _newPrimaryIndexToken The new address of the primary index token contract. 
     */
    function setPrimaryIndexTokenAddress(address _newPrimaryIndexToken) external onlyModerator() {
        require(_newPrimaryIndexToken != address(0), "PITLeverage: invalid address");
        emit SetPrimaryIndexToken(address(primaryIndexToken), _newPrimaryIndexToken);
        primaryIndexToken = IPrimaryIndexToken(_newPrimaryIndexToken);
    }

    /** 
     * @notice Updates the ParaSwap Augustus contract and registry contract addresses. 
     * @dev Only a moderator can call this function. 
     * @param augustusParaswap_ The new address of the ParaSwap Augustus contract. 
     * @param AUGUSTUS_REGISTRY_ The new address of the ParaSwap Augustus registry contract. 
     */
    function setAugustusParaswap(address augustusParaswap_, address AUGUSTUS_REGISTRY_) public onlyModerator(){
        require(augustusParaswap_ != address(0) && AUGUSTUS_REGISTRY_ !=address(0), "PITLeverage: invalid address");
        augustusParaswap = augustusParaswap_;
        AUGUSTUS_REGISTRY = AUGUSTUS_REGISTRY_;
        emit SetAugustusParaswap(augustusParaswap_, AUGUSTUS_REGISTRY_);
    }

    /** 
     * @notice Retrieves the Loan-to-Value (LTV) ratio for the given project token. 
     * @param _projectToken The address of the project token. 
     * @return lvrNumerator The numerator of the LTV ratio. 
     * @return lvrDenominator The denominator of the LTV ratio. 
     */
    function getLVR(address _projectToken) public view returns(uint8 lvrNumerator, uint8 lvrDenominator) {
        lvrNumerator = primaryIndexToken.projectTokenInfo(_projectToken).loanToValueRatio.numerator;
        lvrDenominator = primaryIndexToken.projectTokenInfo(_projectToken).loanToValueRatio.denominator;
    }

    /** 
     * @notice Retrieves the price of the given token in USD. 
     * @param token The address of the token to retrieve the price for. 
     * @return price The price of the token in USD. 
     */
    function getTokenPrice(address token) public view returns(uint price) {
        uint tokenMultiplier = 10 ** ERC20Upgradeable(token).decimals();
        price = primaryIndexToken.getTokenEvaluation(token, tokenMultiplier);
    }

    /** 
     * @notice Checks if the given margin, exposure, and LVR values form a valid collateralization. 
     * @param margin The margin amount. 
     * @param exp The exposure amount. 
     * @param lvrNumerator The numerator of the loan-to-value ratio. 
     * @param lvrDenominator The denominator of the loan-to-value ratio. 
     * @return isValid True if the collateralization is valid, false otherwise. 
     */
    function isValidCollateralisation(uint margin, uint exp, uint lvrNumerator, uint lvrDenominator) public pure returns(bool isValid){
        uint ratioNumerator = (margin + exp) * lvrNumerator;
        uint ratioDenominator = exp * lvrDenominator;
        isValid = ratioNumerator > ratioDenominator ? true : false;
    }

    /** 
     * @notice Calculates the collateral token count for a given notional value. 
     * @param _projectToken The address of the project token. 
     * @param notionalValue The notional value for which the collateral token count is to be calculated. 
     * @return collateralTokenCount The calculated collateral token count. 
     */
    function calculateCollateralTokenCount(address _projectToken, uint notionalValue) public view returns(uint collateralTokenCount) {
        collateralTokenCount = notionalValue * 10 ** ERC20Upgradeable(_projectToken).decimals() / getTokenPrice(_projectToken);
    }

    /** 
     * @notice Calculates the lending token count for a given notional value. 
     * @param _lendingToken The address of the lending token. 
     * @param notionalValue The notional value for which the lending token count is to be calculated. 
     * @return lendingTokenCount The calculated lending token count. 
     */
    function calculateLendingTokenCount(address _lendingToken, uint notionalValue) public view returns(uint lendingTokenCount) {
        lendingTokenCount = notionalValue * 10 ** ERC20Upgradeable(_lendingToken).decimals() / getTokenPrice(_lendingToken);
    }


    /** 
     * @notice Calculates the health factor numerator and denominator based on the given parameters. 
     * @param expAmount The exposure amount. 
     * @param margin The margin amount. 
     * @param borrowAmount The borrowed amount. 
     * @param lvrNumerator The numerator of the loan-to-value ratio. 
     * @param lvrDenominator The denominator of the loan-to-value ratio. 
     * @return hfNumerator The calculated health factor numerator. 
     * @return hfDenominator The calculated health factor denominator. 
     */
    function calculateHF(uint expAmount, uint margin, uint borrowAmount, uint lvrNumerator, uint lvrDenominator) public pure returns(uint hfNumerator, uint hfDenominator) {
        hfNumerator = (expAmount + margin) * lvrNumerator;
        hfDenominator = borrowAmount * lvrDenominator;
    }

    /** 
     * @notice Calculates the margin amount for a given project token and safety margin.
     * Margin = ((Notional / LVR) * (1 + SafetyMargin)) - Notional
     * @param projectToken The address of the project token. 
     * @param safetyMarginNumerator The numerator of the safety margin ratio. 
     * @param safetyMarginDenominator The denominator of the safety margin ratio. 
     * @param expAmount The exposure amount. 
     * @return marginAmount The calculated margin amount. 
     */
    function calculateMargin(address projectToken, uint safetyMarginNumerator, uint safetyMarginDenominator, uint expAmount) public view returns(uint marginAmount) {
        (uint8 lvrNumerator, uint8 lvrDenominator) = getLVR(projectToken);
        uint margin = (expAmount * (lvrDenominator * (safetyMarginDenominator + safetyMarginNumerator) - lvrNumerator * safetyMarginDenominator) / (lvrNumerator * safetyMarginDenominator));
        marginAmount = margin * 10 ** ERC20Upgradeable(projectToken).decimals() / getTokenPrice(projectToken);
    }

    /** 
     * @notice Deletes a leverage position for a user and project token. 
     * @param user The address of the user. 
     * @param projectToken The address of the project token. 
     */
    function deleteLeveragePosition(address user, address projectToken) external isPrimaryIndexToken {
        delete isLeveragePosition[user][projectToken];
    }

    /** 
     * @notice Calculates the safety margin numerator and denominator for a given project token, margin, and exposure. 
     * Safety Margin = ((Margin + Notional) / (Notional / LVR)) - 1
     * @param projectToken The address of the project token. 
     * @param margin The margin amount. 
     * @param exp The exposure amount.
     * @return safetyMarginNumerator The calculated safety margin numerator.
     * @return safetyMarginDenominator The calculated safety margin denominator.
     */
    function calculateSafetyMargin(address projectToken, uint margin, uint exp) public view returns(uint safetyMarginNumerator, uint safetyMarginDenominator){
        (uint8 lvrNumerator, uint8 lvrDenominator) = getLVR(projectToken);
        uint marginPrice = primaryIndexToken.getTokenEvaluation(projectToken, margin);
        safetyMarginNumerator = (marginPrice + exp) * lvrNumerator - exp * lvrDenominator;
        safetyMarginDenominator = (exp * lvrDenominator);
    }

    /**
     * @notice Defers the liquidity check for a given user, project token, and lending token.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     */
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

    /**
     * @notice Performs a naked borrow operation for a user with the given lending token and amount.
     * @param user The address of the user.
     * @param lendingToken The address of the lending token.
     * @param lendingTokenAmount The amount of lending token to be borrowed.
     * @param projectToken The address of the project token.
     * @param currentLendingToken The address of the current lending token.
     */
    function _nakedBorrow(address user, address lendingToken, uint lendingTokenAmount, address projectToken, address currentLendingToken) internal {
        primaryIndexToken.updateInterestInBorrowPositions(user, lendingToken);

        primaryIndexToken.calcBorrowPosition(user, projectToken, lendingToken, lendingTokenAmount, currentLendingToken);
        ERC20Upgradeable(lendingToken).safeTransferFrom(user, address(this), lendingTokenAmount);
    }

    /**
     * @notice Buys tokens on ParaSwap and returns the received amount.
     * @param tokenTo The address of the token to buy.
     * @param _target The target address for the ParaSwap operation.
     * @param buyCalldata The calldata required for the ParaSwap operation.
     * @return amountRecive The amount of tokens received after the ParaSwap operation.
     */
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

    /** 
     * @notice Approves a specified amount of tokens to be transferred by the token transfer proxy. 
     * @param token The address of the ERC20 token to be approved. 
     * @param tokenTransferProxy The address of the token transfer proxy. 
     * @param tokenAmount The amount of tokens to be approved for transfer. 
     */
    function _approve(address token, address tokenTransferProxy, uint tokenAmount) internal {
        if(ERC20Upgradeable(token).allowance(address(this), tokenTransferProxy) <= tokenAmount) {
            ERC20Upgradeable(token).safeApprove(tokenTransferProxy, type(uint256).max);
        }
    }

    /** 
     * @notice Collateralizes a loan with the specified parameters. 
     * @param user The address of the user taking the loan. 
     * @param projectToken The address of the project token to be collateralized. 
     * @param collateralTokenCount The amount of collateral tokens being provided. 
     * @param marginCollateralCount The margin collateral amount. 
     * @return totalCollateral The total amount of collateral tokens. 
     * @return addingAmount The additional collateral amount needed. 
     */
    function _collateraliseLoan(address user, address projectToken, uint collateralTokenCount, uint marginCollateralCount) internal returns(uint totalCollateral, uint addingAmount){
        addingAmount = calculateAddingAmount(user, projectToken, marginCollateralCount);
        totalCollateral = collateralTokenCount + addingAmount;
        primaryIndexToken.calcDepositPosition(projectToken, totalCollateral, user);
        ERC20Upgradeable(projectToken).safeTransfer(address(primaryIndexToken), collateralTokenCount);
        if(addingAmount > 0) {
            ERC20Upgradeable(projectToken).safeTransferFrom(user, address(primaryIndexToken), addingAmount);
        }
    }

    /** 
     * @notice Calculates the additional collateral amount needed for the specified user and project token. 
     * @param user The address of the user. 
     * @param projectToken The address of the project token. 
     * @param marginCollateralCount The margin collateral amount. 
     * @return addingAmount The additional collateral amount needed. 
     */
    function calculateAddingAmount(address user, address projectToken, uint marginCollateralCount) public view returns(uint256 addingAmount) {
        uint depositedAmount = primaryIndexToken.getDepositedAmount(projectToken, user);
        addingAmount = marginCollateralCount > depositedAmount ? marginCollateralCount - depositedAmount : 0;
    }
     
    /** 
     * @notice Checks if the specified user has a valid position for the given project and lending tokens. 
     * @param user The address of the user. 
     * @param projectToken The address of the project token. 
     * @param lendingToken The address of the lending token. 
     * @param marginCollateralAmount The margin collateral amount. 
     */
    function _checkIsValidPosition(address user, address projectToken, address lendingToken, uint marginCollateralAmount) internal view {
        (uint256 depositedProjectTokenAmount, uint256 loanBody, uint256 accrual, , ) = primaryIndexToken.getPosition(user, projectToken, lendingToken);
        require(!isLeveragePosition[user][projectToken] && loanBody == 0 && accrual == 0 || isLeveragePosition[user][projectToken], "PITLeverage: invalid position");
        require(marginCollateralAmount >= depositedProjectTokenAmount, "PITLeverage: invalid amount");
    }

    /** 
     * @notice Checks if the slippage is within the acceptable range. 
     * @param collateralTokenCount The amount of collateral tokens. 
     * @param maxSlippage The maximum acceptable slippage. 
     * @param amountRecive The amount of tokens received. 
     */
    function _checkSlippage(uint collateralTokenCount, uint maxSlippage, uint amountRecive) internal pure {
        uint realRate = amountRecive * decimalPercent / collateralTokenCount;
        uint slippage = decimalPercent >= realRate ? decimalPercent - realRate : realRate - decimalPercent;
        require(maxSlippage >= slippage, "PITLeverage: over maxSlippage");
    }

    /** 
     * @notice Executes a leveraged borrow operation for the specified project token, lending token, and notional exposure. 
     * @param projectToken The address of the project token. 
     * @param lendingToken The address of the lending token. 
     * @param notionalExposure The notional exposure for the borrow operation. 
     * @param marginCollateralAmount The amount of collateral to be deposited by the user. 
     * @param buyCalldata The calldata used for buying the project token on the DEX. 
     */
    function leveragedBorrow(address projectToken, address lendingToken, uint notionalExposure, uint marginCollateralAmount, bytes memory buyCalldata, uint8 leverageType) public nonReentrant{
        _leveragedBorrow(projectToken, lendingToken, notionalExposure, marginCollateralAmount, buyCalldata, msg.sender, leverageType);
    }

    /** 
     * @dev Allows a related contract to borrow funds on behalf of a user to enter a leveraged position. 
     * @param projectToken The address of the project token the user wants to invest in. 
     * @param lendingToken The address of the lending token used for collateral. 
     * @param notionalExposure The notional exposure of the user's investment. 
     * @param marginCollateralAmount The amount of collateral to be deposited by the user. 
     * @param buyCalldata The calldata used for buying the project token on the DEX. 
     * @param borrower The address of the user for whom the funds are being borrowed. 
     */
    function leveragedBorrowFromRelatedContract(address projectToken, address lendingToken, uint notionalExposure, uint marginCollateralAmount, bytes memory buyCalldata, address borrower, uint8 leverageType) public nonReentrant onlyRelatedContracts() {
        _leveragedBorrow(projectToken, lendingToken, notionalExposure, marginCollateralAmount, buyCalldata, borrower, leverageType);
    }

    /**
     * @notice Executes a leveraged borrow for the borrower on the specified projectToken using the given lendingToken.
     * @dev This function checks for a valid lending token, a valid Augustus address, calculates the lendingTokenCount, and performs a naked borrow.
     * It also approves the token transfer proxy, buys tokens on ParaSwap, collateralizes the loan, and defers liquidity check.
     * Finally, it emits a LeveragedBorrow event.
     * @param projectToken The address of the token being borrowed.
     * @param lendingToken The address of the token being used as collateral.
     * @param notionalExposure The desired notional exposure for the leverage position.
     * @param marginCollateralAmount The amount of collateral to be added to the position as margin.
     * @param buyCalldata The calldata for the ParaSwap buy operation.
     * @param borrower The address of the borrower who's creating the leverage position.
     */
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

    /**
     * @notice Get type of Leverage Position for given borrower and projectToken.
     * @param borrower The address of the borrower who's creating the leverage position
     * @param projectToken The address of the token being used as collateral.
     * @return type of leverage position or max of uint8 if leverage position is not exist.
     */
    function getLeverageType(address borrower, address projectToken) public view returns(uint8) {
        if (isLeveragePosition[borrower][projectToken])
            return uint8(typeOfLeveragePosition[borrower][projectToken]);
        return type(uint8).max;
    }
}
