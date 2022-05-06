# Solidity API

## BitMaps

_Library for managing uint256 to bool mapping in a compact and efficient way, providing the keys are sequential.
Largelly inspired by Uniswap&#x27;s https://github.com/Uniswap/merkle-distributor/blob/master/contracts/MerkleDistributor.sol[merkle-distributor]._

### BitMap

```solidity
struct BitMap {
  mapping(uint256 &#x3D;&gt; uint256) _data;
}
```

### get

```solidity
function get(struct BitMaps.BitMap bitmap, uint256 index) internal view returns (bool)
```

_Returns whether the bit at &#x60;index&#x60; is set._

### setTo

```solidity
function setTo(struct BitMaps.BitMap bitmap, uint256 index, bool value) internal
```

_Sets the bit at &#x60;index&#x60; to the boolean &#x60;value&#x60;._

### set

```solidity
function set(struct BitMaps.BitMap bitmap, uint256 index) internal
```

_Sets the bit at &#x60;index&#x60;._

### unset

```solidity
function unset(struct BitMaps.BitMap bitmap, uint256 index) internal
```

_Unsets the bit at &#x60;index&#x60;._

