# Solidity API

## ERC1155SupplyUpgradeable

_Extension of ERC1155 that adds tracking of total supply per id.

Useful for scenarios where Fungible and Non-fungible tokens have to be
clearly identified. Note: While a totalSupply of 1 might mean the
corresponding is an NFT, there is no guarantees that no other token with the
same id are not going to be minted._

### __ERC1155Supply_init

```solidity
function __ERC1155Supply_init() internal
```

### __ERC1155Supply_init_unchained

```solidity
function __ERC1155Supply_init_unchained() internal
```

### _totalSupply

```solidity
mapping(uint256 &#x3D;&gt; uint256) _totalSupply
```

### totalSupply

```solidity
function totalSupply(uint256 id) public view virtual returns (uint256)
```

_Total amount of tokens in with a given id._

### exists

```solidity
function exists(uint256 id) public view virtual returns (bool)
```

_Indicates weither any token exist with a given id, or not._

### _mint

```solidity
function _mint(address account, uint256 id, uint256 amount, bytes data) internal virtual
```

_See {ERC1155-_mint}._

### _mintBatch

```solidity
function _mintBatch(address to, uint256[] ids, uint256[] amounts, bytes data) internal virtual
```

_See {ERC1155-_mintBatch}._

### _burn

```solidity
function _burn(address account, uint256 id, uint256 amount) internal virtual
```

_See {ERC1155-_burn}._

### _burnBatch

```solidity
function _burnBatch(address account, uint256[] ids, uint256[] amounts) internal virtual
```

_See {ERC1155-_burnBatch}._

### __gap

```solidity
uint256[49] __gap
```

