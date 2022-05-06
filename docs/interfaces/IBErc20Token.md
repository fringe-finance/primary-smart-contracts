# Solidity API

## IBErc20Token

### mint

```solidity
function mint(uint256 mintAmount) external returns (uint256)
```

Sender supplies assets into the market and receives cTokens in exchange

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| mintAmount | uint256 | The amount of the underlying asset to supply |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### redeem

```solidity
function redeem(uint256 redeemTokens) external returns (uint256)
```

Sender redeems cTokens in exchange for the underlying asset

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| redeemTokens | uint256 | The number of cTokens to redeem into underlying |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### redeemUnderlying

```solidity
function redeemUnderlying(uint256 redeemAmount) external returns (uint256)
```

Sender redeems cTokens in exchange for a specified amount of underlying asset

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| redeemAmount | uint256 | The amount of underlying to redeem |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### borrow

```solidity
function borrow(uint256 borrowAmount) external returns (uint256)
```

Sender borrows assets from the protocol to their own address

| Name | Type | Description |
| ---- | ---- | ----------- |
| borrowAmount | uint256 | The amount of the underlying asset to borrow |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### repayBorrow

```solidity
function repayBorrow(uint256 repayAmount) external returns (uint256)
```

Sender repays their own borrow

| Name | Type | Description |
| ---- | ---- | ----------- |
| repayAmount | uint256 | The amount to repay |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### repayBorrowBehalf

```solidity
function repayBorrowBehalf(address borrower, uint256 repayAmount) external returns (uint256)
```

Sender repays a borrow belonging to borrower

| Name | Type | Description |
| ---- | ---- | ----------- |
| borrower | address | the account with the debt being payed off |
| repayAmount | uint256 | The amount to repay |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### liquidateBorrow

```solidity
function liquidateBorrow(address borrower, uint256 repayAmount, address cTokenCollateral) external returns (uint256)
```

The sender liquidates the borrowers collateral.
 The collateral seized is transferred to the liquidator.

| Name | Type | Description |
| ---- | ---- | ----------- |
| borrower | address | The borrower of this cToken to be liquidated |
| repayAmount | uint256 | The amount of the underlying borrowed asset to repay |
| cTokenCollateral | address | The market in which to seize collateral from the borrower |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256)
```

Get the token balance of the &#x60;owner&#x60;

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address of the account to query |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The number of tokens owned by &#x60;owner&#x60; |

### accountTokens

```solidity
function accountTokens(address owner) external returns (uint256)
```

Get the underlying balance of the &#x60;owner&#x60;

_This also accrues interest in a transaction_

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address of the account to query |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of underlying owned by &#x60;owner&#x60; |

