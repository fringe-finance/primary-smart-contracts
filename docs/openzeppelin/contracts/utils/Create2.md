# Solidity API

## Create2

_Helper to make usage of the &#x60;CREATE2&#x60; EVM opcode easier and safer.
&#x60;CREATE2&#x60; can be used to compute in advance the address where a smart
contract will be deployed, which allows for interesting new mechanisms known
as &#x27;counterfactual interactions&#x27;.

See the https://eips.ethereum.org/EIPS/eip-1014#motivation[EIP] for more
information._

### deploy

```solidity
function deploy(uint256 amount, bytes32 salt, bytes bytecode) internal returns (address)
```

_Deploys a contract using &#x60;CREATE2&#x60;. The address where the contract
will be deployed can be known in advance via {computeAddress}.

The bytecode for a contract can be obtained from Solidity with
&#x60;type(contractName).creationCode&#x60;.

Requirements:

- &#x60;bytecode&#x60; must not be empty.
- &#x60;salt&#x60; must have not been used for &#x60;bytecode&#x60; already.
- the factory must have a balance of at least &#x60;amount&#x60;.
- if &#x60;amount&#x60; is non-zero, &#x60;bytecode&#x60; must have a &#x60;payable&#x60; constructor._

### computeAddress

```solidity
function computeAddress(bytes32 salt, bytes32 bytecodeHash) internal view returns (address)
```

_Returns the address where a contract will be stored if deployed via {deploy}. Any change in the
&#x60;bytecodeHash&#x60; or &#x60;salt&#x60; will result in a new destination address._

### computeAddress

```solidity
function computeAddress(bytes32 salt, bytes32 bytecodeHash, address deployer) internal pure returns (address)
```

_Returns the address where a contract will be stored if deployed via {deploy} from a contract located at
&#x60;deployer&#x60;. If &#x60;deployer&#x60; is this contract&#x27;s address, returns the same value as {computeAddress}._

