// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../../../paraswap/interfaces/IParaSwapAugustusRegistry.sol";
import "../../../interfaces/V3/IPrimaryLendingPlatformV3.sol";
import "../../../interfaces/V3/IPrimaryLendingPlatformAtomicRepaymentV3.sol";
import "../../../interfaces/IPriceProviderAggregator.sol";
import "../../../util/V3/Asset.sol";
import "../../../util/ExchangeAggregator.sol";

/**
 * @title PrimaryLendingPlatformLeverageCore.
 * @notice The PrimaryLendingPlatformLeverageCore contract is the core contract for the leverage functionality of the primary lending platform.
 * @dev Contract that allows users to leverage their positions using the exchange aggregator.
 */
abstract contract PrimaryLendingPlatformLeverageV3Core is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for ERC20Upgradeable;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    IPrimaryLendingPlatformV3 public primaryLendingPlatform;
    IPrimaryLendingPlatformAtomicRepaymentV3 public primaryLendingPlatformAtomic;
    address public exchangeAggregator;
    address public registryAggregator;

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
        address indexed user,
        address projectToken,
        address lendingToken,
        uint256 notionalExposure,
        uint256 lendingAmount,
        uint256 margin,
        uint256 addingAmount,
        uint256 totalDepositedAmount,
        uint256 amountReceive,
        LeverageType leverageType
    );

    /**
     * @dev Emitted when user closes the leverage position.
     * @param borrower The address of the borrower.
     * @param lendingToken The address of the short asset.
     * @param positionId The id of leverage position.
     * @param lendingTokenAmount The amount of short asset for closing.
     */
    event ClosePosition(address indexed borrower, address indexed lendingToken, bytes32 indexed positionId, uint256 lendingTokenAmount);

    /**
     * @dev Emitted when the primary lending platform address is set.
     * @param newPrimaryLendingPlatform The new primary lending platform address.
     */
    event SetPrimaryLendingPlatform(address indexed newPrimaryLendingPlatform);

    /**
     * @dev Emitted when the primary lending platform atomic repayment address is set.
     * @param newPrimaryLendingPlatformAtomic The new primary lending platform atomic repayment address.
     */
    event SetPrimaryLendingPlatformAtomic(address indexed newPrimaryLendingPlatformAtomic);

    /**
     * @dev Emitted when the exchange aggregator and registry aggregator addresses are set.
     * @param exchangeAggregator The address of the exchange aggregator.
     * @param registryAggregator The address of the registry aggregator.
     */
    event SetExchangeAggregator(address indexed exchangeAggregator, address indexed registryAggregator);

    /**
     * @dev Initializes the contract with the given parameters.
     * This function is called only once when deploying the contract.
     * @param pit The address of the primary lending platform contract.
     * @param pitAtomicRepayment The address of the primary lending platform atomic repayment contract.
     */
    function initialize(address pit, address pitAtomicRepayment) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init_unchained();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        primaryLendingPlatform = IPrimaryLendingPlatformV3(pit);
        primaryLendingPlatformAtomic = IPrimaryLendingPlatformAtomicRepaymentV3(pitAtomicRepayment);
    }

    /**
     * @dev Modifier to restrict access to only the contract moderator.
     */
    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "PLPLeverage: Caller is not the Moderator");
        _;
    }

    /**
     * @dev Modifier to check if the given project token is listed on the primary lending platform.
     * @param projectToken The address of the project token to check.
     */
    modifier isProjectTokenListed(address projectToken) {
        require(primaryLendingPlatform.projectTokenInfo(projectToken).isListed, "PLPLeverage: Project token is not listed");
        _;
    }

    /**
     * @dev Modifier to check if the given lending token is listed on the primary lending platform.
     * @param lendingToken The address of the lending token to check.
     */
    modifier isLendingTokenListed(address lendingToken) {
        require(primaryLendingPlatform.lendingTokenInfo(lendingToken).isListed, "PLPLeverage: Lending token is not listed");
        _;
    }

    /**
     * @dev Modifier to check if the caller is the primary lending platform contract.
     */
    modifier isPrimaryLendingPlatform() {
        require(msg.sender == address(primaryLendingPlatform), "PLPLeverage: Caller is not primaryLendingPlatform");
        _;
    }

    /**
     * @dev Modifier to check if the caller is a related contract of the primary lending platform.
     */
    modifier onlyRelatedContracts() {
        require(primaryLendingPlatform.isRelatedContract(msg.sender), "PLPLeverage: Caller is not related Contract");
        _;
    }

    /**
     * @dev Updates the Exchange Aggregator contract and registry contract addresses.
     *
     * Requirements:
     * - The caller must be the moderator.
     * - `exchangeAggregatorAddress` must not be the zero address.
     * - `registryAggregatorAddress` must be a valid Augustus contract if it is not the zero address.
     * @param exchangeAggregatorAddress The new address of the Exchange Aggregator contract.
     * @param registryAggregatorAddress The new address of the Aggregator registry contract.
     */
    function setExchangeAggregator(address exchangeAggregatorAddress, address registryAggregatorAddress) external onlyModerator {
        require(exchangeAggregatorAddress != address(0), "PrimaryLendingPlatformLeverage: Invalid address");
        if (registryAggregatorAddress != address(0)) {
            require(IParaSwapAugustusRegistry(registryAggregatorAddress).isValidAugustus(exchangeAggregatorAddress), "PLPLeverage: Invalid Augustus");
        }
        registryAggregator = registryAggregatorAddress;
        exchangeAggregator = exchangeAggregatorAddress;
        emit SetExchangeAggregator(exchangeAggregatorAddress, registryAggregatorAddress);
    }

    //************* MODERATOR FUNCTIONS ********************************

    /**
     * @dev Sets the address of the primary lending platform contract.
     *
     * Requirements:
     * - Only the moderator can call this function.
     * - The new primary lending platform address cannot be the zero address.
     * @param newPrimaryLendingPlatform The address of the new primary lending platform contract.
     */
    function setPrimaryLendingPlatformAddress(address newPrimaryLendingPlatform) external onlyModerator {
        require(newPrimaryLendingPlatform != address(0), "PLPLeverage: Invalid address");
        primaryLendingPlatform = IPrimaryLendingPlatformV3(newPrimaryLendingPlatform);
        emit SetPrimaryLendingPlatform(newPrimaryLendingPlatform);
    }

    /**
     * @dev Sets the address of the primary lending platform atomic repayment contract.
     *
     * Requirements:
     * - Only the moderator can call this function.
     * - The new primary lending platform atomic repayment address cannot be the zero address.
     * @param newPrimaryLendingPlatformAtomic The address of the new primary lending platform atomic repayment contract.
     */
    function setPrimaryLendingPlatformAtomicAddress(address newPrimaryLendingPlatformAtomic) external onlyModerator {
        require(newPrimaryLendingPlatformAtomic != address(0), "PLPLeverage: invalid address");
        primaryLendingPlatformAtomic = IPrimaryLendingPlatformAtomicRepaymentV3(newPrimaryLendingPlatformAtomic);
        emit SetPrimaryLendingPlatformAtomic(newPrimaryLendingPlatformAtomic);
    }

    //************* EXTERNAL FUNCTIONS ********************************

    /**
     * @notice Allows a user to close the specific leverage position by short asset.
     * If close successfully will delete the opened position from list of position data.
     * @param positionId The id of leverage position.
     * @param lendingToken The address of short asset.
     * @param lendingTokenAmount The amount of short asset for closing.
     */
    function closePositionByShortAsset(bytes32 positionId, address lendingToken, uint256 lendingTokenAmount) external {
        _closePositionByShortAsset(msg.sender, positionId, lendingToken, lendingTokenAmount, msg.sender);
    }

    /**
     * @notice Allows a related contract to close the specific leverage position by short asset.
     * If close successfully will delete the opened position from list of position data.
     * @param user The address of the repairer.
     * @param positionId The id of leverage position.
     * @param lendingToken The address of short asset.
     * @param lendingTokenAmount The amount of short asset for closing.
     * @param borrower The address of the borrower.
     * @return amountRemaining The remaining amount of short asset.
     */
    function closePositionByShortAssetFromRelatedContract(
        address user,
        bytes32 positionId,
        address lendingToken,
        uint256 lendingTokenAmount,
        address borrower
    ) external onlyRelatedContracts returns (uint256 amountRemaining) {
        amountRemaining = _closePositionByShortAsset(user, positionId, lendingToken, lendingTokenAmount, borrower);
    }

    //************* PUBLIC VIEW FUNCTIONS ********************************

    /**
     * @notice Retrieves the price of the given token in USD.
     * @param token The address of the token to retrieve the price for.
     * @return collateralPrice The price of the token in USD.
     * @return capitalPrice The price of the token in USD.
     */
    function getTokenPrice(address token) public view returns (uint256 collateralPrice, uint256 capitalPrice) {
        uint256 tokenMultiplier = 10 ** ERC20Upgradeable(token).decimals();
        return primaryLendingPlatform.getTokenEvaluation(token, tokenMultiplier);
    }

    /**
     * @notice Calculates the lending token count for a given notional value.
     * @param lendingToken The address of the lending token.
     * @param notionalValue The notional value for which the lending token count is to be calculated.
     * @return lendingTokenCount The calculated lending token count.
     */
    function calculateLendingTokenCount(address lendingToken, uint256 notionalValue) public view returns (uint256 lendingTokenCount) {
        (, uint256 lendingTokenPrice) = getTokenPrice(lendingToken);
        lendingTokenCount = (notionalValue * 10 ** ERC20Upgradeable(lendingToken).decimals()) / lendingTokenPrice;
    }

    /**
     * @notice Calculates the additional collateral amount needed for the specified user and project token.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     * @param marginCollateralCount The margin collateral amount.
     * @return addingAmount The additional collateral amount needed.
     */
    function calculateAddingAmount(address user, address projectToken, uint256 marginCollateralCount) public view returns (uint256 addingAmount) {
        uint256 depositedAmount = primaryLendingPlatform.depositedAmount(user, projectToken);
        addingAmount = marginCollateralCount > depositedAmount ? marginCollateralCount - depositedAmount : 0;
    }

    //************* INTERNAL FUNCTIONS ********************************

    /**
     * @notice Performs a naked borrow operation for a user with the given lending token and amount.
     * @param user The address of the user.
     * @param lendingToken The address of the lending token.
     * @param lendingTokenAmount The amount of lending token to be borrowed.
     */
    function _nakedBorrow(address user, address lendingToken, uint256 lendingTokenAmount) internal {
        primaryLendingPlatform.updateInterestInAllBorrowPositions(user);

        primaryLendingPlatform.calcBorrowPosition(user, lendingToken, lendingTokenAmount);
        ERC20Upgradeable(lendingToken).safeTransferFrom(user, address(this), lendingTokenAmount);
    }

    /**
     * @notice Executes a leveraged borrow for the borrower on the specified projectToken using the given lendingToken.
     * @dev This function checks for a valid lending token, a valid Augustus address, calculates the lendingTokenCount, and performs a naked borrow.
     * It also approves the token transfer proxy, buys tokens on ParaSwap, collateralize the loan, and defers liquidity check.
     * Finally, it emits a LeveragedBorrow event.
     * @param prjInfo Information about the project token, including its address and type.
     * @param lendingInfo Information about the lending token, including its address and type.
     * @param notionalExposure The desired notional exposure for the leverage position.
     * @param marginCollateralAmount The amount of collateral to be added to the position as margin.
     * @param buyCalldata The calldata for the ParaSwap buy operation.
     * @param borrower The address of the borrower who's creating the leverage position.
     * @param leverageType The type of leverage borrow.
     * @param updatePriceTokens The array of tokens to update price.
     */
    function _leveragedBorrow(
        Asset.Info memory prjInfo,
        Asset.Info memory lendingInfo,
        uint256 notionalExposure,
        uint256 marginCollateralAmount,
        bytes[] memory buyCalldata,
        address borrower,
        uint8 leverageType,
        address[] memory updatePriceTokens
    ) internal {
        require(notionalExposure > 0, "PLPLeverage: Invalid amount");

        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updateMultiFinalPrices(updatePriceTokens);

        _checkIsValidPosition(borrower, prjInfo.addr, notionalExposure);

        uint256 lendingTokenCount = calculateLendingTokenCount(lendingInfo.addr, notionalExposure);

        _nakedBorrow(borrower, lendingInfo.addr, lendingTokenCount);

        uint256 amountReceive;
        {
            (address[] memory lendingAssets, ) = ExchangeAggregator._unwrapTokenAndApprove(
                lendingInfo,
                lendingTokenCount,
                exchangeAggregator,
                registryAggregator
            );
            uint256[] memory amountRemaining;
            (amountRemaining, amountReceive) = ExchangeAggregator._buyOnExchangeAggregatorWithMultiAsset(
                lendingAssets,
                prjInfo,
                buyCalldata,
                exchangeAggregator
            );
            for (uint8 i = 0; i < amountRemaining.length; i++) {
                ERC20Upgradeable(lendingAssets[i]).safeTransfer(borrower, amountRemaining[i]);
            }
        }

        (uint256 totalCollateral, uint256 addingAmount) = _collateralizeLoan(borrower, prjInfo.addr, amountReceive, marginCollateralAmount);

        _deferLiquidityCheck(borrower, prjInfo.addr, lendingInfo.addr);

        emit LeveragedBorrow(
            borrower,
            prjInfo.addr,
            lendingInfo.addr,
            notionalExposure,
            lendingTokenCount,
            marginCollateralAmount,
            addingAmount,
            totalCollateral,
            amountReceive,
            LeverageType(leverageType)
        );
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
     * @notice Closes the specified leverage position by short asset.
     * @param user The address of the repairer.
     * @param positionId The id of leverage position.
     * @param lendingToken The address of short asset.
     * @param lendingTokenAmount The amount of short asset for closing.
     * @param borrower The address of the borrower.
     * @return amountRemaining The remaining amount of short asset.
     */
    function _closePositionByShortAsset(
        address user,
        bytes32 positionId,
        address lendingToken,
        uint256 lendingTokenAmount,
        address borrower
    ) internal returns (uint256 amountRemaining){
        ERC20Upgradeable(lendingToken).safeTransferFrom(user, address(this), lendingTokenAmount);
        Asset._safeIncreaseAllowance(primaryLendingPlatform.lendingTokenInfo(lendingToken).bLendingToken, lendingToken, lendingTokenAmount);
        uint256 amountRepaid = primaryLendingPlatform.repayFromRelatedContract(lendingToken, lendingTokenAmount, address(this), borrower, positionId);
        amountRemaining = lendingTokenAmount - amountRepaid;
        if (amountRemaining > 0) {
            ERC20Upgradeable(lendingToken).safeTransfer(user, amountRemaining);
        }

        emit ClosePosition(borrower, lendingToken, positionId, amountRepaid);
    }

    //************* INTERNAL VIEW FUNCTIONS ********************************

    /**
     * @notice Checks if the specified user has a valid position for the given project and lending tokens.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     * @param notionalExposure The margin collateral amount.
     */
    function _checkIsValidPosition(address user, address projectToken, uint256 notionalExposure) internal view {
        IPrimaryLendingPlatformV3.Ratio memory lvrProjectToken = primaryLendingPlatform.projectTokenInfo(projectToken).loanToValueRatio;
        uint256 collateralPIT = (notionalExposure * lvrProjectToken.numerator) / lvrProjectToken.denominator;
        uint256 totalPitRemaining = primaryLendingPlatform.totalPITRemaining(user);
        require(totalPitRemaining + collateralPIT >= notionalExposure, "PLPLeverage: not enough total pit remaining");
    }

    /**
     * @notice Defers the liquidity check for a given user, project token, and lending token.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     */
    function _deferLiquidityCheck(address user, address projectToken, address lendingToken) internal view {
        (uint256 totalPit, uint256 totalWeightedLoanInUSD) = primaryLendingPlatform.healthFactor(user);
        require(totalWeightedLoanInUSD <= totalPit, "PLPLeverage: lendingTokenAmount exceeds pit remaining");
        uint256 newTotalBorrowPerLendingToken = primaryLendingPlatform.getBorrowedPerLendingTokenInUSD(lendingToken);

        uint256 borrowLimitPerLendingToken = primaryLendingPlatform.borrowLimitPerLendingToken(lendingToken);

        uint256 newTotalDepositPerProjectToken = primaryLendingPlatform.getDepositedPerProjectTokenInUSD(projectToken);

        uint256 depositLimitPerProjectToken = primaryLendingPlatform.depositLimitPerProjectToken(projectToken);

        require(newTotalBorrowPerLendingToken <= borrowLimitPerLendingToken, "PLPLeverage: totalBorrow exceeded borrowLimit per lending asset");
        require(
            newTotalDepositPerProjectToken <= depositLimitPerProjectToken,
            "PLPLeverage: totalDeposit exceeded depositLimit per collateral asset"
        );
    }
}
