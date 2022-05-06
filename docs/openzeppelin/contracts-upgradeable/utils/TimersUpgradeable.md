# Solidity API

## TimersUpgradeable

_Tooling for timepoints, timers and delays_

### Timestamp

```solidity
struct Timestamp {
  uint64 _deadline;
}
```

### getDeadline

```solidity
function getDeadline(struct TimersUpgradeable.Timestamp timer) internal pure returns (uint64)
```

### setDeadline

```solidity
function setDeadline(struct TimersUpgradeable.Timestamp timer, uint64 timestamp) internal
```

### reset

```solidity
function reset(struct TimersUpgradeable.Timestamp timer) internal
```

### isUnset

```solidity
function isUnset(struct TimersUpgradeable.Timestamp timer) internal pure returns (bool)
```

### isStarted

```solidity
function isStarted(struct TimersUpgradeable.Timestamp timer) internal pure returns (bool)
```

### isPending

```solidity
function isPending(struct TimersUpgradeable.Timestamp timer) internal view returns (bool)
```

### isExpired

```solidity
function isExpired(struct TimersUpgradeable.Timestamp timer) internal view returns (bool)
```

### BlockNumber

```solidity
struct BlockNumber {
  uint64 _deadline;
}
```

### getDeadline

```solidity
function getDeadline(struct TimersUpgradeable.BlockNumber timer) internal pure returns (uint64)
```

### setDeadline

```solidity
function setDeadline(struct TimersUpgradeable.BlockNumber timer, uint64 timestamp) internal
```

### reset

```solidity
function reset(struct TimersUpgradeable.BlockNumber timer) internal
```

### isUnset

```solidity
function isUnset(struct TimersUpgradeable.BlockNumber timer) internal pure returns (bool)
```

### isStarted

```solidity
function isStarted(struct TimersUpgradeable.BlockNumber timer) internal pure returns (bool)
```

### isPending

```solidity
function isPending(struct TimersUpgradeable.BlockNumber timer) internal view returns (bool)
```

### isExpired

```solidity
function isExpired(struct TimersUpgradeable.BlockNumber timer) internal view returns (bool)
```

