# Solidity API

## EIP712

_https://eips.ethereum.org/EIPS/eip-712[EIP 712] is a standard for hashing and signing of typed structured data.

The encoding specified in the EIP is very generic, and such a generic implementation in Solidity is not feasible,
thus this contract does not implement the encoding itself. Protocols need to implement the type-specific encoding
they need in their contracts using a combination of &#x60;abi.encode&#x60; and &#x60;keccak256&#x60;.

This contract implements the EIP 712 domain separator ({_domainSeparatorV4}) that is used as part of the encoding
scheme, and the final step of the encoding to obtain the message digest that is then signed via ECDSA
({_hashTypedDataV4}).

The implementation of the domain separator was designed to be as efficient as possible while still properly updating
the chain id to protect against replay attacks on an eventual fork of the chain.

NOTE: This contract implements the version of the encoding known as &quot;v4&quot;, as implemented by the JSON RPC method
https://docs.metamask.io/guide/signing-data.html[&#x60;eth_signTypedDataV4&#x60; in MetaMask].

_Available since v3.4.__

### _CACHED_DOMAIN_SEPARATOR

```solidity
bytes32 _CACHED_DOMAIN_SEPARATOR
```

### _CACHED_CHAIN_ID

```solidity
uint256 _CACHED_CHAIN_ID
```

### _HASHED_NAME

```solidity
bytes32 _HASHED_NAME
```

### _HASHED_VERSION

```solidity
bytes32 _HASHED_VERSION
```

### _TYPE_HASH

```solidity
bytes32 _TYPE_HASH
```

### constructor

```solidity
constructor(string name, string version) internal
```

_Initializes the domain separator and parameter caches.

The meaning of &#x60;name&#x60; and &#x60;version&#x60; is specified in
https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator[EIP 712]:

- &#x60;name&#x60;: the user readable name of the signing domain, i.e. the name of the DApp or the protocol.
- &#x60;version&#x60;: the current major version of the signing domain.

NOTE: These parameters cannot be changed except through a xref:learn::upgrading-smart-contracts.adoc[smart
contract upgrade]._

### _domainSeparatorV4

```solidity
function _domainSeparatorV4() internal view returns (bytes32)
```

_Returns the domain separator for the current chain._

### _buildDomainSeparator

```solidity
function _buildDomainSeparator(bytes32 typeHash, bytes32 nameHash, bytes32 versionHash) private view returns (bytes32)
```

### _hashTypedDataV4

```solidity
function _hashTypedDataV4(bytes32 structHash) internal view virtual returns (bytes32)
```

_Given an already https://eips.ethereum.org/EIPS/eip-712#definition-of-hashstruct[hashed struct], this
function returns the hash of the fully encoded EIP712 message for this domain.

This hash can be used together with {ECDSA-recover} to obtain the signer of a message. For example:

&#x60;&#x60;&#x60;solidity
bytes32 digest &#x3D; _hashTypedDataV4(keccak256(abi.encode(
    keccak256(&quot;Mail(address to,string contents)&quot;),
    mailTo,
    keccak256(bytes(mailContents))
)));
address signer &#x3D; ECDSA.recover(digest, signature);
&#x60;&#x60;&#x60;_

