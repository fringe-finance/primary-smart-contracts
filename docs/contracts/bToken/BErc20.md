# BErc20

## Overview

#### License: MIT

## 

```solidity
abstract contract BErc20 is BToken, BErc20Interface
```

Author: Compound
CTokens which wrap an EIP-20 underlying

## Functions info

### initialize (0x1a31d465)

```solidity
function initialize(
    address underlying_,
    Bondtroller comptroller_,
    InterestRateModel interestRateModel_,
    uint256 initialExchangeRateMantissa_,
    string memory name_,
    string memory symbol_,
    uint8 decimals_
) public
```

Initializes the new money market.


Parameters:

| Name                         | Type                       | Description                                  |
| :--------------------------- | :------------------------- | :------------------------------------------- |
| underlying_                  | address                    | The address of the underlying asset.         |
| comptroller_                 | contract Bondtroller       | The address of the Comptroller.              |
| interestRateModel_           | contract InterestRateModel | The address of the interest rate model.      |
| initialExchangeRateMantissa_ | uint256                    | The initial exchange rate, scaled by 1e18.   |
| name_                        | string                     | ERC-20 name of this token.                   |
| symbol_                      | string                     | ERC-20 symbol of this token.                 |
| decimals_                    | uint8                      | ERC-20 decimal precision of this token.      |

### sweepToken (0x1be19560)

```solidity
function sweepToken(EIP20NonStandardInterface token) external override
```

A public function to sweep accidental ERC-20 transfers to this contract. Tokens are sent to admin (timelock).


Parameters:

| Name  | Type                               | Description                               |
| :---- | :--------------------------------- | :---------------------------------------- |
| token | contract EIP20NonStandardInterface | The address of the ERC-20 token to sweep. |

### _addReserves (0x3e941010)

```solidity
function _addReserves(uint256 addAmount) external override returns (uint256)
```

The sender adds to reserves.


Parameters:

| Name      | Type    | Description                                          |
| :-------- | :------ | :--------------------------------------------------- |
| addAmount | uint256 | The amount fo underlying token to add as reserves.   |


Return values:

| Name | Type    | Description                                                                 |
| :--- | :------ | :-------------------------------------------------------------------------- |
| [0]  | uint256 | uint256 0=success, otherwise a failure (see ErrorReporter.sol for details). |
