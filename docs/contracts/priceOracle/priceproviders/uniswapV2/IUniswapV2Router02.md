# IUniswapV2Router02

## Overview

#### License: MIT

## 

```solidity
interface IUniswapV2Router02
```


## Functions info

### factory (0xc45a0155)

```solidity
function factory() external pure returns (address)
```


### WETH (0xad5c4648)

```solidity
function WETH() external pure returns (address)
```


### addLiquidity (0xe8e33700)

```solidity
function addLiquidity(
    address tokenA,
    address tokenB,
    uint256 amountADesired,
    uint256 amountBDesired,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline
) external returns (uint256 amountA, uint256 amountB, uint256 liquidity)
```


### addLiquidityETH (0xf305d719)

```solidity
function addLiquidityETH(
    address token,
    uint256 amountTokenDesired,
    uint256 amountTokenMin,
    uint256 amountETHMin,
    address to,
    uint256 deadline
)
    external
    payable
    returns (uint256 amountToken, uint256 amountETH, uint256 liquidity)
```


### removeLiquidity (0xbaa2abde)

```solidity
function removeLiquidity(
    address tokenA,
    address tokenB,
    uint256 liquidity,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline
) external returns (uint256 amountA, uint256 amountB)
```


### removeLiquidityETH (0x02751cec)

```solidity
function removeLiquidityETH(
    address token,
    uint256 liquidity,
    uint256 amountTokenMin,
    uint256 amountETHMin,
    address to,
    uint256 deadline
) external returns (uint256 amountToken, uint256 amountETH)
```


### removeLiquidityWithPermit (0x2195995c)

```solidity
function removeLiquidityWithPermit(
    address tokenA,
    address tokenB,
    uint256 liquidity,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline,
    bool approveMax,
    uint8 v,
    bytes32 r,
    bytes32 s
) external returns (uint256 amountA, uint256 amountB)
```


### removeLiquidityETHWithPermit (0xded9382a)

```solidity
function removeLiquidityETHWithPermit(
    address token,
    uint256 liquidity,
    uint256 amountTokenMin,
    uint256 amountETHMin,
    address to,
    uint256 deadline,
    bool approveMax,
    uint8 v,
    bytes32 r,
    bytes32 s
) external returns (uint256 amountToken, uint256 amountETH)
```


### swapExactTokensForTokens (0x38ed1739)

```solidity
function swapExactTokensForTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
) external returns (uint256[] memory amounts)
```


### swapTokensForExactTokens (0x8803dbee)

```solidity
function swapTokensForExactTokens(
    uint256 amountOut,
    uint256 amountInMax,
    address[] calldata path,
    address to,
    uint256 deadline
) external returns (uint256[] memory amounts)
```


### swapExactETHForTokens (0x7ff36ab5)

```solidity
function swapExactETHForTokens(
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
) external payable returns (uint256[] memory amounts)
```


### swapTokensForExactETH (0x4a25d94a)

```solidity
function swapTokensForExactETH(
    uint256 amountOut,
    uint256 amountInMax,
    address[] calldata path,
    address to,
    uint256 deadline
) external returns (uint256[] memory amounts)
```


### swapExactTokensForETH (0x18cbafe5)

```solidity
function swapExactTokensForETH(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
) external returns (uint256[] memory amounts)
```


### swapETHForExactTokens (0xfb3bdb41)

```solidity
function swapETHForExactTokens(
    uint256 amountOut,
    address[] calldata path,
    address to,
    uint256 deadline
) external payable returns (uint256[] memory amounts)
```


### quote (0xad615dec)

```solidity
function quote(
    uint256 amountA,
    uint256 reserveA,
    uint256 reserveB
) external pure returns (uint256 amountB)
```


### getAmountOut (0x054d50d4)

```solidity
function getAmountOut(
    uint256 amountIn,
    uint256 reserveIn,
    uint256 reserveOut
) external pure returns (uint256 amountOut)
```


### getAmountIn (0x85f8c259)

```solidity
function getAmountIn(
    uint256 amountOut,
    uint256 reserveIn,
    uint256 reserveOut
) external pure returns (uint256 amountIn)
```


### getAmountsOut (0xd06ca61f)

```solidity
function getAmountsOut(
    uint256 amountIn,
    address[] calldata path
) external view returns (uint256[] memory amounts)
```


### getAmountsIn (0x1f00ca74)

```solidity
function getAmountsIn(
    uint256 amountOut,
    address[] calldata path
) external view returns (uint256[] memory amounts)
```


### removeLiquidityETHSupportingFeeOnTransferTokens (0xaf2979eb)

```solidity
function removeLiquidityETHSupportingFeeOnTransferTokens(
    address token,
    uint256 liquidity,
    uint256 amountTokenMin,
    uint256 amountETHMin,
    address to,
    uint256 deadline
) external returns (uint256 amountETH)
```


### removeLiquidityETHWithPermitSupportingFeeOnTransferTokens (0x5b0d5984)

```solidity
function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
    address token,
    uint256 liquidity,
    uint256 amountTokenMin,
    uint256 amountETHMin,
    address to,
    uint256 deadline,
    bool approveMax,
    uint8 v,
    bytes32 r,
    bytes32 s
) external returns (uint256 amountETH)
```


### swapExactTokensForTokensSupportingFeeOnTransferTokens (0x5c11d795)

```solidity
function swapExactTokensForTokensSupportingFeeOnTransferTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
) external
```


### swapExactETHForTokensSupportingFeeOnTransferTokens (0xb6f9de95)

```solidity
function swapExactETHForTokensSupportingFeeOnTransferTokens(
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
) external payable
```


### swapExactTokensForETHSupportingFeeOnTransferTokens (0x791ac947)

```solidity
function swapExactTokensForETHSupportingFeeOnTransferTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
) external
```

