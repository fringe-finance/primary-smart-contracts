# Solidity API

## ERC721Pausable

_ERC721 token with pausable token transfers, minting and burning.

Useful for scenarios such as preventing trades until the end of an evaluation
period, or having an emergency switch for freezing all token transfers in the
event of a large bug._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual
```

_See {ERC721-_beforeTokenTransfer}.

Requirements:

- the contract must not be paused._

