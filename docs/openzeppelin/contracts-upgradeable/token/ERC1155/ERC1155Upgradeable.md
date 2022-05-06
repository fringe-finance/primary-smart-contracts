# Solidity API

## ERC1155Upgradeable

_Implementation of the basic standard multi-token.
See https://eips.ethereum.org/EIPS/eip-1155
Originally based on code by Enjin: https://github.com/enjin/erc-1155

_Available since v3.1.__

### _balances

```solidity
mapping(uint256 &#x3D;&gt; mapping(address &#x3D;&gt; uint256)) _balances
```

### _operatorApprovals

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; bool)) _operatorApprovals
```

### _uri

```solidity
string _uri
```

### __ERC1155_init

```solidity
function __ERC1155_init(string uri_) internal
```

_See {_setURI}._

### __ERC1155_init_unchained

```solidity
function __ERC1155_init_unchained(string uri_) internal
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### uri

```solidity
function uri(uint256) public view virtual returns (string)
```

_See {IERC1155MetadataURI-uri}.

This implementation returns the same URI for *all* token types. It relies
on the token type ID substitution mechanism
https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].

Clients calling this function must replace the &#x60;\{id\}&#x60; substring with the
actual token type ID._

### balanceOf

```solidity
function balanceOf(address account, uint256 id) public view virtual returns (uint256)
```

_See {IERC1155-balanceOf}.

Requirements:

- &#x60;account&#x60; cannot be the zero address._

### balanceOfBatch

```solidity
function balanceOfBatch(address[] accounts, uint256[] ids) public view virtual returns (uint256[])
```

_See {IERC1155-balanceOfBatch}.

Requirements:

- &#x60;accounts&#x60; and &#x60;ids&#x60; must have the same length._

### setApprovalForAll

```solidity
function setApprovalForAll(address operator, bool approved) public virtual
```

_See {IERC1155-setApprovalForAll}._

### isApprovedForAll

```solidity
function isApprovedForAll(address account, address operator) public view virtual returns (bool)
```

_See {IERC1155-isApprovedForAll}._

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) public virtual
```

_See {IERC1155-safeTransferFrom}._

### safeBatchTransferFrom

```solidity
function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data) public virtual
```

_See {IERC1155-safeBatchTransferFrom}._

### _safeTransferFrom

```solidity
function _safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) internal virtual
```

_Transfers &#x60;amount&#x60; tokens of token type &#x60;id&#x60; from &#x60;from&#x60; to &#x60;to&#x60;.

Emits a {TransferSingle} event.

Requirements:

- &#x60;to&#x60; cannot be the zero address.
- &#x60;from&#x60; must have a balance of tokens of type &#x60;id&#x60; of at least &#x60;amount&#x60;.
- If &#x60;to&#x60; refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
acceptance magic value._

### _safeBatchTransferFrom

```solidity
function _safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data) internal virtual
```

_xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {_safeTransferFrom}.

Emits a {TransferBatch} event.

Requirements:

- If &#x60;to&#x60; refers to a smart contract, it must implement {IERC1155Receiver-onERC1155BatchReceived} and return the
acceptance magic value._

### _setURI

```solidity
function _setURI(string newuri) internal virtual
```

_Sets a new URI for all token types, by relying on the token type ID
substitution mechanism
https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].

By this mechanism, any occurrence of the &#x60;\{id\}&#x60; substring in either the
URI or any of the amounts in the JSON file at said URI will be replaced by
clients with the token type ID.

For example, the &#x60;https://token-cdn-domain/\{id\}.json&#x60; URI would be
interpreted by clients as
&#x60;https://token-cdn-domain/000000000000000000000000000000000000000000000000000000000004cce0.json&#x60;
for token type ID 0x4cce0.

See {uri}.

Because these URIs cannot be meaningfully represented by the {URI} event,
this function emits no events._

### _mint

```solidity
function _mint(address account, uint256 id, uint256 amount, bytes data) internal virtual
```

_Creates &#x60;amount&#x60; tokens of token type &#x60;id&#x60;, and assigns them to &#x60;account&#x60;.

Emits a {TransferSingle} event.

Requirements:

- &#x60;account&#x60; cannot be the zero address.
- If &#x60;account&#x60; refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
acceptance magic value._

### _mintBatch

```solidity
function _mintBatch(address to, uint256[] ids, uint256[] amounts, bytes data) internal virtual
```

_xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {_mint}.

Requirements:

- &#x60;ids&#x60; and &#x60;amounts&#x60; must have the same length.
- If &#x60;to&#x60; refers to a smart contract, it must implement {IERC1155Receiver-onERC1155BatchReceived} and return the
acceptance magic value._

### _burn

```solidity
function _burn(address account, uint256 id, uint256 amount) internal virtual
```

_Destroys &#x60;amount&#x60; tokens of token type &#x60;id&#x60; from &#x60;account&#x60;

Requirements:

- &#x60;account&#x60; cannot be the zero address.
- &#x60;account&#x60; must have at least &#x60;amount&#x60; tokens of token type &#x60;id&#x60;._

### _burnBatch

```solidity
function _burnBatch(address account, uint256[] ids, uint256[] amounts) internal virtual
```

_xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {_burn}.

Requirements:

- &#x60;ids&#x60; and &#x60;amounts&#x60; must have the same length._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data) internal virtual
```

_Hook that is called before any token transfer. This includes minting
and burning, as well as batched variants.

The same hook is called on both single and batched variants. For single
transfers, the length of the &#x60;id&#x60; and &#x60;amount&#x60; arrays will be 1.

Calling conditions (for each &#x60;id&#x60; and &#x60;amount&#x60; pair):

- When &#x60;from&#x60; and &#x60;to&#x60; are both non-zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens
of token type &#x60;id&#x60; will be  transferred to &#x60;to&#x60;.
- When &#x60;from&#x60; is zero, &#x60;amount&#x60; tokens of token type &#x60;id&#x60; will be minted
for &#x60;to&#x60;.
- when &#x60;to&#x60; is zero, &#x60;amount&#x60; of &#x60;&#x60;from&#x60;&#x60;&#x27;s tokens of token type &#x60;id&#x60;
will be burned.
- &#x60;from&#x60; and &#x60;to&#x60; are never both zero.
- &#x60;ids&#x60; and &#x60;amounts&#x60; have the same, non-zero length.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

### _doSafeTransferAcceptanceCheck

```solidity
function _doSafeTransferAcceptanceCheck(address operator, address from, address to, uint256 id, uint256 amount, bytes data) private
```

### _doSafeBatchTransferAcceptanceCheck

```solidity
function _doSafeBatchTransferAcceptanceCheck(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data) private
```

### _asSingletonArray

```solidity
function _asSingletonArray(uint256 element) private pure returns (uint256[])
```

### __gap

```solidity
uint256[47] __gap
```

