# IERC1363ReceiverUpgradeable









## Methods

### onTransferReceived

```solidity
function onTransferReceived(address operator, address from, uint256 value, bytes data) external nonpayable returns (bytes4)
```

Handle the receipt of ERC1363 tokens

*Any ERC1363 smart contract calls this function on the recipient after a `transfer` or a `transferFrom`. This function MAY throw to revert and reject the transfer. Return of other than the magic value MUST result in the transaction being reverted. Note: the token contract address is always the message sender.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| operator | address | address The address which called `transferAndCall` or `transferFromAndCall` function |
| from | address | address The address which are token transferred from |
| value | uint256 | uint256 The amount of tokens transferred |
| data | bytes | bytes Additional data with no specified format |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes4 | `bytes4(keccak256(&quot;onTransferReceived(address,address,uint256,bytes)&quot;))`  unless throwing |




