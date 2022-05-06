# Solidity API

## BTokenStorage

### _notEntered

```solidity
bool _notEntered
```

_Guard variable for re-entrancy checks_

### name

```solidity
string name
```

EIP-20 token name for this token

### symbol

```solidity
string symbol
```

EIP-20 token symbol for this token

### decimals

```solidity
uint8 decimals
```

EIP-20 token decimals for this token

### borrowRateMaxMantissa

```solidity
uint256 borrowRateMaxMantissa
```

Maximum borrow rate that can ever be applied (.0005% / block)

### reserveFactorMaxMantissa

```solidity
uint256 reserveFactorMaxMantissa
```

Maximum fraction of interest that can be set aside for reserves

### admin

```solidity
address payable admin
```

Administrator for this contract

### pendingAdmin

```solidity
address payable pendingAdmin
```

Pending administrator for this contract

### bondtroller

```solidity
contract Bondtroller bondtroller
```

Contract which oversees inter-cToken operations

### interestRateModel

```solidity
contract InterestRateModel interestRateModel
```

Model which tells what the current interest rate should be

### initialExchangeRateMantissa

```solidity
uint256 initialExchangeRateMantissa
```

Initial exchange rate used when minting the first CTokens (used when totalSupply &#x3D; 0)

### reserveFactorMantissa

```solidity
uint256 reserveFactorMantissa
```

Fraction of interest currently set aside for reserves

### accrualBlockNumber

```solidity
uint256 accrualBlockNumber
```

Block number that interest was last accrued at

### borrowIndex

```solidity
uint256 borrowIndex
```

Accumulator of the total earned interest rate since the opening of the market

### totalBorrows

```solidity
uint256 totalBorrows
```

Total amount of outstanding borrows of the underlying in this market

### totalReserves

```solidity
uint256 totalReserves
```

Total amount of reserves of the underlying held in this market

### totalSupply

```solidity
uint256 totalSupply
```

Total number of tokens in circulation

### accountTokens

```solidity
mapping(address &#x3D;&gt; uint256) accountTokens
```

Official record of token balances for each account

### transferAllowances

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; uint256)) transferAllowances
```

Approved token transfer amounts on behalf of others

### BorrowSnapshot

```solidity
struct BorrowSnapshot {
  uint256 principal;
  uint256 interestIndex;
}
```

### accountBorrows

```solidity
mapping(address &#x3D;&gt; struct BTokenStorage.BorrowSnapshot) accountBorrows
```

Mapping of account addresses to outstanding borrow balances

### protocolSeizeShareMantissa

```solidity
uint256 protocolSeizeShareMantissa
```

Share of seized collateral that is added to reserves

## BTokenInterface

### isCToken

```solidity
bool isCToken
```

Indicator that this is a CToken contract (for inspection)

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
event NewBondtroller(contract Bondtroller oldBondtroller, contract Bondtroller newBondtroller)
```

Event emitted when bondtroller is changed

### NewMarketInterestRateModel

```solidity
event NewMarketInterestRateModel(contract InterestRateModel oldInterestRateModel, contract InterestRateModel newInterestRateModel)
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
event Transfer(address from, address to, uint256 amount)
```

EIP20 Transfer event

### Approval

```solidity
event Approval(address owner, address spender, uint256 amount)
```

EIP20 Approval event

### transfer

```solidity
function transfer(address dst, uint256 amount) external virtual returns (bool)
```

Failure event

### transferFrom

```solidity
function transferFrom(address src, address dst, uint256 amount) external virtual returns (bool)
```

### approve

```solidity
function approve(address spender, uint256 amount) external virtual returns (bool)
```

### allowance

```solidity
function allowance(address owner, address spender) external view virtual returns (uint256)
```

### balanceOf

```solidity
function balanceOf(address owner) external view virtual returns (uint256)
```

### balanceOfUnderlying

```solidity
function balanceOfUnderlying(address owner) external virtual returns (uint256)
```

### getAccountSnapshot

```solidity
function getAccountSnapshot(address account) external view virtual returns (uint256, uint256, uint256, uint256)
```

### borrowRatePerBlock

```solidity
function borrowRatePerBlock() external view virtual returns (uint256)
```

### supplyRatePerBlock

```solidity
function supplyRatePerBlock() external view virtual returns (uint256)
```

### totalBorrowsCurrent

```solidity
function totalBorrowsCurrent() external virtual returns (uint256)
```

### borrowBalanceCurrent

```solidity
function borrowBalanceCurrent(address account) external virtual returns (uint256)
```

### borrowBalanceStored

```solidity
function borrowBalanceStored(address account) public view virtual returns (uint256)
```

### exchangeRateCurrent

```solidity
function exchangeRateCurrent() public virtual returns (uint256)
```

### exchangeRateStored

```solidity
function exchangeRateStored() public view virtual returns (uint256)
```

### getCash

```solidity
function getCash() external view virtual returns (uint256)
```

### accrueInterest

```solidity
function accrueInterest() public virtual returns (uint256)
```

### _setPendingAdmin

```solidity
function _setPendingAdmin(address payable newPendingAdmin) external virtual returns (uint256)
```

### _acceptAdmin

```solidity
function _acceptAdmin() external virtual returns (uint256)
```

### _setBondtroller

```solidity
function _setBondtroller(contract Bondtroller newBondtroller) public virtual returns (uint256)
```

### _setReserveFactor

```solidity
function _setReserveFactor(uint256 newReserveFactorMantissa) external virtual returns (uint256)
```

### _reduceReserves

```solidity
function _reduceReserves(uint256 reduceAmount) external virtual returns (uint256)
```

### _setInterestRateModel

```solidity
function _setInterestRateModel(contract InterestRateModel newInterestRateModel) public virtual returns (uint256)
```

## BErc20Storage

### underlying

```solidity
address underlying
```

Underlying asset for this CToken

## BErc20Interface

### sweepToken

```solidity
function sweepToken(contract EIP20NonStandardInterface token) external virtual
```

### _addReserves

```solidity
function _addReserves(uint256 addAmount) external virtual returns (uint256)
```

