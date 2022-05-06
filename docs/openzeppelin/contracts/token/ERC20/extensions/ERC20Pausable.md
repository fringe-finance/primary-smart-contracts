# Solidity API

## ERC20Pausable

_ERC20 token with pausable token transfers, minting and burning.

Useful for scenarios such as preventing trades until the end of an evaluation
period, or having an emergency switch for freezing all token transfers in the
event of a large bug._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual
```

_See {ERC20-_beforeTokenTransfer}.

Requirements:

- the contract must not be paused._

