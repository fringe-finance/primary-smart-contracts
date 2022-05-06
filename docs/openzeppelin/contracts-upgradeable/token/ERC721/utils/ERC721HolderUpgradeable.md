# Solidity API

## ERC721HolderUpgradeable

_Implementation of the {IERC721Receiver} interface.

Accepts all token transfers.
Make sure the contract is able to use its token with {IERC721-safeTransferFrom}, {IERC721-approve} or {IERC721-setApprovalForAll}._

### __ERC721Holder_init

```solidity
function __ERC721Holder_init() internal
```

### __ERC721Holder_init_unchained

```solidity
function __ERC721Holder_init_unchained() internal
```

### onERC721Received

```solidity
function onERC721Received(address, address, uint256, bytes) public virtual returns (bytes4)
```

_See {IERC721Receiver-onERC721Received}.

Always returns &#x60;IERC721Receiver.onERC721Received.selector&#x60;._

### __gap

```solidity
uint256[50] __gap
```

