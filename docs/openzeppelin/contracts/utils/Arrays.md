# Solidity API

## Arrays

_Collection of functions related to array types._

### findUpperBound

```solidity
function findUpperBound(uint256[] array, uint256 element) internal view returns (uint256)
```

_Searches a sorted &#x60;array&#x60; and returns the first index that contains
a value greater or equal to &#x60;element&#x60;. If no such index exists (i.e. all
values in the array are strictly less than &#x60;element&#x60;), the array length is
returned. Time complexity O(log n).

&#x60;array&#x60; is expected to be sorted in ascending order, and to contain no
repeated elements._

