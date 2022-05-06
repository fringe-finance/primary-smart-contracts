# Solidity API

## Timers

_Tooling for timepoints, timers and delays_

### Timestamp

```solidity
struct Timestamp {
  uint64 _deadline;
}
```

### getDeadline

```solidity
function getDeadline(struct Timers.Timestamp timer) internal pure returns (uint64)
```

### setDeadline

```solidity
function setDeadline(struct Timers.Timestamp timer, uint64 timestamp) internal
```

### reset

```solidity
function reset(struct Timers.Timestamp timer) internal
```

### isUnset

```solidity
function isUnset(struct Timers.Timestamp timer) internal pure returns (bool)
```

### isStarted

```solidity
function isStarted(struct Timers.Timestamp timer) internal pure returns (bool)
```

### isPending

```solidity
function isPending(struct Timers.Timestamp timer) internal view returns (bool)
```

### isExpired

```solidity
function isExpired(struct Timers.Timestamp timer) internal view returns (bool)
```

### BlockNumber

```solidity
struct BlockNumber {
  uint64 _deadline;
}
```

### getDeadline

```solidity
function getDeadline(struct Timers.BlockNumber timer) internal pure returns (uint64)
```

### setDeadline

```solidity
function setDeadline(struct Timers.BlockNumber timer, uint64 timestamp) internal
```

### reset

```solidity
function reset(struct Timers.BlockNumber timer) internal
```

### isUnset

```solidity
function isUnset(struct Timers.BlockNumber timer) internal pure returns (bool)
```

### isStarted

```solidity
function isStarted(struct Timers.BlockNumber timer) internal pure returns (bool)
```

### isPending

```solidity
function isPending(struct Timers.BlockNumber timer) internal view returns (bool)
```

### isExpired

```solidity
function isExpired(struct Timers.BlockNumber timer) internal view returns (bool)
```

