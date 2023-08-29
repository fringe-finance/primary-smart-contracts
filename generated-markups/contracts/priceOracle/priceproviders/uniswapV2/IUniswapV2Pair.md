# IUniswapV2Pair

## Interface Description


License: MIT

## 

```solidity
interface IUniswapV2Pair
```


## Events info

### Approval

```solidity
event Approval(address indexed owner, address indexed spender, uint256 value)
```


### Transfer

```solidity
event Transfer(address indexed from, address indexed to, uint256 value)
```


### Mint

```solidity
event Mint(address indexed sender, uint256 amount0, uint256 amount1)
```


### Burn

```solidity
event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)
```


### Swap

```solidity
event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)
```


### Sync

```solidity
event Sync(uint112 reserve0, uint112 reserve1)
```


## Functions info

### name (0x06fdde03)

```solidity
function name() external pure returns (string memory)
```


### symbol (0x95d89b41)

```solidity
function symbol() external pure returns (string memory)
```


### decimals (0x313ce567)

```solidity
function decimals() external pure returns (uint8)
```


### totalSupply (0x18160ddd)

```solidity
function totalSupply() external view returns (uint256)
```


### balanceOf (0x70a08231)

```solidity
function balanceOf(address owner) external view returns (uint256)
```


### allowance (0xdd62ed3e)

```solidity
function allowance(
    address owner,
    address spender
) external view returns (uint256)
```


### approve (0x095ea7b3)

```solidity
function approve(address spender, uint256 value) external returns (bool)
```


### transfer (0xa9059cbb)

```solidity
function transfer(address to, uint256 value) external returns (bool)
```


### transferFrom (0x23b872dd)

```solidity
function transferFrom(
    address from,
    address to,
    uint256 value
) external returns (bool)
```


### DOMAIN_SEPARATOR (0x3644e515)

```solidity
function DOMAIN_SEPARATOR() external view returns (bytes32)
```


### PERMIT_TYPEHASH (0x30adf81f)

```solidity
function PERMIT_TYPEHASH() external pure returns (bytes32)
```


### nonces (0x7ecebe00)

```solidity
function nonces(address owner) external view returns (uint256)
```


### permit (0xd505accf)

```solidity
function permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
) external
```


### MINIMUM_LIQUIDITY (0xba9a7a56)

```solidity
function MINIMUM_LIQUIDITY() external pure returns (uint256)
```


### factory (0xc45a0155)

```solidity
function factory() external view returns (address)
```


### token0 (0x0dfe1681)

```solidity
function token0() external view returns (address)
```


### token1 (0xd21220a7)

```solidity
function token1() external view returns (address)
```


### getReserves (0x0902f1ac)

```solidity
function getReserves()
    external
    view
    returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)
```


### price0CumulativeLast (0x5909c0d5)

```solidity
function price0CumulativeLast() external view returns (uint256)
```


### price1CumulativeLast (0x5a3d5493)

```solidity
function price1CumulativeLast() external view returns (uint256)
```


### kLast (0x7464fc3d)

```solidity
function kLast() external view returns (uint256)
```


### mint (0x6a627842)

```solidity
function mint(address to) external returns (uint256 liquidity)
```


### burn (0x89afcb44)

```solidity
function burn(address to) external returns (uint256 amount0, uint256 amount1)
```


### swap (0x022c0d9f)

```solidity
function swap(
    uint256 amount0Out,
    uint256 amount1Out,
    address to,
    bytes calldata data
) external
```


### skim (0xbc25cf77)

```solidity
function skim(address to) external
```


### sync (0xfff6cae9)

```solidity
function sync() external
```


### initialize (0x485cc955)

```solidity
function initialize(address, address) external
```

