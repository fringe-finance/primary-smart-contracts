# Solidity API

## ERC20Snapshot

_This contract extends an ERC20 token with a snapshot mechanism. When a snapshot is created, the balances and
total supply at the time are recorded for later access.

This can be used to safely create mechanisms based on token balances such as trustless dividends or weighted voting.
In naive implementations it&#x27;s possible to perform a &quot;double spend&quot; attack by reusing the same balance from different
accounts. By using snapshots to calculate dividends or voting power, those attacks no longer apply. It can also be
used to create an efficient ERC20 forking mechanism.

Snapshots are created by the internal {_snapshot} function, which will emit the {Snapshot} event and return a
snapshot id. To get the total supply at the time of a snapshot, call the function {totalSupplyAt} with the snapshot
id. To get the balance of an account at the time of a snapshot, call the {balanceOfAt} function with the snapshot id
and the account address.

NOTE: Snapshot policy can be customized by overriding the {_getCurrentSnapshotId} method. For example, having it
return &#x60;block.number&#x60; will trigger the creation of snapshot at the begining of each new block. When overridding this
function, be careful about the monotonicity of its result. Non-monotonic snapshot ids will break the contract.

Implementing snapshots for every block using this method will incur significant gas costs. For a gas-efficient
alternative consider {ERC20Votes}.

&#x3D;&#x3D;&#x3D;&#x3D; Gas Costs

Snapshots are efficient. Snapshot creation is _O(1)_. Retrieval of balances or total supply from a snapshot is _O(log
n)_ in the number of snapshots that have been created, although _n_ for a specific account will generally be much
smaller since identical balances in subsequent snapshots are stored as a single entry.

There is a constant overhead for normal ERC20 transfers due to the additional snapshot bookkeeping. This overhead is
only significant for the first transfer that immediately follows a snapshot for a particular account. Subsequent
transfers will have normal cost until the next snapshot, and so on._

### Snapshots

```solidity
struct Snapshots {
  uint256[] ids;
  uint256[] values;
}
```

### _accountBalanceSnapshots

```solidity
mapping(address &#x3D;&gt; struct ERC20Snapshot.Snapshots) _accountBalanceSnapshots
```

### _totalSupplySnapshots

```solidity
struct ERC20Snapshot.Snapshots _totalSupplySnapshots
```

### _currentSnapshotId

```solidity
struct Counters.Counter _currentSnapshotId
```

### Snapshot

```solidity
event Snapshot(uint256 id)
```

_Emitted by {_snapshot} when a snapshot identified by &#x60;id&#x60; is created._

### _snapshot

```solidity
function _snapshot() internal virtual returns (uint256)
```

_Creates a new snapshot and returns its snapshot id.

Emits a {Snapshot} event that contains the same id.

{_snapshot} is &#x60;internal&#x60; and you have to decide how to expose it externally. Its usage may be restricted to a
set of accounts, for example using {AccessControl}, or it may be open to the public.

[WARNING]
&#x3D;&#x3D;&#x3D;&#x3D;
While an open way of calling {_snapshot} is required for certain trust minimization mechanisms such as forking,
you must consider that it can potentially be used by attackers in two ways.

First, it can be used to increase the cost of retrieval of values from snapshots, although it will grow
logarithmically thus rendering this attack ineffective in the long term. Second, it can be used to target
specific accounts and increase the cost of ERC20 transfers for them, in the ways specified in the Gas Costs
section above.

We haven&#x27;t measured the actual numbers; if this is something you&#x27;re interested in please reach out to us.
&#x3D;&#x3D;&#x3D;&#x3D;_

### _getCurrentSnapshotId

```solidity
function _getCurrentSnapshotId() internal view virtual returns (uint256)
```

_Get the current snapshotId_

### balanceOfAt

```solidity
function balanceOfAt(address account, uint256 snapshotId) public view virtual returns (uint256)
```

_Retrieves the balance of &#x60;account&#x60; at the time &#x60;snapshotId&#x60; was created._

### totalSupplyAt

```solidity
function totalSupplyAt(uint256 snapshotId) public view virtual returns (uint256)
```

_Retrieves the total supply at the time &#x60;snapshotId&#x60; was created._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual
```

_Hook that is called before any transfer of tokens. This includes
minting and burning.

Calling conditions:

- when &#x60;from&#x60; and &#x60;to&#x60; are both non-zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens
will be transferred to &#x60;to&#x60;.
- when &#x60;from&#x60; is zero, &#x60;amount&#x60; tokens will be minted for &#x60;to&#x60;.
- when &#x60;to&#x60; is zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens will be burned.
- &#x60;from&#x60; and &#x60;to&#x60; are never both zero.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

### _valueAt

```solidity
function _valueAt(uint256 snapshotId, struct ERC20Snapshot.Snapshots snapshots) private view returns (bool, uint256)
```

### _updateAccountSnapshot

```solidity
function _updateAccountSnapshot(address account) private
```

### _updateTotalSupplySnapshot

```solidity
function _updateTotalSupplySnapshot() private
```

### _updateSnapshot

```solidity
function _updateSnapshot(struct ERC20Snapshot.Snapshots snapshots, uint256 currentValue) private
```

### _lastSnapshotId

```solidity
function _lastSnapshotId(uint256[] ids) private view returns (uint256)
```

