# Solidity API

## ERC20PresetFixedSupply

_{ERC20} token, including:

 - Preminted initial supply
 - Ability for holders to burn (destroy) their tokens
 - No access control mechanism (for minting/pausing) and hence no governance

This contract uses {ERC20Burnable} to include burn capabilities - head to
its documentation for details.

_Available since v3.4.__

### constructor

```solidity
constructor(string name, string symbol, uint256 initialSupply, address owner) public
```

_Mints &#x60;initialSupply&#x60; amount of token and transfers them to &#x60;owner&#x60;.

See {ERC20-constructor}._

