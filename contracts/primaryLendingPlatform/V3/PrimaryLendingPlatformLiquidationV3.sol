// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./core/PrimaryLendingPlatformLiquidationV3Core.sol";
import "../../interfaces/IPriceProviderAggregator.sol";

/**
 * @title PrimaryLendingPlatformLiquidationZksync.
 * @notice The PrimaryLendingPlatformLiquidationZksync contract is the contract that allows users to liquidate positions for zksync network.
 * @dev Contract that allows users to liquidate positions. Inherit from PrimaryLendingPlatformLiquidationCore.
 */
contract PrimaryLendingPlatformLiquidationV3 is PrimaryLendingPlatformLiquidationV3Core {
    //************* EXTERNAL FUNCTION ********************************

    /**
     * @notice Liquidates a user's position based on the specified lending token amount and update related token's prices.
     * @dev The function to be called when a user wants to liquidate their position. Support liquidation with hot borrowing or not.
     *
     * Requirements:
     * - The project token is listed on the platform.
     * - The lending token is listed on the platform.
     * - The lending token amount must be greater than 0.
     * - The user must have a position for the given project token and lending token.
     * - The health factor must be less than 1.
     * - `_lendingTokenAmount` must be within the permissible range of liquidation amount.
     *
     * Effects:
     * - Update price of related tokens.
     * - Calculates the health factor of the position using `healthFactor` function.
     * - Validates the health factor and ensures it's less than 1.
     * - Calculates the permissible liquidation range using `getLimitLiquidationAmount` function.
     * - Validates `_lendingTokenAmount` against the permissible range.
     * - Determines the amount of project token to send to the liquidator.
     * - Distributes rewards to the liquidator.
     * @param account The address of the borrower.
     * @param prjInfo Information about the project token, including its address and type.
     * @param lendingInfo Information about the lending token, including its address and type.
     * @param lendingTokenAmount The amount of lending tokens to be used for liquidation.
     * @param updatePriceTokens the list of token addresses need to be updated price.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @param buyCalldata the buy calldata for hot borrow.
     */
    function liquidate(
        address account,
        Asset.Info memory prjInfo,
        Asset.Info memory lendingInfo,
        uint256 lendingTokenAmount,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData,
        bytes[] memory buyCalldata
    )
        external
        payable
        isProjectTokenListed(prjInfo.addr)
        isLendingTokenListed(lendingInfo.addr)
        nonReentrant
        returns (address[] memory assets, uint256[] memory assetAmounts)
    {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return _liquidate(account, prjInfo, lendingInfo, lendingTokenAmount, msg.sender, buyCalldata, updatePriceTokens);
    }

    /**
     * @notice Liquidates a user's position based on the specified lending token amount and update related token's prices.
     * @dev The function to be called when a user wants to liquidate their position. Support liquidation with hot borrowing or not.
     *
     * Requirements:
     * - The project token is listed on the platform.
     * - The lending token is listed on the platform.
     * - The lending token amount must be greater than 0.
     * - The user must have a position for the given project token and lending token.
     * - The health factor must be less than 1.
     * - `_lendingTokenAmount` must be within the permissible range of liquidation amount.
     *
     * Effects:
     * - Update price of related tokens.
     * - Calculates the health factor of the position using `healthFactor` function.
     * - Validates the health factor and ensures it's less than 1.
     * - Calculates the permissible liquidation range using `getLimitLiquidationAmount` function.
     * - Validates `_lendingTokenAmount` against the permissible range.
     * - Determines the amount of project token to send to the liquidator.
     * - Distributes rewards to the liquidator.
     * @param account The address of the borrower.
     * @param prjInfo Information about the project token, including its address and type.
     * @param lendingInfo Information about the lending token, including its address and type.
     * @param lendingTokenAmount The amount of lending tokens to be used for liquidation.
     * @param liquidator The address of the liquidator.
     * @param updatePriceTokens the list of token addresses need to be updated price.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @param buyCalldata the buy calldata for hot borrow.
     */
    function liquidateFromModerator(
        address account,
        Asset.Info memory prjInfo,
        Asset.Info memory lendingInfo,
        uint256 lendingTokenAmount,
        address liquidator,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData,
        bytes[] memory buyCalldata
    )
        external
        payable
        isProjectTokenListed(prjInfo.addr)
        isLendingTokenListed(lendingInfo.addr)
        onlyRelatedContracts
        nonReentrant
        returns (address[] memory assets, uint256[] memory assetAmounts)
    {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return _liquidate(account, prjInfo, lendingInfo, lendingTokenAmount, liquidator, buyCalldata, updatePriceTokens);
    }

    /**
     * @dev Calculates the liquidator reward factor (LRF) for a given position after after updating related token's prices.
     * ####Formula:
     * - LRF = (1 + (1 - HF) * k)
     * @param account The address of the borrower whose position is being considered.
     * @return lrfNumerator The numerator of the liquidator reward factor.
     * @return lrfDenominator The denominator of the liquidator reward factor.
     */
    function liquidatorRewardFactorWithUpdatePrices(
        address account,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 lrfNumerator, uint256 lrfDenominator) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return liquidatorRewardFactor(account);
    }

    /**
     * @dev Returns the minimum and maximum liquidation amount for a given account, project token, and lending token after updating related token's prices.
     *
     * Formula:
     * - MinLA = min(MaxLA, MPA)
     * - MaxLA = (LVR * CVc - THF * LVc) / (LRF * LVR - THF)
     * @param _account The account for which to calculate the liquidation amount.
     * @param _projectToken The project token address.
     * @param _lendingToken The lending token address.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return maxLA The maximum liquidation amount.
     * @return minLA The minimum liquidation amount.
     */
    function getLiquidationAmountWithUpdatePrices(
        address _account,
        address _projectToken,
        address _lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 maxLA, uint256 minLA) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return getLiquidationAmount(_account, _projectToken, _lendingToken);
    }
}
