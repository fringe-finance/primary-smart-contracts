# Solidity API

## ERC20PausableUpgradeable

_ERC20 token with pausable token transfers, minting and burning.

Useful for scenarios such as preventing trades until the end of an evaluation
period, or having an emergency switch for freezing all token transfers in the
event of a large bug._

### __ERC20Pausable_init

```solidity
function __ERC20Pausable_init() internal
```

### __ERC20Pausable_init_unchained

```solidity
function __ERC20Pausable_init_unchained() internal
```

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual
```

_See {ERC20-_beforeTokenTransfer}.

Requirements:

- the contract must not be paused._

### __gap

```solidity
uint256[50] __gap
```

