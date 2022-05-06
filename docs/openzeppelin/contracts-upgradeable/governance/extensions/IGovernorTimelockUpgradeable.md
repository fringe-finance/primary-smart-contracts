# Solidity API

## IGovernorTimelockUpgradeable

_Extension of the {IGovernor} for timelock supporting modules.

_Available since v4.3.__

### __IGovernorTimelock_init

```solidity
function __IGovernorTimelock_init() internal
```

### __IGovernorTimelock_init_unchained

```solidity
function __IGovernorTimelock_init_unchained() internal
```

### ProposalQueued

```solidity
event ProposalQueued(uint256 proposalId, uint256 eta)
```

### timelock

```solidity
function timelock() public view virtual returns (address)
```

### proposalEta

```solidity
function proposalEta(uint256 proposalId) public view virtual returns (uint256)
```

### queue

```solidity
function queue(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) public virtual returns (uint256 proposalId)
```

### __gap

```solidity
uint256[50] __gap
```

