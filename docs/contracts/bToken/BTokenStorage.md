# BTokenStorage

## Overview

#### License: MIT

## 

```solidity
contract BTokenStorage
```


## Structs info

### BorrowSnapshot

```solidity
struct BorrowSnapshot {
	uint256 principal;
	uint256 interestIndex;
}
```


## Constants info

### protocolSeizeShareMantissa (0x6752e702)

```solidity
uint256 constant protocolSeizeShareMantissa = 2.8e16
```

Share of seized collateral that is added to reserves
## State variables info

### name (0x06fdde03)

```solidity
string name
```

EIP-20 token name for this token
### symbol (0x95d89b41)

```solidity
string symbol
```

EIP-20 token symbol for this token
### decimals (0x313ce567)

```solidity
uint8 decimals
```

EIP-20 token decimals for this token
### admin (0xf851a440)

```solidity
address payable admin
```

Administrator for this contract
### pendingAdmin (0x26782247)

```solidity
address payable pendingAdmin
```

Pending administrator for this contract
### bondtroller (0x25358647)

```solidity
contract Bondtroller bondtroller
```

Contract which oversees inter-cToken operations
### interestRateModel (0xf3fdb15a)

```solidity
contract InterestRateModel interestRateModel
```

Model which tells what the current interest rate should be
### reserveFactorMantissa (0x173b9904)

```solidity
uint256 reserveFactorMantissa
```

Fraction of interest currently set aside for reserves
### accrualBlockNumber (0x6c540baf)

```solidity
uint256 accrualBlockNumber
```

Block number that interest was last accrued at
### borrowIndex (0xaa5af0fd)

```solidity
uint256 borrowIndex
```

Accumulator of the total earned interest rate since the opening of the market
### totalBorrows (0x47bd3718)

```solidity
uint256 totalBorrows
```

Total amount of outstanding borrows of the underlying in this market
### totalReserves (0x8f840ddd)

```solidity
uint256 totalReserves
```

Total amount of reserves of the underlying held in this market
### totalSupply (0x18160ddd)

```solidity
uint256 totalSupply
```

Total number of tokens in circulation
### accountTokens (0xa19d1460)

```solidity
mapping(address => uint256) accountTokens
```

Official record of token balances for each account