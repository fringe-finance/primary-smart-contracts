# Solidity API

## ECDSA

_Elliptic Curve Digital Signature Algorithm (ECDSA) operations.

These functions can be used to verify that a message was signed by the holder
of the private keys of a given address._

### RecoverError

```solidity
enum RecoverError {
  NoError,
  InvalidSignature,
  InvalidSignatureLength,
  InvalidSignatureS,
  InvalidSignatureV
}
```

### _throwError

```solidity
function _throwError(enum ECDSA.RecoverError error) private pure
```

### tryRecover

```solidity
function tryRecover(bytes32 hash, bytes signature) internal pure returns (address, enum ECDSA.RecoverError)
```

_Returns the address that signed a hashed message (&#x60;hash&#x60;) with
&#x60;signature&#x60; or error string. This address can then be used for verification purposes.

The &#x60;ecrecover&#x60; EVM opcode allows for malleable (non-unique) signatures:
this function rejects them by requiring the &#x60;s&#x60; value to be in the lower
half order, and the &#x60;v&#x60; value to be either 27 or 28.

IMPORTANT: &#x60;hash&#x60; _must_ be the result of a hash operation for the
verification to be secure: it is possible to craft signatures that
recover to arbitrary addresses for non-hashed data. A safe way to ensure
this is by receiving a hash of the original message (which may otherwise
be too long), and then calling {toEthSignedMessageHash} on it.

Documentation for signature generation:
- with https://web3js.readthedocs.io/en/v1.3.4/web3-eth-accounts.html#sign[Web3.js]
- with https://docs.ethers.io/v5/api/signer/#Signer-signMessage[ethers]

_Available since v4.3.__

### recover

```solidity
function recover(bytes32 hash, bytes signature) internal pure returns (address)
```

_Returns the address that signed a hashed message (&#x60;hash&#x60;) with
&#x60;signature&#x60;. This address can then be used for verification purposes.

The &#x60;ecrecover&#x60; EVM opcode allows for malleable (non-unique) signatures:
this function rejects them by requiring the &#x60;s&#x60; value to be in the lower
half order, and the &#x60;v&#x60; value to be either 27 or 28.

IMPORTANT: &#x60;hash&#x60; _must_ be the result of a hash operation for the
verification to be secure: it is possible to craft signatures that
recover to arbitrary addresses for non-hashed data. A safe way to ensure
this is by receiving a hash of the original message (which may otherwise
be too long), and then calling {toEthSignedMessageHash} on it._

### tryRecover

```solidity
function tryRecover(bytes32 hash, bytes32 r, bytes32 vs) internal pure returns (address, enum ECDSA.RecoverError)
```

_Overload of {ECDSA-tryRecover} that receives the &#x60;r&#x60; and &#x60;vs&#x60; short-signature fields separately.

See https://eips.ethereum.org/EIPS/eip-2098[EIP-2098 short signatures]

_Available since v4.3.__

### recover

```solidity
function recover(bytes32 hash, bytes32 r, bytes32 vs) internal pure returns (address)
```

_Overload of {ECDSA-recover} that receives the &#x60;r and &#x60;vs&#x60; short-signature fields separately.

_Available since v4.2.__

### tryRecover

```solidity
function tryRecover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) internal pure returns (address, enum ECDSA.RecoverError)
```

_Overload of {ECDSA-tryRecover} that receives the &#x60;v&#x60;,
&#x60;r&#x60; and &#x60;s&#x60; signature fields separately.

_Available since v4.3.__

### recover

```solidity
function recover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) internal pure returns (address)
```

_Overload of {ECDSA-recover} that receives the &#x60;v&#x60;,
&#x60;r&#x60; and &#x60;s&#x60; signature fields separately.
/_

### toEthSignedMessageHash

```solidity
function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32)
```

_Returns an Ethereum Signed Message, created from a &#x60;hash&#x60;. This
produces hash corresponding to the one signed with the
https://eth.wiki/json-rpc/API#eth_sign[&#x60;eth_sign&#x60;]
JSON-RPC method as part of EIP-191.

See {recover}.
/_

### toTypedDataHash

```solidity
function toTypedDataHash(bytes32 domainSeparator, bytes32 structHash) internal pure returns (bytes32)
```

_Returns an Ethereum Signed Typed Data, created from a
&#x60;domainSeparator&#x60; and a &#x60;structHash&#x60;. This produces hash corresponding
to the one signed with the
https://eips.ethereum.org/EIPS/eip-712[&#x60;eth_signTypedData&#x60;]
JSON-RPC method as part of EIP-712.

See {recover}.
/_

