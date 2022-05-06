# Solidity API

## RefundEscrow

_Escrow that holds funds for a beneficiary, deposited from multiple
parties.
Intended usage: See {Escrow}. Same usage guidelines apply here.
The owner account (that is, the contract that instantiates this
contract) may deposit, close the deposit period, and allow for either
withdrawal by the beneficiary, or refunds to the depositors. All interactions
with &#x60;RefundEscrow&#x60; will be made through the owner contract._

### State

```solidity
enum State {
  Active,
  Refunding,
  Closed
}
```

### RefundsClosed

```solidity
event RefundsClosed()
```

### RefundsEnabled

```solidity
event RefundsEnabled()
```

### _state

```solidity
enum RefundEscrow.State _state
```

### _beneficiary

```solidity
address payable _beneficiary
```

### constructor

```solidity
constructor(address payable beneficiary_) public
```

_Constructor._

| Name | Type | Description |
| ---- | ---- | ----------- |
| beneficiary_ | address payable | The beneficiary of the deposits. |

### state

```solidity
function state() public view virtual returns (enum RefundEscrow.State)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | enum RefundEscrow.State | The current state of the escrow. |

### beneficiary

```solidity
function beneficiary() public view virtual returns (address payable)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address payable | The beneficiary of the escrow. |

### deposit

```solidity
function deposit(address refundee) public payable virtual
```

_Stores funds that may later be refunded._

| Name | Type | Description |
| ---- | ---- | ----------- |
| refundee | address | The address funds will be sent to if a refund occurs. |

### close

```solidity
function close() public virtual
```

_Allows for the beneficiary to withdraw their funds, rejecting
further deposits._

### enableRefunds

```solidity
function enableRefunds() public virtual
```

_Allows for refunds to take place, rejecting further deposits._

### beneficiaryWithdraw

```solidity
function beneficiaryWithdraw() public virtual
```

_Withdraws the beneficiary&#x27;s funds._

### withdrawalAllowed

```solidity
function withdrawalAllowed(address) public view returns (bool)
```

_Returns whether refundees can withdraw their deposits (be refunded). The overridden function receives a
&#x27;payee&#x27; argument, but we ignore it here since the condition is global, not per-payee._

