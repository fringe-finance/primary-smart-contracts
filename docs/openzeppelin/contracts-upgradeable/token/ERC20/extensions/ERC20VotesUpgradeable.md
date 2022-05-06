# Solidity API

## ERC20VotesUpgradeable

_Extension of ERC20 to support Compound-like voting and delegation. This version is more generic than Compound&#x27;s,
and supports token supply up to 2^224^ - 1, while COMP is limited to 2^96^ - 1.

NOTE: If exact COMP compatibility is required, use the {ERC20VotesComp} variant of this module.

This extension keeps a history (checkpoints) of each account&#x27;s vote power. Vote power can be delegated either
by calling the {delegate} function directly, or by providing a signature to be used with {delegateBySig}. Voting
power can be queried through the public accessors {getVotes} and {getPastVotes}.

By default, token balance does not account for voting power. This makes transfers cheaper. The downside is that it
requires users to delegate to themselves in order to activate checkpoints and have their voting power tracked.
Enabling self-delegation can easily be done by overriding the {delegates} function. Keep in mind however that this
will significantly increase the base gas cost of transfers.

_Available since v4.2.__

### __ERC20Votes_init_unchained

```solidity
function __ERC20Votes_init_unchained() internal
```

### Checkpoint

```solidity
struct Checkpoint {
  uint32 fromBlock;
  uint224 votes;
}
```

### _DELEGATION_TYPEHASH

```solidity
bytes32 _DELEGATION_TYPEHASH
```

### _delegates

```solidity
mapping(address &#x3D;&gt; address) _delegates
```

### _checkpoints

```solidity
mapping(address &#x3D;&gt; struct ERC20VotesUpgradeable.Checkpoint[]) _checkpoints
```

### _totalSupplyCheckpoints

```solidity
struct ERC20VotesUpgradeable.Checkpoint[] _totalSupplyCheckpoints
```

### DelegateChanged

```solidity
event DelegateChanged(address delegator, address fromDelegate, address toDelegate)
```

_Emitted when an account changes their delegate._

### DelegateVotesChanged

```solidity
event DelegateVotesChanged(address delegate, uint256 previousBalance, uint256 newBalance)
```

_Emitted when a token transfer or delegate change results in changes to an account&#x27;s voting power._

### checkpoints

```solidity
function checkpoints(address account, uint32 pos) public view virtual returns (struct ERC20VotesUpgradeable.Checkpoint)
```

_Get the &#x60;pos&#x60;-th checkpoint for &#x60;account&#x60;._

### numCheckpoints

```solidity
function numCheckpoints(address account) public view virtual returns (uint32)
```

_Get number of checkpoints for &#x60;account&#x60;._

### delegates

```solidity
function delegates(address account) public view virtual returns (address)
```

_Get the address &#x60;account&#x60; is currently delegating to._

### getVotes

```solidity
function getVotes(address account) public view returns (uint256)
```

_Gets the current votes balance for &#x60;account&#x60;_

### getPastVotes

```solidity
function getPastVotes(address account, uint256 blockNumber) public view returns (uint256)
```

_Retrieve the number of votes for &#x60;account&#x60; at the end of &#x60;blockNumber&#x60;.

Requirements:

- &#x60;blockNumber&#x60; must have been already mined_

### getPastTotalSupply

```solidity
function getPastTotalSupply(uint256 blockNumber) public view returns (uint256)
```

_Retrieve the &#x60;totalSupply&#x60; at the end of &#x60;blockNumber&#x60;. Note, this value is the sum of all balances.
It is but NOT the sum of all the delegated votes!

Requirements:

- &#x60;blockNumber&#x60; must have been already mined_

### _checkpointsLookup

```solidity
function _checkpointsLookup(struct ERC20VotesUpgradeable.Checkpoint[] ckpts, uint256 blockNumber) private view returns (uint256)
```

_Lookup a value in a list of (sorted) checkpoints._

### delegate

```solidity
function delegate(address delegatee) public virtual
```

_Delegate votes from the sender to &#x60;delegatee&#x60;._

### delegateBySig

```solidity
function delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) public virtual
```

_Delegates votes from signer to &#x60;delegatee&#x60;_

### _maxSupply

```solidity
function _maxSupply() internal view virtual returns (uint224)
```

_Maximum token supply. Defaults to &#x60;type(uint224).max&#x60; (2^224^ - 1)._

### _mint

```solidity
function _mint(address account, uint256 amount) internal virtual
```

_Snapshots the totalSupply after it has been increased._

### _burn

```solidity
function _burn(address account, uint256 amount) internal virtual
```

_Snapshots the totalSupply after it has been decreased._

### _afterTokenTransfer

```solidity
function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual
```

_Move voting power when tokens are transferred.

Emits a {DelegateVotesChanged} event._

### _delegate

```solidity
function _delegate(address delegator, address delegatee) internal virtual
```

_Change delegation for &#x60;delegator&#x60; to &#x60;delegatee&#x60;.

Emits events {DelegateChanged} and {DelegateVotesChanged}._

### _moveVotingPower

```solidity
function _moveVotingPower(address src, address dst, uint256 amount) private
```

### _writeCheckpoint

```solidity
function _writeCheckpoint(struct ERC20VotesUpgradeable.Checkpoint[] ckpts, function (uint256,uint256) view returns (uint256) op, uint256 delta) private returns (uint256 oldWeight, uint256 newWeight)
```

### _add

```solidity
function _add(uint256 a, uint256 b) private pure returns (uint256)
```

### _subtract

```solidity
function _subtract(uint256 a, uint256 b) private pure returns (uint256)
```

### __gap

```solidity
uint256[47] __gap
```

