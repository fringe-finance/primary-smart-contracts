# Solidity API

## GovernorProposalThresholdUpgradeable

_Extension of {Governor} for proposal restriction to token holders with a minimum balance.

_Available since v4.3.__

### __GovernorProposalThreshold_init

```solidity
function __GovernorProposalThreshold_init() internal
```

### __GovernorProposalThreshold_init_unchained

```solidity
function __GovernorProposalThreshold_init_unchained() internal
```

### propose

```solidity
function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) public virtual returns (uint256)
```

_See {IGovernor-propose}._

### proposalThreshold

```solidity
function proposalThreshold() public view virtual returns (uint256)
```

_Part of the Governor Bravo&#x27;s interface: _&quot;The number of votes required in order for a voter to become a proposer&quot;_._

### __gap

```solidity
uint256[50] __gap
```

