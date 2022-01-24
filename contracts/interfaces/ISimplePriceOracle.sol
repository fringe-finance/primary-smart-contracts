// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface ISimplePriceOracle {
    
    event PricePosted(address asset, uint previousPriceMantissa, uint requestedPriceMantissa, uint newPriceMantissa);

    function getUnderlyingPrice(address cToken) external view returns (uint);

    function setUnderlyingPrice(address cToken, uint underlyingPriceMantissa) external;

    function setDirectPrice(address asset, uint price) external;

    // v1 price oracle interface for use as backing of proxy
    function assetPrices(address asset) external view returns (uint);

   
}
