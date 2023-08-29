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

/**
 * @title PrimaryLendingPlatformLeverageCore.
 * @notice The PrimaryLendingPlatformLeverageCore contract is the core contract for the leverage functionality of the primary lending platform.
 * @dev Contract that allows users to leverage their positions using the exchange aggregator.
 */
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

    /**
     * @dev Emitted when a user leverages their borrowing position.
     * @param user The address of the user who leveraged their position.
     * @param projectToken The address of the project token being used for leverage.
     * @param lendingToken The address of the lending token being used for leverage.
     * @param notionalExposure The total notional exposure of the user's position.
     * @param lendingAmount The amount of the lending token being borrowed.
     * @param margin The margin required for the leverage.
     * @param addingAmount The amount of the project token being added to the position.
     * @param totalDepositedAmount The total amount of the project token deposited in the position.
     * @param amountReceive The amount of the lending token received by the user after the leverage.
     */
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

    /**
     * @dev Emitted when the primary lending platform address is set.
     * @param newPrimaryLendingPlatform The new primary lending platform address.
     */
    event SetPrimaryLendingPlatform(address indexed newPrimaryLendingPlatform);

    /**
     * @dev Initializes the contract with the given parameters.
     * This function is called only once when deploying the contract.
     * @param pit The address of the primary index token contract.
     */
    function initialize(address pit) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init_unchained();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        primaryLendingPlatform = IPrimaryLendingPlatform(pit);
    }

    /**
     * @dev Modifier to restrict access to only the contract admin.
     */
    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "PITLeverage: Caller is not the Admin");
        _;
    }

    /**
     * @dev Modifier to restrict access to only the contract moderator.
     */
    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "PITLeverage: Caller is not the Moderator");
        _;
    }

    /**
     * @dev Modifier to check if the given project token is listed on the primary lending platform.
     * @param projectToken The address of the project token to check.
     */
    modifier isProjectTokenListed(address projectToken) {
        require(primaryLendingPlatform.projectTokenInfo(projectToken).isListed, "PITLeverage: Project token is not listed");
        _;
    }

    /**
     * @dev Modifier to check if the given lending token is listed on the primary lending platform.
     * @param lendingToken The address of the lending token to check.
     */
    modifier isLendingTokenListed(address lendingToken) {
        require(primaryLendingPlatform.lendingTokenInfo(lendingToken).isListed, "PITLeverage: Lending token is not listed");
        _;
    }

    /**
     * @dev Modifier to check if the caller is the primary lending platform contract.
     */
    modifier isPrimaryLendingPlatform() {
        require(msg.sender == address(primaryLendingPlatform), "PITLeverage: Caller is not primaryLendingPlatform");
        _;
    }

    /**
     * @dev Modifier to check if the caller is a related contract of the primary lending platform.
     */
    modifier onlyRelatedContracts() {
        require(primaryLendingPlatform.getRelatedContract(msg.sender), "PITLeverage: Caller is not related Contract");
        _;
    }

    /**
     * @dev Sets the address of the primary lending platform contract.
     * #### Requirements:
     * - Only the moderator can call this function.
     * - The new primary lending platform address cannot be the zero address.
     * @param newPrimaryLendingPlatform The address of the new primary lending platform contract.
     */
    function setPrimaryLendingPlatformAddress(address newPrimaryLendingPlatform) external onlyModerator {
        require(newPrimaryLendingPlatform != address(0), "PITLeverage: Invalid address");
        primaryLendingPlatform = IPrimaryLendingPlatform(newPrimaryLendingPlatform);
        emit SetPrimaryLendingPlatform(newPrimaryLendingPlatform);
    }

    /**
     * @dev Returns the price of a given token in USD.
     * @param token The address of the token to get the price of.
     * @return price The price of the token in USD.
     */
    function getTokenPrice(address token) public view returns (uint256 price) {
        uint256 tokenMultiplier = 10 ** ERC20Upgradeable(token).decimals();
        price = primaryLendingPlatform.getTokenEvaluation(token, tokenMultiplier);
    }

    /**
     * @dev Checks if the given margin, exposure, and LVR values form a valid collateralization.
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
     * @dev Calculates the health factor numerator and denominator based on the given parameters.
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
     * @dev Calculates the margin amount for a given position and safety margin.
     * #### Formula: 
     * - Margin = ((Notional / LVR) * (1 + SafetyMargin)) - Notional
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
     * @dev Deletes a leverage position for a user and project token.
     * The caller must be the primary lending platform.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     */
    function deleteLeveragePosition(address user, address projectToken) external isPrimaryLendingPlatform {
        delete isLeveragePosition[user][projectToken];
    }

    /**
     * @dev Calculates the safety margin numerator and denominator for a given position, margin, and exposure.
     * #### Formula: 
     * - Safety Margin = ((Margin + Notional) / (Notional / LVR)) - 1
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
     * @dev Internal function to defer the liquidity check for a given user, project token, and lending token.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * #### Requirements:
     * - `totalOutstandingInUSD` must be less than or equal to `pit`.
     * - `newTotalBorrowPerCollateral` must be less than or equal to `borrowLimitPerCollateral`.
     * - `newTotalBorrowPerLendingToken` must be less than or equal to `borrowLimitPerLendingToken`.
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
     * @dev Internal function to execute a naked borrow operation, updating the interest in borrow positions for the user and calculating the borrow position.
     * @param user The address of the user performing the borrow operation.
     * @param lendingToken The address of the token being borrowed.
     * @param lendingTokenAmount The amount of the token being borrowed.
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
     * @dev Internal function to execute a buy order on the exchange aggregator contract and returns the amount of tokens received.
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
     * @dev Internal function to approve a specified amount of tokens to be transferred by the token transfer proxy.
     * @param token The address of the ERC20 token to be approved.
     * @param tokenAmount The amount of tokens to be approved for transfer.
     */
    function _approveTokenTransfer(address token, uint256 tokenAmount) internal virtual {
        address tokenTransferProxy = IParaSwapAugustus(exchangeAggregator).getTokenTransferProxy();
        if (ERC20Upgradeable(token).allowance(address(this), tokenTransferProxy) <= tokenAmount) {
            ERC20Upgradeable(token).safeApprove(tokenTransferProxy, type(uint256).max);
        }
    }

    /**
     * @notice Internal function to collateralize a loan with the specified parameters.
     * @param user The address of the user taking the loan.
     * @param projectToken The address of the project token to be collateralize.
     * @param collateralTokenCount The amount of collateral tokens being provided.
     * @param marginCollateralCount The amount of margin collateral being used.
     * @return totalCollateral The total amount of collateral tokens after adding the margin collateral.
     * @return addingAmount The amount of margin collateral being added to the collateral tokens.
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
     * @notice Internal function to check if the specified user has a valid position for the given project and lending tokens.
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
     * @dev Internal function to be called when a user wants to leverage their position.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @param notionalExposure The desired notional exposure for the leverage position.
     * @param marginCollateralAmount The amount of collateral to be added to the position as margin.
     * @param buyCalldata The calldata for buying the project token on the exchange aggregator.
     * @param borrower The address of the borrower who's creating the leverage position.
     * @param leverageType The type of leverage position.
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

        _nakedBorrow(borrower, lendingToken, lendingTokenCount, projectToken, currentLendingToken);

        _approveTokenTransfer(lendingToken, lendingTokenCount);

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
     * @dev Gets type of Leverage Position for given borrower and projectToken.
     * @param borrower The address of the borrower who's creating the leverage position
     * @param projectToken The address of the token being used as collateral.
     * @return type of leverage position or max of uint8 if leverage position is not exist.
     */
    function getLeverageType(address borrower, address projectToken) public view returns (uint8) {
        if (isLeveragePosition[borrower][projectToken]) return uint8(typeOfLeveragePosition[borrower][projectToken]);
        return type(uint8).max;
    }
}
