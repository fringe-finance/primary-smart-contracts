# BondtrollerV2Storage

## Contract Description


License: MIT

## 

```solidity
contract BondtrollerV2Storage is BondtrollerV1Storage
```


## Structs info

### Market

```solidity
struct Market {
	bool isListed;
	uint256 collateralFactorMantissa;
	bool isComped;
}
```


## State variables info

### accountMembership (0x9ace3ada)

```solidity
mapping(address => mapping(address => bool)) accountMembership
```

Per-market mapping of "accounts in this asset"
### markets (0x8e8f294b)

```solidity
mapping(address => struct BondtrollerV2Storage.Market) markets
```

Official mapping of BTokens -> Market metadata

Used e.g. to determine if a market is supported
### pauseGuardian (0x24a3d622)

```solidity
address pauseGuardian
```

The Pause Guardian can pause certain actions as a safety mechanism.
Actions which allow users to remove their own assets cannot be paused.
Liquidation / seizing / transfer can only be paused globally, not by market.
### _mintGuardianPaused (0x3c94786f)

```solidity
bool _mintGuardianPaused
```


### _borrowGuardianPaused (0xe6653f3d)

```solidity
bool _borrowGuardianPaused
```


### transferGuardianPaused (0x87f76303)

```solidity
bool transferGuardianPaused
```


### seizeGuardianPaused (0xac0b0bb7)

```solidity
bool seizeGuardianPaused
```


### mintGuardianPaused (0x731f0c2b)

```solidity
mapping(address => bool) mintGuardianPaused
```


### borrowGuardianPaused (0x6d154ea5)

```solidity
mapping(address => bool) borrowGuardianPaused
```

