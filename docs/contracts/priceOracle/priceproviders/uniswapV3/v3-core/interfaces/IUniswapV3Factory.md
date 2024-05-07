# IUniswapV3Factory

## Overview

#### License: GPL-2.0-or-later

```solidity
interface IUniswapV3Factory
```

The Uniswap V3 Factory facilitates creation of Uniswap V3 pools and control over the protocol fees
## Events info

### OwnerChanged

```solidity
event OwnerChanged(address indexed oldOwner, address indexed newOwner)
```

Emitted when the owner of the factory is changed


Parameters:

| Name     | Type    | Description                              |
| :------- | :------ | :--------------------------------------- |
| oldOwner | address | The owner before the owner was changed   |
| newOwner | address | The owner after the owner was changed    |

### PoolCreated

```solidity
event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)
```

Emitted when a pool is created


Parameters:

| Name        | Type    | Description                                                                         |
| :---------- | :------ | :---------------------------------------------------------------------------------- |
| token0      | address | The first token of the pool by address sort order                                   |
| token1      | address | The second token of the pool by address sort order                                  |
| fee         | uint24  | The fee collected upon every swap in the pool, denominated in hundredths of a bip   |
| tickSpacing | int24   | The minimum number of ticks between initialized ticks                               |
| pool        | address | The address of the created pool                                                     |

### FeeAmountEnabled

```solidity
event FeeAmountEnabled(uint24 indexed fee, int24 indexed tickSpacing)
```

Emitted when a new fee amount is enabled for pool creation via the factory


Parameters:

| Name        | Type   | Description                                                                                |
| :---------- | :----- | :----------------------------------------------------------------------------------------- |
| fee         | uint24 | The enabled fee, denominated in hundredths of a bip                                        |
| tickSpacing | int24  | The minimum number of ticks between initialized ticks for pools created with the given fee |

## Functions info

### owner (0x8da5cb5b)

```solidity
function owner() external view returns (address)
```

Returns the current owner of the factory

Can be changed by the current owner via setOwner


Return values:

| Name | Type    | Description                      |
| :--- | :------ | :------------------------------- |
| [0]  | address | The address of the factory owner |

### feeAmountTickSpacing (0x22afcccb)

```solidity
function feeAmountTickSpacing(uint24 fee) external view returns (int24)
```

Returns the tick spacing for a given fee amount, if enabled, or 0 if not enabled

A fee amount can never be removed, so this value should be hard coded or cached in the calling context


Parameters:

| Name | Type   | Description                                                                               |
| :--- | :----- | :---------------------------------------------------------------------------------------- |
| fee  | uint24 | The enabled fee, denominated in hundredths of a bip. Returns 0 in case of unenabled fee   |


Return values:

| Name | Type  | Description      |
| :--- | :---- | :--------------- |
| [0]  | int24 | The tick spacing |

### getPool (0x1698ee82)

```solidity
function getPool(
    address tokenA,
    address tokenB,
    uint24 fee
) external view returns (address pool)
```

Returns the pool address for a given pair of tokens and a fee, or address 0 if it does not exist

tokenA and tokenB may be passed in either token0/token1 or token1/token0 order


Parameters:

| Name   | Type    | Description                                                                         |
| :----- | :------ | :---------------------------------------------------------------------------------- |
| tokenA | address | The contract address of either token0 or token1                                     |
| tokenB | address | The contract address of the other token                                             |
| fee    | uint24  | The fee collected upon every swap in the pool, denominated in hundredths of a bip   |


Return values:

| Name | Type    | Description      |
| :--- | :------ | :--------------- |
| pool | address | The pool address |

### createPool (0xa1671295)

```solidity
function createPool(
    address tokenA,
    address tokenB,
    uint24 fee
) external returns (address pool)
```

Creates a pool for the given two tokens and fee

tokenA and tokenB may be passed in either order: token0/token1 or token1/token0. tickSpacing is retrieved
from the fee. The call will revert if the pool already exists, the fee is invalid, or the token arguments
are invalid.


Parameters:

| Name   | Type    | Description                                       |
| :----- | :------ | :------------------------------------------------ |
| tokenA | address | One of the two tokens in the desired pool         |
| tokenB | address | The other of the two tokens in the desired pool   |
| fee    | uint24  | The desired fee for the pool                      |


Return values:

| Name | Type    | Description                           |
| :--- | :------ | :------------------------------------ |
| pool | address | The address of the newly created pool |

### setOwner (0x13af4035)

```solidity
function setOwner(address _owner) external
```

Updates the owner of the factory

Must be called by the current owner


Parameters:

| Name   | Type    | Description                  |
| :----- | :------ | :--------------------------- |
| _owner | address | The new owner of the factory |

### enableFeeAmount (0x8a7c195f)

```solidity
function enableFeeAmount(uint24 fee, int24 tickSpacing) external
```

Enables a fee amount with the given tickSpacing

Fee amounts may never be removed once enabled


Parameters:

| Name        | Type   | Description                                                                              |
| :---------- | :----- | :--------------------------------------------------------------------------------------- |
| fee         | uint24 | The fee amount to enable, denominated in hundredths of a bip (i.e. 1e-6)                 |
| tickSpacing | int24  | The spacing between ticks to be enforced for all pools created with the given fee amount |
