# Solidity API

## EscrowUpgradeable

_Base escrow contract, holds funds designated for a payee until they
withdraw them.

Intended usage: This contract (and derived escrow contracts) should be a
standalone contract, that only interacts with the contract that instantiated
it. That way, it is guaranteed that all Ether will be handled according to
the &#x60;Escrow&#x60; rules, and there is no need to check for payable functions or
transfers in the inheritance tree. The contract that uses the escrow as its
payment method should be its owner, and provide public methods redirecting
to the escrow&#x27;s deposit and withdraw._

### initialize

```solidity
function initialize() public virtual
```

### __Escrow_init

```solidity
function __Escrow_init() internal
```

### __Escrow_init_unchained

```solidity
function __Escrow_init_unchained() internal
```

### Deposited

```solidity
event Deposited(address payee, uint256 weiAmount)
```

### Withdrawn

```solidity
event Withdrawn(address payee, uint256 weiAmount)
```

### _deposits

```solidity
mapping(address &#x3D;&gt; uint256) _deposits
```

### depositsOf

```solidity
function depositsOf(address payee) public view returns (uint256)
```

### deposit

```solidity
function deposit(address payee) public payable virtual
```

_Stores the sent amount as credit to be withdrawn._

| Name | Type | Description |
| ---- | ---- | ----------- |
| payee | address | The destination address of the funds. |

### withdraw

```solidity
function withdraw(address payable payee) public virtual
```

_Withdraw accumulated balance for a payee, forwarding all gas to the
recipient.

WARNING: Forwarding all gas opens the door to reentrancy vulnerabilities.
Make sure you trust the recipient, or are either following the
checks-effects-interactions pattern or using {ReentrancyGuard}._

| Name | Type | Description |
| ---- | ---- | ----------- |
| payee | address payable | The address whose funds will be withdrawn and transferred to. |

### __gap

```solidity
uint256[49] __gap
```

