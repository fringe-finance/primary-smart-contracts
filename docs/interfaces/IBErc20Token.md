# IBErc20Token









## Methods

### accountTokens

```solidity
function accountTokens(address owner) external nonpayable returns (uint256)
```

Get the underlying balance of the `owner`

*This also accrues interest in a transaction*

#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | The address of the account to query |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | The amount of underlying owned by `owner` |

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256)
```

Get the token balance of the `owner`



#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | The address of the account to query |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | The number of tokens owned by `owner` |

### borrow

```solidity
function borrow(uint256 borrowAmount) external nonpayable returns (uint256)
```

Sender borrows assets from the protocol to their own address



#### Parameters

| Name | Type | Description |
|---|---|---|
| borrowAmount | uint256 | The amount of the underlying asset to borrow |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### liquidateBorrow

```solidity
function liquidateBorrow(address borrower, uint256 repayAmount, address cTokenCollateral) external nonpayable returns (uint256)
```

The sender liquidates the borrowers collateral.  The collateral seized is transferred to the liquidator.



#### Parameters

| Name | Type | Description |
|---|---|---|
| borrower | address | The borrower of this cToken to be liquidated |
| repayAmount | uint256 | The amount of the underlying borrowed asset to repay |
| cTokenCollateral | address | The market in which to seize collateral from the borrower |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### mint

```solidity
function mint(uint256 mintAmount) external nonpayable returns (uint256)
```

Sender supplies assets into the market and receives cTokens in exchange

*Accrues interest whether or not the operation succeeds, unless reverted*

#### Parameters

| Name | Type | Description |
|---|---|---|
| mintAmount | uint256 | The amount of the underlying asset to supply |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### redeem

```solidity
function redeem(uint256 redeemTokens) external nonpayable returns (uint256)
```

Sender redeems cTokens in exchange for the underlying asset

*Accrues interest whether or not the operation succeeds, unless reverted*

#### Parameters

| Name | Type | Description |
|---|---|---|
| redeemTokens | uint256 | The number of cTokens to redeem into underlying |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### redeemUnderlying

```solidity
function redeemUnderlying(uint256 redeemAmount) external nonpayable returns (uint256)
```

Sender redeems cTokens in exchange for a specified amount of underlying asset

*Accrues interest whether or not the operation succeeds, unless reverted*

#### Parameters

| Name | Type | Description |
|---|---|---|
| redeemAmount | uint256 | The amount of underlying to redeem |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### repayBorrow

```solidity
function repayBorrow(uint256 repayAmount) external nonpayable returns (uint256)
```

Sender repays their own borrow



#### Parameters

| Name | Type | Description |
|---|---|---|
| repayAmount | uint256 | The amount to repay |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### repayBorrowBehalf

```solidity
function repayBorrowBehalf(address borrower, uint256 repayAmount) external nonpayable returns (uint256)
```

Sender repays a borrow belonging to borrower



#### Parameters

| Name | Type | Description |
|---|---|---|
| borrower | address | the account with the debt being payed off |
| repayAmount | uint256 | The amount to repay |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint 0=success, otherwise a failure (see ErrorReporter.sol for details) |




