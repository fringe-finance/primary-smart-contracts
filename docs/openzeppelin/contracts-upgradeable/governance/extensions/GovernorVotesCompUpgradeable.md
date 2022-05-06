# Solidity API

## GovernorVotesCompUpgradeable

_Extension of {Governor} for voting weight extraction from a Comp token.

_Available since v4.3.__

### token

```solidity
contract ERC20VotesCompUpgradeable token
```

### __GovernorVotesComp_init

```solidity
function __GovernorVotesComp_init(contract ERC20VotesCompUpgradeable token_) internal
```

### __GovernorVotesComp_init_unchained

```solidity
function __GovernorVotesComp_init_unchained(contract ERC20VotesCompUpgradeable token_) internal
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

