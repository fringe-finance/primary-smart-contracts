# InterestRateModel

*Compound*

> Compound&#39;s InterestRateModel Interface





## Methods

### getBorrowRate

```solidity
function getBorrowRate(uint256 cash, uint256 borrows, uint256 reserves) external view returns (uint256)
```

Calculates the current borrow interest rate per block



#### Parameters

| Name | Type | Description |
|---|---|---|
| cash | uint256 | The total amount of cash the market has |
| borrows | uint256 | The total amount of borrows the market has outstanding |
| reserves | uint256 | The total amount of reserves the market has |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | The borrow rate per block (as a percentage, and scaled by 1e18) |

### getSupplyRate

```solidity
function getSupplyRate(uint256 cash, uint256 borrows, uint256 reserves, uint256 reserveFactorMantissa) external view returns (uint256)
```

Calculates the current supply interest rate per block



#### Parameters

| Name | Type | Description |
|---|---|---|
| cash | uint256 | The total amount of cash the market has |
| borrows | uint256 | The total amount of borrows the market has outstanding |
| reserves | uint256 | The total amount of reserves the market has |
| reserveFactorMantissa | uint256 | The current reserve factor the market has |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | The supply rate per block (as a percentage, and scaled by 1e18) |

### isInterestRateModel

```solidity
function isInterestRateModel() external view returns (bool)
```

Indicator that this is an InterestRateModel contract (for inspection)




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |




