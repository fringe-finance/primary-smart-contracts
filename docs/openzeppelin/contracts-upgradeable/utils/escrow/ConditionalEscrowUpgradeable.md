# Solidity API

## ConditionalEscrowUpgradeable

_Base abstract escrow to only allow withdrawal if a condition is met.
Intended usage: See {Escrow}. Same usage guidelines apply here._

### __ConditionalEscrow_init

```solidity
function __ConditionalEscrow_init() internal
```

### __ConditionalEscrow_init_unchained

```solidity
function __ConditionalEscrow_init_unchained() internal
```

### withdrawalAllowed

```solidity
function withdrawalAllowed(address payee) public view virtual returns (bool)
```

_Returns whether an address is allowed to withdraw their funds. To be
implemented by derived contracts._

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
uint256[50] __gap
```

