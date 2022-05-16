# BLendingToken









## Methods

### DEFAULT_ADMIN_ROLE

```solidity
function DEFAULT_ADMIN_ROLE() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### MODERATOR_ROLE

```solidity
function MODERATOR_ROLE() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### _acceptAdmin

```solidity
function _acceptAdmin() external nonpayable returns (uint256)
```

Accepts transfer of admin rights. msg.sender must be pendingAdmin

*Admin function for pending admin to accept role and update admin*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### _addReserves

```solidity
function _addReserves(uint256 addAmount) external nonpayable returns (uint256)
```

The sender adds to reserves.



#### Parameters

| Name | Type | Description |
|---|---|---|
| addAmount | uint256 | The amount fo underlying token to add as reserves |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### _reduceReserves

```solidity
function _reduceReserves(uint256 reduceAmount) external nonpayable returns (uint256)
```

Accrues interest and reduces reserves by transferring to admin



#### Parameters

| Name | Type | Description |
|---|---|---|
| reduceAmount | uint256 | Amount of reduction to reserves |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### _setBondtroller

```solidity
function _setBondtroller(contract Bondtroller newBondtroller) external nonpayable returns (uint256)
```

Sets a new bondtroller for the market

*Admin function to set a new bondtroller*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newBondtroller | contract Bondtroller | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### _setInterestRateModel

```solidity
function _setInterestRateModel(contract InterestRateModel newInterestRateModel) external nonpayable returns (uint256)
```

accrues interest and updates the interest rate model using _setInterestRateModelFresh

*Admin function to accrue interest and update the interest rate model*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newInterestRateModel | contract InterestRateModel | the new interest rate model to use |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### _setPendingAdmin

```solidity
function _setPendingAdmin(address payable newPendingAdmin) external nonpayable returns (uint256)
```

Begins transfer of admin rights. The newPendingAdmin must call `_acceptAdmin` to finalize the transfer.

*Admin function to begin change of admin. The newPendingAdmin must call `_acceptAdmin` to finalize the transfer.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newPendingAdmin | address payable | New pending admin. |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### _setReserveFactor

```solidity
function _setReserveFactor(uint256 newReserveFactorMantissa) external nonpayable returns (uint256)
```

accrues interest and sets a new reserve factor for the protocol using _setReserveFactorFresh

*Admin function to accrue interest and set a new reserve factor*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newReserveFactorMantissa | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### accountTokens

```solidity
function accountTokens(address) external view returns (uint256)
```

Official record of token balances for each account



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### accrualBlockNumber

```solidity
function accrualBlockNumber() external view returns (uint256)
```

Block number that interest was last accrued at




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### accrueInterest

```solidity
function accrueInterest() external nonpayable returns (uint256)
```

Applies accrued interest to total borrows and reserves

*This calculates interest accrued from the last checkpointed block   up to the current block and writes new checkpoint to storage.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### admin

```solidity
function admin() external view returns (address payable)
```

Administrator for this contract




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address payable | undefined |

### allowance

```solidity
function allowance(address owner, address spender) external view returns (uint256)
```

Get the current allowance from `owner` for `spender`



#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | The address of the account which owns the tokens to be spent |
| spender | address | The address of the account which may transfer tokens |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | The number of tokens allowed to be spent (-1 means infinite) |

### approve

```solidity
function approve(address spender, uint256 amount) external nonpayable returns (bool)
```

Approve `spender` to transfer up to `amount` from `src`

*This will overwrite the approval amount for `spender`  and is subject to issues noted [here](https://eips.ethereum.org/EIPS/eip-20#approve)*

#### Parameters

| Name | Type | Description |
|---|---|---|
| spender | address | The address of the account which may transfer tokens |
| amount | uint256 | The number of tokens that are approved (-1 means infinite) |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | Whether or not the approval succeeded |

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

### balanceOfUnderlying

```solidity
function balanceOfUnderlying(address owner) external nonpayable returns (uint256)
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

### balanceOfUnderlyingView

```solidity
function balanceOfUnderlyingView(address owner) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### bondtroller

```solidity
function bondtroller() external view returns (contract Bondtroller)
```

Contract which oversees inter-cToken operations




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract Bondtroller | undefined |

### borrowBalanceCurrent

```solidity
function borrowBalanceCurrent(address account) external nonpayable returns (uint256)
```

Accrue interest to updated borrowIndex and then calculate account&#39;s borrow balance using the updated borrowIndex



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | The address whose balance should be calculated after updating borrowIndex |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | The calculated balance |

### borrowBalanceStored

```solidity
function borrowBalanceStored(address account) external view returns (uint256)
```

Return the borrow balance of account based on stored data



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | The address whose balance should be calculated |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | The calculated balance |

### borrowIndex

```solidity
function borrowIndex() external view returns (uint256)
```

Accumulator of the total earned interest rate since the opening of the market




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### borrowRatePerBlock

```solidity
function borrowRatePerBlock() external view returns (uint256)
```

Returns the current per-block borrow interest rate for this cToken




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | The borrow interest rate per block, scaled by 1e18 |

### borrowTo

```solidity
function borrowTo(address borrower, uint256 borrowAmount) external nonpayable returns (uint256 borrowError)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| borrower | address | undefined |
| borrowAmount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| borrowError | uint256 | undefined |

### decimals

```solidity
function decimals() external view returns (uint8)
```

EIP-20 token decimals for this token




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint8 | undefined |

### exchangeRateCurrent

```solidity
function exchangeRateCurrent() external nonpayable returns (uint256)
```

Accrue interest then return the up-to-date exchange rate




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Calculated exchange rate scaled by 1e18 |

### exchangeRateStored

```solidity
function exchangeRateStored() external view returns (uint256)
```

Calculates the exchange rate from the underlying to the CToken

*This function does not accrue interest before calculating the exchange rate*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Calculated exchange rate scaled by 1e18 |

### getAccountSnapshot

```solidity
function getAccountSnapshot(address account) external view returns (uint256, uint256, uint256, uint256)
```

Get a snapshot of the account&#39;s balances, and the cached exchange rate

*This is used by bondtroller to more efficiently perform liquidity checks.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | Address of the account to snapshot |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | (possible error, token balance, borrow balance, exchange rate mantissa) |
| _1 | uint256 | undefined |
| _2 | uint256 | undefined |
| _3 | uint256 | undefined |

### getCash

```solidity
function getCash() external view returns (uint256)
```

Get cash balance of this cToken in the underlying asset




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | The quantity of underlying asset owned by this contract |

### getEstimatedBorrowBalanceStored

```solidity
function getEstimatedBorrowBalanceStored(address account) external view returns (uint256 accrual)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| accrual | uint256 | undefined |

### getEstimatedBorrowIndex

```solidity
function getEstimatedBorrowIndex() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getRoleAdmin

```solidity
function getRoleAdmin(bytes32 role) external view returns (bytes32)
```



*Returns the admin role that controls `role`. See {grantRole} and {revokeRole}. To change a role&#39;s admin, use {_setRoleAdmin}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### grandModerator

```solidity
function grandModerator(address newModerator) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| newModerator | address | undefined |

### grantRole

```solidity
function grantRole(bytes32 role, address account) external nonpayable
```



*Grants `role` to `account`. If `account` had not been already granted `role`, emits a {RoleGranted} event. Requirements: - the caller must have ``role``&#39;s admin role.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### hasRole

```solidity
function hasRole(bytes32 role, address account) external view returns (bool)
```



*Returns `true` if `account` has been granted `role`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### init

```solidity
function init(address underlying_, contract Bondtroller bondtroller_, contract InterestRateModel interestRateModel_, uint256 initialExchangeRateMantissa_, string name_, string symbol_, uint8 decimals_, address admin_) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| underlying_ | address | undefined |
| bondtroller_ | contract Bondtroller | undefined |
| interestRateModel_ | contract InterestRateModel | undefined |
| initialExchangeRateMantissa_ | uint256 | undefined |
| name_ | string | undefined |
| symbol_ | string | undefined |
| decimals_ | uint8 | undefined |
| admin_ | address | undefined |

### initialize

```solidity
function initialize(address underlying_, contract Bondtroller comptroller_, contract InterestRateModel interestRateModel_, uint256 initialExchangeRateMantissa_, string name_, string symbol_, uint8 decimals_) external nonpayable
```

Initialize the new money market



#### Parameters

| Name | Type | Description |
|---|---|---|
| underlying_ | address | The address of the underlying asset |
| comptroller_ | contract Bondtroller | The address of the Comptroller |
| interestRateModel_ | contract InterestRateModel | The address of the interest rate model |
| initialExchangeRateMantissa_ | uint256 | The initial exchange rate, scaled by 1e18 |
| name_ | string | ERC-20 name of this token |
| symbol_ | string | ERC-20 symbol of this token |
| decimals_ | uint8 | ERC-20 decimal precision of this token |

### initialize

```solidity
function initialize(contract Bondtroller bondtroller_, contract InterestRateModel interestRateModel_, uint256 initialExchangeRateMantissa_, string name_, string symbol_, uint8 decimals_) external nonpayable
```

Initialize the money market



#### Parameters

| Name | Type | Description |
|---|---|---|
| bondtroller_ | contract Bondtroller | The address of the Bondtroller |
| interestRateModel_ | contract InterestRateModel | The address of the interest rate model |
| initialExchangeRateMantissa_ | uint256 | The initial exchange rate, scaled by 1e18 |
| name_ | string | EIP-20 name of this token |
| symbol_ | string | EIP-20 symbol of this token |
| decimals_ | uint8 | EIP-20 decimal precision of this token |

### interestRateModel

```solidity
function interestRateModel() external view returns (contract InterestRateModel)
```

Model which tells what the current interest rate should be




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract InterestRateModel | undefined |

### isCToken

```solidity
function isCToken() external view returns (bool)
```

Indicator that this is a CToken contract (for inspection)




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### mintTo

```solidity
function mintTo(address minter, uint256 mintAmount) external nonpayable returns (uint256 err, uint256 mintedAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| minter | address | undefined |
| mintAmount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| err | uint256 | undefined |
| mintedAmount | uint256 | undefined |

### name

```solidity
function name() external view returns (string)
```

EIP-20 token name for this token




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### pendingAdmin

```solidity
function pendingAdmin() external view returns (address payable)
```

Pending administrator for this contract




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address payable | undefined |

### primaryIndexToken

```solidity
function primaryIndexToken() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### protocolSeizeShareMantissa

```solidity
function protocolSeizeShareMantissa() external view returns (uint256)
```

Share of seized collateral that is added to reserves




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### redeemTo

```solidity
function redeemTo(address redeemer, uint256 redeemTokens) external nonpayable returns (uint256 redeemErr)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| redeemer | address | undefined |
| redeemTokens | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| redeemErr | uint256 | undefined |

### redeemUnderlyingTo

```solidity
function redeemUnderlyingTo(address redeemer, uint256 redeemAmount) external nonpayable returns (uint256 redeemUnderlyingError)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| redeemer | address | undefined |
| redeemAmount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| redeemUnderlyingError | uint256 | undefined |

### renounceRole

```solidity
function renounceRole(bytes32 role, address account) external nonpayable
```



*Revokes `role` from the calling account. Roles are often managed via {grantRole} and {revokeRole}: this function&#39;s purpose is to provide a mechanism for accounts to lose their privileges if they are compromised (such as when a trusted device is misplaced). If the calling account had been granted `role`, emits a {RoleRevoked} event. Requirements: - the caller must be `account`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### repayTo

```solidity
function repayTo(address payer, address borrower, uint256 repayAmount) external nonpayable returns (uint256 repayBorrowError, uint256 amountRepayed)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| payer | address | undefined |
| borrower | address | undefined |
| repayAmount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| repayBorrowError | uint256 | undefined |
| amountRepayed | uint256 | undefined |

### reserveFactorMantissa

```solidity
function reserveFactorMantissa() external view returns (uint256)
```

Fraction of interest currently set aside for reserves




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### revokeModerator

```solidity
function revokeModerator(address moderator) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| moderator | address | undefined |

### revokeRole

```solidity
function revokeRole(bytes32 role, address account) external nonpayable
```



*Revokes `role` from `account`. If `account` had been granted `role`, emits a {RoleRevoked} event. Requirements: - the caller must have ``role``&#39;s admin role.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### setPrimaryIndexToken

```solidity
function setPrimaryIndexToken(address _primaryIndexToken) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _primaryIndexToken | address | undefined |

### setReserveFactor

```solidity
function setReserveFactor(uint256 reserveFactorMantissa) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| reserveFactorMantissa | uint256 | undefined |

### supplyRatePerBlock

```solidity
function supplyRatePerBlock() external view returns (uint256)
```

Returns the current per-block supply interest rate for this cToken




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | The supply interest rate per block, scaled by 1e18 |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) external view returns (bool)
```



*See {IERC165-supportsInterface}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| interfaceId | bytes4 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### sweepToken

```solidity
function sweepToken(contract EIP20NonStandardInterface token) external nonpayable
```

A public function to sweep accidental ERC-20 transfers to this contract. Tokens are sent to admin (timelock)



#### Parameters

| Name | Type | Description |
|---|---|---|
| token | contract EIP20NonStandardInterface | The address of the ERC-20 token to sweep |

### symbol

```solidity
function symbol() external view returns (string)
```

EIP-20 token symbol for this token




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### totalBorrows

```solidity
function totalBorrows() external view returns (uint256)
```

Total amount of outstanding borrows of the underlying in this market




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### totalBorrowsCurrent

```solidity
function totalBorrowsCurrent() external nonpayable returns (uint256)
```

Returns the current total borrows plus accrued interest




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | The total borrows with interest |

### totalReserves

```solidity
function totalReserves() external view returns (uint256)
```

Total amount of reserves of the underlying held in this market




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

Total number of tokens in circulation




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### transfer

```solidity
function transfer(address dst, uint256 amount) external nonpayable returns (bool)
```

Transfer `amount` tokens from `msg.sender` to `dst`



#### Parameters

| Name | Type | Description |
|---|---|---|
| dst | address | The address of the destination account |
| amount | uint256 | The number of tokens to transfer |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | Whether or not the transfer succeeded |

### transferFrom

```solidity
function transferFrom(address src, address dst, uint256 amount) external nonpayable returns (bool)
```

Transfer `amount` tokens from `src` to `dst`



#### Parameters

| Name | Type | Description |
|---|---|---|
| src | address | The address of the source account |
| dst | address | The address of the destination account |
| amount | uint256 | The number of tokens to transfer |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | Whether or not the transfer succeeded |

### underlying

```solidity
function underlying() external view returns (address)
```

Underlying asset for this CToken




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |



## Events

### AccrueInterest

```solidity
event AccrueInterest(uint256 cashPrior, uint256 interestAccumulated, uint256 borrowIndex, uint256 totalBorrows)
```

Event emitted when interest is accrued



#### Parameters

| Name | Type | Description |
|---|---|---|
| cashPrior  | uint256 | undefined |
| interestAccumulated  | uint256 | undefined |
| borrowIndex  | uint256 | undefined |
| totalBorrows  | uint256 | undefined |

### Approval

```solidity
event Approval(address indexed owner, address indexed spender, uint256 amount)
```

EIP20 Approval event



#### Parameters

| Name | Type | Description |
|---|---|---|
| owner `indexed` | address | undefined |
| spender `indexed` | address | undefined |
| amount  | uint256 | undefined |

### Borrow

```solidity
event Borrow(address borrower, uint256 borrowAmount, uint256 accountBorrows, uint256 totalBorrows)
```

Event emitted when underlying is borrowed



#### Parameters

| Name | Type | Description |
|---|---|---|
| borrower  | address | undefined |
| borrowAmount  | uint256 | undefined |
| accountBorrows  | uint256 | undefined |
| totalBorrows  | uint256 | undefined |

### Failure

```solidity
event Failure(uint256 error, uint256 info, uint256 detail)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| error  | uint256 | undefined |
| info  | uint256 | undefined |
| detail  | uint256 | undefined |

### LiquidateBorrow

```solidity
event LiquidateBorrow(address liquidator, address borrower, uint256 repayAmount, address cTokenCollateral, uint256 seizeTokens)
```

Event emitted when a borrow is liquidated



#### Parameters

| Name | Type | Description |
|---|---|---|
| liquidator  | address | undefined |
| borrower  | address | undefined |
| repayAmount  | uint256 | undefined |
| cTokenCollateral  | address | undefined |
| seizeTokens  | uint256 | undefined |

### Mint

```solidity
event Mint(address minter, uint256 mintAmount, uint256 mintTokens)
```

Event emitted when tokens are minted



#### Parameters

| Name | Type | Description |
|---|---|---|
| minter  | address | undefined |
| mintAmount  | uint256 | undefined |
| mintTokens  | uint256 | undefined |

### NewAdmin

```solidity
event NewAdmin(address oldAdmin, address newAdmin)
```

Event emitted when pendingAdmin is accepted, which means admin is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldAdmin  | address | undefined |
| newAdmin  | address | undefined |

### NewBondtroller

```solidity
event NewBondtroller(contract Bondtroller oldBondtroller, contract Bondtroller newBondtroller)
```

Event emitted when bondtroller is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldBondtroller  | contract Bondtroller | undefined |
| newBondtroller  | contract Bondtroller | undefined |

### NewMarketInterestRateModel

```solidity
event NewMarketInterestRateModel(contract InterestRateModel oldInterestRateModel, contract InterestRateModel newInterestRateModel)
```

Event emitted when interestRateModel is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldInterestRateModel  | contract InterestRateModel | undefined |
| newInterestRateModel  | contract InterestRateModel | undefined |

### NewPendingAdmin

```solidity
event NewPendingAdmin(address oldPendingAdmin, address newPendingAdmin)
```

Event emitted when pendingAdmin is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldPendingAdmin  | address | undefined |
| newPendingAdmin  | address | undefined |

### NewReserveFactor

```solidity
event NewReserveFactor(uint256 oldReserveFactorMantissa, uint256 newReserveFactorMantissa)
```

Event emitted when the reserve factor is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldReserveFactorMantissa  | uint256 | undefined |
| newReserveFactorMantissa  | uint256 | undefined |

### Redeem

```solidity
event Redeem(address redeemer, uint256 redeemAmount, uint256 redeemTokens)
```

Event emitted when tokens are redeemed



#### Parameters

| Name | Type | Description |
|---|---|---|
| redeemer  | address | undefined |
| redeemAmount  | uint256 | undefined |
| redeemTokens  | uint256 | undefined |

### RepayBorrow

```solidity
event RepayBorrow(address payer, address borrower, uint256 repayAmount, uint256 accountBorrows, uint256 totalBorrows)
```

Event emitted when a borrow is repaid



#### Parameters

| Name | Type | Description |
|---|---|---|
| payer  | address | undefined |
| borrower  | address | undefined |
| repayAmount  | uint256 | undefined |
| accountBorrows  | uint256 | undefined |
| totalBorrows  | uint256 | undefined |

### ReservesAdded

```solidity
event ReservesAdded(address benefactor, uint256 addAmount, uint256 newTotalReserves)
```

Event emitted when the reserves are added



#### Parameters

| Name | Type | Description |
|---|---|---|
| benefactor  | address | undefined |
| addAmount  | uint256 | undefined |
| newTotalReserves  | uint256 | undefined |

### ReservesReduced

```solidity
event ReservesReduced(address admin, uint256 reduceAmount, uint256 newTotalReserves)
```

Event emitted when the reserves are reduced



#### Parameters

| Name | Type | Description |
|---|---|---|
| admin  | address | undefined |
| reduceAmount  | uint256 | undefined |
| newTotalReserves  | uint256 | undefined |

### RoleAdminChanged

```solidity
event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| previousAdminRole `indexed` | bytes32 | undefined |
| newAdminRole `indexed` | bytes32 | undefined |

### RoleGranted

```solidity
event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| account `indexed` | address | undefined |
| sender `indexed` | address | undefined |

### RoleRevoked

```solidity
event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| account `indexed` | address | undefined |
| sender `indexed` | address | undefined |

### SetPrimaryIndexToken

```solidity
event SetPrimaryIndexToken(address indexed oldPrimaryIndexToken, address indexed newPrimaryIndexToken)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| oldPrimaryIndexToken `indexed` | address | undefined |
| newPrimaryIndexToken `indexed` | address | undefined |

### Transfer

```solidity
event Transfer(address indexed from, address indexed to, uint256 amount)
```

EIP20 Transfer event



#### Parameters

| Name | Type | Description |
|---|---|---|
| from `indexed` | address | undefined |
| to `indexed` | address | undefined |
| amount  | uint256 | undefined |



