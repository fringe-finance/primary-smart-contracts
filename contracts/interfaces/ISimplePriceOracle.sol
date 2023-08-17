// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface ISimplePriceOracle {
    event PricePosted(address asset, uint256 previousPriceMantissa, uint256 requestedPriceMantissa, uint256 newPriceMantissa);

    function getUnderlyingPrice(address cToken) external view returns (uint);

    function setUnderlyingPrice(address cToken, uint256 underlyingPriceMantissa) external;

    function setDirectPrice(address asset, uint256 price) external;

    // v1 price oracle interface for use as backing of proxy
    function assetPrices(address asset) external view returns (uint);
}
