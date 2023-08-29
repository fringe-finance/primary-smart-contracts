# BToken

## Abstract Contract Description


License: MIT

## 

```solidity
abstract contract BToken is BTokenInterface, Exponential, TokenErrorReporter
```

Author: Compound
Abstract base for CTokens

## Structs info

### MintLocalVars

```solidity
struct MintLocalVars {
	TokenErrorReporter.Error err;
	CarefulMath.MathError mathErr;
	uint256 exchangeRateMantissa;
	uint256 mintTokens;
	uint256 totalSupplyNew;
	uint256 accountTokensNew;
	uint256 actualMintAmount;
}
```


### RedeemLocalVars

```solidity
struct RedeemLocalVars {
	TokenErrorReporter.Error err;
	CarefulMath.MathError mathErr;
	uint256 exchangeRateMantissa;
	uint256 redeemTokens;
	uint256 redeemAmount;
	uint256 totalSupplyNew;
	uint256 accountTokensNew;
}
```


### BorrowLocalVars

```solidity
struct BorrowLocalVars {
	CarefulMath.MathError mathErr;
	uint256 accountBorrows;
	uint256 accountBorrowsNew;
	uint256 totalBorrowsNew;
}
```


### RepayBorrowLocalVars

```solidity
struct RepayBorrowLocalVars {
	TokenErrorReporter.Error err;
	CarefulMath.MathError mathErr;
	uint256 repayAmount;
	uint256 borrowerIndex;
	uint256 accountBorrows;
	uint256 accountBorrowsNew;
	uint256 totalBorrowsNew;
	uint256 actualRepayAmount;
}
```


## Modifiers info

### nonReentrant

```solidity
modifier nonReentrant()
```

Prevents a contract from calling itself, directly or indirectly.
## Functions info

### initialize (0x99d8c1b4)

```solidity
function initialize(
    Bondtroller bondtroller_,
    InterestRateModel interestRateModel_,
    uint256 initialExchangeRateMantissa_,
    string memory name_,
    string memory symbol_,
    uint8 decimals_
) public
```

Initializes the money market.


Parameters:

| Name                         | Type                       | Description                                  |
| :--------------------------- | :------------------------- | :------------------------------------------- |
| bondtroller_                 | contract Bondtroller       | The address of the Bondtroller.              |
| interestRateModel_           | contract InterestRateModel | The address of the interest rate model.      |
| initialExchangeRateMantissa_ | uint256                    | The initial exchange rate, scaled by 1e18.   |
| name_                        | string                     | EIP-20 name of this token.                   |
| symbol_                      | string                     | EIP-20 symbol of this token.                 |
| decimals_                    | uint8                      | EIP-20 decimal precision of this token.      |

### transfer (0xa9059cbb)

```solidity
function transfer(
    address dst,
    uint256 amount
) external override nonReentrant returns (bool)
```

Transfers `amount` tokens from `msg.sender` to `dst`.


Parameters:

| Name   | Type    | Description                               |
| :----- | :------ | :---------------------------------------- |
| dst    | address | The address of the destination account.   |
| amount | uint256 | The number of tokens to transfer.         |


Return values:

| Name | Type | Description                            |
| :--- | :--- | :------------------------------------- |
| [0]  | bool | Whether or not the transfer succeeded. |

### transferFrom (0x23b872dd)

```solidity
function transferFrom(
    address src,
    address dst,
    uint256 amount
) external override nonReentrant returns (bool)
```

Transfers `amount` tokens from `src` to `dst`.


Parameters:

| Name   | Type    | Description                               |
| :----- | :------ | :---------------------------------------- |
| src    | address | The address of the source account.        |
| dst    | address | The address of the destination account.   |
| amount | uint256 | The number of tokens to transfer.         |


Return values:

| Name | Type | Description                            |
| :--- | :--- | :------------------------------------- |
| [0]  | bool | Whether or not the transfer succeeded. |

### approve (0x095ea7b3)

```solidity
function approve(
    address spender,
    uint256 amount
) external override returns (bool)
```

Approves `spender` to transfer up to `amount` from `src`.
This will overwrite the approval amount for `spender`
and is subject to issues noted [here](https://eips.ethereum.org/EIPS/eip-20#approve).


Parameters:

| Name    | Type    | Description                                                   |
| :------ | :------ | :------------------------------------------------------------ |
| spender | address | The address of the account which may transfer tokens.         |
| amount  | uint256 | The number of tokens that are approved (-1 means infinite).   |


Return values:

| Name | Type | Description                            |
| :--- | :--- | :------------------------------------- |
| [0]  | bool | Whether or not the approval succeeded. |

### allowance (0xdd62ed3e)

```solidity
function allowance(
    address owner,
    address spender
) external view override returns (uint256)
```

Gets the current allowance from `owner` for `spender`.


Parameters:

| Name    | Type    | Description                                                     |
| :------ | :------ | :-------------------------------------------------------------- |
| owner   | address | The address of the account which owns the tokens to be spent.   |
| spender | address | The address of the account which may transfer tokens.           |


Return values:

| Name | Type    | Description                                                   |
| :--- | :------ | :------------------------------------------------------------ |
| [0]  | uint256 | The number of tokens allowed to be spent (-1 means infinite). |

### balanceOf (0x70a08231)

```solidity
function balanceOf(address owner) external view override returns (uint256)
```

Gets the token balance of the `owner`.


Parameters:

| Name  | Type    | Description                            |
| :---- | :------ | :------------------------------------- |
| owner | address | The address of the account to query.   |


Return values:

| Name | Type    | Description                            |
| :--- | :------ | :------------------------------------- |
| [0]  | uint256 | The number of tokens owned by `owner`. |

### balanceOfUnderlying (0x3af9e669)

```solidity
function balanceOfUnderlying(address owner) external override returns (uint256)
```

Gets the underlying balance of the `owner`.
This also accrues interest in a transaction.


Parameters:

| Name  | Type    | Description                            |
| :---- | :------ | :------------------------------------- |
| owner | address | The address of the account to query.   |


Return values:

| Name | Type    | Description                                |
| :--- | :------ | :----------------------------------------- |
| [0]  | uint256 | The amount of underlying owned by `owner`. |

### balanceOfUnderlyingView (0x439d3ee7)

```solidity
function balanceOfUnderlyingView(address owner) external view returns (uint256)
```

Returns the balance of the underlying asset of this bToken for the given account.
This is a view function, which means it will not modify the blockchain state.


Parameters:

| Name  | Type    | Description                            |
| :---- | :------ | :------------------------------------- |
| owner | address | The address of the account to query.   |


Return values:

| Name | Type    | Description                                                               |
| :--- | :------ | :------------------------------------------------------------------------ |
| [0]  | uint256 | The balance of the underlying asset of this bToken for the given account. |

### getAccountSnapshot (0xc37f68e2)

```solidity
function getAccountSnapshot(
    address account
) external view override returns (uint256, uint256, uint256, uint256)
```

Gets a snapshot of the account's balances, and the cached exchange rate.
This is used by bondtroller to more efficiently perform liquidity checks.


Parameters:

| Name    | Type    | Description                          |
| :------ | :------ | :----------------------------------- |
| account | address | Address of the account to snapshot   |


Return values:

| Name | Type    | Description                                                             |
| :--- | :------ | :---------------------------------------------------------------------- |
| [0]  | uint256 | (possible error, token balance, borrow balance, exchange rate mantissa) |

### borrowRatePerBlock (0xf8f9da28)

```solidity
function borrowRatePerBlock() external view override returns (uint256)
```

Returns the current per-block borrow interest rate for this cToken.


Return values:

| Name | Type    | Description                                         |
| :--- | :------ | :-------------------------------------------------- |
| [0]  | uint256 | The borrow interest rate per block, scaled by 1e18. |

### supplyRatePerBlock (0xae9d70b0)

```solidity
function supplyRatePerBlock() external view override returns (uint256)
```

Returns the current per-block supply interest rate for this cToken.


Return values:

| Name | Type    | Description                                         |
| :--- | :------ | :-------------------------------------------------- |
| [0]  | uint256 | The supply interest rate per block, scaled by 1e18. |

### totalBorrowsCurrent (0x73acee98)

```solidity
function totalBorrowsCurrent() external override nonReentrant returns (uint256)
```

Returns the current total borrows plus accrued interest.


Return values:

| Name | Type    | Description                      |
| :--- | :------ | :------------------------------- |
| [0]  | uint256 | The total borrows with interest. |

### borrowBalanceCurrent (0x17bfdfbc)

```solidity
function borrowBalanceCurrent(
    address account
) external override nonReentrant returns (uint256)
```

Accrues interest to updated borrowIndex and then calculate account's borrow balance using the updated borrowIndex.


Parameters:

| Name    | Type    | Description                                                                  |
| :------ | :------ | :--------------------------------------------------------------------------- |
| account | address | The address whose balance should be calculated after updating borrowIndex.   |


Return values:

| Name | Type    | Description             |
| :--- | :------ | :---------------------- |
| [0]  | uint256 | The calculated balance. |

### borrowBalanceStored (0x95dd9193)

```solidity
function borrowBalanceStored(
    address account
) public view override returns (uint256)
```

Returns the borrow balance of account based on stored data.


Parameters:

| Name    | Type    | Description                                       |
| :------ | :------ | :------------------------------------------------ |
| account | address | The address whose balance should be calculated.   |


Return values:

| Name | Type    | Description             |
| :--- | :------ | :---------------------- |
| [0]  | uint256 | The calculated balance. |

### exchangeRateCurrent (0xbd6d894d)

```solidity
function exchangeRateCurrent() public override nonReentrant returns (uint256)
```

Accrues interest then return the up-to-date exchange rate.


Return values:

| Name | Type    | Description                              |
| :--- | :------ | :--------------------------------------- |
| [0]  | uint256 | Calculated exchange rate scaled by 1e18. |

### exchangeRateStored (0x182df0f5)

```solidity
function exchangeRateStored() public view override returns (uint256)
```

Calculates the exchange rate from the underlying to the CToken.


Return values:

| Name | Type    | Description                              |
| :--- | :------ | :--------------------------------------- |
| [0]  | uint256 | Calculated exchange rate scaled by 1e18. |

### getCash (0x3b1d21a2)

```solidity
function getCash() external view override returns (uint256)
```

Gets cash balance of this cToken in the underlying asset.


Return values:

| Name | Type    | Description                                              |
| :--- | :------ | :------------------------------------------------------- |
| [0]  | uint256 | The quantity of underlying asset owned by this contract. |

### accrueInterest (0xa6afed95)

```solidity
function accrueInterest() public override returns (uint256)
```

Applies accrued interest to total borrows and reserves.
This calculates interest accrued from the last checkpointed block
up to the current block and writes new checkpoint to storage.
### _setBondtroller (0xb4ac7688)

```solidity
function _setBondtroller(
    Bondtroller newBondtroller
) public override returns (uint256)
```

Sets a new bondtroller for the market.
Admin function to set a new bondtroller.


Return values:

| Name | Type    | Description                                                                 |
| :--- | :------ | :-------------------------------------------------------------------------- |
| [0]  | uint256 | uint256 0=success, otherwise a failure (see ErrorReporter.sol for details). |

### _setReserveFactor (0xfca7820b)

```solidity
function _setReserveFactor(
    uint256 newReserveFactorMantissa
) external override nonReentrant returns (uint256)
```

Accrues interest and sets a new reserve factor for the protocol using _setReserveFactorFresh.
Admin function to accrue interest and set a new reserve factor.


Return values:

| Name | Type    | Description                                                                 |
| :--- | :------ | :-------------------------------------------------------------------------- |
| [0]  | uint256 | uint256 0=success, otherwise a failure (see ErrorReporter.sol for details). |

### _reduceReserves (0x601a0bf1)

```solidity
function _reduceReserves(
    uint256 reduceAmount
) external override nonReentrant returns (uint256)
```

Accrues interest and reduces reserves by transferring to moderator.


Parameters:

| Name         | Type    | Description                        |
| :----------- | :------ | :--------------------------------- |
| reduceAmount | uint256 | Amount of reduction to reserves.   |


Return values:

| Name | Type    | Description                                                                 |
| :--- | :------ | :-------------------------------------------------------------------------- |
| [0]  | uint256 | uint256 0=success, otherwise a failure (see ErrorReporter.sol for details). |

### _setInterestRateModel (0xf2b3abbd)

```solidity
function _setInterestRateModel(
    InterestRateModel newInterestRateModel
) public override returns (uint256)
```

accrues interest and updates the interest rate model using _setInterestRateModelFresh.
Admin function to accrue interest and update the interest rate model.


Parameters:

| Name                 | Type                       | Description                           |
| :------------------- | :------------------------- | :------------------------------------ |
| newInterestRateModel | contract InterestRateModel | the new interest rate model to use.   |


Return values:

| Name | Type    | Description                                                                 |
| :--- | :------ | :-------------------------------------------------------------------------- |
| [0]  | uint256 | uint256 0=success, otherwise a failure (see ErrorReporter.sol for details). |

### hasRoleModerator (0xd6526889)

```solidity
function hasRoleModerator(address account) public view virtual returns (bool)
```

Returns whether the specified account has the moderator role.


Parameters:

| Name    | Type    | Description                                |
| :------ | :------ | :----------------------------------------- |
| account | address | The address to check for moderator role.   |


Return values:

| Name | Type | Description                                                      |
| :--- | :--- | :--------------------------------------------------------------- |
| [0]  | bool | A boolean indicating whether the account has the moderator role. |
