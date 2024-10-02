// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import "../../util/V3/Asset.sol";

interface IPrimaryLendingPlatformLiquidationV3 {
    /**
     * @notice Liquidates a portion of the borrower's debt using the lending token, called by a related contract.
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
    ) external payable returns (address[] memory assets, uint256[] memory assetAmounts);
}
