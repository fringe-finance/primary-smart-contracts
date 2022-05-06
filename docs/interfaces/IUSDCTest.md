# Solidity API

## IUSDCTest

### name

```solidity
function name() external view returns (string)
```

_Returns the name of the token._

### symbol

```solidity
function symbol() external view returns (string)
```

_Returns the symbol of the token, usually a shorter version of the
name._

### decimals

```solidity
function decimals() external view returns (uint8)
```

_Returns the number of decimals used to get its user representation.
For example, if &#x60;decimals&#x60; equals &#x60;2&#x60;, a balance of &#x60;505&#x60; tokens should
be displayed to a user as &#x60;5,05&#x60; (&#x60;505 / 10 ** 2&#x60;).

Tokens usually opt for a value of 18, imitating the relationship between
Ether and Wei. This is the value {ERC20} uses, unless this function is
overridden;

NOTE: This information is only used for _display_ purposes: it in
no way affects any of the arithmetic of the contract, including
{IERC20-balanceOf} and {IERC20-transfer}._

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

_Returns the amount of tokens in existence._

### balanceOf

```solidity
function balanceOf(address account) external view returns (uint256)
```

_Returns the amount of tokens owned by &#x60;account&#x60;._

### transfer

```solidity
function transfer(address recipient, uint256 amount) external returns (bool)
```

_Moves &#x60;amount&#x60; tokens from the caller&#x27;s account to &#x60;recipient&#x60;.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event._

### allowance

```solidity
function allowance(address owner, address spender) external view returns (uint256)
```

_Returns the remaining number of tokens that &#x60;spender&#x60; will be
allowed to spend on behalf of &#x60;owner&#x60; through {transferFrom}. This is
zero by default.

This value changes when {approve} or {transferFrom} are called._

### approve

```solidity
function approve(address spender, uint256 amount) external returns (bool)
```

_Sets &#x60;amount&#x60; as the allowance of &#x60;spender&#x60; over the caller&#x27;s tokens.

Returns a boolean value indicating whether the operation succeeded.

IMPORTANT: Beware that changing an allowance with this method brings the risk
that someone may use both the old and the new allowance by unfortunate
transaction ordering. One possible solution to mitigate this race
condition is to first reduce the spender&#x27;s allowance to 0 and set the
desired value afterwards:
https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729

Emits an {Approval} event._

### transferFrom

```solidity
function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)
```

_Moves &#x60;amount&#x60; tokens from &#x60;sender&#x60; to &#x60;recipient&#x60; using the
allowance mechanism. &#x60;amount&#x60; is then deducted from the caller&#x27;s
allowance.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event._

### mint

```solidity
function mint(uint256 amount) external
```

_mints Project tokens to msg.sender_

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | - the amount of project tokens to mint |

### mintTo

```solidity
function mintTo(address to, uint256 amount) external
```

_mints Project tokens to &#x60;to&#x60;_

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | - address of user that receive the Project Token |
| amount | uint256 | - the amount of project tokens to mint |

