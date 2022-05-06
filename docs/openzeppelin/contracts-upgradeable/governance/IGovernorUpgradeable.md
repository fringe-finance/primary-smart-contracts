# Solidity API

## IGovernorUpgradeable

_Interface of the {Governor} core.

_Available since v4.3.__

### __IGovernor_init

```solidity
function __IGovernor_init() internal
```

### __IGovernor_init_unchained

```solidity
function __IGovernor_init_unchained() internal
```

### ProposalState

```solidity
enum ProposalState {
  Pending,
  Active,
  Canceled,
  Defeated,
  Succeeded,
  Queued,
  Expired,
  Executed
}
```

### ProposalCreated

```solidity
event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)
```

_Emitted when a proposal is created._

### ProposalCanceled

```solidity
event ProposalCanceled(uint256 proposalId)
```

_Emitted when a proposal is canceled._

### ProposalExecuted

```solidity
event ProposalExecuted(uint256 proposalId)
```

_Emitted when a proposal is executed._

### VoteCast

```solidity
event VoteCast(address voter, uint256 proposalId, uint8 support, uint256 weight, string reason)
```

_Emitted when a vote is cast.

Note: &#x60;support&#x60; values should be seen as buckets. There interpretation depends on the voting module used._

### name

```solidity
function name() public view virtual returns (string)
```

module:core

_Name of the governor instance (used in building the ERC712 domain separator)._

### version

```solidity
function version() public view virtual returns (string)
```

module:core

_Version of the governor instance (used in building the ERC712 domain separator). Default: &quot;1&quot;_

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

### hashProposal

```solidity
function hashProposal(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) public pure virtual returns (uint256)
```

module:core

_Hashing function used to (re)build the proposal id from the proposal details.._

### state

```solidity
function state(uint256 proposalId) public view virtual returns (enum IGovernorUpgradeable.ProposalState)
```

module:core

_Current state of a proposal, following Compound&#x27;s convention_

### proposalSnapshot

```solidity
function proposalSnapshot(uint256 proposalId) public view virtual returns (uint256)
```

module:core

_block number used to retrieve user&#x27;s votes and quorum._

### proposalDeadline

```solidity
function proposalDeadline(uint256 proposalId) public view virtual returns (uint256)
```

module:core

_timestamp at which votes close._

### votingDelay

```solidity
function votingDelay() public view virtual returns (uint256)
```

module:user-config

_delay, in number of block, between the proposal is created and the vote starts. This can be increassed to
leave time for users to buy voting power, of delegate it, before the voting of a proposal starts._

### votingPeriod

```solidity
function votingPeriod() public view virtual returns (uint256)
```

module:user-config

_delay, in number of blocks, between the vote start and vote ends.

Note: the {votingDelay} can delay the start of the vote. This must be considered when setting the voting
duration compared to the voting delay._

### quorum

```solidity
function quorum(uint256 blockNumber) public view virtual returns (uint256)
```

module:user-config

_Minimum number of cast voted required for a proposal to be successful.

Note: The &#x60;blockNumber&#x60; parameter corresponds to the snaphot used for counting vote. This allows to scale the
quroum depending on values such as the totalSupply of a token at this block (see {ERC20Votes})._

### getVotes

```solidity
function getVotes(address account, uint256 blockNumber) public view virtual returns (uint256)
```

module:reputation

_Voting power of an &#x60;account&#x60; at a specific &#x60;blockNumber&#x60;.

Note: this can be implemented in a number of ways, for example by reading the delegated balance from one (or
multiple), {ERC20Votes} tokens._

### hasVoted

```solidity
function hasVoted(uint256 proposalId, address account) public view virtual returns (bool)
```

module:voting

_Returns weither &#x60;account&#x60; has cast a vote on &#x60;proposalId&#x60;._

### propose

```solidity
function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) public virtual returns (uint256 proposalId)
```

_Create a new proposal. Vote start {IGovernor-votingDelay} blocks after the proposal is created and ends
{IGovernor-votingPeriod} blocks after the voting starts.

Emits a {ProposalCreated} event._

### execute

```solidity
function execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) public payable virtual returns (uint256 proposalId)
```

_Execute a successful proposal. This requires the quorum to be reached, the vote to be successful, and the
deadline to be reached.

Emits a {ProposalExecuted} event.

Note: some module can modify the requirements for execution, for example by adding an additional timelock._

### castVote

```solidity
function castVote(uint256 proposalId, uint8 support) public virtual returns (uint256 balance)
```

_Cast a vote

Emits a {VoteCast} event._

### castVoteWithReason

```solidity
function castVoteWithReason(uint256 proposalId, uint8 support, string reason) public virtual returns (uint256 balance)
```

_Cast a with a reason

Emits a {VoteCast} event._

### castVoteBySig

```solidity
function castVoteBySig(uint256 proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s) public virtual returns (uint256 balance)
```

_Cast a vote using the user cryptographic signature.

Emits a {VoteCast} event._

### __gap

```solidity
uint256[50] __gap
```

