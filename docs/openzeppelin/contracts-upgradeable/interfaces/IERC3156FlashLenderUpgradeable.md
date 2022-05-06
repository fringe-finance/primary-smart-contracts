# Solidity API

## IERC3156FlashLenderUpgradeable

_Interface of the ERC3156 FlashLender, as defined in
https://eips.ethereum.org/EIPS/eip-3156[ERC-3156].

_Available since v4.1.__

### maxFlashLoan

```solidity
function maxFlashLoan(address token) external view returns (uint256)
```

_The amount of currency available to be lended._

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The loan currency. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of &#x60;token&#x60; that can be borrowed. |

### flashFee

```solidity
function flashFee(address token, uint256 amount) external view returns (uint256)
```

_The fee to be charged for a given loan._

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The loan currency. |
| amount | uint256 | The amount of tokens lent. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of &#x60;token&#x60; to be charged for the loan, on top of the returned principal. |

### flashLoan

```solidity
function flashLoan(contract IERC3156FlashBorrowerUpgradeable receiver, address token, uint256 amount, bytes data) external returns (bool)
```

_Initiate a flash loan._

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiver | contract IERC3156FlashBorrowerUpgradeable | The receiver of the tokens in the loan, and the receiver of the callback. |
| token | address | The loan currency. |
| amount | uint256 | The amount of tokens lent. |
| data | bytes | Arbitrary data structure, intended to contain user-defined parameters. |

