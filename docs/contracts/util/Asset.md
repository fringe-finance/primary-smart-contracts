# Asset

## Overview

#### License: MIT

```solidity
library Asset
```

A library for handling different types of assets, including ERC20 tokens, ERC4626 tokens, and Uniswap V2 LP tokens.
## Enums info

### Type

```solidity
enum Type {
	 ERC20,
	 ERC4626,
	 LP
}
```


## Structs info

### Info

```solidity
struct Info {
	address addr;
	Asset.Type tokenType;
}
```


## Functions info

### _unwrap

```solidity
function _unwrap(
    Asset.Info memory _tokenInfo,
    uint256 _tokenAmount
) internal returns (address[] memory assets, uint256[] memory assetAmounts)
```

Unwraps the specified amount of tokens based on their type.


Parameters:

| Name         | Type              | Description                                                    |
| :----------- | :---------------- | :------------------------------------------------------------- |
| _tokenInfo   | struct Asset.Info | Information about the token, including its address and type.   |
| _tokenAmount | uint256           | The amount of tokens to unwrap.                                |


Return values:

| Name         | Type      | Description                          |
| :----------- | :-------- | :----------------------------------- |
| assets       | address[] | The unwrapped assets' addresses.     |
| assetAmounts | uint256[] | The amounts of the unwrapped assets. |

### _wrap

```solidity
function _wrap(
    address[] memory _assets,
    uint256[] memory _assetAmounts,
    Asset.Info memory _tokenInfo
) internal returns (uint256 tokenAmount)
```

Wraps the specified amounts of assets into a token.


Parameters:

| Name          | Type              | Description                                                    |
| :------------ | :---------------- | :------------------------------------------------------------- |
| _assets       | address[]         | The addresses of the assets to wrap.                           |
| _assetAmounts | uint256[]         | The amounts of the assets to wrap.                             |
| _tokenInfo    | struct Asset.Info | Information about the token, including its address and type.   |


Return values:

| Name        | Type    | Description                      |
| :---------- | :------ | :------------------------------- |
| tokenAmount | uint256 | The amount of the wrapped token. |

### _redeem

```solidity
function _redeem(
    Asset.Info memory _tokenInfo,
    address _receiver
) internal returns (address[] memory assets, uint256[] memory assetAmounts)
```

Redeems the redundant amount of tokens for the underlying assets.


Parameters:

| Name       | Type              | Description                                                    |
| :--------- | :---------------- | :------------------------------------------------------------- |
| _tokenInfo | struct Asset.Info | Information about the token, including its address and type.   |
| _receiver  | address           | The address that will receive the redeemed assets.             |


Return values:

| Name         | Type      | Description                         |
| :----------- | :-------- | :---------------------------------- |
| assets       | address[] | The redeemed assets' addresses.     |
| assetAmounts | uint256[] | The amounts of the redeemed assets. |

### _safeIncreaseAllowance

```solidity
function _safeIncreaseAllowance(
    address _spender,
    address _token,
    uint256 _tokenAmount
) internal
```

Safely increases the allowance of a spender for a given token.


Parameters:

| Name         | Type    | Description                                |
| :----------- | :------ | :----------------------------------------- |
| _spender     | address | The address allowed to spend the tokens.   |
| _token       | address | The address of the token.                  |
| _tokenAmount | uint256 | The amount of tokens to allow.             |
