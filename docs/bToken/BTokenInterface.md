# BTokenInterface









## Methods

### _acceptAdmin

```solidity
function _acceptAdmin() external nonpayable returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### _reduceReserves

```solidity
function _reduceReserves(uint256 reduceAmount) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| reduceAmount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### _setBondtroller

```solidity
function _setBondtroller(contract Bondtroller newBondtroller) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| newBondtroller | contract Bondtroller | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### _setInterestRateModel

```solidity
function _setInterestRateModel(contract InterestRateModel newInterestRateModel) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| newInterestRateModel | contract InterestRateModel | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### _setPendingAdmin

```solidity
function _setPendingAdmin(address payable newPendingAdmin) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| newPendingAdmin | address payable | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### _setReserveFactor

```solidity
function _setReserveFactor(uint256 newReserveFactorMantissa) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| newReserveFactorMantissa | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

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





#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | undefined |
| spender | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### approve

```solidity
function approve(address spender, uint256 amount) external nonpayable returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| spender | address | undefined |
| amount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### balanceOfUnderlying

```solidity
function balanceOfUnderlying(address owner) external nonpayable returns (uint256)
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





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### borrowBalanceStored

```solidity
function borrowBalanceStored(address account) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

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






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

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






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### exchangeRateStored

```solidity
function exchangeRateStored() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getAccountSnapshot

```solidity
function getAccountSnapshot(address account) external view returns (uint256, uint256, uint256, uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |
| _1 | uint256 | undefined |
| _2 | uint256 | undefined |
| _3 | uint256 | undefined |

### getCash

```solidity
function getCash() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

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

### protocolSeizeShareMantissa

```solidity
function protocolSeizeShareMantissa() external view returns (uint256)
```

Share of seized collateral that is added to reserves




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### reserveFactorMantissa

```solidity
function reserveFactorMantissa() external view returns (uint256)
```

Fraction of interest currently set aside for reserves




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### supplyRatePerBlock

```solidity
function supplyRatePerBlock() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

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






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

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

Failure event



#### Parameters

| Name | Type | Description |
|---|---|---|
| dst | address | undefined |
| amount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### transferFrom

```solidity
function transferFrom(address src, address dst, uint256 amount) external nonpayable returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| src | address | undefined |
| dst | address | undefined |
| amount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |



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



