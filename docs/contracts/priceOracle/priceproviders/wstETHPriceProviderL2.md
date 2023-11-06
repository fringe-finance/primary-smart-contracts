# wstETHPriceProviderL2

## Overview

#### License: MIT

## 

```solidity
contract wstETHPriceProviderL2 is wstETHPriceProvider
```

Price provider that uses chainlink

This contract is used to get the price of wstETH in USD.
## Events info

### SetSequencerUptimeFeed

```solidity
event SetSequencerUptimeFeed(address indexed newSequencerUptimeFeed)
```

Emitted when the address of the L2 sequencer uptime feed is set.


Parameters:

| Name                   | Type    | Description                                      |
| :--------------------- | :------ | :----------------------------------------------- |
| newSequencerUptimeFeed | address | The address of the new L2 sequencer uptime feed. |

### SetGracePeriodTime

```solidity
event SetGracePeriodTime(uint32 newGracePeriodTime)
```

Emitted when the grace period time is set.


Parameters:

| Name               | Type   | Description                      |
| :----------------- | :----- | :------------------------------- |
| newGracePeriodTime | uint32 | The new grace period time value. |

## State variables info

### gracePeriodTime (0xd5bd765c)

```solidity
uint32 gracePeriodTime
```


### sequencerUptimeFeed (0xa7264705)

```solidity
address sequencerUptimeFeed
```


## Functions info

### setSequencerUptimeFeed (0xb8f44963)

```solidity
function setSequencerUptimeFeed(
    address newSequencerUptimeFeed
) external onlyModerator
```

Sets proxy addresses for the L2 sequencer feeds.
Caller must be the moderator.


Parameters:

| Name                   | Type    | Description                                      |
| :--------------------- | :------ | :----------------------------------------------- |
| newSequencerUptimeFeed | address | The address of new SequencerUptimeFeed contract. |

### setGracePeriodTime (0x21b90245)

```solidity
function setGracePeriodTime(uint32 newGracePeriodTime) external onlyModerator
```

Sets the grace period after the sequencer is backed up.
Caller must be the moderator.


Parameters:

| Name               | Type   | Description                      |
| :----------------- | :----- | :------------------------------- |
| newGracePeriodTime | uint32 | The new grace period time value. |

### getLatestPrice (0x16345f18)

```solidity
function getLatestPrice(
    address aggregatorPath_
) public view override returns (uint256 answer)
```

ReturnS the latest price after performing sanity check and staleness check.


Parameters:

| Name            | Type    | Description                                     |
| :-------------- | :------ | :---------------------------------------------- |
| aggregatorPath_ | address | The address of chainlink aggregator contract.   |


Return values:

| Name   | Type    | Description                |
| :----- | :------ | :------------------------- |
| answer | uint256 | The latest price (answer). |
