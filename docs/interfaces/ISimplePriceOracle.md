# ISimplePriceOracle









## Methods

### assetPrices

```solidity
function assetPrices(address asset) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| asset | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getUnderlyingPrice

```solidity
function getUnderlyingPrice(address cToken) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| cToken | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### setDirectPrice

```solidity
function setDirectPrice(address asset, uint256 price) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| asset | address | undefined |
| price | uint256 | undefined |

### setUnderlyingPrice

```solidity
function setUnderlyingPrice(address cToken, uint256 underlyingPriceMantissa) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| cToken | address | undefined |
| underlyingPriceMantissa | uint256 | undefined |



## Events

### PricePosted

```solidity
event PricePosted(address asset, uint256 previousPriceMantissa, uint256 requestedPriceMantissa, uint256 newPriceMantissa)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| asset  | address | undefined |
| previousPriceMantissa  | uint256 | undefined |
| requestedPriceMantissa  | uint256 | undefined |
| newPriceMantissa  | uint256 | undefined |



