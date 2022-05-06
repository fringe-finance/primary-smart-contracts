# Solidity API

## IERC1820ImplementerUpgradeable

_Interface for an ERC1820 implementer, as defined in the
https://eips.ethereum.org/EIPS/eip-1820#interface-implementation-erc1820implementerinterface[EIP].
Used by contracts that will be registered as implementers in the
{IERC1820Registry}._

### canImplementInterfaceForAddress

```solidity
function canImplementInterfaceForAddress(bytes32 interfaceHash, address account) external view returns (bytes32)
```

_Returns a special value (&#x60;ERC1820_ACCEPT_MAGIC&#x60;) if this contract
implements &#x60;interfaceHash&#x60; for &#x60;account&#x60;.

See {IERC1820Registry-setInterfaceImplementer}._

