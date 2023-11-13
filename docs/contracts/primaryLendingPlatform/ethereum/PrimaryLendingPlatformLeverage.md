# PrimaryLendingPlatformLeverage

## Overview

#### License: MIT

## 

```solidity
contract PrimaryLendingPlatformLeverage is PrimaryLendingPlatformLeverageCore
```

The PrimaryLendingPlatformAtomicRepayment contract is the contract that allows users to open leveraged positions.

Contract that allows users to open leveraged positions using the Augustus Paraswap exchange aggregator. Inherit from PrimaryLendingPlatformLeverageCore.
## Functions info

### leveragedBorrow (0xf5800f1b)

```solidity
function leveragedBorrow(
    address projectToken,
    address lendingToken,
    uint256 notionalExposure,
    uint256 marginCollateralAmount,
    bytes memory buyCalldata,
    uint8 leverageType
) public nonReentrant
```

Executes a leveraged borrow for the borrower on the specified projectToken using the given lendingToken.

The function to be called when a user wants to leverage their position.

Requirements:
- The project token is listed on the platform.
- The lending token is listed on the platform.
- Notional exposure must be greater than 0.
- The lending token must be the same as the current lending token or the current lending token must be address(0).
- The user must have a valid position for the given project token and lending token.

Effects:
- Calculates the required `lendingTokenCount` based on `notionalExposure`.
- Performs a naked borrow using `_nakedBorrow` function.
- Approves the transfer of `lendingToken` to the system.
- Buys tokens on an exchange aggregator using `_buyOnExchangeAggregator` function.
- Collateralizes the loan with the received tokens using `_collateralizeLoan` function.
- Defers liquidity check using `_deferLiquidityCheck` function.
- Sets the leveraged position flag and type for the borrower.


Parameters:

| Name                   | Type    | Description                                                             |
| :--------------------- | :------ | :---------------------------------------------------------------------- |
| projectToken           | address | The address of the project token.                                       |
| lendingToken           | address | The address of the lending token.                                       |
| notionalExposure       | uint256 | The desired notional exposure for the leverage position.                |
| marginCollateralAmount | uint256 | The amount of collateral to be added to the position as margin.         |
| buyCalldata            | bytes   | The calldata for buying the project token on the exchange aggregator.   |
| leverageType           | uint8   | The type of leverage position.                                          |

### leveragedBorrowFromRelatedContract (0x68d7a4c3)

```solidity
function leveragedBorrowFromRelatedContract(
    address projectToken,
    address lendingToken,
    uint256 notionalExposure,
    uint256 marginCollateralAmount,
    bytes memory buyCalldata,
    address borrower,
    uint8 leverageType
) public nonReentrant onlyRelatedContracts
```

Allows a related contract to borrow funds on behalf of a user to enter a leveraged position.

Requirements:
- Caller must be a related contract.
- The project token is listed on the platform.
- The lending token is listed on the platform.
- Notional exposure must be greater than 0.
- The lending token must be the same as the current lending token or the current lending token must be address(0).
- The user must have a valid position for the given project token and lending token.

Effects:
- Calculates the required `lendingTokenCount` based on `notionalExposure`.
- Performs a naked borrow using `_nakedBorrow` function.
- Approves the transfer of `lendingToken` to the system.
- Buys tokens on an exchange aggregator using `_buyOnExchangeAggregator` function.
- Collateralizes the loan with the received tokens using `_collateralizeLoan` function.
- Defers liquidity check using `_deferLiquidityCheck` function.
- Sets the leveraged position flag and type for the borrower.


Parameters:

| Name                   | Type    | Description                                                             |
| :--------------------- | :------ | :---------------------------------------------------------------------- |
| projectToken           | address | The address of the project token.                                       |
| lendingToken           | address | The address of the lending token.                                       |
| notionalExposure       | uint256 | The desired notional exposure for the leverage position.                |
| marginCollateralAmount | uint256 | The amount of collateral to be added to the position as margin.         |
| buyCalldata            | bytes   | The calldata for buying the project token on the exchange aggregator.   |
| borrower               | address | The address of the user for whom the funds are being borrowed.          |
| leverageType           | uint8   | The type of leverage position.                                          |
