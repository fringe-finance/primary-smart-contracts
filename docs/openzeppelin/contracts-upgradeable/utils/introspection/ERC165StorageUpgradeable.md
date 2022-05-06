# Solidity API

## ERC165StorageUpgradeable

_Storage based implementation of the {IERC165} interface.

Contracts may inherit from this and call {_registerInterface} to declare
their support of an interface._

### __ERC165Storage_init

```solidity
function __ERC165Storage_init() internal
```

### __ERC165Storage_init_unchained

```solidity
function __ERC165Storage_init_unchained() internal
```

### _supportedInterfaces

```solidity
mapping(bytes4 &#x3D;&gt; bool) _supportedInterfaces
```

_Mapping of interface ids to whether or not it&#x27;s supported._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### _registerInterface

```solidity
function _registerInterface(bytes4 interfaceId) internal virtual
```

_Registers the contract as an implementer of the interface defined by
&#x60;interfaceId&#x60;. Support of the actual ERC165 interface is automatic and
registering its interface id is not required.

See {IERC165-supportsInterface}.

Requirements:

- &#x60;interfaceId&#x60; cannot be the ERC165 invalid interface (&#x60;0xffffffff&#x60;)._

### __gap

```solidity
uint256[49] __gap
```

