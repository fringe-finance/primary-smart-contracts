# BondtrollerV3Storage

## Contract Description


License: MIT

## 

```solidity
contract BondtrollerV3Storage is BondtrollerV2Storage
```


## Structs info

### CompMarketState

```solidity
struct CompMarketState {
	uint224 index;
	uint32 block;
}
```


## State variables info

### allMarkets (0x52d84d1e)

```solidity
contract BToken[] allMarkets
```

A list of all markets
### compRate (0xaa900754)

```solidity
uint256 compRate
```

The rate at which the flywheel distributes COMP, per block
### compSpeeds (0x1d7b33d7)

```solidity
mapping(address => uint256) compSpeeds
```

The portion of compRate that each market currently receives
### compSupplyState (0x6b79c38d)

```solidity
mapping(address => struct BondtrollerV3Storage.CompMarketState) compSupplyState
```

The COMP market supply state for each market
### compBorrowState (0x8c57804e)

```solidity
mapping(address => struct BondtrollerV3Storage.CompMarketState) compBorrowState
```

The COMP market borrow state for each market
### compSupplierIndex (0xb21be7fd)

```solidity
mapping(address => mapping(address => uint256)) compSupplierIndex
```

The COMP borrow index for each market for each supplier as of the last time they accrued COMP
### compBorrowerIndex (0xca0af043)

```solidity
mapping(address => mapping(address => uint256)) compBorrowerIndex
```

The COMP borrow index for each market for each borrower as of the last time they accrued COMP
### compAccrued (0xcc7ebdc4)

```solidity
mapping(address => uint256) compAccrued
```

The COMP accrued but not yet transferred to each user