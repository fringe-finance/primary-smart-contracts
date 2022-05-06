# Solidity API

## GovernorCompatibilityBravo

_Compatibility layer that implements GovernorBravo compatibility on to of {Governor}.

This compatibility layer includes a voting system and requires a {IGovernorTimelock} compatible module to be added
through inheritance. It does not include token bindings, not does it include any variable upgrade patterns.

_Available since v4.3.__

### VoteType

```solidity
enum VoteType {
  Against,
  For,
  Abstain
}
```

### ProposalDetails

```solidity
struct ProposalDetails {
  address proposer;
  address[] targets;
  uint256[] values;
  string[] signatures;
  bytes[] calldatas;
  uint256 forVotes;
  uint256 againstVotes;
  uint256 abstainVotes;
  mapping(address &#x3D;&gt; struct IGovernorCompatibilityBravo.Receipt) receipts;
  bytes32 descriptionHash;
}
```

### _proposalDetails

```solidity
mapping(uint256 &#x3D;&gt; struct GovernorCompatibilityBravo.ProposalDetails) _proposalDetails
```

### COUNTING_MODE

```solidity
function COUNTING_MODE() public pure virtual returns (string)
```

module:voting

_A description of the possible &#x60;support&#x60; values for {castVote} and the way these votes are counted, meant to
be consumed by UIs to show correct vote options and interpret the results. The string is a URL-encoded sequence of
key-value pairs that each describe one aspect, for example &#x60;support&#x3D;bravo&amp;quorum&#x3D;for,abstain&#x60;.

There are 2 standard keys: &#x60;support&#x60; and &#x60;quorum&#x60;.

- &#x60;support&#x3D;bravo&#x60; refers to the vote options 0 &#x3D; For, 1 &#x3D; Against, 2 &#x3D; Abstain, as in &#x60;GovernorBravo&#x60;.
- &#x60;quorum&#x3D;bravo&#x60; means that only For votes are counted towards quorum.
- &#x60;quorum&#x3D;for,abstain&#x60; means that both For and Abstain votes are counted towards quorum.

NOTE: The string can be decoded by the standard
https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams[&#x60;URLSearchParams&#x60;]
JavaScript class._

### propose

```solidity
function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) public virtual returns (uint256)
```

_See {IGovernor-propose}._

### propose

```solidity
function propose(address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, string description) public virtual returns (uint256)
```

_See {IGovernorCompatibilityBravo-propose}._

### queue

```solidity
function queue(uint256 proposalId) public virtual
```

_See {IGovernorCompatibilityBravo-queue}._

### execute

```solidity
function execute(uint256 proposalId) public payable virtual
```

_See {IGovernorCompatibilityBravo-execute}._

### cancel

```solidity
function cancel(uint256 proposalId) public virtual
```

_Cancels a proposal only if sender is the proposer, or proposer delegates dropped below proposal threshold._

### _encodeCalldata

```solidity
function _encodeCalldata(string[] signatures, bytes[] calldatas) private pure returns (bytes[])
```

_Encodes calldatas with optional function signature._

### _storeProposal

```solidity
function _storeProposal(address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, string description) private
```

_Store proposal metadata for later lookup_

### proposalThreshold

```solidity
function proposalThreshold() public view virtual returns (uint256)
```

_Part of the Governor Bravo&#x27;s interface: _&quot;The number of votes required in order for a voter to become a proposer&quot;_._

### proposals

```solidity
function proposals(uint256 proposalId) public view virtual returns (uint256 id, address proposer, uint256 eta, uint256 startBlock, uint256 endBlock, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed)
```

_See {IGovernorCompatibilityBravo-proposals}._

### getActions

```solidity
function getActions(uint256 proposalId) public view virtual returns (address[] targets, uint256[] values, string[] signatures, bytes[] calldatas)
```

_See {IGovernorCompatibilityBravo-getActions}._

### getReceipt

```solidity
function getReceipt(uint256 proposalId, address voter) public view virtual returns (struct IGovernorCompatibilityBravo.Receipt)
```

_See {IGovernorCompatibilityBravo-getReceipt}._

### quorumVotes

```solidity
function quorumVotes() public view virtual returns (uint256)
```

_See {IGovernorCompatibilityBravo-quorumVotes}._

### hasVoted

```solidity
function hasVoted(uint256 proposalId, address account) public view virtual returns (bool)
```

_See {IGovernor-hasVoted}._

### _quorumReached

```solidity
function _quorumReached(uint256 proposalId) internal view virtual returns (bool)
```

_See {Governor-_quorumReached}. In this module, only forVotes count toward the quorum._

### _voteSucceeded

```solidity
function _voteSucceeded(uint256 proposalId) internal view virtual returns (bool)
```

_See {Governor-_voteSucceeded}. In this module, the forVotes must be scritly over the againstVotes._

### _countVote

```solidity
function _countVote(uint256 proposalId, address account, uint8 support, uint256 weight) internal virtual
```

_See {Governor-_countVote}. In this module, the support follows Governor Bravo._

