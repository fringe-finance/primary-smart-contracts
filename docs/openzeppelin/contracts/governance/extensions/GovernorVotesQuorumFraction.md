# Solidity API

## GovernorVotesQuorumFraction

_Extension of {Governor} for voting weight extraction from an {ERC20Votes} token and a quorum expressed as a
fraction of the total supply.

_Available since v4.3.__

### _quorumNumerator

```solidity
uint256 _quorumNumerator
```

### QuorumNumeratorUpdated

```solidity
event QuorumNumeratorUpdated(uint256 oldQuorumNumerator, uint256 newQuorumNumerator)
```

### constructor

```solidity
constructor(uint256 quorumNumeratorValue) internal
```

### quorumNumerator

```solidity
function quorumNumerator() public view virtual returns (uint256)
```

### quorumDenominator

```solidity
function quorumDenominator() public view virtual returns (uint256)
```

### quorum

```solidity
function quorum(uint256 blockNumber) public view virtual returns (uint256)
```

module:user-config

_Minimum number of cast voted required for a proposal to be successful.

Note: The &#x60;blockNumber&#x60; parameter corresponds to the snaphot used for counting vote. This allows to scale the
quroum depending on values such as the totalSupply of a token at this block (see {ERC20Votes})._

### updateQuorumNumerator

```solidity
function updateQuorumNumerator(uint256 newQuorumNumerator) external virtual
```

### _updateQuorumNumerator

```solidity
function _updateQuorumNumerator(uint256 newQuorumNumerator) internal virtual
```

