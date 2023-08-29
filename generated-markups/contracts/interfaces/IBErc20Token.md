# IBErc20Token

## Interface Description


License: MIT

## 

```solidity
interface IBErc20Token
```


## Functions info

### mint (0xa0712d68)

```solidity
function mint(uint256 mintAmount) external returns (uint256)
```

Sender supplies assets into the market and receives cTokens in exchange

Accrues interest whether or not the operation succeeds, unless reverted


Parameters:

| Name       | Type    | Description                                    |
| :--------- | :------ | :--------------------------------------------- |
| mintAmount | uint256 | The amount of the underlying asset to supply   |


Return values:

| Name | Type    | Description                                                                |
| :--- | :------ | :------------------------------------------------------------------------- |
| [0]  | uint256 | uint256 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### redeem (0xdb006a75)

```solidity
function redeem(uint256 redeemTokens) external returns (uint256)
```

Sender redeems cTokens in exchange for the underlying asset

Accrues interest whether or not the operation succeeds, unless reverted


Parameters:

| Name         | Type    | Description                                       |
| :----------- | :------ | :------------------------------------------------ |
| redeemTokens | uint256 | The number of cTokens to redeem into underlying   |


Return values:

| Name | Type    | Description                                                                |
| :--- | :------ | :------------------------------------------------------------------------- |
| [0]  | uint256 | uint256 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### redeemUnderlying (0x852a12e3)

```solidity
function redeemUnderlying(uint256 redeemAmount) external returns (uint256)
```

Sender redeems cTokens in exchange for a specified amount of underlying asset

Accrues interest whether or not the operation succeeds, unless reverted


Parameters:

| Name         | Type    | Description                          |
| :----------- | :------ | :----------------------------------- |
| redeemAmount | uint256 | The amount of underlying to redeem   |


Return values:

| Name | Type    | Description                                                                |
| :--- | :------ | :------------------------------------------------------------------------- |
| [0]  | uint256 | uint256 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### borrow (0xc5ebeaec)

```solidity
function borrow(uint256 borrowAmount) external returns (uint256)
```

Sender borrows assets from the protocol to their own address


Parameters:

| Name         | Type    | Description                                    |
| :----------- | :------ | :--------------------------------------------- |
| borrowAmount | uint256 | The amount of the underlying asset to borrow   |


Return values:

| Name | Type    | Description                                                                |
| :--- | :------ | :------------------------------------------------------------------------- |
| [0]  | uint256 | uint256 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### repayBorrow (0x0e752702)

```solidity
function repayBorrow(uint256 repayAmount) external returns (uint256)
```

Sender repays their own borrow


Parameters:

| Name        | Type    | Description           |
| :---------- | :------ | :-------------------- |
| repayAmount | uint256 | The amount to repay   |


Return values:

| Name | Type    | Description                                                                |
| :--- | :------ | :------------------------------------------------------------------------- |
| [0]  | uint256 | uint256 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### repayBorrowBehalf (0x2608f818)

```solidity
function repayBorrowBehalf(
    address borrower,
    uint256 repayAmount
) external returns (uint256)
```

Sender repays a borrow belonging to borrower


Parameters:

| Name        | Type    | Description                                 |
| :---------- | :------ | :------------------------------------------ |
| borrower    | address | the account with the debt being payed off   |
| repayAmount | uint256 | The amount to repay                         |


Return values:

| Name | Type    | Description                                                                |
| :--- | :------ | :------------------------------------------------------------------------- |
| [0]  | uint256 | uint256 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### liquidateBorrow (0xf5e3c462)

```solidity
function liquidateBorrow(
    address borrower,
    uint256 repayAmount,
    address cTokenCollateral
) external returns (uint256)
```

The sender liquidates the borrowers collateral.
The collateral seized is transferred to the liquidator.


Parameters:

| Name             | Type    | Description                                                 |
| :--------------- | :------ | :---------------------------------------------------------- |
| borrower         | address | The borrower of this cToken to be liquidated                |
| repayAmount      | uint256 | The amount of the underlying borrowed asset to repay        |
| cTokenCollateral | address | The market in which to seize collateral from the borrower   |


Return values:

| Name | Type    | Description                                                                |
| :--- | :------ | :------------------------------------------------------------------------- |
| [0]  | uint256 | uint256 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### balanceOf (0x70a08231)

```solidity
function balanceOf(address owner) external view returns (uint256)
```

Get the token balance of the `owner`


Parameters:

| Name  | Type    | Description                           |
| :---- | :------ | :------------------------------------ |
| owner | address | The address of the account to query   |


Return values:

| Name | Type    | Description                           |
| :--- | :------ | :------------------------------------ |
| [0]  | uint256 | The number of tokens owned by `owner` |

### accountTokens (0xa19d1460)

```solidity
function accountTokens(address owner) external returns (uint256)
```

Get the underlying balance of the `owner`

This also accrues interest in a transaction


Parameters:

| Name  | Type    | Description                           |
| :---- | :------ | :------------------------------------ |
| owner | address | The address of the account to query   |


Return values:

| Name | Type    | Description                               |
| :--- | :------ | :---------------------------------------- |
| [0]  | uint256 | The amount of underlying owned by `owner` |
