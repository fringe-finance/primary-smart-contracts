# Solidity API

## Governor

_Core of the governance system, designed to be extended though various modules.

This contract is abstract and requires several function to be implemented in various modules:

- A counting module must implement {quorum}, {_quorumReached}, {_voteSucceeded} and {_countVote}
- A voting module must implement {getVotes}
- Additionanly, the {votingPeriod} must also be implemented

_Available since v4.3.__

### BALLOT_TYPEHASH

```solidity
bytes32 BALLOT_TYPEHASH
```

### ProposalCore

```solidity
struct ProposalCore {
  struct Timers.BlockNumber voteStart;
  struct Timers.BlockNumber voteEnd;
  bool executed;
  bool canceled;
}
```

### _name

```solidity
string _name
```

### _proposals

```solidity
mapping(uint256 &#x3D;&gt; struct Governor.ProposalCore) _proposals
```

### onlyGovernance

```solidity
modifier onlyGovernance()
```

_Restrict access to governor executing address. Some module might override the _executor function to make
sure this modifier is consistant with the execution model._

### constructor

```solidity
constructor(string name_) internal
```

_Sets the value for {name} and {version}_

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### name

```solidity
function name() public view virtual returns (string)
```

_See {IGovernor-name}._

### version

```solidity
function version() public view virtual returns (string)
```

_See {IGovernor-version}._

### hashProposal

```solidity
function hashProposal(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) public pure virtual returns (uint256)
```

_See {IGovernor-hashProposal}.

The proposal id is produced by hashing the RLC encoded &#x60;targets&#x60; array, the &#x60;values&#x60; array, the &#x60;calldatas&#x60; array
and the descriptionHash (bytes32 which itself is the keccak256 hash of the description string). This proposal id
can be produced from the proposal data which is part of the {ProposalCreated} event. It can even be computed in
advance, before the proposal is submitted.

Note that the chainId and the governor address are not part of the proposal id computation. Consequently, the
same proposal (with same operation and same description) will have the same id if submitted on multiple governors
accross multiple networks. This also means that in order to execute the same operation twice (on the same
governor) the proposer will have to change the description in order to avoid proposal id conflicts._

### state

```solidity
function state(uint256 proposalId) public view virtual returns (enum IGovernor.ProposalState)
```

_See {IGovernor-state}._

### proposalSnapshot

```solidity
function proposalSnapshot(uint256 proposalId) public view virtual returns (uint256)
```

_See {IGovernor-proposalSnapshot}._

### proposalDeadline

```solidity
function proposalDeadline(uint256 proposalId) public view virtual returns (uint256)
```

_See {IGovernor-proposalDeadline}._

### _quorumReached

```solidity
function _quorumReached(uint256 proposalId) internal view virtual returns (bool)
```

_Amount of votes already cast passes the threshold limit._

### _voteSucceeded

```solidity
function _voteSucceeded(uint256 proposalId) internal view virtual returns (bool)
```

_Is the proposal successful or not._

### _countVote

```solidity
function _countVote(uint256 proposalId, address account, uint8 support, uint256 weight) internal virtual
```

_Register a vote with a given support and voting weight.

Note: Support is generic and can represent various things depending on the voting system used._

### propose

```solidity
function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) public virtual returns (uint256)
```

_See {IGovernor-propose}._

### execute

```solidity
function execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) public payable virtual returns (uint256)
```

_See {IGovernor-execute}._

### _execute

```solidity
function _execute(uint256, address[] targets, uint256[] values, bytes[] calldatas, bytes32) internal virtual
```

_Internal execution mechanism. Can be overriden to implement different execution mechanism_

### _cancel

```solidity
function _cancel(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) internal virtual returns (uint256)
```

_Internal cancel mechanism: locks up the proposal timer, preventing it from being re-submitted. Marks it as
canceled to allow distinguishing it from executed proposals.

Emits a {IGovernor-ProposalCanceled} event._

### castVote

```solidity
function castVote(uint256 proposalId, uint8 support) public virtual returns (uint256)
```

_See {IGovernor-castVote}._

### castVoteWithReason

```solidity
function castVoteWithReason(uint256 proposalId, uint8 support, string reason) public virtual returns (uint256)
```

_See {IGovernor-castVoteWithReason}._

### castVoteBySig

```solidity
function castVoteBySig(uint256 proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s) public virtual returns (uint256)
```

_See {IGovernor-castVoteBySig}._

### _castVote

```solidity
function _castVote(uint256 proposalId, address account, uint8 support, string reason) internal virtual returns (uint256)
```

_Internal vote casting mechanism: Check that the vote is pending, that it has not been cast yet, retrieve
voting weight using {IGovernor-getVotes} and call the {_countVote} internal function.

Emits a {IGovernor-VoteCast} event._

### _executor

```solidity
function _executor() internal view virtual returns (address)
```

_Address through which the governor executes action. Will be overloaded by module that execute actions
through another contract such as a timelock._

