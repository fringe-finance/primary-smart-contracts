# BondtrollerV4Storage









## Methods

### _borrowGuardianPaused

```solidity
function _borrowGuardianPaused() external view returns (bool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### _mintGuardianPaused

```solidity
function _mintGuardianPaused() external view returns (bool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

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

### accountMembership

```solidity
function accountMembership(address, address) external view returns (bool)
```

Per-market mapping of &quot;accounts in this asset&quot;



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### admin

```solidity
function admin() external view returns (address)
```

Administrator for this contract




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### allMarkets

```solidity
function allMarkets(uint256) external view returns (contract BToken)
```

A list of all markets



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract BToken | undefined |

### borrowCapGuardian

```solidity
function borrowCapGuardian() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### borrowCaps

```solidity
function borrowCaps(address) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### borrowGuardianPaused

```solidity
function borrowGuardianPaused(address) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### closeFactorMantissa

```solidity
function closeFactorMantissa() external view returns (uint256)
```

Multiplier used to calculate the maximum repayAmount when liquidating a borrow




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### compAccrued

```solidity
function compAccrued(address) external view returns (uint256)
```

The COMP accrued but not yet transferred to each user



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### compBorrowState

```solidity
function compBorrowState(address) external view returns (uint224 index, uint32 block)
```

The COMP market borrow state for each market



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| index | uint224 | undefined |
| block | uint32 | undefined |

### compBorrowerIndex

```solidity
function compBorrowerIndex(address, address) external view returns (uint256)
```

The COMP borrow index for each market for each borrower as of the last time they accrued COMP



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### compRate

```solidity
function compRate() external view returns (uint256)
```

The rate at which the flywheel distributes COMP, per block




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### compSpeeds

```solidity
function compSpeeds(address) external view returns (uint256)
```

The portion of compRate that each market currently receives



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### compSupplierIndex

```solidity
function compSupplierIndex(address, address) external view returns (uint256)
```

The COMP borrow index for each market for each supplier as of the last time they accrued COMP



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### compSupplyState

```solidity
function compSupplyState(address) external view returns (uint224 index, uint32 block)
```

The COMP market supply state for each market



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| index | uint224 | undefined |
| block | uint32 | undefined |

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

### markets

```solidity
function markets(address) external view returns (bool isListed, uint256 collateralFactorMantissa, bool isComped)
```

Official mapping of BTokens -&gt; Market metadata



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| isListed | bool | undefined |
| collateralFactorMantissa | uint256 | undefined |
| isComped | bool | undefined |

### maxAssets

```solidity
function maxAssets() external view returns (uint256)
```

Max number of assets a single account can participate in (borrow or use as collateral)




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### mintGuardianPaused

```solidity
function mintGuardianPaused(address) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### oracle

```solidity
function oracle() external view returns (address)
```

Oracle which gives the price of any given asset




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### pauseGuardian

```solidity
function pauseGuardian() external view returns (address)
```

The Pause Guardian can pause certain actions as a safety mechanism.  Actions which allow users to remove their own assets cannot be paused.  Liquidation / seizing / transfer can only be paused globally, not by market.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### seizeGuardianPaused

```solidity
function seizeGuardianPaused() external view returns (bool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### transferGuardianPaused

```solidity
function transferGuardianPaused() external view returns (bool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |




