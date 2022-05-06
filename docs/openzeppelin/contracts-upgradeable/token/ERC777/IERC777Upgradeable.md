# Solidity API

## IERC777Upgradeable

_Interface of the ERC777Token standard as defined in the EIP.

This contract uses the
https://eips.ethereum.org/EIPS/eip-1820[ERC1820 registry standard] to let
token holders and recipients react to token movements by using setting implementers
for the associated interfaces in said registry. See {IERC1820Registry} and
{ERC1820Implementer}._

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

### granularity

```solidity
function granularity() external view returns (uint256)
```

_Returns the smallest part of the token that is not divisible. This
means all token operations (creation, movement and destruction) must have
amounts that are a multiple of this number.

For most token contracts, this value will equal 1._

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

_Returns the amount of tokens in existence._

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256)
```

_Returns the amount of tokens owned by an account (&#x60;owner&#x60;)._

### send

```solidity
function send(address recipient, uint256 amount, bytes data) external
```

_Moves &#x60;amount&#x60; tokens from the caller&#x27;s account to &#x60;recipient&#x60;.

If send or receive hooks are registered for the caller and &#x60;recipient&#x60;,
the corresponding functions will be called with &#x60;data&#x60; and empty
&#x60;operatorData&#x60;. See {IERC777Sender} and {IERC777Recipient}.

Emits a {Sent} event.

Requirements

- the caller must have at least &#x60;amount&#x60; tokens.
- &#x60;recipient&#x60; cannot be the zero address.
- if &#x60;recipient&#x60; is a contract, it must implement the {IERC777Recipient}
interface._

### burn

```solidity
function burn(uint256 amount, bytes data) external
```

_Destroys &#x60;amount&#x60; tokens from the caller&#x27;s account, reducing the
total supply.

If a send hook is registered for the caller, the corresponding function
will be called with &#x60;data&#x60; and empty &#x60;operatorData&#x60;. See {IERC777Sender}.

Emits a {Burned} event.

Requirements

- the caller must have at least &#x60;amount&#x60; tokens._

### isOperatorFor

```solidity
function isOperatorFor(address operator, address tokenHolder) external view returns (bool)
```

_Returns true if an account is an operator of &#x60;tokenHolder&#x60;.
Operators can send and burn tokens on behalf of their owners. All
accounts are their own operator.

See {operatorSend} and {operatorBurn}._

### authorizeOperator

```solidity
function authorizeOperator(address operator) external
```

_Make an account an operator of the caller.

See {isOperatorFor}.

Emits an {AuthorizedOperator} event.

Requirements

- &#x60;operator&#x60; cannot be calling address._

### revokeOperator

```solidity
function revokeOperator(address operator) external
```

_Revoke an account&#x27;s operator status for the caller.

See {isOperatorFor} and {defaultOperators}.

Emits a {RevokedOperator} event.

Requirements

- &#x60;operator&#x60; cannot be calling address._

### defaultOperators

```solidity
function defaultOperators() external view returns (address[])
```

_Returns the list of default operators. These accounts are operators
for all token holders, even if {authorizeOperator} was never called on
them.

This list is immutable, but individual holders may revoke these via
{revokeOperator}, in which case {isOperatorFor} will return false._

### operatorSend

```solidity
function operatorSend(address sender, address recipient, uint256 amount, bytes data, bytes operatorData) external
```

_Moves &#x60;amount&#x60; tokens from &#x60;sender&#x60; to &#x60;recipient&#x60;. The caller must
be an operator of &#x60;sender&#x60;.

If send or receive hooks are registered for &#x60;sender&#x60; and &#x60;recipient&#x60;,
the corresponding functions will be called with &#x60;data&#x60; and
&#x60;operatorData&#x60;. See {IERC777Sender} and {IERC777Recipient}.

Emits a {Sent} event.

Requirements

- &#x60;sender&#x60; cannot be the zero address.
- &#x60;sender&#x60; must have at least &#x60;amount&#x60; tokens.
- the caller must be an operator for &#x60;sender&#x60;.
- &#x60;recipient&#x60; cannot be the zero address.
- if &#x60;recipient&#x60; is a contract, it must implement the {IERC777Recipient}
interface._

### operatorBurn

```solidity
function operatorBurn(address account, uint256 amount, bytes data, bytes operatorData) external
```

_Destroys &#x60;amount&#x60; tokens from &#x60;account&#x60;, reducing the total supply.
The caller must be an operator of &#x60;account&#x60;.

If a send hook is registered for &#x60;account&#x60;, the corresponding function
will be called with &#x60;data&#x60; and &#x60;operatorData&#x60;. See {IERC777Sender}.

Emits a {Burned} event.

Requirements

- &#x60;account&#x60; cannot be the zero address.
- &#x60;account&#x60; must have at least &#x60;amount&#x60; tokens.
- the caller must be an operator for &#x60;account&#x60;._

### Sent

```solidity
event Sent(address operator, address from, address to, uint256 amount, bytes data, bytes operatorData)
```

### Minted

```solidity
event Minted(address operator, address to, uint256 amount, bytes data, bytes operatorData)
```

### Burned

```solidity
event Burned(address operator, address from, uint256 amount, bytes data, bytes operatorData)
```

### AuthorizedOperator

```solidity
event AuthorizedOperator(address operator, address tokenHolder)
```

### RevokedOperator

```solidity
event RevokedOperator(address operator, address tokenHolder)
```

