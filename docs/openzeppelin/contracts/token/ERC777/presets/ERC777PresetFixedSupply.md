# Solidity API

## ERC777PresetFixedSupply

_{ERC777} token, including:

 - Preminted initial supply
 - No access control mechanism (for minting/pausing) and hence no governance

_Available since v3.4.__

### constructor

```solidity
constructor(string name, string symbol, address[] defaultOperators, uint256 initialSupply, address owner) public
```

_Mints &#x60;initialSupply&#x60; amount of token and transfers them to &#x60;owner&#x60;.

See {ERC777-constructor}._

