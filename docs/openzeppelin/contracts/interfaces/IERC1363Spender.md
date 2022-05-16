# IERC1363Spender









## Methods

### onApprovalReceived

```solidity
function onApprovalReceived(address owner, uint256 value, bytes data) external nonpayable returns (bytes4)
```

Handle the approval of ERC1363 tokens

*Any ERC1363 smart contract calls this function on the recipient after an `approve`. This function MAY throw to revert and reject the approval. Return of other than the magic value MUST result in the transaction being reverted. Note: the token contract address is always the message sender.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | address The address which called `approveAndCall` function |
| value | uint256 | uint256 The amount of tokens to be spent |
| data | bytes | bytes Additional data with no specified format |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes4 | `bytes4(keccak256(&quot;onApprovalReceived(address,uint256,bytes)&quot;))`  unless throwing |




