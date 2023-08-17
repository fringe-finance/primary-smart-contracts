// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../paraswap/interfaces/IParaSwapAugustus.sol";
import "../paraswap/interfaces/IParaSwapAugustusRegistry.sol";
import "../interfaces/IPrimaryLendingPlatform.sol";

abstract contract PrimaryLendingPlatformLeverageCore is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for ERC20Upgradeable;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    mapping(address => mapping(address => bool)) public isLeveragePosition;
    IPrimaryLendingPlatform public primaryLendingPlatform;
    address public exchangeAggregator;

    mapping(address => mapping(address => LeverageType)) public typeOfLeveragePosition;

    struct Ratio {
        uint8 numerator;
        uint8 denominator;
    }

    enum LeverageType {
        AMPLIFY,
        MARGIN_TRADE
    }

    event LeveragedBorrow(
        address user,
        address projectToken,
        address lendingToken,
        uint256 notionalExposure,
        uint256 lendingAmount,
        uint256 margin,
        uint256 addingAmount,
        uint256 totalDepositedAmount,
        uint256 amountReceive
    );
    event SetPrimaryLendingPlatform(address indexed newPrimaryLendingPlatform);

    /**
     * @notice Initializes the contract with the given parameters.
     * @dev This function is called only once when deploying the contract.
     * @param pit The address of the primary index token contract.
     */
    function initialize(address pit) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init_unchained();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        primaryLendingPlatform = IPrimaryLendingPlatform(pit);
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "PITLeverage: Caller is not the Admin");
        _;
    }

    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "PITLeverage: Caller is not the Moderator");
        _;
    }

    modifier isProjectTokenListed(address projectToken) {
        require(primaryLendingPlatform.projectTokenInfo(projectToken).isListed, "PITLeverage: Project token is not listed");
        _;
    }

    modifier isLendingTokenListed(address lendingToken) {
        require(primaryLendingPlatform.lendingTokenInfo(lendingToken).isListed, "PITLeverage: Lending token is not listed");
        _;
    }

    modifier isPrimaryLendingPlatform() {
        require(msg.sender == address(primaryLendingPlatform), "PITLeverage: Caller is not primaryLendingPlatform");
        _;
    }

    modifier onlyRelatedContracts() {
        require(primaryLendingPlatform.getRelatedContract(msg.sender), "PITLeverage: Caller is not related Contract");
        _;
    }

    /**
     * @notice Updates the primary index token contract address.
     * @dev Only a moderator can call this function.
     * @param newPrimaryLendingPlatform The new address of the primary index token contract.
     */
    function setPrimaryLendingPlatformAddress(address newPrimaryLendingPlatform) external onlyModerator {
        require(newPrimaryLendingPlatform != address(0), "PITLeverage: Invalid address");
        emit SetPrimaryLendingPlatform(newPrimaryLendingPlatform);
    }

    /**
     * @notice Retrieves the price of the given token in USD.
     * @param token The address of the token to retrieve the price for.
     * @return price The price of the token in USD.
     */
    function getTokenPrice(address token) public view returns (uint256 price) {
        uint256 tokenMultiplier = 10 ** ERC20Upgradeable(token).decimals();
        price = primaryLendingPlatform.getTokenEvaluation(token, tokenMultiplier);
    }

    /**
     * @notice Checks if the given margin, exposure, and LVR values form a valid collateralization.
     * @param margin The margin amount.
     * @param exp The exposure amount.
     * @param lvrNumerator The numerator of the loan-to-value ratio.
     * @param lvrDenominator The denominator of the loan-to-value ratio.
     * @return isValid True if the collateralization is valid, false otherwise.
     */
    function isValidCollateralization(uint256 margin, uint256 exp, uint256 lvrNumerator, uint256 lvrDenominator) public pure returns (bool isValid) {
        uint256 ratioNumerator = (margin + exp) * lvrNumerator;
        uint256 ratioDenominator = exp * lvrDenominator;
        isValid = ratioNumerator > ratioDenominator ? true : false;
    }

    /**
     * @notice Calculates the lending token count for a given notional value.
     * @param lendingToken The address of the lending token.
     * @param notionalValue The notional value for which the lending token count is to be calculated.
     * @return lendingTokenCount The calculated lending token count.
     */
    function calculateLendingTokenCount(address lendingToken, uint256 notionalValue) public view returns (uint256 lendingTokenCount) {
        lendingTokenCount = (notionalValue * 10 ** ERC20Upgradeable(lendingToken).decimals()) / getTokenPrice(lendingToken);
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
    function calculateHF(
        uint256 expAmount,
        uint256 margin,
        uint256 borrowAmount,
        uint256 lvrNumerator,
        uint256 lvrDenominator
    ) public pure returns (uint256 hfNumerator, uint256 hfDenominator) {
        hfNumerator = (expAmount + margin) * lvrNumerator;
        hfDenominator = borrowAmount * lvrDenominator;
    }

    /**
     * @notice Calculates the margin amount for a given position and safety margin.
     * Margin = ((Notional / LVR) * (1 + SafetyMargin)) - Notional
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @param safetyMarginNumerator The numerator of the safety margin ratio.
     * @param safetyMarginDenominator The denominator of the safety margin ratio.
     * @param expAmount The exposure amount.
     * @return marginAmount The calculated margin amount.
     */
    function calculateMargin(
        address projectToken,
        address lendingToken,
        uint256 safetyMarginNumerator,
        uint256 safetyMarginDenominator,
        uint256 expAmount
    ) public view returns (uint256 marginAmount) {
        (uint256 lvrNumerator, uint256 lvrDenominator) = primaryLendingPlatform.getLoanToValueRatio(projectToken, lendingToken);
        uint256 margin = ((expAmount *
            (lvrDenominator * (safetyMarginDenominator + safetyMarginNumerator) - lvrNumerator * safetyMarginDenominator)) /
            (lvrNumerator * safetyMarginDenominator));
        marginAmount = (margin * 10 ** ERC20Upgradeable(projectToken).decimals()) / getTokenPrice(projectToken);
    }

    /**
     * @notice Deletes a leverage position for a user and project token.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     */
    function deleteLeveragePosition(address user, address projectToken) external isPrimaryLendingPlatform {
        delete isLeveragePosition[user][projectToken];
    }

    /**
     * @notice Calculates the safety margin numerator and denominator for a given position, margin, and exposure.
     * Safety Margin = ((Margin + Notional) / (Notional / LVR)) - 1
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @param margin The margin amount.
     * @param exp The exposure amount.
     * @return safetyMarginNumerator The calculated safety margin numerator.
     * @return safetyMarginDenominator The calculated safety margin denominator.
     */
    function calculateSafetyMargin(
        address projectToken,
        address lendingToken,
        uint256 margin,
        uint256 exp
    ) public view returns (uint256 safetyMarginNumerator, uint256 safetyMarginDenominator) {
        (uint256 lvrNumerator, uint256 lvrDenominator) = primaryLendingPlatform.getLoanToValueRatio(projectToken, lendingToken);
        uint256 marginPrice = primaryLendingPlatform.getTokenEvaluation(projectToken, margin);
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
        uint256 pit = primaryLendingPlatform.pit(user, projectToken, lendingToken);
        uint256 totalOutstandingInUSD = primaryLendingPlatform.totalOutstandingInUSD(user, projectToken, lendingToken);
        uint256 newTotalBorrowPerCollateral = primaryLendingPlatform.getTotalBorrowPerCollateral(projectToken);
        uint256 borrowLimitPerCollateral = primaryLendingPlatform.borrowLimitPerCollateral(projectToken);
        uint256 newTotalBorrowPerLendingToken = primaryLendingPlatform.getTotalBorrowPerLendingToken(lendingToken);
        uint256 borrowLimitPerLendingToken = primaryLendingPlatform.borrowLimitPerLendingToken(lendingToken);
        require(totalOutstandingInUSD <= pit, "PITLeverage: LendingTokenAmount exceeds pit remaining");
        require(newTotalBorrowPerCollateral <= borrowLimitPerCollateral, "PITLeverage: TotalBorrow exceeded borrowLimit per collateral asset");
        require(newTotalBorrowPerLendingToken <= borrowLimitPerLendingToken, "PITLeverage: TotalBorrow exceeded borrowLimit per lending asset");
    }

    /**
     * @notice Performs a naked borrow operation for a user with the given lending token and amount.
     * @param user The address of the user.
     * @param lendingToken The address of the lending token.
     * @param lendingTokenAmount The amount of lending token to be borrowed.
     * @param projectToken The address of the project token.
     * @param currentLendingToken The address of the current lending token.
     */
    function _nakedBorrow(
        address user,
        address lendingToken,
        uint256 lendingTokenAmount,
        address projectToken,
        address currentLendingToken
    ) internal {
        primaryLendingPlatform.updateInterestInBorrowPositions(user, lendingToken);

        primaryLendingPlatform.calcBorrowPosition(user, projectToken, lendingToken, lendingTokenAmount, currentLendingToken);
        ERC20Upgradeable(lendingToken).safeTransferFrom(user, address(this), lendingTokenAmount);
    }

    /**
     * @notice Buys tokens on ParaSwap and returns the received amount.
     * @param tokenTo The address of the token to buy.
     * @param buyCalldata The calldata required for the ParaSwap operation.
     * @return amountReceive The amount of tokens received after the ParaSwap operation.
     */
    function _buyOnExchangeAggregator(address tokenTo, bytes memory buyCalldata) internal returns (uint256 amountReceive) {
        uint256 beforeBalanceTo = ERC20Upgradeable(tokenTo).balanceOf(address(this));
        // solium-disable-next-line security/no-call-value
        (bool success, ) = exchangeAggregator.call(buyCalldata);
        if (!success) {
            // Copy revert reason from call
            assembly {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }
        uint256 afterBalanceTo = ERC20Upgradeable(tokenTo).balanceOf(address(this));
        amountReceive = afterBalanceTo - beforeBalanceTo;
    }

    /**
     * @notice Approves a specified amount of tokens to be transferred by the token transfer proxy.
     * @param token The address of the ERC20 token to be approved.
     * @param tokenTransferProxy The address of the token transfer proxy.
     * @param tokenAmount The amount of tokens to be approved for transfer.
     */
    function _approve(address token, address tokenTransferProxy, uint256 tokenAmount) internal {
        if (ERC20Upgradeable(token).allowance(address(this), tokenTransferProxy) <= tokenAmount) {
            ERC20Upgradeable(token).safeApprove(tokenTransferProxy, type(uint256).max);
        }
    }

    /**
     * @notice Collateralize a loan with the specified parameters.
     * @param user The address of the user taking the loan.
     * @param projectToken The address of the project token to be collateralize.
     * @param collateralTokenCount The amount of collateral tokens being provided.
     * @param marginCollateralCount The margin collateral amount.
     * @return totalCollateral The total amount of collateral tokens.
     * @return addingAmount The additional collateral amount needed.
     */
    function _collateralizeLoan(
        address user,
        address projectToken,
        uint256 collateralTokenCount,
        uint256 marginCollateralCount
    ) internal returns (uint256 totalCollateral, uint256 addingAmount) {
        addingAmount = calculateAddingAmount(user, projectToken, marginCollateralCount);
        totalCollateral = collateralTokenCount + addingAmount;
        primaryLendingPlatform.calcDepositPosition(projectToken, totalCollateral, user);
        ERC20Upgradeable(projectToken).safeTransfer(address(primaryLendingPlatform), collateralTokenCount);
        if (addingAmount > 0) {
            ERC20Upgradeable(projectToken).safeTransferFrom(user, address(primaryLendingPlatform), addingAmount);
        }
    }

    /**
     * @notice Calculates the additional collateral amount needed for the specified user and project token.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     * @param marginCollateralCount The margin collateral amount.
     * @return addingAmount The additional collateral amount needed.
     */
    function calculateAddingAmount(address user, address projectToken, uint256 marginCollateralCount) public view returns (uint256 addingAmount) {
        uint256 depositedAmount = primaryLendingPlatform.getDepositedAmount(projectToken, user);
        addingAmount = marginCollateralCount > depositedAmount ? marginCollateralCount - depositedAmount : 0;
    }

    /**
     * @notice Checks if the specified user has a valid position for the given project and lending tokens.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @param marginCollateralAmount The margin collateral amount.
     */
    function _checkIsValidPosition(address user, address projectToken, address lendingToken, uint256 marginCollateralAmount) internal view {
        (uint256 depositedProjectTokenAmount, uint256 loanBody, uint256 accrual, , ) = primaryLendingPlatform.getPosition(
            user,
            projectToken,
            lendingToken
        );
        require(
            (!isLeveragePosition[user][projectToken] && loanBody == 0 && accrual == 0) || isLeveragePosition[user][projectToken],
            "PITLeverage: Invalid position"
        );
        require(marginCollateralAmount >= depositedProjectTokenAmount, "PITLeverage: Invalid amount");
    }

    /**
     * @notice Executes a leveraged borrow for the borrower on the specified projectToken using the given lendingToken.
     * @dev This function checks for a valid lending token, a valid Augustus address, calculates the lendingTokenCount, and performs a naked borrow.
     * It also approves the token transfer proxy, buys tokens on ParaSwap, collateralize the loan, and defers liquidity check.
     * Finally, it emits a LeveragedBorrow event.
     * @param projectToken The address of the token being borrowed.
     * @param lendingToken The address of the token being used as collateral.
     * @param notionalExposure The desired notional exposure for the leverage position.
     * @param marginCollateralAmount The amount of collateral to be added to the position as margin.
     * @param buyCalldata The calldata for the ParaSwap buy operation.
     * @param borrower The address of the borrower who's creating the leverage position.
     */
    function _leveragedBorrow(
        address projectToken,
        address lendingToken,
        uint256 notionalExposure,
        uint256 marginCollateralAmount,
        bytes memory buyCalldata,
        address borrower,
        uint8 leverageType
    ) internal {
        require(notionalExposure > 0, "PITLeverage: Invalid amount");
        address currentLendingToken = primaryLendingPlatform.getLendingToken(borrower, projectToken);
        if (currentLendingToken != address(0)) {
            require(lendingToken == currentLendingToken, "PITLeverage: Invalid lending token");
        }
        _checkIsValidPosition(borrower, projectToken, lendingToken, marginCollateralAmount);

        uint256 lendingTokenCount = calculateLendingTokenCount(lendingToken, notionalExposure);

        address tokenTransferProxy = IParaSwapAugustus(exchangeAggregator).getTokenTransferProxy();

        _nakedBorrow(borrower, lendingToken, lendingTokenCount, projectToken, currentLendingToken);

        _approve(lendingToken, tokenTransferProxy, lendingTokenCount);

        uint256 amountReceive = _buyOnExchangeAggregator(projectToken, buyCalldata);

        (uint256 totalCollateral, uint256 addingAmount) = _collateralizeLoan(borrower, projectToken, amountReceive, marginCollateralAmount);

        _deferLiquidityCheck(borrower, projectToken, lendingToken);

        if (!isLeveragePosition[borrower][projectToken]) {
            isLeveragePosition[borrower][projectToken] = true;
        }
        typeOfLeveragePosition[borrower][projectToken] = LeverageType(leverageType);
        emit LeveragedBorrow(
            borrower,
            projectToken,
            lendingToken,
            notionalExposure,
            lendingTokenCount,
            marginCollateralAmount,
            addingAmount,
            totalCollateral,
            amountReceive
        );
    }

    /**
     * @notice Get type of Leverage Position for given borrower and projectToken.
     * @param borrower The address of the borrower who's creating the leverage position
     * @param projectToken The address of the token being used as collateral.
     * @return type of leverage position or max of uint8 if leverage position is not exist.
     */
    function getLeverageType(address borrower, address projectToken) public view returns (uint8) {
        if (isLeveragePosition[borrower][projectToken]) return uint8(typeOfLeveragePosition[borrower][projectToken]);
        return type(uint8).max;
    }
}
