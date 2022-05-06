# Solidity API

## ERC20CappedUpgradeable

_Extension of {ERC20} that adds a cap to the supply of tokens._

### _cap

```solidity
uint256 _cap
```

### __ERC20Capped_init

```solidity
function __ERC20Capped_init(uint256 cap_) internal
```

_Sets the value of the &#x60;cap&#x60;. This value is immutable, it can only be
set once during construction._

### __ERC20Capped_init_unchained

```solidity
function __ERC20Capped_init_unchained(uint256 cap_) internal
```

### cap

```solidity
function cap() public view virtual returns (uint256)
```

_Returns the cap on the token&#x27;s total supply._

### _mint

```solidity
function _mint(address account, uint256 amount) internal virtual
```

_See {ERC20-_mint}._

### __gap

```solidity
uint256[50] __gap
```

