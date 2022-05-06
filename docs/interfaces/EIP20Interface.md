# Solidity API

## EIP20Interface

### name

```solidity
function name() external view returns (string)
```

### symbol

```solidity
function symbol() external view returns (string)
```

### decimals

```solidity
function decimals() external view returns (uint8)
```

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

Get the total number of tokens in circulation

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The supply of tokens |

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256 balance)
```

Gets the balance of the specified address

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address from which the balance will be retrieved return The &#x60;balance&#x60; |

### transfer

```solidity
function transfer(address dst, uint256 amount) external returns (bool success)
```

Transfer &#x60;amount&#x60; tokens from &#x60;msg.sender&#x60; to &#x60;dst&#x60;

| Name | Type | Description |
| ---- | ---- | ----------- |
| dst | address | The address of the destination account |
| amount | uint256 | The number of tokens to transfer return Whether or not the transfer succeeded |

### transferFrom

```solidity
function transferFrom(address src, address dst, uint256 amount) external returns (bool success)
```

Transfer &#x60;amount&#x60; tokens from &#x60;src&#x60; to &#x60;dst&#x60;

| Name | Type | Description |
| ---- | ---- | ----------- |
| src | address | The address of the source account |
| dst | address | The address of the destination account |
| amount | uint256 | The number of tokens to transfer return Whether or not the transfer succeeded |

### approve

```solidity
function approve(address spender, uint256 amount) external returns (bool success)
```

Approve &#x60;spender&#x60; to transfer up to &#x60;amount&#x60; from &#x60;src&#x60;

_This will overwrite the approval amount for &#x60;spender&#x60;
 and is subject to issues noted [here](https://eips.ethereum.org/EIPS/eip-20#approve)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| spender | address | The address of the account which may transfer tokens |
| amount | uint256 | The number of tokens that are approved (-1 means infinite) return Whether or not the approval succeeded |

### allowance

```solidity
function allowance(address owner, address spender) external view returns (uint256 remaining)
```

Get the current allowance from &#x60;owner&#x60; for &#x60;spender&#x60;

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address of the account which owns the tokens to be spent |
| spender | address | The address of the account which may transfer tokens return The number of tokens allowed to be spent (-1 means infinite) |

### Transfer

```solidity
event Transfer(address from, address to, uint256 amount)
```

### Approval

```solidity
event Approval(address owner, address spender, uint256 amount)
```

