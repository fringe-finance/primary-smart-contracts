# EIP20Interface



> ERC 20 Token Standard Interface  https://eips.ethereum.org/EIPS/eip-20





## Methods

### allowance

```solidity
function allowance(address owner, address spender) external view returns (uint256 remaining)
```

Get the current allowance from `owner` for `spender`



#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | The address of the account which owns the tokens to be spent |
| spender | address | The address of the account which may transfer tokens return The number of tokens allowed to be spent (-1 means infinite) |

#### Returns

| Name | Type | Description |
|---|---|---|
| remaining | uint256 | undefined |

### approve

```solidity
function approve(address spender, uint256 amount) external nonpayable returns (bool success)
```

Approve `spender` to transfer up to `amount` from `src`

*This will overwrite the approval amount for `spender`  and is subject to issues noted [here](https://eips.ethereum.org/EIPS/eip-20#approve)*

#### Parameters

| Name | Type | Description |
|---|---|---|
| spender | address | The address of the account which may transfer tokens |
| amount | uint256 | The number of tokens that are approved (-1 means infinite) return Whether or not the approval succeeded |

#### Returns

| Name | Type | Description |
|---|---|---|
| success | bool | undefined |

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256 balance)
```

Gets the balance of the specified address



#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | The address from which the balance will be retrieved return The `balance` |

#### Returns

| Name | Type | Description |
|---|---|---|
| balance | uint256 | undefined |

### decimals

```solidity
function decimals() external view returns (uint8)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint8 | undefined |

### name

```solidity
function name() external view returns (string)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### symbol

```solidity
function symbol() external view returns (string)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

Get the total number of tokens in circulation




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | The supply of tokens |

### transfer

```solidity
function transfer(address dst, uint256 amount) external nonpayable returns (bool success)
```

Transfer `amount` tokens from `msg.sender` to `dst`



#### Parameters

| Name | Type | Description |
|---|---|---|
| dst | address | The address of the destination account |
| amount | uint256 | The number of tokens to transfer return Whether or not the transfer succeeded |

#### Returns

| Name | Type | Description |
|---|---|---|
| success | bool | undefined |

### transferFrom

```solidity
function transferFrom(address src, address dst, uint256 amount) external nonpayable returns (bool success)
```

Transfer `amount` tokens from `src` to `dst`



#### Parameters

| Name | Type | Description |
|---|---|---|
| src | address | The address of the source account |
| dst | address | The address of the destination account |
| amount | uint256 | The number of tokens to transfer return Whether or not the transfer succeeded |

#### Returns

| Name | Type | Description |
|---|---|---|
| success | bool | undefined |



## Events

### Approval

```solidity
event Approval(address indexed owner, address indexed spender, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| owner `indexed` | address | undefined |
| spender `indexed` | address | undefined |
| amount  | uint256 | undefined |

### Transfer

```solidity
event Transfer(address indexed from, address indexed to, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| from `indexed` | address | undefined |
| to `indexed` | address | undefined |
| amount  | uint256 | undefined |



