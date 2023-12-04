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
}
