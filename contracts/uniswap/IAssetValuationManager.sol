// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

interface IAssetValuationManager {
    function getAssetValuation(address basicToken, address assetToken, uint256 assetAmount) external view returns (uint256 valuation);
    function getAssetUSDValuation(address assetToken, uint256 assetTokenAmt) external view returns (uint256 assetTokenOut);
}