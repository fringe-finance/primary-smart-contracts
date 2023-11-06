# BondtrollerV1Storage

## Overview

#### License: MIT

## 

```solidity
contract BondtrollerV1Storage
```


## Constants info

### isBondtroller (0xc311ab3c)

```solidity
bool constant isBondtroller = true
```

watermark that says that this is Bondtroller
## State variables info

### admin (0xf851a440)

```solidity
address admin
```

Administrator for this contract
### oracle (0x7dc0d1d0)

```solidity
address oracle
```

Oracle which gives the price of any given asset
### closeFactorMantissa (0xe8755446)

```solidity
uint256 closeFactorMantissa
```

Multiplier used to calculate the maximum repayAmount when liquidating a borrow
### liquidationIncentiveMantissa (0x4ada90af)

```solidity
uint256 liquidationIncentiveMantissa
```

Multiplier representing the discount on collateral that a liquidator receives
### maxAssets (0x94b2294b)

```solidity
uint256 maxAssets
```

Max number of assets a single account can participate in (borrow or use as collateral)
### accountAssets (0xdce15449)

```solidity
mapping(address => contract BToken[]) accountAssets
```

Per-account mapping of "assets you are in", capped by maxAssets