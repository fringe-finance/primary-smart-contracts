# Solidity API

## IERC1363Upgradeable

### transferAndCall

```solidity
function transferAndCall(address to, uint256 value) external returns (bool)
```

_Transfer tokens from &#x60;msg.sender&#x60; to another address and then call &#x60;onTransferReceived&#x60; on receiver_

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | address The address which you want to transfer to |
| value | uint256 | uint256 The amount of tokens to be transferred |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true unless throwing |

### transferAndCall

```solidity
function transferAndCall(address to, uint256 value, bytes data) external returns (bool)
```

_Transfer tokens from &#x60;msg.sender&#x60; to another address and then call &#x60;onTransferReceived&#x60; on receiver_

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | address The address which you want to transfer to |
| value | uint256 | uint256 The amount of tokens to be transferred |
| data | bytes | bytes Additional data with no specified format, sent in call to &#x60;to&#x60; |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true unless throwing |

### transferFromAndCall

```solidity
function transferFromAndCall(address from, address to, uint256 value) external returns (bool)
```

_Transfer tokens from one address to another and then call &#x60;onTransferReceived&#x60; on receiver_

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | address The address which you want to send tokens from |
| to | address | address The address which you want to transfer to |
| value | uint256 | uint256 The amount of tokens to be transferred |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true unless throwing |

### transferFromAndCall

```solidity
function transferFromAndCall(address from, address to, uint256 value, bytes data) external returns (bool)
```

_Transfer tokens from one address to another and then call &#x60;onTransferReceived&#x60; on receiver_

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | address The address which you want to send tokens from |
| to | address | address The address which you want to transfer to |
| value | uint256 | uint256 The amount of tokens to be transferred |
| data | bytes | bytes Additional data with no specified format, sent in call to &#x60;to&#x60; |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true unless throwing |

### approveAndCall

```solidity
function approveAndCall(address spender, uint256 value) external returns (bool)
```

_Approve the passed address to spend the specified amount of tokens on behalf of msg.sender
and then call &#x60;onApprovalReceived&#x60; on spender._

| Name | Type | Description |
| ---- | ---- | ----------- |
| spender | address | address The address which will spend the funds |
| value | uint256 | uint256 The amount of tokens to be spent |

### approveAndCall

```solidity
function approveAndCall(address spender, uint256 value, bytes data) external returns (bool)
```

_Approve the passed address to spend the specified amount of tokens on behalf of msg.sender
and then call &#x60;onApprovalReceived&#x60; on spender._

| Name | Type | Description |
| ---- | ---- | ----------- |
| spender | address | address The address which will spend the funds |
| value | uint256 | uint256 The amount of tokens to be spent |
| data | bytes | bytes Additional data with no specified format, sent in call to &#x60;spender&#x60; |
