# Solidity API

## ISimplePriceOracle

### PricePosted

```solidity
event PricePosted(address asset, uint256 previousPriceMantissa, uint256 requestedPriceMantissa, uint256 newPriceMantissa)
```

### getUnderlyingPrice

```solidity
function getUnderlyingPrice(address cToken) external view returns (uint256)
```

### setUnderlyingPrice

```solidity
function setUnderlyingPrice(address cToken, uint256 underlyingPriceMantissa) external
```

### setDirectPrice

```solidity
function setDirectPrice(address asset, uint256 price) external
```

### assetPrices

```solidity
function assetPrices(address asset) external view returns (uint256)
```

