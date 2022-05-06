# Solidity API

## GovernorVotesComp

_Extension of {Governor} for voting weight extraction from a Comp token.

_Available since v4.3.__

### token

```solidity
contract ERC20VotesComp token
```

### constructor

```solidity
constructor(contract ERC20VotesComp token_) internal
```

### getVotes

```solidity
function getVotes(address account, uint256 blockNumber) public view virtual returns (uint256)
```

Read the voting weight from the token&#x27;s built in snapshot mechanism (see {IGovernor-getVotes}).

