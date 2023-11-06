# AggregatorV3Interface

## Overview

#### License: MIT

## 

```solidity
interface AggregatorV3Interface
```


## Functions info

### decimals (0x313ce567)

```solidity
function decimals() external view returns (uint8)
```


### description (0x7284e416)

```solidity
function description() external view returns (string memory)
```


### version (0x54fd4d50)

```solidity
function version() external view returns (uint256)
```


### getRoundData (0x9a6fc8f5)

```solidity
function getRoundData(
    uint80 _roundId
)
    external
    view
    returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    )
```


### latestRoundData (0xfeaf968c)

```solidity
function latestRoundData()
    external
    view
    returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    )
```


### latestAnswer (0x50d25bcd)

```solidity
function latestAnswer() external view returns (uint256 answer)
```

