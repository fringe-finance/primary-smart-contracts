# Solidity API

## EnumerableSet

_Library for managing
https://en.wikipedia.org/wiki/Set_(abstract_data_type)[sets] of primitive
types.

Sets have the following properties:

- Elements are added, removed, and checked for existence in constant time
(O(1)).
- Elements are enumerated in O(n). No guarantees are made on the ordering.

&#x60;&#x60;&#x60;
contract Example {
    // Add the library methods
    using EnumerableSet for EnumerableSet.AddressSet;

    // Declare a set state variable
    EnumerableSet.AddressSet private mySet;
}
&#x60;&#x60;&#x60;

As of v3.3.0, sets of type &#x60;bytes32&#x60; (&#x60;Bytes32Set&#x60;), &#x60;address&#x60; (&#x60;AddressSet&#x60;)
and &#x60;uint256&#x60; (&#x60;UintSet&#x60;) are supported._

### Set

```solidity
struct Set {
  bytes32[] _values;
  mapping(bytes32 &#x3D;&gt; uint256) _indexes;
}
```

### _add

```solidity
function _add(struct EnumerableSet.Set set, bytes32 value) private returns (bool)
```

_Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present._

### _remove

```solidity
function _remove(struct EnumerableSet.Set set, bytes32 value) private returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present._

### _contains

```solidity
function _contains(struct EnumerableSet.Set set, bytes32 value) private view returns (bool)
```

_Returns true if the value is in the set. O(1)._

### _length

```solidity
function _length(struct EnumerableSet.Set set) private view returns (uint256)
```

_Returns the number of values on the set. O(1)._

### _at

```solidity
function _at(struct EnumerableSet.Set set, uint256 index) private view returns (bytes32)
```

_Returns the value stored at position &#x60;index&#x60; in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- &#x60;index&#x60; must be strictly less than {length}._

### _values

```solidity
function _values(struct EnumerableSet.Set set) private view returns (bytes32[])
```

_Return the entire set in an array

WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
this function has an unbounded cost, and using it as part of a state-changing function may render the function
uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block._

### Bytes32Set

```solidity
struct Bytes32Set {
  struct EnumerableSet.Set _inner;
}
```

### add

```solidity
function add(struct EnumerableSet.Bytes32Set set, bytes32 value) internal returns (bool)
```

_Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present._

### remove

```solidity
function remove(struct EnumerableSet.Bytes32Set set, bytes32 value) internal returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present._

### contains

```solidity
function contains(struct EnumerableSet.Bytes32Set set, bytes32 value) internal view returns (bool)
```

_Returns true if the value is in the set. O(1)._

### length

```solidity
function length(struct EnumerableSet.Bytes32Set set) internal view returns (uint256)
```

_Returns the number of values in the set. O(1)._

### at

```solidity
function at(struct EnumerableSet.Bytes32Set set, uint256 index) internal view returns (bytes32)
```

_Returns the value stored at position &#x60;index&#x60; in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- &#x60;index&#x60; must be strictly less than {length}._

### values

```solidity
function values(struct EnumerableSet.Bytes32Set set) internal view returns (bytes32[])
```

_Return the entire set in an array

WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
this function has an unbounded cost, and using it as part of a state-changing function may render the function
uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block._

### AddressSet

```solidity
struct AddressSet {
  struct EnumerableSet.Set _inner;
}
```

### add

```solidity
function add(struct EnumerableSet.AddressSet set, address value) internal returns (bool)
```

_Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present._

### remove

```solidity
function remove(struct EnumerableSet.AddressSet set, address value) internal returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present._

### contains

```solidity
function contains(struct EnumerableSet.AddressSet set, address value) internal view returns (bool)
```

_Returns true if the value is in the set. O(1)._

### length

```solidity
function length(struct EnumerableSet.AddressSet set) internal view returns (uint256)
```

_Returns the number of values in the set. O(1)._

### at

```solidity
function at(struct EnumerableSet.AddressSet set, uint256 index) internal view returns (address)
```

_Returns the value stored at position &#x60;index&#x60; in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- &#x60;index&#x60; must be strictly less than {length}._

### values

```solidity
function values(struct EnumerableSet.AddressSet set) internal view returns (address[])
```

_Return the entire set in an array

WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
this function has an unbounded cost, and using it as part of a state-changing function may render the function
uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block._

### UintSet

```solidity
struct UintSet {
  struct EnumerableSet.Set _inner;
}
```

### add

```solidity
function add(struct EnumerableSet.UintSet set, uint256 value) internal returns (bool)
```

_Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present._

### remove

```solidity
function remove(struct EnumerableSet.UintSet set, uint256 value) internal returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present._

### contains

```solidity
function contains(struct EnumerableSet.UintSet set, uint256 value) internal view returns (bool)
```

_Returns true if the value is in the set. O(1)._

### length

```solidity
function length(struct EnumerableSet.UintSet set) internal view returns (uint256)
```

_Returns the number of values on the set. O(1)._

### at

```solidity
function at(struct EnumerableSet.UintSet set, uint256 index) internal view returns (uint256)
```

_Returns the value stored at position &#x60;index&#x60; in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- &#x60;index&#x60; must be strictly less than {length}._

### values

```solidity
function values(struct EnumerableSet.UintSet set) internal view returns (uint256[])
```

_Return the entire set in an array

WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
this function has an unbounded cost, and using it as part of a state-changing function may render the function
uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block._

