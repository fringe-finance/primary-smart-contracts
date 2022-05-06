# Solidity API

## BToken

Abstract base for CTokens

### initialize

```solidity
function initialize(contract Bondtroller bondtroller_, contract InterestRateModel interestRateModel_, uint256 initialExchangeRateMantissa_, string name_, string symbol_, uint8 decimals_) public
```

Initialize the money market

| Name | Type | Description |
| ---- | ---- | ----------- |
| bondtroller_ | contract Bondtroller | The address of the Bondtroller |
| interestRateModel_ | contract InterestRateModel | The address of the interest rate model |
| initialExchangeRateMantissa_ | uint256 | The initial exchange rate, scaled by 1e18 |
| name_ | string | EIP-20 name of this token |
| symbol_ | string | EIP-20 symbol of this token |
| decimals_ | uint8 | EIP-20 decimal precision of this token |

### transferTokens

```solidity
function transferTokens(address spender, address src, address dst, uint256 tokens) internal returns (uint256)
```

Transfer &#x60;tokens&#x60; tokens from &#x60;src&#x60; to &#x60;dst&#x60; by &#x60;spender&#x60;

_Called by both &#x60;transfer&#x60; and &#x60;transferFrom&#x60; internally_

| Name | Type | Description |
| ---- | ---- | ----------- |
| spender | address | The address of the account performing the transfer |
| src | address | The address of the source account |
| dst | address | The address of the destination account |
| tokens | uint256 | The number of tokens to transfer |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Whether or not the transfer succeeded |

### transfer

```solidity
function transfer(address dst, uint256 amount) external returns (bool)
```

Transfer &#x60;amount&#x60; tokens from &#x60;msg.sender&#x60; to &#x60;dst&#x60;

| Name | Type | Description |
| ---- | ---- | ----------- |
| dst | address | The address of the destination account |
| amount | uint256 | The number of tokens to transfer |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | Whether or not the transfer succeeded |

### transferFrom

```solidity
function transferFrom(address src, address dst, uint256 amount) external returns (bool)
```

Transfer &#x60;amount&#x60; tokens from &#x60;src&#x60; to &#x60;dst&#x60;

| Name | Type | Description |
| ---- | ---- | ----------- |
| src | address | The address of the source account |
| dst | address | The address of the destination account |
| amount | uint256 | The number of tokens to transfer |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | Whether or not the transfer succeeded |

### approve

```solidity
function approve(address spender, uint256 amount) external returns (bool)
```

Approve &#x60;spender&#x60; to transfer up to &#x60;amount&#x60; from &#x60;src&#x60;

_This will overwrite the approval amount for &#x60;spender&#x60;
 and is subject to issues noted [here](https://eips.ethereum.org/EIPS/eip-20#approve)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| spender | address | The address of the account which may transfer tokens |
| amount | uint256 | The number of tokens that are approved (-1 means infinite) |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | Whether or not the approval succeeded |

### allowance

```solidity
function allowance(address owner, address spender) external view returns (uint256)
```

Get the current allowance from &#x60;owner&#x60; for &#x60;spender&#x60;

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address of the account which owns the tokens to be spent |
| spender | address | The address of the account which may transfer tokens |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The number of tokens allowed to be spent (-1 means infinite) |

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

### balanceOfUnderlying

```solidity
function balanceOfUnderlying(address owner) external returns (uint256)
```

Get the underlying balance of the &#x60;owner&#x60;

_This also accrues interest in a transaction_

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address of the account to query |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of underlying owned by &#x60;owner&#x60; |

### balanceOfUnderlyingView

```solidity
function balanceOfUnderlyingView(address owner) external view returns (uint256)
```

### getAccountSnapshot

```solidity
function getAccountSnapshot(address account) external view returns (uint256, uint256, uint256, uint256)
```

Get a snapshot of the account&#x27;s balances, and the cached exchange rate

_This is used by bondtroller to more efficiently perform liquidity checks._

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the account to snapshot |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | (possible error, token balance, borrow balance, exchange rate mantissa) |
| [1] | uint256 |  |
| [2] | uint256 |  |
| [3] | uint256 |  |

### getBlockNumber

```solidity
function getBlockNumber() internal view returns (uint256)
```

_Function to simply retrieve block number
 This exists mainly for inheriting test contracts to stub this result._

### borrowRatePerBlock

```solidity
function borrowRatePerBlock() external view returns (uint256)
```

Returns the current per-block borrow interest rate for this cToken

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The borrow interest rate per block, scaled by 1e18 |

### supplyRatePerBlock

```solidity
function supplyRatePerBlock() external view returns (uint256)
```

Returns the current per-block supply interest rate for this cToken

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The supply interest rate per block, scaled by 1e18 |

### totalBorrowsCurrent

```solidity
function totalBorrowsCurrent() external returns (uint256)
```

Returns the current total borrows plus accrued interest

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total borrows with interest |

### borrowBalanceCurrent

```solidity
function borrowBalanceCurrent(address account) external returns (uint256)
```

Accrue interest to updated borrowIndex and then calculate account&#x27;s borrow balance using the updated borrowIndex

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address whose balance should be calculated after updating borrowIndex |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The calculated balance |

### borrowBalanceStored

```solidity
function borrowBalanceStored(address account) public view returns (uint256)
```

Return the borrow balance of account based on stored data

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address whose balance should be calculated |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The calculated balance |

### borrowBalanceStoredInternal

```solidity
function borrowBalanceStoredInternal(address account) internal view returns (enum CarefulMath.MathError, uint256)
```

Return the borrow balance of account based on stored data

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address whose balance should be calculated |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | enum CarefulMath.MathError | (error code, the calculated balance or 0 if error code is non-zero) |
| [1] | uint256 |  |

### exchangeRateCurrent

```solidity
function exchangeRateCurrent() public returns (uint256)
```

Accrue interest then return the up-to-date exchange rate

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Calculated exchange rate scaled by 1e18 |

### exchangeRateStored

```solidity
function exchangeRateStored() public view returns (uint256)
```

Calculates the exchange rate from the underlying to the CToken

_This function does not accrue interest before calculating the exchange rate_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Calculated exchange rate scaled by 1e18 |

### exchangeRateStoredInternal

```solidity
function exchangeRateStoredInternal() internal view returns (enum CarefulMath.MathError, uint256)
```

Calculates the exchange rate from the underlying to the CToken

_This function does not accrue interest before calculating the exchange rate_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | enum CarefulMath.MathError | (error code, calculated exchange rate scaled by 1e18) |
| [1] | uint256 |  |

### getCash

```solidity
function getCash() external view returns (uint256)
```

Get cash balance of this cToken in the underlying asset

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The quantity of underlying asset owned by this contract |

### accrueInterest

```solidity
function accrueInterest() public returns (uint256)
```

Applies accrued interest to total borrows and reserves

_This calculates interest accrued from the last checkpointed block
  up to the current block and writes new checkpoint to storage._

### mintInternal

```solidity
function mintInternal(uint256 mintAmount) internal returns (uint256, uint256)
```

Sender supplies assets into the market and receives cTokens in exchange

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| mintAmount | uint256 | The amount of the underlying asset to supply |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | (uint, uint) An error code (0&#x3D;success, otherwise a failure, see ErrorReporter.sol), and the actual mint amount. |
| [1] | uint256 |  |

### MintLocalVars

```solidity
struct MintLocalVars {
  enum TokenErrorReporter.Error err;
  enum CarefulMath.MathError mathErr;
  uint256 exchangeRateMantissa;
  uint256 mintTokens;
  uint256 totalSupplyNew;
  uint256 accountTokensNew;
  uint256 actualMintAmount;
}
```

### mintFresh

```solidity
function mintFresh(address minter, uint256 mintAmount) internal returns (uint256, uint256)
```

User supplies assets into the market and receives cTokens in exchange

_Assumes interest has already been accrued up to the current block_

| Name | Type | Description |
| ---- | ---- | ----------- |
| minter | address | The address of the account which is supplying the assets |
| mintAmount | uint256 | The amount of the underlying asset to supply |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | (uint, uint) An error code (0&#x3D;success, otherwise a failure, see ErrorReporter.sol), and the actual mint amount. |
| [1] | uint256 |  |

### redeemInternal

```solidity
function redeemInternal(uint256 redeemTokens) internal returns (uint256)
```

Sender redeems cTokens in exchange for the underlying asset

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| redeemTokens | uint256 | The number of cTokens to redeem into underlying |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### redeemUnderlyingInternal

```solidity
function redeemUnderlyingInternal(uint256 redeemAmount) internal returns (uint256)
```

Sender redeems cTokens in exchange for a specified amount of underlying asset

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| redeemAmount | uint256 | The amount of underlying to receive from redeeming cTokens |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### RedeemLocalVars

```solidity
struct RedeemLocalVars {
  enum TokenErrorReporter.Error err;
  enum CarefulMath.MathError mathErr;
  uint256 exchangeRateMantissa;
  uint256 redeemTokens;
  uint256 redeemAmount;
  uint256 totalSupplyNew;
  uint256 accountTokensNew;
}
```

### redeemFresh

```solidity
function redeemFresh(address payable redeemer, uint256 redeemTokensIn, uint256 redeemAmountIn) internal returns (uint256)
```

User redeems cTokens in exchange for the underlying asset

_Assumes interest has already been accrued up to the current block_

| Name | Type | Description |
| ---- | ---- | ----------- |
| redeemer | address payable | The address of the account which is redeeming the tokens |
| redeemTokensIn | uint256 | The number of cTokens to redeem into underlying (only one of redeemTokensIn or redeemAmountIn may be non-zero) |
| redeemAmountIn | uint256 | The number of underlying tokens to receive from redeeming cTokens (only one of redeemTokensIn or redeemAmountIn may be non-zero) |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### borrowInternal

```solidity
function borrowInternal(uint256 borrowAmount) internal returns (uint256)
```

Sender borrows assets from the protocol to their own address

| Name | Type | Description |
| ---- | ---- | ----------- |
| borrowAmount | uint256 | The amount of the underlying asset to borrow |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### BorrowLocalVars

```solidity
struct BorrowLocalVars {
  enum CarefulMath.MathError mathErr;
  uint256 accountBorrows;
  uint256 accountBorrowsNew;
  uint256 totalBorrowsNew;
}
```

### borrowFresh

```solidity
function borrowFresh(address payable borrower, uint256 borrowAmount) internal returns (uint256)
```

Users borrow assets from the protocol to their own address

| Name | Type | Description |
| ---- | ---- | ----------- |
| borrower | address payable |  |
| borrowAmount | uint256 | The amount of the underlying asset to borrow |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### repayBorrowInternal

```solidity
function repayBorrowInternal(uint256 repayAmount) internal returns (uint256, uint256)
```

Sender repays their own borrow

| Name | Type | Description |
| ---- | ---- | ----------- |
| repayAmount | uint256 | The amount to repay |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | (uint, uint) An error code (0&#x3D;success, otherwise a failure, see ErrorReporter.sol), and the actual repayment amount. |
| [1] | uint256 |  |

### repayBorrowBehalfInternal

```solidity
function repayBorrowBehalfInternal(address borrower, uint256 repayAmount) internal returns (uint256, uint256)
```

Sender repays a borrow belonging to borrower

| Name | Type | Description |
| ---- | ---- | ----------- |
| borrower | address | the account with the debt being payed off |
| repayAmount | uint256 | The amount to repay |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | (uint, uint) An error code (0&#x3D;success, otherwise a failure, see ErrorReporter.sol), and the actual repayment amount. |
| [1] | uint256 |  |

### RepayBorrowLocalVars

```solidity
struct RepayBorrowLocalVars {
  enum TokenErrorReporter.Error err;
  enum CarefulMath.MathError mathErr;
  uint256 repayAmount;
  uint256 borrowerIndex;
  uint256 accountBorrows;
  uint256 accountBorrowsNew;
  uint256 totalBorrowsNew;
  uint256 actualRepayAmount;
}
```

### repayBorrowFresh

```solidity
function repayBorrowFresh(address payer, address borrower, uint256 repayAmount) internal returns (uint256, uint256)
```

Borrows are repaid by another user (possibly the borrower).

| Name | Type | Description |
| ---- | ---- | ----------- |
| payer | address | the account paying off the borrow |
| borrower | address | the account with the debt being payed off |
| repayAmount | uint256 | the amount of undelrying tokens being returned |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | (uint, uint) An error code (0&#x3D;success, otherwise a failure, see ErrorReporter.sol), and the actual repayment amount. |
| [1] | uint256 |  |

### _setPendingAdmin

```solidity
function _setPendingAdmin(address payable newPendingAdmin) external returns (uint256)
```

Begins transfer of admin rights. The newPendingAdmin must call &#x60;_acceptAdmin&#x60; to finalize the transfer.

_Admin function to begin change of admin. The newPendingAdmin must call &#x60;_acceptAdmin&#x60; to finalize the transfer._

| Name | Type | Description |
| ---- | ---- | ----------- |
| newPendingAdmin | address payable | New pending admin. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### _acceptAdmin

```solidity
function _acceptAdmin() external returns (uint256)
```

Accepts transfer of admin rights. msg.sender must be pendingAdmin

_Admin function for pending admin to accept role and update admin_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### _setBondtroller

```solidity
function _setBondtroller(contract Bondtroller newBondtroller) public returns (uint256)
```

Sets a new bondtroller for the market

_Admin function to set a new bondtroller_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) / |

### _setReserveFactor

```solidity
function _setReserveFactor(uint256 newReserveFactorMantissa) external returns (uint256)
```

accrues interest and sets a new reserve factor for the protocol using _setReserveFactorFresh

_Admin function to accrue interest and set a new reserve factor_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) / |

### _setReserveFactorFresh

```solidity
function _setReserveFactorFresh(uint256 newReserveFactorMantissa) internal returns (uint256)
```

Sets a new reserve factor for the protocol (*requires fresh interest accrual)

_Admin function to set a new reserve factor_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) / |

### _addReservesInternal

```solidity
function _addReservesInternal(uint256 addAmount) internal returns (uint256)
```

Accrues interest and reduces reserves by transferring from msg.sender

| Name | Type | Description |
| ---- | ---- | ----------- |
| addAmount | uint256 | Amount of addition to reserves |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) / |

### _addReservesFresh

```solidity
function _addReservesFresh(uint256 addAmount) internal returns (uint256, uint256)
```

Add reserves by transferring from caller

_Requires fresh interest accrual_

| Name | Type | Description |
| ---- | ---- | ----------- |
| addAmount | uint256 | Amount of addition to reserves |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | (uint, uint) An error code (0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details)) and the actual amount added, net token fees / |
| [1] | uint256 |  |

### _reduceReserves

```solidity
function _reduceReserves(uint256 reduceAmount) external returns (uint256)
```

Accrues interest and reduces reserves by transferring to admin

| Name | Type | Description |
| ---- | ---- | ----------- |
| reduceAmount | uint256 | Amount of reduction to reserves |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) / |

### _reduceReservesFresh

```solidity
function _reduceReservesFresh(uint256 reduceAmount) internal returns (uint256)
```

Reduces reserves by transferring to admin

_Requires fresh interest accrual_

| Name | Type | Description |
| ---- | ---- | ----------- |
| reduceAmount | uint256 | Amount of reduction to reserves |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) / |

### _setInterestRateModel

```solidity
function _setInterestRateModel(contract InterestRateModel newInterestRateModel) public returns (uint256)
```

accrues interest and updates the interest rate model using _setInterestRateModelFresh

_Admin function to accrue interest and update the interest rate model_

| Name | Type | Description |
| ---- | ---- | ----------- |
| newInterestRateModel | contract InterestRateModel | the new interest rate model to use |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) /     f |

### _setInterestRateModelFresh

```solidity
function _setInterestRateModelFresh(contract InterestRateModel newInterestRateModel) internal returns (uint256)
```

updates the interest rate model (*requires fresh interest accrual)

_Admin function to update the interest rate model_

| Name | Type | Description |
| ---- | ---- | ----------- |
| newInterestRateModel | contract InterestRateModel | the new interest rate model to use |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) /     f |

### getCashPrior

```solidity
function getCashPrior() internal view virtual returns (uint256)
```

Gets balance of this contract in terms of the underlying

_This excludes the value of the current message, if any_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The quantity of underlying owned by this contract /     f |

### doTransferIn

```solidity
function doTransferIn(address from, uint256 amount) internal virtual returns (uint256)
```

_Performs a transfer in, reverting upon failure. Returns the amount actually transferred to the protocol, in case of a fee.
 This may revert due to insufficient balance or insufficient allowance.
/
    f_

### doTransferOut

```solidity
function doTransferOut(address payable to, uint256 amount) internal virtual
```

_Performs a transfer out, ideally returning an explanatory error code upon failure tather than reverting.
 If caller has not called checked protocol&#x27;s balance, may revert due to insufficient cash held in the contract.
 If caller has checked protocol&#x27;s balance, and verified it is &gt;&#x3D; amount, this should not revert in normal conditions.
/
    f_

### nonReentrant

```solidity
modifier nonReentrant()
```

_Prevents a contract from calling itself, directly or indirectly.
/
    m_

