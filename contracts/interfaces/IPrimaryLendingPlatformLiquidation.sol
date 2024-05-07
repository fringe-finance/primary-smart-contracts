// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../util/Asset.sol";

interface IPrimaryLendingPlatformLiquidation {

    /**
     * @dev The function to be called when a user wants to liquidate their position. Support liquidation with hot borrowing or not.
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
    ) external payable returns (address[] memory assets, uint256[] memory assetAmounts);

    /**
     * @dev The function to be called when a user wants to liquidate their position. Support liquidation with hot borrowing or not.
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
    ) external payable returns (address[] memory assets, uint256[] memory assetAmounts);


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
    ) external payable returns (uint256 maxLA, uint256 minLA);
}
