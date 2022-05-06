# Solidity API

## ICompoundTimelock

https://github.com/compound-finance/compound-protocol/blob/master/contracts/Timelock.sol[Compound&#x27;s timelock] interface

### receive

```solidity
receive() external payable
```

### GRACE_PERIOD

```solidity
function GRACE_PERIOD() external view returns (uint256)
```

### MINIMUM_DELAY

```solidity
function MINIMUM_DELAY() external view returns (uint256)
```

### MAXIMUM_DELAY

```solidity
function MAXIMUM_DELAY() external view returns (uint256)
```

### admin

```solidity
function admin() external view returns (address)
```

### pendingAdmin

```solidity
function pendingAdmin() external view returns (address)
```

### delay

```solidity
function delay() external view returns (uint256)
```

### queuedTransactions

```solidity
function queuedTransactions(bytes32) external view returns (bool)
```

### setDelay

```solidity
function setDelay(uint256) external
```

### acceptAdmin

```solidity
function acceptAdmin() external
```

### setPendingAdmin

```solidity
function setPendingAdmin(address) external
```

### queueTransaction

```solidity
function queueTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) external returns (bytes32)
```

### cancelTransaction

```solidity
function cancelTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) external
```

### executeTransaction

```solidity
function executeTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) external payable returns (bytes)
```

## GovernorTimelockCompound

_Extension of {Governor} that binds the execution process to a Compound Timelock. This adds a delay, enforced by
the external timelock to all successful proposal (in addition to the voting duration). The {Governor} needs to be
the admin of the timelock for any operation to be performed. A public, unrestricted,
{GovernorTimelockCompound-__acceptAdmin} is available to accept ownership of the timelock.

Using this model means the proposal will be operated by the {TimelockController} and not by the {Governor}. Thus,
the assets and permissions must be attached to the {TimelockController}. Any asset sent to the {Governor} will be
inaccessible.

_Available since v4.3.__

### ProposalTimelock

```solidity
struct ProposalTimelock {
  struct Timers.Timestamp timer;
}
```

### _timelock

```solidity
contract ICompoundTimelock _timelock
```

### _proposalTimelocks

```solidity
mapping(uint256 &#x3D;&gt; struct GovernorTimelockCompound.ProposalTimelock) _proposalTimelocks
```

### TimelockChange

```solidity
event TimelockChange(address oldTimelock, address newTimelock)
```

_Emitted when the timelock controller used for proposal execution is modified._

### constructor

```solidity
constructor(contract ICompoundTimelock timelockAddress) internal
```

_Set the timelock._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### state

```solidity
function state(uint256 proposalId) public view virtual returns (enum IGovernor.ProposalState)
```

_Overriden version of the {Governor-state} function with added support for the &#x60;Queued&#x60; and &#x60;Expired&#x60; status._

### timelock

```solidity
function timelock() public view virtual returns (address)
```

_Public accessor to check the address of the timelock_

### proposalEta

```solidity
function proposalEta(uint256 proposalId) public view virtual returns (uint256)
```

_Public accessor to check the eta of a queued proposal_

### queue

```solidity
function queue(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) public virtual returns (uint256)
```

_Function to queue a proposal to the timelock._

### _execute

```solidity
function _execute(uint256 proposalId, address[] targets, uint256[] values, bytes[] calldatas, bytes32) internal virtual
```

_Overriden execute function that run the already queued proposal through the timelock._

### _cancel

```solidity
function _cancel(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) internal virtual returns (uint256)
```

_Overriden version of the {Governor-_cancel} function to cancel the timelocked proposal if it as already
been queued._

### _executor

```solidity
function _executor() internal view virtual returns (address)
```

_Address through which the governor executes action. In this case, the timelock._

### __acceptAdmin

```solidity
function __acceptAdmin() public
```

_Accept admin right over the timelock._

### updateTimelock

```solidity
function updateTimelock(contract ICompoundTimelock newTimelock) external virtual
```

_Public endpoint to update the underlying timelock instance. Restricted to the timelock itself, so updates
must be proposed, scheduled and executed using the {Governor} workflow.

For security reason, the timelock must be handed over to another admin before setting up a new one. The two
operations (hand over the timelock) and do the update can be batched in a single proposal.

Note that if the timelock admin has been handed over in a previous operation, we refuse updates made through the
timelock if admin of the timelock has already been accepted and the operation is executed outside the scope of
governance._

### _updateTimelock

```solidity
function _updateTimelock(contract ICompoundTimelock newTimelock) private
```

