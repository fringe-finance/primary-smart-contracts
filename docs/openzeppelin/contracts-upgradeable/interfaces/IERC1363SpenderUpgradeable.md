# Solidity API

## IERC1363SpenderUpgradeable

### onApprovalReceived

```solidity
function onApprovalReceived(address owner, uint256 value, bytes data) external returns (bytes4)
```

Handle the approval of ERC1363 tokens

_Any ERC1363 smart contract calls this function on the recipient
after an &#x60;approve&#x60;. This function MAY throw to revert and reject the
approval. Return of other than the magic value MUST result in the
transaction being reverted.
Note: the token contract address is always the message sender._

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | address The address which called &#x60;approveAndCall&#x60; function |
| value | uint256 | uint256 The amount of tokens to be spent |
| data | bytes | bytes Additional data with no specified format |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes4 | &#x60;bytes4(keccak256(&quot;onApprovalReceived(address,uint256,bytes)&quot;))&#x60;  unless throwing |

