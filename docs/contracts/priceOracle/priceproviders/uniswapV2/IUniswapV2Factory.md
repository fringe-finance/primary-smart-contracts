# IUniswapV2Factory

## Overview

#### License: MIT

## 

```solidity
interface IUniswapV2Factory
```


## Events info

### PairCreated

```solidity
event PairCreated(address indexed token0, address indexed token1, address pair, uint256)
```


## Functions info

### feeTo (0x017e7e58)

```solidity
function feeTo() external view returns (address)
```


### feeToSetter (0x094b7415)

```solidity
function feeToSetter() external view returns (address)
```


### getPair (0xe6a43905)

```solidity
function getPair(
    address tokenA,
    address tokenB
) external view returns (address pair)
```


### allPairs (0x1e3dd18b)

```solidity
function allPairs(uint256) external view returns (address pair)
```


### allPairsLength (0x574f2ba3)

```solidity
function allPairsLength() external view returns (uint256)
```


### createPair (0xc9c65396)

```solidity
function createPair(
    address tokenA,
    address tokenB
) external returns (address pair)
```


### setFeeTo (0xf46901ed)

```solidity
function setFeeTo(address) external
```


### setFeeToSetter (0xa2e74af6)

```solidity
function setFeeToSetter(address) external
```

