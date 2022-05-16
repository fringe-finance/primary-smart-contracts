# BTokenStorage









## Methods

### accountTokens

```solidity
function accountTokens(address) external view returns (uint256)
```

Official record of token balances for each account



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### accrualBlockNumber

```solidity
function accrualBlockNumber() external view returns (uint256)
```

Block number that interest was last accrued at




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### admin

```solidity
function admin() external view returns (address payable)
```

Administrator for this contract




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address payable | undefined |

### bondtroller

```solidity
function bondtroller() external view returns (contract Bondtroller)
```

Contract which oversees inter-cToken operations




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract Bondtroller | undefined |

### borrowIndex

```solidity
function borrowIndex() external view returns (uint256)
```

Accumulator of the total earned interest rate since the opening of the market




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### decimals

```solidity
function decimals() external view returns (uint8)
```

EIP-20 token decimals for this token




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint8 | undefined |

### interestRateModel

```solidity
function interestRateModel() external view returns (contract InterestRateModel)
```

Model which tells what the current interest rate should be




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract InterestRateModel | undefined |

### name

```solidity
function name() external view returns (string)
```

EIP-20 token name for this token




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### pendingAdmin

```solidity
function pendingAdmin() external view returns (address payable)
```

Pending administrator for this contract




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address payable | undefined |

### protocolSeizeShareMantissa

```solidity
function protocolSeizeShareMantissa() external view returns (uint256)
```

Share of seized collateral that is added to reserves




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### reserveFactorMantissa

```solidity
function reserveFactorMantissa() external view returns (uint256)
```

Fraction of interest currently set aside for reserves




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### symbol

```solidity
function symbol() external view returns (string)
```

EIP-20 token symbol for this token




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### totalBorrows

```solidity
function totalBorrows() external view returns (uint256)
```

Total amount of outstanding borrows of the underlying in this market




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### totalReserves

```solidity
function totalReserves() external view returns (uint256)
```

Total amount of reserves of the underlying held in this market




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

Total number of tokens in circulation




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |




