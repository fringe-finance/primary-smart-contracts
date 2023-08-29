# InterestRateModel

## Abstract Contract Description


License: MIT

## 

```solidity
abstract contract InterestRateModel
```

Author: Compound
## Constants info

### isInterestRateModel (0x2191f92a)

```solidity
bool constant isInterestRateModel = true
```

Indicator that this is an InterestRateModel contract (for inspection)
## Functions info

### getBorrowRate (0x89469df9)

```solidity
function getBorrowRate(
    uint256 cash,
    uint256 borrows,
    uint256 reserves,
    address blendingToken
) external view virtual returns (uint256)
```

Calculates the current borrow interest rate per block.


Parameters:

| Name     | Type    | Description                                               |
| :------- | :------ | :-------------------------------------------------------- |
| cash     | uint256 | The total amount of cash the market has.                  |
| borrows  | uint256 | The total amount of borrows the market has outstanding.   |
| reserves | uint256 | The total amount of reserves the market has.              |


Return values:

| Name | Type    | Description                                                      |
| :--- | :------ | :--------------------------------------------------------------- |
| [0]  | uint256 | The borrow rate per block (as a percentage, and scaled by 1e18). |

### getSupplyRate (0x32dc9b1c)

```solidity
function getSupplyRate(
    uint256 cash,
    uint256 borrows,
    uint256 reserves,
    uint256 reserveFactorMantissa,
    address blendingToken
) external view virtual returns (uint256)
```

Calculates the current supply interest rate per block.


Parameters:

| Name                  | Type    | Description                                               |
| :-------------------- | :------ | :-------------------------------------------------------- |
| cash                  | uint256 | The total amount of cash the market has.                  |
| borrows               | uint256 | The total amount of borrows the market has outstanding.   |
| reserves              | uint256 | The total amount of reserves the market has.              |
| reserveFactorMantissa | uint256 | The current reserve factor the market has.                |


Return values:

| Name | Type    | Description                                                      |
| :--- | :------ | :--------------------------------------------------------------- |
| [0]  | uint256 | The supply rate per block (as a percentage, and scaled by 1e18). |

### storeBorrowRate (0x5eeaafea)

```solidity
function storeBorrowRate(
    uint256 cash,
    uint256 borrows,
    uint256 reserves
) external virtual returns (uint256)
```

Calculates the current borrow interest rate per block.


Parameters:

| Name     | Type    | Description                                               |
| :------- | :------ | :-------------------------------------------------------- |
| cash     | uint256 | The total amount of cash the market has.                  |
| borrows  | uint256 | The total amount of borrows the market has outstanding.   |
| reserves | uint256 | The total amount of reserves the market has.              |


Return values:

| Name | Type    | Description                                                      |
| :--- | :------ | :--------------------------------------------------------------- |
| [0]  | uint256 | The borrow rate per block (as a percentage, and scaled by 1e18). |
