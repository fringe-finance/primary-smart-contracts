# Solidity API

## TimelockController

_Contract module which acts as a timelocked controller. When set as the
owner of an &#x60;Ownable&#x60; smart contract, it enforces a timelock on all
&#x60;onlyOwner&#x60; maintenance operations. This gives time for users of the
controlled contract to exit before a potentially dangerous maintenance
operation is applied.

By default, this contract is self administered, meaning administration tasks
have to go through the timelock process. The proposer (resp executor) role
is in charge of proposing (resp executing) operations. A common use case is
to position this {TimelockController} as the owner of a smart contract, with
a multisig or a DAO as the sole proposer.

_Available since v3.3.__

### TIMELOCK_ADMIN_ROLE

```solidity
bytes32 TIMELOCK_ADMIN_ROLE
```

### PROPOSER_ROLE

```solidity
bytes32 PROPOSER_ROLE
```

### EXECUTOR_ROLE

```solidity
bytes32 EXECUTOR_ROLE
```

### _DONE_TIMESTAMP

```solidity
uint256 _DONE_TIMESTAMP
```

### _timestamps

```solidity
mapping(bytes32 &#x3D;&gt; uint256) _timestamps
```

### _minDelay

```solidity
uint256 _minDelay
```

### CallScheduled

```solidity
event CallScheduled(bytes32 id, uint256 index, address target, uint256 value, bytes data, bytes32 predecessor, uint256 delay)
```

_Emitted when a call is scheduled as part of operation &#x60;id&#x60;._

### CallExecuted

```solidity
event CallExecuted(bytes32 id, uint256 index, address target, uint256 value, bytes data)
```

_Emitted when a call is performed as part of operation &#x60;id&#x60;._

### Cancelled

```solidity
event Cancelled(bytes32 id)
```

_Emitted when operation &#x60;id&#x60; is cancelled._

### MinDelayChange

```solidity
event MinDelayChange(uint256 oldDuration, uint256 newDuration)
```

_Emitted when the minimum delay for future operations is modified._

### constructor

```solidity
constructor(uint256 minDelay, address[] proposers, address[] executors) public
```

_Initializes the contract with a given &#x60;minDelay&#x60;._

### onlyRoleOrOpenRole

```solidity
modifier onlyRoleOrOpenRole(bytes32 role)
```

_Modifier to make a function callable only by a certain role. In
addition to checking the sender&#x27;s role, &#x60;address(0)&#x60; &#x27;s role is also
considered. Granting a role to &#x60;address(0)&#x60; is equivalent to enabling
this role for everyone._

### receive

```solidity
receive() external payable
```

_Contract might receive/hold ETH as part of the maintenance process._

### isOperation

```solidity
function isOperation(bytes32 id) public view virtual returns (bool pending)
```

_Returns whether an id correspond to a registered operation. This
includes both Pending, Ready and Done operations._

### isOperationPending

```solidity
function isOperationPending(bytes32 id) public view virtual returns (bool pending)
```

_Returns whether an operation is pending or not._

### isOperationReady

```solidity
function isOperationReady(bytes32 id) public view virtual returns (bool ready)
```

_Returns whether an operation is ready or not._

### isOperationDone

```solidity
function isOperationDone(bytes32 id) public view virtual returns (bool done)
```

_Returns whether an operation is done or not._

### getTimestamp

```solidity
function getTimestamp(bytes32 id) public view virtual returns (uint256 timestamp)
```

_Returns the timestamp at with an operation becomes ready (0 for
unset operations, 1 for done operations)._

### getMinDelay

```solidity
function getMinDelay() public view virtual returns (uint256 duration)
```

_Returns the minimum delay for an operation to become valid.

This value can be changed by executing an operation that calls &#x60;updateDelay&#x60;._

### hashOperation

```solidity
function hashOperation(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt) public pure virtual returns (bytes32 hash)
```

_Returns the identifier of an operation containing a single
transaction._

### hashOperationBatch

```solidity
function hashOperationBatch(address[] targets, uint256[] values, bytes[] datas, bytes32 predecessor, bytes32 salt) public pure virtual returns (bytes32 hash)
```

_Returns the identifier of an operation containing a batch of
transactions._

### schedule

```solidity
function schedule(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt, uint256 delay) public virtual
```

_Schedule an operation containing a single transaction.

Emits a {CallScheduled} event.

Requirements:

- the caller must have the &#x27;proposer&#x27; role._

### scheduleBatch

```solidity
function scheduleBatch(address[] targets, uint256[] values, bytes[] datas, bytes32 predecessor, bytes32 salt, uint256 delay) public virtual
```

_Schedule an operation containing a batch of transactions.

Emits one {CallScheduled} event per transaction in the batch.

Requirements:

- the caller must have the &#x27;proposer&#x27; role._

### _schedule

```solidity
function _schedule(bytes32 id, uint256 delay) private
```

_Schedule an operation that is to becomes valid after a given delay._

### cancel

```solidity
function cancel(bytes32 id) public virtual
```

_Cancel an operation.

Requirements:

- the caller must have the &#x27;proposer&#x27; role._

### execute

```solidity
function execute(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt) public payable virtual
```

_Execute an (ready) operation containing a single transaction.

Emits a {CallExecuted} event.

Requirements:

- the caller must have the &#x27;executor&#x27; role._

### executeBatch

```solidity
function executeBatch(address[] targets, uint256[] values, bytes[] datas, bytes32 predecessor, bytes32 salt) public payable virtual
```

_Execute an (ready) operation containing a batch of transactions.

Emits one {CallExecuted} event per transaction in the batch.

Requirements:

- the caller must have the &#x27;executor&#x27; role._

### _beforeCall

```solidity
function _beforeCall(bytes32 id, bytes32 predecessor) private view
```

_Checks before execution of an operation&#x27;s calls._

### _afterCall

```solidity
function _afterCall(bytes32 id) private
```

_Checks after execution of an operation&#x27;s calls._

### _call

```solidity
function _call(bytes32 id, uint256 index, address target, uint256 value, bytes data) private
```

_Execute an operation&#x27;s call.

Emits a {CallExecuted} event._

### updateDelay

```solidity
function updateDelay(uint256 newDelay) external virtual
```

_Changes the minimum timelock duration for future operations.

Emits a {MinDelayChange} event.

Requirements:

- the caller must be the timelock itself. This can only be achieved by scheduling and later executing
an operation where the timelock is the target and the data is the ABI-encoded call to this function._

