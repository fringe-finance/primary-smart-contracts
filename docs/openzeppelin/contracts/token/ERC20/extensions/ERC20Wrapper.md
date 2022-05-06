# Solidity API

## ERC20Wrapper

_Extension of the ERC20 token contract to support token wrapping.

Users can deposit and withdraw &quot;underlying tokens&quot; and receive a matching number of &quot;wrapped tokens&quot;. This is useful
in conjunction with other modules. For example, combining this wrapping mechanism with {ERC20Votes} will allow the
wrapping of an existing &quot;basic&quot; ERC20 into a governance token.

_Available since v4.2.__

### underlying

```solidity
contract IERC20 underlying
```

### constructor

```solidity
constructor(contract IERC20 underlyingToken) internal
```

### depositFor

```solidity
function depositFor(address account, uint256 amount) public virtual returns (bool)
```

_Allow a user to deposit underlying tokens and mint the corresponding number of wrapped tokens._

### withdrawTo

```solidity
function withdrawTo(address account, uint256 amount) public virtual returns (bool)
```

_Allow a user to burn a number of wrapped tokens and withdraw the corresponding number of underlying tokens._

### _recover

```solidity
function _recover(address account) internal virtual returns (uint256)
```

_Mint wrapped token to cover any underlyingTokens that would have been transfered by mistake. Internal
function that can be exposed with access control if desired._

