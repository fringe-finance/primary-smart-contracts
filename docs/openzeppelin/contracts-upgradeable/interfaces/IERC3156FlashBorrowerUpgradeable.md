# Solidity API

## IERC3156FlashBorrowerUpgradeable

_Interface of the ERC3156 FlashBorrower, as defined in
https://eips.ethereum.org/EIPS/eip-3156[ERC-3156].

_Available since v4.1.__

### onFlashLoan

```solidity
function onFlashLoan(address initiator, address token, uint256 amount, uint256 fee, bytes data) external returns (bytes32)
```

_Receive a flash loan._

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The initiator of the loan. |
| token | address | The loan currency. |
| amount | uint256 | The amount of tokens lent. |
| fee | uint256 | The additional amount of tokens to repay. |
| data | bytes | Arbitrary data structure, intended to contain user-defined parameters. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | The keccak256 hash of &quot;ERC3156FlashBorrower.onFlashLoan&quot; |

