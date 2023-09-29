# EIP20NonStandardInterface

## Interface Description


License: MIT

## 

```solidity
interface EIP20NonStandardInterface
```

Version of ERC20 with no return values for `transfer` and `transferFrom`
See https://medium.com/coinmonks/missing-return-value-bug-at-least-130-tokens-affected-d67bf08521ca
## Events info

### Transfer

```solidity
event Transfer(address indexed from, address indexed to, uint256 amount)
```


### Approval

```solidity
event Approval(address indexed owner, address indexed spender, uint256 amount)
```


## Functions info

### totalSupply (0x18160ddd)

```solidity
function totalSupply() external view returns (uint256)
```

Get the total number of tokens in circulation


Return values:

| Name | Type    | Description          |
| :--- | :------ | :------------------- |
| [0]  | uint256 | The supply of tokens |

### balanceOf (0x70a08231)

```solidity
function balanceOf(address owner) external view returns (uint256 balance)
```

Gets the balance of the specified address


Parameters:

| Name  | Type    | Description                                          |
| :---- | :------ | :--------------------------------------------------- |
| owner | address | The address from which the balance will be retrieved |

### transfer (0xa9059cbb)

```solidity
function transfer(address dst, uint256 amount) external
```

Transfer `amount` tokens from `msg.sender` to `dst`


Parameters:

| Name   | Type    | Description                              |
| :----- | :------ | :--------------------------------------- |
| dst    | address | The address of the destination account   |
| amount | uint256 | The number of tokens to transfer         |

### transferFrom (0x23b872dd)

```solidity
function transferFrom(address src, address dst, uint256 amount) external
```

Transfer `amount` tokens from `src` to `dst`


Parameters:

| Name   | Type    | Description                              |
| :----- | :------ | :--------------------------------------- |
| src    | address | The address of the source account        |
| dst    | address | The address of the destination account   |
| amount | uint256 | The number of tokens to transfer         |

### approve (0x095ea7b3)

```solidity
function approve(
    address spender,
    uint256 amount
) external returns (bool success)
```

Approve `spender` to transfer up to `amount` from `src`

This will overwrite the approval amount for `spender`
and is subject to issues noted [here](https://eips.ethereum.org/EIPS/eip-20#approve)


Parameters:

| Name    | Type    | Description                                                                          |
| :------ | :------ | :----------------------------------------------------------------------------------- |
| spender | address | The address of the account which may transfer tokens                                 |
| amount  | uint256 | The number of tokens that are approved
 return Whether or not the approval succeeded |

### allowance (0xdd62ed3e)

```solidity
function allowance(
    address owner,
    address spender
) external view returns (uint256 remaining)
```

Get the current allowance from `owner` for `spender`


Parameters:

| Name    | Type    | Description                                                                                           |
| :------ | :------ | :---------------------------------------------------------------------------------------------------- |
| owner   | address | The address of the account which owns the tokens to be spent                                          |
| spender | address | The address of the account which may transfer tokens
 return The number of tokens allowed to be spent |
