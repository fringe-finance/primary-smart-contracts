# Solidity API

## EnumerableMapUpgradeable

_Library for managing an enumerable variant of Solidity&#x27;s
https://solidity.readthedocs.io/en/latest/types.html#mapping-types[&#x60;mapping&#x60;]
type.

Maps have the following properties:

- Entries are added, removed, and checked for existence in constant time
(O(1)).
- Entries are enumerated in O(n). No guarantees are made on the ordering.

&#x60;&#x60;&#x60;
contract Example {
    // Add the library methods
    using EnumerableMap for EnumerableMap.UintToAddressMap;

    // Declare a set state variable
    EnumerableMap.UintToAddressMap private myMap;
}
&#x60;&#x60;&#x60;

As of v3.0.0, only maps of type &#x60;uint256 -&gt; address&#x60; (&#x60;UintToAddressMap&#x60;) are
supported._

### Map

```solidity
struct Map {
  struct EnumerableSetUpgradeable.Bytes32Set _keys;
  mapping(bytes32 &#x3D;&gt; bytes32) _values;
}
```

### _set

```solidity
function _set(struct EnumerableMapUpgradeable.Map map, bytes32 key, bytes32 value) private returns (bool)
```

_Adds a key-value pair to a map, or updates the value for an existing
key. O(1).

Returns true if the key was added to the map, that is if it was not
already present._

### _remove

```solidity
function _remove(struct EnumerableMapUpgradeable.Map map, bytes32 key) private returns (bool)
```

_Removes a key-value pair from a map. O(1).

Returns true if the key was removed from the map, that is if it was present._

### _contains

```solidity
function _contains(struct EnumerableMapUpgradeable.Map map, bytes32 key) private view returns (bool)
```

_Returns true if the key is in the map. O(1)._

### _length

```solidity
function _length(struct EnumerableMapUpgradeable.Map map) private view returns (uint256)
```

_Returns the number of key-value pairs in the map. O(1)._

### _at

```solidity
function _at(struct EnumerableMapUpgradeable.Map map, uint256 index) private view returns (bytes32, bytes32)
```

_Returns the key-value pair stored at position &#x60;index&#x60; in the map. O(1).

Note that there are no guarantees on the ordering of entries inside the
array, and it may change when more entries are added or removed.

Requirements:

- &#x60;index&#x60; must be strictly less than {length}._

### _tryGet

```solidity
function _tryGet(struct EnumerableMapUpgradeable.Map map, bytes32 key) private view returns (bool, bytes32)
```

_Tries to returns the value associated with &#x60;key&#x60;.  O(1).
Does not revert if &#x60;key&#x60; is not in the map._

### _get

```solidity
function _get(struct EnumerableMapUpgradeable.Map map, bytes32 key) private view returns (bytes32)
```

_Returns the value associated with &#x60;key&#x60;.  O(1).

Requirements:

- &#x60;key&#x60; must be in the map._

### _get

```solidity
function _get(struct EnumerableMapUpgradeable.Map map, bytes32 key, string errorMessage) private view returns (bytes32)
```

_Same as {_get}, with a custom error message when &#x60;key&#x60; is not in the map.

CAUTION: This function is deprecated because it requires allocating memory for the error
message unnecessarily. For custom revert reasons use {_tryGet}._

### UintToAddressMap

```solidity
struct UintToAddressMap {
  struct EnumerableMapUpgradeable.Map _inner;
}
```

### set

```solidity
function set(struct EnumerableMapUpgradeable.UintToAddressMap map, uint256 key, address value) internal returns (bool)
```

_Adds a key-value pair to a map, or updates the value for an existing
key. O(1).

Returns true if the key was added to the map, that is if it was not
already present._

### remove

```solidity
function remove(struct EnumerableMapUpgradeable.UintToAddressMap map, uint256 key) internal returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the key was removed from the map, that is if it was present._

### contains

```solidity
function contains(struct EnumerableMapUpgradeable.UintToAddressMap map, uint256 key) internal view returns (bool)
```

_Returns true if the key is in the map. O(1)._

### length

```solidity
function length(struct EnumerableMapUpgradeable.UintToAddressMap map) internal view returns (uint256)
```

_Returns the number of elements in the map. O(1)._

### at

```solidity
function at(struct EnumerableMapUpgradeable.UintToAddressMap map, uint256 index) internal view returns (uint256, address)
```

_Returns the element stored at position &#x60;index&#x60; in the set. O(1).
Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- &#x60;index&#x60; must be strictly less than {length}._

### tryGet

```solidity
function tryGet(struct EnumerableMapUpgradeable.UintToAddressMap map, uint256 key) internal view returns (bool, address)
```

_Tries to returns the value associated with &#x60;key&#x60;.  O(1).
Does not revert if &#x60;key&#x60; is not in the map.

_Available since v3.4.__

### get

```solidity
function get(struct EnumerableMapUpgradeable.UintToAddressMap map, uint256 key) internal view returns (address)
```

_Returns the value associated with &#x60;key&#x60;.  O(1).

Requirements:

- &#x60;key&#x60; must be in the map._

### get

```solidity
function get(struct EnumerableMapUpgradeable.UintToAddressMap map, uint256 key, string errorMessage) internal view returns (address)
```

_Same as {get}, with a custom error message when &#x60;key&#x60; is not in the map.

CAUTION: This function is deprecated because it requires allocating memory for the error
message unnecessarily. For custom revert reasons use {tryGet}._
