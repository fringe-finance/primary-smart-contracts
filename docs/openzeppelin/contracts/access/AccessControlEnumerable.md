# Solidity API

## AccessControlEnumerable

_Extension of {AccessControl} that allows enumerating the members of each role._

### _roleMembers

```solidity
mapping(bytes32 &#x3D;&gt; struct EnumerableSet.AddressSet) _roleMembers
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### getRoleMember

```solidity
function getRoleMember(bytes32 role, uint256 index) public view returns (address)
```

_Returns one of the accounts that have &#x60;role&#x60;. &#x60;index&#x60; must be a
value between 0 and {getRoleMemberCount}, non-inclusive.

Role bearers are not sorted in any particular way, and their ordering may
change at any point.

WARNING: When using {getRoleMember} and {getRoleMemberCount}, make sure
you perform all queries on the same block. See the following
https://forum.openzeppelin.com/t/iterating-over-elements-on-enumerableset-in-openzeppelin-contracts/2296[forum post]
for more information._

### getRoleMemberCount

```solidity
function getRoleMemberCount(bytes32 role) public view returns (uint256)
```

_Returns the number of accounts that have &#x60;role&#x60;. Can be used
together with {getRoleMember} to enumerate all bearers of a role._

### grantRole

```solidity
function grantRole(bytes32 role, address account) public virtual
```

_Overload {grantRole} to track enumerable memberships_

### revokeRole

```solidity
function revokeRole(bytes32 role, address account) public virtual
```

_Overload {revokeRole} to track enumerable memberships_

### renounceRole

```solidity
function renounceRole(bytes32 role, address account) public virtual
```

_Overload {renounceRole} to track enumerable memberships_

### _setupRole

```solidity
function _setupRole(bytes32 role, address account) internal virtual
```

_Overload {_setupRole} to track enumerable memberships_

