# PriceProvider

## Overview

#### License: MIT

```solidity
abstract contract PriceProvider
```

Abstract contract for a price provider that can be used by the PriceOracle contract.
## Functions info

### changeActive (0x258a4532)

```solidity
function changeActive(address token, bool active) public virtual
```

Changes the active status of a token.


Parameters:

| Name   | Type    | Description                                                 |
| :----- | :------ | :---------------------------------------------------------- |
| token  | address | The address of the token to change the active status for.   |
| active | bool    | The new active status of the token.                         |

### updatePrices (0x0aa9adbc)

```solidity
function updatePrices(
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable virtual
```

Performs a price update if the price is no longer valid.


Parameters:

| Name       | Type      | Description                             |
| :--------- | :-------- | :-------------------------------------- |
| priceIds   | bytes32[] | The priceIds need to update.            |
| updateData | bytes[]   | The updateData provided by PythNetwork. |

### isActive (0x9f8a13d7)

```solidity
function isActive(address token) public view virtual returns (bool)
```

Returns whether a token is active or not.


Parameters:

| Name  | Type    | Description                          |
| :---- | :------ | :----------------------------------- |
| token | address | The address of the token to check.   |


Return values:

| Name | Type | Description                                              |
| :--- | :--- | :------------------------------------------------------- |
| [0]  | bool | A boolean indicating whether the token is active or not. |

### isListed (0xf794062e)

```solidity
function isListed(address token) public view virtual returns (bool)
```

Returns a boolean indicating whether the given token address is listed in the price provider.


Parameters:

| Name  | Type    | Description                          |
| :---- | :------ | :----------------------------------- |
| token | address | The address of the token to check.   |


Return values:

| Name | Type | Description                                              |
| :--- | :--- | :------------------------------------------------------- |
| [0]  | bool | A boolean indicating whether the token is listed or not. |

### getPrice (0x41976e09)

```solidity
function getPrice(
    address token
) public view virtual returns (uint256 priceMantissa, uint8 priceDecimals)
```

Returns the price of the specified token.


Parameters:

| Name  | Type    | Description                                      |
| :---- | :------ | :----------------------------------------------- |
| token | address | The address of the token to get the price for.   |


Return values:

| Name          | Type    | Description                                          |
| :------------ | :------ | :--------------------------------------------------- |
| priceMantissa | uint256 | The price of the token, represented as a mantissa.   |
| priceDecimals | uint8   | The number of decimal places in the token's price.   |

### getPriceDecimals (0x1b30aafc)

```solidity
function getPriceDecimals() public view virtual returns (uint8 priceDecimals)
```

Returns the number of decimal places for the price returned by the price provider.


Return values:

| Name          | Type  | Description                                 |
| :------------ | :---- | :------------------------------------------ |
| priceDecimals | uint8 | The number of decimal places for the price. |

### getExpiredPriceFeeds (0xe1f67b13)

```solidity
function getExpiredPriceFeeds(
    address[] memory token,
    uint256 timeBeforeExpiration
) external view virtual returns (bytes32[] memory priceIds, uint256 updateFee)
```

Returns the expired price feeds for the given tokens and time before expiration.


Parameters:

| Name                 | Type      | Description                                                       |
| :------------------- | :-------- | :---------------------------------------------------------------- |
| token                | address[] | An array of token addresses to get the expired price feeds for.   |
| timeBeforeExpiration | uint256   | The time in seconds before the price feed expires.                |


Return values:

| Name      | Type      | Description                                                    |
| :-------- | :-------- | :------------------------------------------------------------- |
| priceIds  | bytes32[] | An array of bytes32 representing the expired price feed IDs.   |
| updateFee | uint256   | The fee required to update the expired price feeds.            |
