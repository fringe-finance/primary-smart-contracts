# OracleLibrary

## Overview

#### License: GPL-2.0-or-later

```solidity
library OracleLibrary
```

Provides functions to integrate with V3 pool oracle
## Structs info

### WeightedTickData

```solidity
struct WeightedTickData {
	int24 tick;
	uint128 weight;
}
```


## Functions info

### consult

```solidity
function consult(
    address pool,
    uint32 secondsAgo
)
    internal
    view
    returns (int24 arithmeticMeanTick, uint128 harmonicMeanLiquidity)
```

Calculates time-weighted means of tick and liquidity for a given Uniswap V3 pool


Parameters:

| Name       | Type    | Description                                                                     |
| :--------- | :------ | :------------------------------------------------------------------------------ |
| pool       | address | Address of the pool that we want to observe                                     |
| secondsAgo | uint32  | Number of seconds in the past from which to calculate the time-weighted means   |


Return values:

| Name                  | Type    | Description                                                                        |
| :-------------------- | :------ | :--------------------------------------------------------------------------------- |
| arithmeticMeanTick    | int24   | The arithmetic mean tick from (block.timestamp - secondsAgo) to block.timestamp    |
| harmonicMeanLiquidity | uint128 | The harmonic mean liquidity from (block.timestamp - secondsAgo) to block.timestamp |

### getQuoteAtTick

```solidity
function getQuoteAtTick(
    int24 tick,
    uint128 baseAmount,
    address baseToken,
    address quoteToken
) internal pure returns (uint256 quoteAmount)
```

Given a tick and a token amount, calculates the amount of token received in exchange


Parameters:

| Name       | Type    | Description                                                               |
| :--------- | :------ | :------------------------------------------------------------------------ |
| tick       | int24   | Tick value used to calculate the quote                                    |
| baseAmount | uint128 | Amount of token to be converted                                           |
| baseToken  | address | Address of an ERC20 token contract used as the baseAmount denomination    |
| quoteToken | address | Address of an ERC20 token contract used as the quoteAmount denomination   |


Return values:

| Name        | Type    | Description                                               |
| :---------- | :------ | :-------------------------------------------------------- |
| quoteAmount | uint256 | Amount of quoteToken received for baseAmount of baseToken |

### getOldestObservationSecondsAgo

```solidity
function getOldestObservationSecondsAgo(
    address pool
) internal view returns (uint32 secondsAgo)
```

Given a pool, it returns the number of seconds ago of the oldest stored observation


Parameters:

| Name | Type    | Description                                          |
| :--- | :------ | :--------------------------------------------------- |
| pool | address | Address of Uniswap V3 pool that we want to observe   |


Return values:

| Name       | Type   | Description                                                             |
| :--------- | :----- | :---------------------------------------------------------------------- |
| secondsAgo | uint32 | The number of seconds ago of the oldest observation stored for the pool |

### getChainedPrice

```solidity
function getChainedPrice(
    address[] memory tokens,
    int24[] memory ticks
) internal pure returns (int256 syntheticTick)
```

Returns the "synthetic" tick which represents the price of the first entry in `tokens` in terms of the last

Useful for calculating relative prices along routes.


Parameters:

| Name   | Type      | Description                                                        |
| :----- | :-------- | :----------------------------------------------------------------- |
| tokens | address[] | The token contract addresses                                       |
| ticks  | int24[]   | The ticks, representing the price of each token pair in `tokens`   |


Return values:

| Name          | Type   | Description                                                                             |
| :------------ | :----- | :-------------------------------------------------------------------------------------- |
| syntheticTick | int256 | The synthetic tick, representing the relative price of the outermost tokens in `tokens` |
