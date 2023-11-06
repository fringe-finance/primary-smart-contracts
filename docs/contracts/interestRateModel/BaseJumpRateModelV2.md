# BaseJumpRateModelV2

## Overview

#### License: MIT

## 

```solidity
contract BaseJumpRateModelV2
```

Author: Compound (modified by Dharma Labs, refactored by Arr00)

Version 2 modifies Version 1 by enabling updateable parameters.
## Events info

### NewInterestParams

```solidity
event NewInterestParams(uint256 baseRatePerBlock, uint256 multiplierPerBlock, uint256 jumpMultiplierPerBlock, uint256 kink)
```

Emitted when the interest rate model's parameters are updated.


Parameters:

| Name                   | Type    | Description                             |
| :--------------------- | :------ | :-------------------------------------- |
| baseRatePerBlock       | uint256 | The new base interest rate per block.   |
| multiplierPerBlock     | uint256 | The new multiplier per block.           |
| jumpMultiplierPerBlock | uint256 | The new jump multiplier per block.      |
| kink                   | uint256 | The new kink value.                     |

### NewOwner

```solidity
event NewOwner(address newOwner)
```

Emitted when the owner of the contract is updated.


Parameters:

| Name     | Type    | Description              |
| :------- | :------ | :----------------------- |
| newOwner | address | The new owner's address. |

## Constants info

### blocksPerYear (0xa385fb96)

```solidity
uint256 constant blocksPerYear = 2102400
```

The approximate number of blocks per year that is assumed by the interest rate model
## State variables info

### owner (0x8da5cb5b)

```solidity
address owner
```

The address of the owner, i.e. the Timelock contract, which can update parameters directly
### multiplierPerBlock (0x8726bb89)

```solidity
uint256 multiplierPerBlock
```

The multiplier of utilization rate that gives the slope of the interest rate
### baseRatePerBlock (0xf14039de)

```solidity
uint256 baseRatePerBlock
```

The base interest rate which is the y-intercept when utilization rate is 0
### jumpMultiplierPerBlock (0xb9f9850a)

```solidity
uint256 jumpMultiplierPerBlock
```

The multiplierPerBlock after hitting a specified utilization point
### kink (0xfd2da339)

```solidity
uint256 kink
```

The utilization point at which the jump multiplier is applied
## Functions info

### constructor

```solidity
constructor(
    uint256 baseRatePerYear,
    uint256 multiplierPerYear,
    uint256 jumpMultiplierPerYear,
    uint256 kink_,
    address owner_
)
```

Constructs an interest rate model.


Parameters:

| Name                  | Type    | Description                                                                                                 |
| :-------------------- | :------ | :---------------------------------------------------------------------------------------------------------- |
| baseRatePerYear       | uint256 | The approximate target base APR, as a mantissa (scaled by 1e18).                                            |
| multiplierPerYear     | uint256 | The rate of increase in interest rate wrt utilization (scaled by 1e18).                                     |
| jumpMultiplierPerYear | uint256 | The multiplierPerBlock after hitting a specified utilization point.                                         |
| kink_                 | uint256 | The utilization point at which the jump multiplier is applied.                                              |
| owner_                | address | The address of the owner, i.e. the Timelock contract (which has the ability to update parameters directly). |

### chageOwner (0x9988642f)

```solidity
function chageOwner(address _newOwner) external
```

Changes the owner address (only callable by previous owner).


Parameters:

| Name      | Type    | Description        |
| :-------- | :------ | :----------------- |
| _newOwner | address | new owner address. |

### updateJumpRateModel (0x2037f3e7)

```solidity
function updateJumpRateModel(
    uint256 baseRatePerYear,
    uint256 multiplierPerYear,
    uint256 jumpMultiplierPerYear,
    uint256 kink_
) external
```

Updates the parameters of the interest rate model (only callable by owner, i.e. Timelock).


Parameters:

| Name                  | Type    | Description                                                               |
| :-------------------- | :------ | :------------------------------------------------------------------------ |
| baseRatePerYear       | uint256 | The approximate target base APR, as a mantissa (scaled by 1e18).          |
| multiplierPerYear     | uint256 | The rate of increase in interest rate wrt utilization (scaled by 1e18).   |
| jumpMultiplierPerYear | uint256 | The multiplierPerBlock after hitting a specified utilization point.       |
| kink_                 | uint256 | The utilization point at which the jump multiplier is applied.            |

### utilizationRate (0x6e71e2d8)

```solidity
function utilizationRate(
    uint256 cash,
    uint256 borrows,
    uint256 reserves
) public pure returns (uint256)
```

Calculates the utilization rate of the market: `borrows / (cash + borrows - reserves)`.


Parameters:

| Name     | Type    | Description                                                |
| :------- | :------ | :--------------------------------------------------------- |
| cash     | uint256 | The amount of cash in the market.                          |
| borrows  | uint256 | The amount of borrows in the market.                       |
| reserves | uint256 | The amount of reserves in the market (currently unused).   |


Return values:

| Name | Type    | Description                                           |
| :--- | :------ | :---------------------------------------------------- |
| [0]  | uint256 | The utilization rate as a mantissa between [0, 1e18]. |

### getSupplyRate (0xb8168816)

```solidity
function getSupplyRate(
    uint256 cash,
    uint256 borrows,
    uint256 reserves,
    uint256 reserveFactorMantissa
) public view virtual returns (uint256)
```

Calculates the current supply rate per block.


Parameters:

| Name                  | Type    | Description                                  |
| :-------------------- | :------ | :------------------------------------------- |
| cash                  | uint256 | The amount of cash in the market.            |
| borrows               | uint256 | The amount of borrows in the market.         |
| reserves              | uint256 | The amount of reserves in the market.        |
| reserveFactorMantissa | uint256 | The current reserve factor for the market.   |


Return values:

| Name | Type    | Description                                                          |
| :--- | :------ | :------------------------------------------------------------------- |
| [0]  | uint256 | The supply rate percentage per block as a mantissa (scaled by 1e18). |
