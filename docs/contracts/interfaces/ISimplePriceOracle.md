# ISimplePriceOracle

## Overview

#### License: MIT

## 

```solidity
interface ISimplePriceOracle
```


## Events info

### PricePosted

```solidity
event PricePosted(address asset, uint256 previousPriceMantissa, uint256 requestedPriceMantissa, uint256 newPriceMantissa)
```


## Functions info

### getUnderlyingPrice (0xfc57d4df)

```solidity
function getUnderlyingPrice(address cToken) external view returns (uint256)
```


### setUnderlyingPrice (0x127ffda0)

```solidity
function setUnderlyingPrice(
    address cToken,
    uint256 underlyingPriceMantissa
) external
```


### setDirectPrice (0x09a8acb0)

```solidity
function setDirectPrice(address asset, uint256 price) external
```


### assetPrices (0x5e9a523c)

```solidity
function assetPrices(address asset) external view returns (uint256)
```

