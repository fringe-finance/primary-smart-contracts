# Solidity API

## ERC20PermitUpgradeable

_Implementation of the ERC20 Permit extension allowing approvals to be made via signatures, as defined in
https://eips.ethereum.org/EIPS/eip-2612[EIP-2612].

Adds the {permit} method, which can be used to change an account&#x27;s ERC20 allowance (see {IERC20-allowance}) by
presenting a message signed by the account. By not relying on &#x60;{IERC20-approve}&#x60;, the token holder account doesn&#x27;t
need to send a transaction, and thus is not required to hold Ether at all.

_Available since v3.4.__

### _nonces

```solidity
mapping(address &#x3D;&gt; struct CountersUpgradeable.Counter) _nonces
```

### _PERMIT_TYPEHASH

```solidity
bytes32 _PERMIT_TYPEHASH
```

### __ERC20Permit_init

```solidity
function __ERC20Permit_init(string name) internal
```

_Initializes the {EIP712} domain separator using the &#x60;name&#x60; parameter, and setting &#x60;version&#x60; to &#x60;&quot;1&quot;&#x60;.

It&#x27;s a good idea to use the same &#x60;name&#x60; that is defined as the ERC20 token name._

### __ERC20Permit_init_unchained

```solidity
function __ERC20Permit_init_unchained(string name) internal
```

### permit

```solidity
function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public virtual
```

_See {IERC20Permit-permit}._

### nonces

```solidity
function nonces(address owner) public view virtual returns (uint256)
```

_See {IERC20Permit-nonces}._

### DOMAIN_SEPARATOR

```solidity
function DOMAIN_SEPARATOR() external view returns (bytes32)
```

_See {IERC20Permit-DOMAIN_SEPARATOR}._

### _useNonce

```solidity
function _useNonce(address owner) internal virtual returns (uint256 current)
```

_&quot;Consume a nonce&quot;: return the current value and increment.

_Available since v4.1.__

### __gap

```solidity
uint256[49] __gap
```

