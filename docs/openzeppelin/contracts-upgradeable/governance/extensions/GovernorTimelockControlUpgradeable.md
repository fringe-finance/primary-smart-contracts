# Solidity API

## GovernorTimelockControlUpgradeable

_Extension of {Governor} that binds the execution process to an instance of {TimelockController}. This adds a
delay, enforced by the {TimelockController} to all successful proposal (in addition to the voting duration). The
{Governor} needs the proposer (an ideally the executor) roles for the {Governor} to work properly.

Using this model means the proposal will be operated by the {TimelockController} and not by the {Governor}. Thus,
the assets and permissions must be attached to the {TimelockController}. Any asset sent to the {Governor} will be
inaccessible.

_Available since v4.3.__

### _timelock

```solidity
contract TimelockControllerUpgradeable _timelock
```

### _timelockIds

```solidity
mapping(uint256 &#x3D;&gt; bytes32) _timelockIds
```

### TimelockChange

```solidity
event TimelockChange(address oldTimelock, address newTimelock)
```

_Emitted when the timelock controller used for proposal execution is modified._

### __GovernorTimelockControl_init

```solidity
function __GovernorTimelockControl_init(contract TimelockControllerUpgradeable timelockAddress) internal
```

_Set the timelock._

### __GovernorTimelockControl_init_unchained

```solidity
function __GovernorTimelockControl_init_unchained(contract TimelockControllerUpgradeable timelockAddress) internal
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### state

```solidity
function state(uint256 proposalId) public view virtual returns (enum IGovernorUpgradeable.ProposalState)
```

_Overriden version of the {Governor-state} function with added support for the &#x60;Queued&#x60; status._

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
function _execute(uint256, address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) internal virtual
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

### updateTimelock

```solidity
function updateTimelock(contract TimelockControllerUpgradeable newTimelock) external virtual
```

_Public endpoint to update the underlying timelock instance. Restricted to the timelock itself, so updates
must be proposed, scheduled and executed using the {Governor} workflow._

### _updateTimelock

```solidity
function _updateTimelock(contract TimelockControllerUpgradeable newTimelock) private
```

### __gap

```solidity
uint256[48] __gap
```

