# Solidity API

## ERC1820Implementer

_Implementation of the {IERC1820Implementer} interface.

Contracts may inherit from this and call {_registerInterfaceForAddress} to
declare their willingness to be implementers.
{IERC1820Registry-setInterfaceImplementer} should then be called for the
registration to be complete._

### _ERC1820_ACCEPT_MAGIC

```solidity
bytes32 _ERC1820_ACCEPT_MAGIC
```

### _supportedInterfaces

```solidity
mapping(bytes32 &#x3D;&gt; mapping(address &#x3D;&gt; bool)) _supportedInterfaces
```

### canImplementInterfaceForAddress

```solidity
function canImplementInterfaceForAddress(bytes32 interfaceHash, address account) public view virtual returns (bytes32)
```

_See {IERC1820Implementer-canImplementInterfaceForAddress}._

### _registerInterfaceForAddress

```solidity
function _registerInterfaceForAddress(bytes32 interfaceHash, address account) internal virtual
```

_Declares the contract as willing to be an implementer of
&#x60;interfaceHash&#x60; for &#x60;account&#x60;.

See {IERC1820Registry-setInterfaceImplementer} and
{IERC1820Registry-interfaceHash}._

