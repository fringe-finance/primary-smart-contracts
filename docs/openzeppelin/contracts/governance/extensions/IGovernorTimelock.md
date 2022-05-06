# Solidity API

## IGovernorTimelock

_Extension of the {IGovernor} for timelock supporting modules.

_Available since v4.3.__

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

