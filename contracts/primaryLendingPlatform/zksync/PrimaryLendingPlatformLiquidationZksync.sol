// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../PrimaryLendingPlatformLiquidationCore.sol";
import "../../interfaces/IPriceProviderAggregator.sol";

/**
 * @title PrimaryLendingPlatformLiquidationZksync.
 * @notice The PrimaryLendingPlatformLiquidationZksync contract is the contract that allows users to liquidate positions for zksync network.
 * @dev Contract that allows users to liquidate positions. Inherit from PrimaryLendingPlatformLiquidationCore.
 */
contract PrimaryLendingPlatformLiquidationZksync is PrimaryLendingPlatformLiquidationCore {
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
     * - Calculates the health factor of the position using `getCurrentHealthFactor` function.
     * - Validates the health factor and ensures it's less than 1.
     * - Calculates the permissible liquidation range using `getLiquidationAmount` function.
     * - Validates `lendingTokenAmount` against the permissible range.
     * - Determines the amount of project token to send to the liquidator.
     * - Distributes rewards to the liquidator.
     * @param _account The address of the borrower
     * @param _prjInfo Information about the project token, including its address and type.
     * @param _lendingInfo Information about the lending token, including its address and type.
     * @param _lendingTokenAmount The amount of lending tokens to be used for liquidation
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @param buyCalldata The calldata for buying the lending token from the exchange aggregator. If the calldata is empty, the liquidation will execute liquidation without hot borrowing.
     */
    function liquidate(
        address _account,
        Asset.Info memory _prjInfo,
        Asset.Info memory _lendingInfo,
        uint256 _lendingTokenAmount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData,
        bytes[] memory buyCalldata
    )
        external
        payable
        isProjectTokenListed(_prjInfo.addr)
        isLendingTokenListed(_lendingInfo.addr)
        nonReentrant
        returns (address[] memory assets, uint256[] memory assetAmounts)
    {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return _liquidate(_account, _prjInfo, _lendingInfo, _lendingTokenAmount, msg.sender, buyCalldata);
    }

    /**
     * @notice Liquidates a portion of the borrower's debt using the lending token, called by a related contract and update related token's prices.
     * @dev The function to be called when a user wants to liquidate their position. Support liquidation with hot borrowing or not.
     *
     * Requirements:
     * - The project token is listed on the platform.
     * - The lending token is listed on the platform.
     * - Called by a related contract.
     * - The lending token amount must be greater than 0.
     * - The user must have a position for the given project token and lending token.
     * - The health factor must be less than 1.
     * - `_lendingTokenAmount` must be within the permissible range of liquidation amount.
     *
     * Effects:
     * - Update price of related tokens.
     * - Calculates the health factor of the position using `getCurrentHealthFactor` function.
     * - Validates the health factor and ensures it's less than 1.
     * - Calculates the permissible liquidation range using `getLiquidationAmount` function.
     * - Validates `lendingTokenAmount` against the permissible range.
     * - Determines the amount of project token to send to the liquidator.
     * - Distributes rewards to the liquidator.
     * @param _account The address of the borrower
     * @param _prjInfo Information about the project token, including its address and type.
     * @param _lendingInfo Information about the lending token, including its address and type.
     * @param _lendingTokenAmount The amount of lending tokens to be used for liquidation
     * @param liquidator The address of the liquidator
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @param buyCalldata The calldata for buying the lending token from the exchange aggregator. If the calldata is empty, the liquidation will execute liquidation without hot borrowing.
     */
    function liquidateFromModerator(
        address _account,
        Asset.Info memory _prjInfo,
        Asset.Info memory _lendingInfo,
        uint256 _lendingTokenAmount,
        address liquidator,
        bytes32[] memory priceIds,
        bytes[] calldata updateData,
        bytes[] memory buyCalldata
    )
        external
        payable
        isProjectTokenListed(_prjInfo.addr)
        isLendingTokenListed(_lendingInfo.addr)
        onlyRelatedContracts
        nonReentrant
        returns (address[] memory assets, uint256[] memory assetAmounts)
    {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return _liquidate(_account, _prjInfo, _lendingInfo, _lendingTokenAmount, liquidator, buyCalldata);
    }

    /**
     * @dev Calculates the liquidator reward factor (LRF) for a given position after after updating related token's prices.
     * ####Formula:
     * - LRF = (1 + (1 - HF) * k)
     * @param _account The address of the borrower whose position is being considered.
     * @param _projectToken The address of the project token.
     * @param _lendingToken The address of the lending token.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return lrfNumerator The numerator of the liquidator reward factor.
     * @return lrfDenominator The denominator of the liquidator reward factor.
     */
    function liquidatorRewardFactorWithUpdatePrices(
        address _account,
        address _projectToken,
        address _lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 lrfNumerator, uint256 lrfDenominator) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return liquidatorRewardFactor(_account, _projectToken, _lendingToken);
    }

    /**
     * @dev Calculates the maximum liquidation amount (MaxLA) for a given position after updating related token's prices.
     * ####Formula:
     * - MaxLA = (LVR * CVc - THF * LVc) / (LRF * LVR - THF)
     * @param _account The address of the borrower whose position is being considered.
     * @param _projectToken The address of the project token.
     * @param _lendingToken The address of the lending token.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return maxLA The maximum liquidator reward amount in the lending token.
     */
    function getMaxLiquidationAmountWithUpdatePrices(
        address _account,
        address _projectToken,
        address _lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 maxLA) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return getMaxLiquidationAmount(_account, _projectToken, _lendingToken);
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
