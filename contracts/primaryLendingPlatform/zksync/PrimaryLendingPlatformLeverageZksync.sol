// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../PrimaryLendingPlatformLeverageCore.sol";
import "../../interfaces/IPriceProviderAggregator.sol";

/**
 * @title PrimaryLendingPlatformLeverageZksync.
 * @notice The PrimaryLendingPlatformLeverageZksync contract is the contract that allows users to open leveraged positions for zksync network.
 * @dev Contract that allows users to open leveraged positions using the OpenOcean exchange aggregator. Inherit from PrimaryLendingPlatformLeverageCore.
 */
contract PrimaryLendingPlatformLeverageZksync is PrimaryLendingPlatformLeverageCore {
    using SafeERC20Upgradeable for ERC20Upgradeable;

    /**
     * @dev Emitted when the address of the OpenOceanExchangeProxy contract is set.
     * @param newOpenOceanExchangeProxy The address of the new OpenOceanExchangeProxy contract.
     */
    event SetOpenOceanExchangeProxy(address indexed newOpenOceanExchangeProxy);

    /**
     * @dev Sets the address of the exchange aggregator contract.
     *
     * Requirements:
     * - Only the moderator can call this function.
     * - The exchange aggregator address must not be the zero address.
     * @param exchangeAggregatorAddress The address of the exchange aggregator contract.
     */
    function setExchangeAggregator(address exchangeAggregatorAddress) external onlyModerator {
        require(exchangeAggregatorAddress != address(0), "AtomicRepayment: Invalid address");
        exchangeAggregator = exchangeAggregatorAddress;
        emit SetOpenOceanExchangeProxy(exchangeAggregatorAddress);
    }

    /**
     * @notice The function to be called when a user wants to leverage their position.
     * @dev Executes a leveraged borrow for the borrower on the specified projectToken using the given lendingToken and update related token's prices.
     *
     * Requirements:
     * - The project token is listed on the platform.
     * - The lending token is listed on the platform.
     * - Notional exposure must be greater than 0.
     * - The lending token must be the same as the current lending token or the current lending token must be address(0).
     * - The user must have a valid position for the given project token and lending token.
     *
     * Effects:
     * - Update price of related tokens.
     * - Calculates the required `lendingTokenCount` based on `notionalExposure`.
     * - Performs a naked borrow using `_nakedBorrow` function.
     * - Approves the transfer of `lendingToken` to the system.
     * - Buys tokens on an exchange aggregator using `_buyOnExchangeAggregator` function.
     * - Collateralizes the loan with the received tokens using `_collateralizeLoan` function.
     * - Defers liquidity check using `_deferLiquidityCheck` function.
     * - Sets the leveraged position flag and type for the borrower.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @param notionalExposure The desired notional exposure for the leverage position.
     * @param marginCollateralAmount The amount of collateral to be added to the position as margin.
     * @param buyCalldata The calldata for buying the project token on the exchange aggregator.
     * @param leverageType The type of leverage position.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     */
    function leveragedBorrow(
        address projectToken,
        address lendingToken,
        uint notionalExposure,
        uint marginCollateralAmount,
        bytes memory buyCalldata,
        uint8 leverageType,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable nonReentrant {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        _leveragedBorrow(projectToken, lendingToken, notionalExposure, marginCollateralAmount, buyCalldata, msg.sender, leverageType);
    }

    /**
     * @dev Allows a related contract to borrow funds on behalf of a user to enter a leveraged position and update related token's prices.
     *
     * Requirements:
     * - Caller must be a related contract.
     * - The project token is listed on the platform.
     * - The lending token is listed on the platform.
     * - Notional exposure must be greater than 0.
     * - The lending token must be the same as the current lending token or the current lending token must be address(0).
     * - The user must have a valid position for the given project token and lending token.
     *
     * Effects:
     * - Update price of related tokens.
     * - Calculates the required `lendingTokenCount` based on `notionalExposure`.
     * - Performs a naked borrow using `_nakedBorrow` function.
     * - Approves the transfer of `lendingToken` to the system.
     * - Buys tokens on an exchange aggregator using `_buyOnExchangeAggregator` function.
     * - Collateralizes the loan with the received tokens using `_collateralizeLoan` function.
     * - Defers liquidity check using `_deferLiquidityCheck` function.
     * - Sets the leveraged position flag and type for the borrower.
     * @param projectToken The address of the project token the user wants to invest in.
     * @param lendingToken The address of the lending token used for collateral.
     * @param notionalExposure The notional exposure of the user's investment.
     * @param marginCollateralAmount The amount of collateral to be deposited by the user.
     * @param buyCalldata The calldata used for buying the project token on the DEX.
     * @param borrower The address of the user for whom the funds are being borrowed.
     * @param leverageType The type of leverage position.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     */
    function leveragedBorrowFromRelatedContract(
        address projectToken,
        address lendingToken,
        uint notionalExposure,
        uint marginCollateralAmount,
        bytes memory buyCalldata,
        address borrower,
        uint8 leverageType,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable nonReentrant onlyRelatedContracts {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        _leveragedBorrow(projectToken, lendingToken, notionalExposure, marginCollateralAmount, buyCalldata, borrower, leverageType);
    }

    /**
     * @dev Internal function to approve a token transfer if the current allowance is less than the specified amount.
     * @param token The address of the ERC20 token to be approved.
     * @param tokenAmount The amount of tokens to be approved for transfer.
     */
    function _approveTokenTransfer(address token, uint256 tokenAmount) internal override {
        uint256 allowanceAmount = ERC20Upgradeable(token).allowance(address(this), exchangeAggregator);
        if (allowanceAmount < tokenAmount) {
            ERC20Upgradeable(token).safeIncreaseAllowance(exchangeAggregator, tokenAmount - allowanceAmount);
        }
    }

    /**
     * @dev Returns the price of a given token in USD after updating related token's prices.
     * @param token The address of the token to get the price of.
     * @return price The price of the token in USD.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     */
    function getTokenPriceWithUpdatePrices(
        address token,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint price) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return getTokenPrice(token);
    }

    /**
     * @notice Calculates the lending token count for a given notional value after updating related token's prices.
     * @param _lendingToken The address of the lending token.
     * @param notionalValue The notional value for which the lending token count is to be calculated.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return lendingTokenCount The calculated lending token count.
     */
    function calculateLendingTokenCountWithUpdatePrices(
        address _lendingToken,
        uint notionalValue,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint lendingTokenCount) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return calculateLendingTokenCount(_lendingToken, notionalValue);
    }

    /**
     * @notice Calculates the margin amount for a given position and safety margin after updating related token's prices.
     *
     * Formula: Margin = ((Notional / LVR) * (1 + SafetyMargin)) - Notional
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @param safetyMarginNumerator The numerator of the safety margin ratio.
     * @param safetyMarginDenominator The denominator of the safety margin ratio.
     * @param expAmount The exposure amount.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return marginAmount The calculated margin amount.
     */
    function calculateMarginWithUpdatePrices(
        address projectToken,
        address lendingToken,
        uint safetyMarginNumerator,
        uint safetyMarginDenominator,
        uint expAmount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint marginAmount) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return calculateMargin(projectToken, lendingToken, safetyMarginNumerator, safetyMarginDenominator, expAmount);
    }

    /**
     * @notice Calculates the safety margin numerator and denominator for a given position, margin, and exposure after updating related token's prices.
     *
     * Formula: Safety Margin = ((Margin + Notional) / (Notional / LVR)) - 1
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @param margin The margin amount.
     * @param exp The exposure amount.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return safetyMarginNumerator The calculated safety margin numerator.
     * @return safetyMarginDenominator The calculated safety margin denominator.
     */
    function calculateSafetyMarginWithUpdatePrices(
        address projectToken,
        address lendingToken,
        uint margin,
        uint exp,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint safetyMarginNumerator, uint safetyMarginDenominator) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return calculateSafetyMargin(projectToken, lendingToken, margin, exp);
    }
}
