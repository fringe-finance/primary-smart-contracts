# Solidity API

## GovernorCountingSimple

_Extension of {Governor} for simple, 3 options, vote counting.

_Available since v4.3.__

### VoteType

```solidity
enum VoteType {
  Against,
  For,
  Abstain
}
```

### ProposalVote

```solidity
struct ProposalVote {
  uint256 againstVotes;
  uint256 forVotes;
  uint256 abstainVotes;
  mapping(address &#x3D;&gt; bool) hasVoted;
}
```

### _proposalVotes

```solidity
mapping(uint256 &#x3D;&gt; struct GovernorCountingSimple.ProposalVote) _proposalVotes
```

### COUNTING_MODE

```solidity
function COUNTING_MODE() public pure virtual returns (string)
```

_See {IGovernor-COUNTING_MODE}._

### hasVoted

```solidity
function hasVoted(uint256 proposalId, address account) public view virtual returns (bool)
```

_See {IGovernor-hasVoted}._

### proposalVotes

```solidity
function proposalVotes(uint256 proposalId) public view virtual returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)
```

_Accessor to the internal vote counts._

### _quorumReached

```solidity
function _quorumReached(uint256 proposalId) internal view virtual returns (bool)
```

_See {Governor-_quorumReached}._

### _voteSucceeded

```solidity
function _voteSucceeded(uint256 proposalId) internal view virtual returns (bool)
```

_See {Governor-_voteSucceeded}. In this module, the forVotes must be scritly over the againstVotes._

### _countVote

```solidity
function _countVote(uint256 proposalId, address account, uint8 support, uint256 weight) internal virtual
```

_See {Governor-_countVote}. In this module, the support follows the &#x60;VoteType&#x60; enum (from Governor Bravo)._

