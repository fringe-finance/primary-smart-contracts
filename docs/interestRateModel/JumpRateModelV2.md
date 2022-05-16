# JumpRateModelV2

*Arr00*

> Compound&#39;s JumpRateModel Contract V2 for V2 cTokens

Supports only for V2 cTokens



## Methods

### baseRatePerBlock

```solidity
function baseRatePerBlock() external view returns (uint256)
```

The base interest rate which is the y-intercept when utilization rate is 0




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### blocksPerYear

```solidity
function blocksPerYear() external view returns (uint256)
```

The approximate number of blocks per year that is assumed by the interest rate model




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getBorrowRate

```solidity
function getBorrowRate(uint256 cash, uint256 borrows, uint256 reserves) external view returns (uint256)
```

Calculates the current borrow rate per block



#### Parameters

| Name | Type | Description |
|---|---|---|
| cash | uint256 | The amount of cash in the market |
| borrows | uint256 | The amount of borrows in the market |
| reserves | uint256 | The amount of reserves in the market |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | The borrow rate percentage per block as a mantissa (scaled by 1e18) |

### getSupplyRate

```solidity
function getSupplyRate(uint256 cash, uint256 borrows, uint256 reserves, uint256 reserveFactorMantissa) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| cash | uint256 | undefined |
| borrows | uint256 | undefined |
| reserves | uint256 | undefined |
| reserveFactorMantissa | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### isInterestRateModel

```solidity
function isInterestRateModel() external view returns (bool)
```

Indicator that this is an InterestRateModel contract (for inspection)




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### jumpMultiplierPerBlock

```solidity
function jumpMultiplierPerBlock() external view returns (uint256)
```

The multiplierPerBlock after hitting a specified utilization point




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### kink

```solidity
function kink() external view returns (uint256)
```

The utilization point at which the jump multiplier is applied




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### multiplierPerBlock

```solidity
function multiplierPerBlock() external view returns (uint256)
```

The multiplier of utilization rate that gives the slope of the interest rate




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### owner

```solidity
function owner() external view returns (address)
```

The address of the owner, i.e. the Timelock contract, which can update parameters directly




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### updateJumpRateModel

```solidity
function updateJumpRateModel(uint256 baseRatePerYear, uint256 multiplierPerYear, uint256 jumpMultiplierPerYear, uint256 kink_) external nonpayable
```

Update the parameters of the interest rate model (only callable by owner, i.e. Timelock)



#### Parameters

| Name | Type | Description |
|---|---|---|
| baseRatePerYear | uint256 | The approximate target base APR, as a mantissa (scaled by 1e18) |
| multiplierPerYear | uint256 | The rate of increase in interest rate wrt utilization (scaled by 1e18) |
| jumpMultiplierPerYear | uint256 | The multiplierPerBlock after hitting a specified utilization point |
| kink_ | uint256 | The utilization point at which the jump multiplier is applied |

### utilizationRate

```solidity
function utilizationRate(uint256 cash, uint256 borrows, uint256 reserves) external pure returns (uint256)
```

Calculates the utilization rate of the market: `borrows / (cash + borrows - reserves)`



#### Parameters

| Name | Type | Description |
|---|---|---|
| cash | uint256 | The amount of cash in the market |
| borrows | uint256 | The amount of borrows in the market |
| reserves | uint256 | The amount of reserves in the market (currently unused) |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | The utilization rate as a mantissa between [0, 1e18] |



## Events

### NewInterestParams

```solidity
event NewInterestParams(uint256 baseRatePerBlock, uint256 multiplierPerBlock, uint256 jumpMultiplierPerBlock, uint256 kink)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| baseRatePerBlock  | uint256 | undefined |
| multiplierPerBlock  | uint256 | undefined |
| jumpMultiplierPerBlock  | uint256 | undefined |
| kink  | uint256 | undefined |



