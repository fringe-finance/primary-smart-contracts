# Solidity API

## GovernorVotesUpgradeable

_Extension of {Governor} for voting weight extraction from an {ERC20Votes} token.

_Available since v4.3.__

### token

```solidity
contract ERC20VotesUpgradeable token
```

### __GovernorVotes_init

```solidity
function __GovernorVotes_init(contract ERC20VotesUpgradeable tokenAddress) internal
```

### __GovernorVotes_init_unchained

```solidity
function __GovernorVotes_init_unchained(contract ERC20VotesUpgradeable tokenAddress) internal
```

### getVotes

```solidity
function getVotes(address account, uint256 blockNumber) public view virtual returns (uint256)
```

Read the voting weight from the token&#x27;s built in snapshot mechanism (see {IGovernor-getVotes}).

### __gap

```solidity
uint256[50] __gap
```

