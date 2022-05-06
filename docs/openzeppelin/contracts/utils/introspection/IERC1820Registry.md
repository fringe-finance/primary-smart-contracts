# Solidity API

## IERC1820Registry

_Interface of the global ERC1820 Registry, as defined in the
https://eips.ethereum.org/EIPS/eip-1820[EIP]. Accounts may register
implementers for interfaces in this registry, as well as query support.

Implementers may be shared by multiple accounts, and can also implement more
than a single interface for each account. Contracts can implement interfaces
for themselves, but externally-owned accounts (EOA) must delegate this to a
contract.

{IERC165} interfaces can also be queried via the registry.

For an in-depth explanation and source code analysis, see the EIP text._

### setManager

```solidity
function setManager(address account, address newManager) external
```

_Sets &#x60;newManager&#x60; as the manager for &#x60;account&#x60;. A manager of an
account is able to set interface implementers for it.

By default, each account is its own manager. Passing a value of &#x60;0x0&#x60; in
&#x60;newManager&#x60; will reset the manager to this initial state.

Emits a {ManagerChanged} event.

Requirements:

- the caller must be the current manager for &#x60;account&#x60;._

### getManager

```solidity
function getManager(address account) external view returns (address)
```

_Returns the manager for &#x60;account&#x60;.

See {setManager}._

### setInterfaceImplementer

```solidity
function setInterfaceImplementer(address account, bytes32 _interfaceHash, address implementer) external
```

_Sets the &#x60;implementer&#x60; contract as &#x60;&#x60;account&#x60;&#x60;&#x27;s implementer for
&#x60;interfaceHash&#x60;.

&#x60;account&#x60; being the zero address is an alias for the caller&#x27;s address.
The zero address can also be used in &#x60;implementer&#x60; to remove an old one.

See {interfaceHash} to learn how these are created.

Emits an {InterfaceImplementerSet} event.

Requirements:

- the caller must be the current manager for &#x60;account&#x60;.
- &#x60;interfaceHash&#x60; must not be an {IERC165} interface id (i.e. it must not
end in 28 zeroes).
- &#x60;implementer&#x60; must implement {IERC1820Implementer} and return true when
queried for support, unless &#x60;implementer&#x60; is the caller. See
{IERC1820Implementer-canImplementInterfaceForAddress}._

### getInterfaceImplementer

```solidity
function getInterfaceImplementer(address account, bytes32 _interfaceHash) external view returns (address)
```

_Returns the implementer of &#x60;interfaceHash&#x60; for &#x60;account&#x60;. If no such
implementer is registered, returns the zero address.

If &#x60;interfaceHash&#x60; is an {IERC165} interface id (i.e. it ends with 28
zeroes), &#x60;account&#x60; will be queried for support of it.

&#x60;account&#x60; being the zero address is an alias for the caller&#x27;s address._

### interfaceHash

```solidity
function interfaceHash(string interfaceName) external pure returns (bytes32)
```

_Returns the interface hash for an &#x60;interfaceName&#x60;, as defined in the
corresponding
https://eips.ethereum.org/EIPS/eip-1820#interface-name[section of the EIP]._

### updateERC165Cache

```solidity
function updateERC165Cache(address account, bytes4 interfaceId) external
```

Updates the cache with whether the contract implements an ERC165 interface or not.

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the contract for which to update the cache. |
| interfaceId | bytes4 | ERC165 interface for which to update the cache. |

### implementsERC165Interface

```solidity
function implementsERC165Interface(address account, bytes4 interfaceId) external view returns (bool)
```

Checks whether a contract implements an ERC165 interface or not.
If the result is not cached a direct lookup on the contract address is performed.
If the result is not cached or the cached value is out-of-date, the cache MUST be updated manually by calling
{updateERC165Cache} with the contract address.

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the contract to check. |
| interfaceId | bytes4 | ERC165 interface to check. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if &#x60;account&#x60; implements &#x60;interfaceId&#x60;, false otherwise. |

### implementsERC165InterfaceNoCache

```solidity
function implementsERC165InterfaceNoCache(address account, bytes4 interfaceId) external view returns (bool)
```

Checks whether a contract implements an ERC165 interface or not without using nor updating the cache.

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the contract to check. |
| interfaceId | bytes4 | ERC165 interface to check. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if &#x60;account&#x60; implements &#x60;interfaceId&#x60;, false otherwise. |

### InterfaceImplementerSet

```solidity
event InterfaceImplementerSet(address account, bytes32 interfaceHash, address implementer)
```

### ManagerChanged

```solidity
event ManagerChanged(address account, address newManager)
```

