# BondtrollerV1Storage









## Methods

### accountAssets

```solidity
function accountAssets(address, uint256) external view returns (contract BToken)
```

Per-account mapping of &quot;assets you are in&quot;, capped by maxAssets



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract BToken | undefined |

### admin

```solidity
function admin() external view returns (address)
```

Administrator for this contract




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### closeFactorMantissa

```solidity
function closeFactorMantissa() external view returns (uint256)
```

Multiplier used to calculate the maximum repayAmount when liquidating a borrow




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### isBondtroller

```solidity
function isBondtroller() external view returns (bool)
```

watermark that says that this is Bondtroller




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### liquidationIncentiveMantissa

```solidity
function liquidationIncentiveMantissa() external view returns (uint256)
```

Multiplier representing the discount on collateral that a liquidator receives




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### maxAssets

```solidity
function maxAssets() external view returns (uint256)
```

Max number of assets a single account can participate in (borrow or use as collateral)




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### oracle

```solidity
function oracle() external view returns (address)
```

Oracle which gives the price of any given asset




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |




