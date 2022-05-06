# Solidity API

## IERC20PermitUpgradeable

_Interface of the ERC20 Permit extension allowing approvals to be made via signatures, as defined in
https://eips.ethereum.org/EIPS/eip-2612[EIP-2612].

Adds the {permit} method, which can be used to change an account&#x27;s ERC20 allowance (see {IERC20-allowance}) by
presenting a message signed by the account. By not relying on {IERC20-approve}, the token holder account doesn&#x27;t
need to send a transaction, and thus is not required to hold Ether at all._

### permit

```solidity
function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external
```

_Sets &#x60;value&#x60; as the allowance of &#x60;spender&#x60; over &#x60;&#x60;owner&#x60;&#x60;&#x27;s tokens,
given &#x60;&#x60;owner&#x60;&#x60;&#x27;s signed approval.

IMPORTANT: The same issues {IERC20-approve} has related to transaction
ordering also apply here.

Emits an {Approval} event.

Requirements:

- &#x60;spender&#x60; cannot be the zero address.
- &#x60;deadline&#x60; must be a timestamp in the future.
- &#x60;v&#x60;, &#x60;r&#x60; and &#x60;s&#x60; must be a valid &#x60;secp256k1&#x60; signature from &#x60;owner&#x60;
over the EIP712-formatted function arguments.
- the signature must use &#x60;&#x60;owner&#x60;&#x60;&#x27;s current nonce (see {nonces}).

For more information on the signature format, see the
https://eips.ethereum.org/EIPS/eip-2612#specification[relevant EIP
section]._

### nonces

```solidity
function nonces(address owner) external view returns (uint256)
```

_Returns the current nonce for &#x60;owner&#x60;. This value must be
included whenever a signature is generated for {permit}.

Every successful call to {permit} increases &#x60;&#x60;owner&#x60;&#x60;&#x27;s nonce by one. This
prevents a signature from being used multiple times._

### DOMAIN_SEPARATOR

```solidity
function DOMAIN_SEPARATOR() external view returns (bytes32)
```

_Returns the domain separator used in the encoding of the signature for {permit}, as defined by {EIP712}._

