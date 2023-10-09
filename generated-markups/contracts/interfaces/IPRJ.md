# IPRJ

## Interface Description


License: MIT

## 

```solidity
interface IPRJ
```


## Functions info

### name (0x06fdde03)

```solidity
function name() external view returns (string memory)
```

Returns the name of the token.
### symbol (0x95d89b41)

```solidity
function symbol() external view returns (string memory)
```

Returns the symbol of the token, usually a shorter version of the
name.
### decimals (0x313ce567)

```solidity
function decimals() external view returns (uint8)
```

Returns the number of decimals used to get its user representation.
For example, if `decimals` equals `2`, a balance of `505` tokens should
be displayed to a user as `5,05` (`505 / 10 ** 2`).

Tokens usually opt for a value of 18, imitating the relationship between
Ether and Wei. This is the value {ERC20} uses, unless this function is
overridden;

NOTE: This information is only used for _display_ purposes: it in
no way affects any of the arithmetic of the contract, including
{IERC20-balanceOf} and {IERC20-transfer}.
### totalSupply (0x18160ddd)

```solidity
function totalSupply() external view returns (uint256)
```

Returns the amount of tokens in existence.
### balanceOf (0x70a08231)

```solidity
function balanceOf(address account) external view returns (uint256)
```

Returns the amount of tokens owned by `account`.
### transfer (0xa9059cbb)

```solidity
function transfer(address recipient, uint256 amount) external returns (bool)
```

Moves `amount` tokens from the caller's account to `recipient`.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event.
### allowance (0xdd62ed3e)

```solidity
function allowance(
    address owner,
    address spender
) external view returns (uint256)
```

Returns the remaining number of tokens that `spender` will be
allowed to spend on behalf of `owner` through {transferFrom}. This is
zero by default.

This value changes when {approve} or {transferFrom} are called.
### approve (0x095ea7b3)

```solidity
function approve(address spender, uint256 amount) external returns (bool)
```

Sets `amount` as the allowance of `spender` over the caller's tokens.

Returns a boolean value indicating whether the operation succeeded.

IMPORTANT: Beware that changing an allowance with this method brings the risk
that someone may use both the old and the new allowance by unfortunate
transaction ordering. One possible solution to mitigate this race
condition is to first reduce the spender's allowance to 0 and set the
desired value afterwards:
https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729

Emits an {Approval} event.
### transferFrom (0x23b872dd)

```solidity
function transferFrom(
    address sender,
    address recipient,
    uint256 amount
) external returns (bool)
```

Moves `amount` tokens from `sender` to `recipient` using the
allowance mechanism. `amount` is then deducted from the caller's
allowance.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event.
### mint (0xa0712d68)

```solidity
function mint(uint256 amount) external
```

mints Project tokens to msg.sender


Parameters:

| Name   | Type    | Description                            |
| :----- | :------ | :------------------------------------- |
| amount | uint256 | - the amount of project tokens to mint |

### mintTo (0x449a52f8)

```solidity
function mintTo(address to, uint256 amount) external
```

mints Project tokens to `to`


Parameters:

| Name   | Type    | Description                                        |
| :----- | :------ | :------------------------------------------------- |
| to     | address | - address of user that receive the Project Token   |
| amount | uint256 | - the amount of project tokens to mint             |
