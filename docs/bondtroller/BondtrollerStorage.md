# Solidity API

## BondtrollerV1Storage

### isBondtroller

```solidity
bool isBondtroller
```

watermark that says that this is Bondtroller

### admin

```solidity
address admin
```

Administrator for this contract

### oracle

```solidity
address oracle
```

Oracle which gives the price of any given asset

### closeFactorMantissa

```solidity
uint256 closeFactorMantissa
```

Multiplier used to calculate the maximum repayAmount when liquidating a borrow

### liquidationIncentiveMantissa

```solidity
uint256 liquidationIncentiveMantissa
```

Multiplier representing the discount on collateral that a liquidator receives

### maxAssets

```solidity
uint256 maxAssets
```

Max number of assets a single account can participate in (borrow or use as collateral)

### accountAssets

```solidity
mapping(address &#x3D;&gt; contract BToken[]) accountAssets
```

Per-account mapping of &quot;assets you are in&quot;, capped by maxAssets

## BondtrollerV2Storage

### Market

```solidity
struct Market {
  bool isListed;
  uint256 collateralFactorMantissa;
  bool isComped;
}
```

### accountMembership

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; bool)) accountMembership
```

Per-market mapping of &quot;accounts in this asset&quot;

### markets

```solidity
mapping(address &#x3D;&gt; struct BondtrollerV2Storage.Market) markets
```

Official mapping of BTokens -&gt; Market metadata

_Used e.g. to determine if a market is supported_

### pauseGuardian

```solidity
address pauseGuardian
```

The Pause Guardian can pause certain actions as a safety mechanism.
 Actions which allow users to remove their own assets cannot be paused.
 Liquidation / seizing / transfer can only be paused globally, not by market.

### _mintGuardianPaused

```solidity
bool _mintGuardianPaused
```

### _borrowGuardianPaused

```solidity
bool _borrowGuardianPaused
```

### transferGuardianPaused

```solidity
bool transferGuardianPaused
```

### seizeGuardianPaused

```solidity
bool seizeGuardianPaused
```

### mintGuardianPaused

```solidity
mapping(address &#x3D;&gt; bool) mintGuardianPaused
```

### borrowGuardianPaused

```solidity
mapping(address &#x3D;&gt; bool) borrowGuardianPaused
```

## BondtrollerV3Storage

### CompMarketState

```solidity
struct CompMarketState {
  uint224 index;
  uint32 block;
}
```

### allMarkets

```solidity
contract BToken[] allMarkets
```

A list of all markets

### compRate

```solidity
uint256 compRate
```

The rate at which the flywheel distributes COMP, per block

### compSpeeds

```solidity
mapping(address &#x3D;&gt; uint256) compSpeeds
```

The portion of compRate that each market currently receives

### compSupplyState

```solidity
mapping(address &#x3D;&gt; struct BondtrollerV3Storage.CompMarketState) compSupplyState
```

The COMP market supply state for each market

### compBorrowState

```solidity
mapping(address &#x3D;&gt; struct BondtrollerV3Storage.CompMarketState) compBorrowState
```

The COMP market borrow state for each market

### compSupplierIndex

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; uint256)) compSupplierIndex
```

The COMP borrow index for each market for each supplier as of the last time they accrued COMP

### compBorrowerIndex

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; uint256)) compBorrowerIndex
```

The COMP borrow index for each market for each borrower as of the last time they accrued COMP

### compAccrued

```solidity
mapping(address &#x3D;&gt; uint256) compAccrued
```

The COMP accrued but not yet transferred to each user

## BondtrollerV4Storage

### borrowCapGuardian

```solidity
address borrowCapGuardian
```

### borrowCaps

```solidity
mapping(address &#x3D;&gt; uint256) borrowCaps
```

## BondtrollerV5Storage

### compContributorSpeeds

```solidity
mapping(address &#x3D;&gt; uint256) compContributorSpeeds
```

The portion of COMP that each contributor receives per block

### lastContributorBlock

```solidity
mapping(address &#x3D;&gt; uint256) lastContributorBlock
```

Last block at which a contributor&#x27;s COMP rewards have been allocated

