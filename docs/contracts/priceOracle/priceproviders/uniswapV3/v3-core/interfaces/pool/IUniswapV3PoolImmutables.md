# IUniswapV3PoolImmutables

## Overview

#### License: GPL-2.0-or-later

```solidity
interface IUniswapV3PoolImmutables
```

These parameters are fixed for a pool forever, i.e., the methods will always return the same values
## Functions info

### factory (0xc45a0155)

```solidity
function factory() external view returns (address)
```

The contract that deployed the pool, which must adhere to the IUniswapV3Factory interface


Return values:

| Name | Type    | Description          |
| :--- | :------ | :------------------- |
| [0]  | address | The contract address |

### token0 (0x0dfe1681)

```solidity
function token0() external view returns (address)
```

The first of the two tokens of the pool, sorted by address


Return values:

| Name | Type    | Description                |
| :--- | :------ | :------------------------- |
| [0]  | address | The token contract address |

### token1 (0xd21220a7)

```solidity
function token1() external view returns (address)
```

The second of the two tokens of the pool, sorted by address


Return values:

| Name | Type    | Description                |
| :--- | :------ | :------------------------- |
| [0]  | address | The token contract address |

### fee (0xddca3f43)

```solidity
function fee() external view returns (uint24)
```

The pool's fee in hundredths of a bip, i.e. 1e-6


Return values:

| Name | Type   | Description |
| :--- | :----- | :---------- |
| [0]  | uint24 | The fee     |

### tickSpacing (0xd0c93a7c)

```solidity
function tickSpacing() external view returns (int24)
```

The pool tick spacing

Ticks can only be used at multiples of this value, minimum of 1 and always positive
e.g.: a tickSpacing of 3 means ticks can be initialized every 3rd tick, i.e., ..., -6, -3, 0, 3, 6, ...
This value is an int24 to avoid casting even though it is always positive.


Return values:

| Name | Type  | Description      |
| :--- | :---- | :--------------- |
| [0]  | int24 | The tick spacing |

### maxLiquidityPerTick (0x70cf754a)

```solidity
function maxLiquidityPerTick() external view returns (uint128)
```

The maximum amount of position liquidity that can use any tick in the range

This parameter is enforced per tick to prevent liquidity from overflowing a uint128 at any point, and
also prevents out-of-range liquidity from being used to prevent adding in-range liquidity to a pool


Return values:

| Name | Type    | Description                          |
| :--- | :------ | :----------------------------------- |
| [0]  | uint128 | The max amount of liquidity per tick |
