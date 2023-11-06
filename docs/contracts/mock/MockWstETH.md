# MockWstETH

## Overview

#### License: MIT

## 

```solidity
contract MockWstETH is ERC20
```


## Functions info

### constructor

```solidity
constructor(
    string memory name,
    string memory symbol,
    uint8 decimals_
) ERC20(name, symbol)
```


### mint (0x40c10f19)

```solidity
function mint(address account, uint256 amount) public
```


### decimals (0x313ce567)

```solidity
function decimals() public view override returns (uint8)
```

Returns the number of decimals used to get its user representation.
For example, if `decimals` equals `2`, a balance of `505` tokens should
be displayed to a user as `5.05` (`505 / 10 ** 2`).

Tokens usually opt for a value of 18, imitating the relationship between
Ether and Wei. This is the default value returned by this function, unless
it's overridden.

NOTE: This information is only used for _display_ purposes: it in
no way affects any of the arithmetic of the contract, including
{IERC20-balanceOf} and {IERC20-transfer}.
### setStETHPerToken (0x3def00f2)

```solidity
function setStETHPerToken(uint256 newValue) external
```


### stEthPerToken (0x035faf82)

```solidity
function stEthPerToken() external view returns (uint256)
```

