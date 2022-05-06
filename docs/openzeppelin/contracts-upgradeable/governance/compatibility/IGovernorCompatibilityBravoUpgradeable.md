# Solidity API

## IGovernorCompatibilityBravoUpgradeable

_Interface extension that adds missing functions to the {Governor} core to provide &#x60;GovernorBravo&#x60; compatibility.

_Available since v4.3.__

### __IGovernorCompatibilityBravo_init

```solidity
function __IGovernorCompatibilityBravo_init() internal
```

### __IGovernorCompatibilityBravo_init_unchained

```solidity
function __IGovernorCompatibilityBravo_init_unchained() internal
```

### Proposal

```solidity
struct Proposal {
  uint256 id;
  address proposer;
  uint256 eta;
  address[] targets;
  uint256[] values;
  string[] signatures;
  bytes[] calldatas;
  uint256 startBlock;
  uint256 endBlock;
  uint256 forVotes;
  uint256 againstVotes;
  uint256 abstainVotes;
  bool canceled;
  bool executed;
  mapping(address &#x3D;&gt; struct IGovernorCompatibilityBravoUpgradeable.Receipt) receipts;
}
```

### Receipt

```solidity
struct Receipt {
  bool hasVoted;
  uint8 support;
  uint96 votes;
}
```

### quorumVotes

```solidity
function quorumVotes() public view virtual returns (uint256)
```

_Part of the Governor Bravo&#x27;s interface._

### proposals

```solidity
function proposals(uint256) public view virtual returns (uint256 id, address proposer, uint256 eta, uint256 startBlock, uint256 endBlock, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed)
```

_Part of the Governor Bravo&#x27;s interface: _&quot;The official record of all proposals ever proposed&quot;_._

### propose

```solidity
function propose(address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, string description) public virtual returns (uint256)
```

_Part of the Governor Bravo&#x27;s interface: _&quot;Function used to propose a new proposal&quot;_._

### queue

```solidity
function queue(uint256 proposalId) public virtual
```

_Part of the Governor Bravo&#x27;s interface: _&quot;Queues a proposal of state succeeded&quot;_._

### execute

```solidity
function execute(uint256 proposalId) public payable virtual
```

_Part of the Governor Bravo&#x27;s interface: _&quot;Executes a queued proposal if eta has passed&quot;_._

### cancel

```solidity
function cancel(uint256 proposalId) public virtual
```

_Cancels a proposal only if sender is the proposer, or proposer delegates dropped below proposal threshold._

### getActions

```solidity
function getActions(uint256 proposalId) public view virtual returns (address[] targets, uint256[] values, string[] signatures, bytes[] calldatas)
```

_Part of the Governor Bravo&#x27;s interface: _&quot;Gets actions of a proposal&quot;_._

### getReceipt

```solidity
function getReceipt(uint256 proposalId, address voter) public view virtual returns (struct IGovernorCompatibilityBravoUpgradeable.Receipt)
```

_Part of the Governor Bravo&#x27;s interface: _&quot;Gets the receipt for a voter on a given proposal&quot;_._

### proposalThreshold

```solidity
function proposalThreshold() public view virtual returns (uint256)
```

_Part of the Governor Bravo&#x27;s interface: _&quot;The number of votes required in order for a voter to become a proposer&quot;_._

### __gap

```solidity
uint256[50] __gap
```

