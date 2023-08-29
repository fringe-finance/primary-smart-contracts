# BTokenInterface

## Abstract Contract Description


License: MIT

## 

```solidity
abstract contract BTokenInterface is BTokenStorage
```


## Events info

### AccrueInterest

```solidity
event AccrueInterest(uint256 cashPrior, uint256 interestAccumulated, uint256 borrowIndex, uint256 totalBorrows)
```

Event emitted when interest is accrued
### Mint

```solidity
event Mint(address minter, uint256 mintAmount, uint256 mintTokens)
```

Event emitted when tokens are minted
### Redeem

```solidity
event Redeem(address redeemer, uint256 redeemAmount, uint256 redeemTokens)
```

Event emitted when tokens are redeemed
### Borrow

```solidity
event Borrow(address borrower, uint256 borrowAmount, uint256 accountBorrows, uint256 totalBorrows)
```

Event emitted when underlying is borrowed
### RepayBorrow

```solidity
event RepayBorrow(address payer, address borrower, uint256 repayAmount, uint256 accountBorrows, uint256 totalBorrows)
```

Event emitted when a borrow is repaid
### LiquidateBorrow

```solidity
event LiquidateBorrow(address liquidator, address borrower, uint256 repayAmount, address cTokenCollateral, uint256 seizeTokens)
```

Event emitted when a borrow is liquidated
### NewPendingAdmin

```solidity
event NewPendingAdmin(address oldPendingAdmin, address newPendingAdmin)
```

Event emitted when pendingAdmin is changed
### NewAdmin

```solidity
event NewAdmin(address oldAdmin, address newAdmin)
```

Event emitted when pendingAdmin is accepted, which means admin is updated
### NewBondtroller

```solidity
event NewBondtroller(Bondtroller oldBondtroller, Bondtroller newBondtroller)
```

Event emitted when bondtroller is changed
### NewMarketInterestRateModel

```solidity
event NewMarketInterestRateModel(InterestRateModel oldInterestRateModel, InterestRateModel newInterestRateModel)
```

Event emitted when interestRateModel is changed
### NewReserveFactor

```solidity
event NewReserveFactor(uint256 oldReserveFactorMantissa, uint256 newReserveFactorMantissa)
```

Event emitted when the reserve factor is changed
### ReservesAdded

```solidity
event ReservesAdded(address benefactor, uint256 addAmount, uint256 newTotalReserves)
```

Event emitted when the reserves are added
### ReservesReduced

```solidity
event ReservesReduced(address admin, uint256 reduceAmount, uint256 newTotalReserves)
```

Event emitted when the reserves are reduced
### Transfer

```solidity
event Transfer(address indexed from, address indexed to, uint256 amount)
```

EIP20 Transfer event
### Approval

```solidity
event Approval(address indexed owner, address indexed spender, uint256 amount)
```

EIP20 Approval event
## Constants info

### isCToken (0xfe9c44ae)

```solidity
bool constant isCToken = true
```

Indicator that this is a CToken contract (for inspection)
## Functions info

### transfer (0xa9059cbb)

```solidity
function transfer(address dst, uint256 amount) external virtual returns (bool)
```

Failure event
### transferFrom (0x23b872dd)

```solidity
function transferFrom(
    address src,
    address dst,
    uint256 amount
) external virtual returns (bool)
```


### approve (0x095ea7b3)

```solidity
function approve(
    address spender,
    uint256 amount
) external virtual returns (bool)
```


### allowance (0xdd62ed3e)

```solidity
function allowance(
    address owner,
    address spender
) external view virtual returns (uint256)
```


### balanceOf (0x70a08231)

```solidity
function balanceOf(address owner) external view virtual returns (uint256)
```


### balanceOfUnderlying (0x3af9e669)

```solidity
function balanceOfUnderlying(address owner) external virtual returns (uint256)
```


### getAccountSnapshot (0xc37f68e2)

```solidity
function getAccountSnapshot(
    address account
) external view virtual returns (uint256, uint256, uint256, uint256)
```


### borrowRatePerBlock (0xf8f9da28)

```solidity
function borrowRatePerBlock() external view virtual returns (uint256)
```


### supplyRatePerBlock (0xae9d70b0)

```solidity
function supplyRatePerBlock() external view virtual returns (uint256)
```


### totalBorrowsCurrent (0x73acee98)

```solidity
function totalBorrowsCurrent() external virtual returns (uint256)
```


### borrowBalanceCurrent (0x17bfdfbc)

```solidity
function borrowBalanceCurrent(
    address account
) external virtual returns (uint256)
```


### borrowBalanceStored (0x95dd9193)

```solidity
function borrowBalanceStored(
    address account
) public view virtual returns (uint256)
```


### exchangeRateCurrent (0xbd6d894d)

```solidity
function exchangeRateCurrent() public virtual returns (uint256)
```


### exchangeRateStored (0x182df0f5)

```solidity
function exchangeRateStored() public view virtual returns (uint256)
```


### getCash (0x3b1d21a2)

```solidity
function getCash() external view virtual returns (uint256)
```


### accrueInterest (0xa6afed95)

```solidity
function accrueInterest() public virtual returns (uint256)
```


### _setBondtroller (0xb4ac7688)

```solidity
function _setBondtroller(
    Bondtroller newBondtroller
) public virtual returns (uint256)
```


### _setReserveFactor (0xfca7820b)

```solidity
function _setReserveFactor(
    uint256 newReserveFactorMantissa
) external virtual returns (uint256)
```


### _reduceReserves (0x601a0bf1)

```solidity
function _reduceReserves(
    uint256 reduceAmount
) external virtual returns (uint256)
```


### _setInterestRateModel (0xf2b3abbd)

```solidity
function _setInterestRateModel(
    InterestRateModel newInterestRateModel
) public virtual returns (uint256)
```

