# Solidity API

## ERC777PresetFixedSupplyUpgradeable

_{ERC777} token, including:

 - Preminted initial supply
 - No access control mechanism (for minting/pausing) and hence no governance

_Available since v3.4.__

### initialize

```solidity
function initialize(string name, string symbol, address[] defaultOperators, uint256 initialSupply, address owner) public virtual
```

### __ERC777PresetFixedSupply_init

```solidity
function __ERC777PresetFixedSupply_init(string name, string symbol, address[] defaultOperators, uint256 initialSupply, address owner) internal
```

_Mints &#x60;initialSupply&#x60; amount of token and transfers them to &#x60;owner&#x60;.

See {ERC777-constructor}._

### __ERC777PresetFixedSupply_init_unchained

```solidity
function __ERC777PresetFixedSupply_init_unchained(string name, string symbol, address[] defaultOperators, uint256 initialSupply, address owner) internal
```

### __gap

```solidity
uint256[50] __gap
```

