# Solidity API

## IERC1363ReceiverUpgradeable

### onTransferReceived

```solidity
function onTransferReceived(address operator, address from, uint256 value, bytes data) external returns (bytes4)
```

Handle the receipt of ERC1363 tokens

_Any ERC1363 smart contract calls this function on the recipient
after a &#x60;transfer&#x60; or a &#x60;transferFrom&#x60;. This function MAY throw to revert and reject the
transfer. Return of other than the magic value MUST result in the
transaction being reverted.
Note: the token contract address is always the message sender._

| Name | Type | Description |
| ---- | ---- | ----------- |
| operator | address | address The address which called &#x60;transferAndCall&#x60; or &#x60;transferFromAndCall&#x60; function |
| from | address | address The address which are token transferred from |
| value | uint256 | uint256 The amount of tokens transferred |
| data | bytes | bytes Additional data with no specified format |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes4 | &#x60;bytes4(keccak256(&quot;onTransferReceived(address,address,uint256,bytes)&quot;))&#x60;  unless throwing |

