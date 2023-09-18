# PriceProvider

## Abstract Contract Description


License: MIT

## 

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

### getPriceSigned (0x19ed931d)

```solidity
function getPriceSigned(
    address token,
    uint256 priceMantissa,
    uint256 validTo,
    bytes memory signature
) public view virtual returns (uint256 _priceMantissa, uint8 _priceDecimals)
```

Returns the price of a token as a signed integer, along with the number of decimals for the price.


Parameters:

| Name          | Type    | Description                                      |
| :------------ | :------ | :----------------------------------------------- |
| token         | address | The address of the token to get the price for.   |
| priceMantissa | uint256 | The mantissa of the price to be returned.        |
| validTo       | uint256 | The timestamp until which the price is valid.    |
| signature     | bytes   | The signature of the price oracle.               |


Return values:

| Name           | Type    | Description                             |
| :------------- | :------ | :-------------------------------------- |
| _priceMantissa | uint256 | The price of the token as a mantissa.   |
| _priceDecimals | uint8   | The number of decimals for the price.   |

### getEvaluation (0x81fd01ea)

```solidity
function getEvaluation(
    address token,
    uint256 tokenAmount
) public view virtual returns (uint256 evaluation)
```

Returns the evaluation of a given token amount based on the current price.


Parameters:

| Name        | Type    | Description                             |
| :---------- | :------ | :-------------------------------------- |
| token       | address | The address of the token to evaluate.   |
| tokenAmount | uint256 | The amount of tokens to evaluate.       |


Return values:

| Name       | Type    | Description                         |
| :--------- | :------ | :---------------------------------- |
| evaluation | uint256 | The evaluation of the token amount. |

### getEvaluationUnsafe (0xb03ec98d)

```solidity
function getEvaluationUnsafe(
    address token,
    uint256 tokenAmount
) public view virtual returns (uint256 evaluation)
```

Returns the evaluation of a given token amount based on the last updated price.


Parameters:

| Name        | Type    | Description                             |
| :---------- | :------ | :-------------------------------------- |
| token       | address | The address of the token to evaluate.   |
| tokenAmount | uint256 | The amount of tokens to evaluate.       |


Return values:

| Name       | Type    | Description                         |
| :--------- | :------ | :---------------------------------- |
| evaluation | uint256 | The evaluation of the token amount. |

### getEvaluationSigned (0xa5c68226)

```solidity
function getEvaluationSigned(
    address token,
    uint256 tokenAmount,
    uint256 priceMantissa,
    uint256 validTo,
    bytes memory signature
) public view virtual returns (uint256 evaluation)
```

return the evaluation in $ of `tokenAmount` with signed price.


Parameters:

| Name          | Type    | Description                                                                                |
| :------------ | :------ | :----------------------------------------------------------------------------------------- |
| token         | address | the address of token to get evaluation in $.                                               |
| tokenAmount   | uint256 | the amount of token to get evaluation. Amount is scaled by 10 in power token decimals.     |
| priceMantissa | uint256 | the price multiplied by priceDecimals. The dimension of priceMantissa should be $/token.   |
| validTo       | uint256 | the timestamp in seconds, when price is gonna be not valid.                                |
| signature     | bytes   | the ECDSA sign on eliptic curve secp256k1.                                                 |

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
