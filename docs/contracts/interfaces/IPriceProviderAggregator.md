# IPriceProviderAggregator

## Overview

#### License: MIT

```solidity
interface IPriceProviderAggregator
```


## Functions info

### setTokenAndPriceProvider (0xf913ab66)

```solidity
function setTokenAndPriceProvider(
    address token,
    address priceProvider,
    uint8 priceDecimals
) external
```

Sets price provider to `token` and its corresponding price provider.


Parameters:

| Name          | Type    | Description                                                                         |
| :------------ | :------ | :---------------------------------------------------------------------------------- |
| token         | address | the address of token.                                                               |
| priceProvider | address | the address of price provider. Should implement the interface of `PriceProvider`.   |
| priceDecimals | uint8   | the decimals of token price.                                                        |

### changeActive (0x3651084e)

```solidity
function changeActive(
    address priceProvider,
    address token,
    bool active
) external
```

Allows the moderator to change the active status of a price provider for a specific token.


Parameters:

| Name          | Type    | Description                                                          |
| :------------ | :------ | :------------------------------------------------------------------- |
| priceProvider | address | The address of the price provider to change the active status for.   |
| token         | address | The address of the token to change the active status for.            |
| active        | bool    | The new active status to set for the price provider.                 |

### updateMultiFinalPrices (0x1e5f85e6)

```solidity
function updateMultiFinalPrices(address[] memory token) external
```

Calculates and update multiple the final TWAP prices of a token.


Parameters:

| Name  | Type      | Description                                |
| :---- | :-------- | :----------------------------------------- |
| token | address[] | The token array needs to update the price. |

### updatePrices (0x0aa9adbc)

```solidity
function updatePrices(
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable
```

Perform a price update if the price is no longer valid.


Parameters:

| Name       | Type      | Description                             |
| :--------- | :-------- | :-------------------------------------- |
| priceIds   | bytes32[] | The priceIds need to update.            |
| updateData | bytes[]   | The updateData provided by PythNetwork. |

### getTokensUpdateFinalPrices (0xef290120)

```solidity
function getTokensUpdateFinalPrices(
    address projectToken,
    address actualLendingToken,
    bool isBorrow
) external view returns (address[] memory tokens)
```

This function is called when performing operations using token prices, to determine which tokens will need to update their final price.


Parameters:

| Name               | Type    | Description                                                                                              |
| :----------------- | :------ | :------------------------------------------------------------------------------------------------------- |
| projectToken       | address | Address of the project token.                                                                            |
| actualLendingToken | address | Address of the lending token.                                                                            |
| isBorrow           | bool    | Whether getting the list of tokens for updateFinalPrices is related to the borrowing operation or not.   |


Return values:

| Name   | Type      | Description                                      |
| :----- | :-------- | :----------------------------------------------- |
| tokens | address[] | Array of tokens that need to update final price. |

### tokenPriceProvider (0xa33540f1)

```solidity
function tokenPriceProvider(
    address token
) external view returns (address priceProvider)
```

Returns priceProvider address.


Parameters:

| Name  | Type    | Description                                                       |
| :---- | :------ | :---------------------------------------------------------------- |
| token | address | The address of token which address of priceProvider is to return. |

### getPrice (0x41976e09)

```solidity
function getPrice(
    address token
)
    external
    view
    returns (
        uint8 priceDecimals,
        uint32 timestamp,
        uint256 collateralPrice,
        uint256 capitalPrice
    )
```

Returns the most recent TWAP price of a token.


Parameters:

| Name  | Type    | Description                 |
| :---- | :------ | :-------------------------- |
| token | address | The address of the token.   |


Return values:

| Name            | Type    | Description                                |
| :-------------- | :------ | :----------------------------------------- |
| priceDecimals   | uint8   | The decimals of the price.                 |
| timestamp       | uint32  | The last updated timestamp of the price.   |
| collateralPrice | uint256 | The collateral price of the token.         |
| capitalPrice    | uint256 | The capital price of the token.            |

### getEvaluation (0x81fd01ea)

```solidity
function getEvaluation(
    address token,
    uint256 tokenAmount
)
    external
    view
    returns (uint256 collateralEvaluation, uint256 capitalEvaluation)
```

returns the most TWAP price in USD evaluation of token by its `tokenAmount`


Parameters:

| Name        | Type    | Description                        |
| :---------- | :------ | :--------------------------------- |
| token       | address | the address of token to evaluate   |
| tokenAmount | uint256 | the amount of token to evaluate    |


Return values:

| Name                 | Type    | Description                                                            |
| :------------------- | :------ | :--------------------------------------------------------------------- |
| collateralEvaluation | uint256 | the USD evaluation of token by its `tokenAmount` in collateral price   |
| capitalEvaluation    | uint256 | the USD evaluation of token by its `tokenAmount` in capital price      |

### getPriceSigned (0x52bd8224)

```solidity
function getPriceSigned(
    address token,
    uint256 _priceMantissa,
    uint8 _priceDecimals,
    uint256 validTo,
    bytes memory signature
) external view returns (uint256 priceMantissa, uint8 priceDecimals)
```

returns the price of token multiplied by 10 ** priceDecimals given by price provider.
price can be calculated as  priceMantissa / (10 ** priceDecimals).
i.e. price = priceMantissa / (10 ** priceDecimals).


Parameters:

| Name           | Type    | Description                                                     |
| :------------- | :------ | :-------------------------------------------------------------- |
| token          | address | the address of token.                                           |
| _priceMantissa | uint256 | - the price of token (used in verifying the signature).         |
| _priceDecimals | uint8   | - the price decimals (used in verifying the signature).         |
| validTo        | uint256 | - the timestamp in seconds (used in verifying the signature).   |
| signature      | bytes   | - the backend signature of secp256k1. length is 65 bytes.       |

### getEvaluationSigned (0xf91b9dc2)

```solidity
function getEvaluationSigned(
    address token,
    uint256 tokenAmount,
    uint256 priceMantissa,
    uint8 priceDecimals,
    uint256 validTo,
    bytes memory signature
) external view returns (uint256 evaluation)
```

Returns the USD evaluation of token by its `tokenAmount`.


Parameters:

| Name          | Type    | Description                                                     |
| :------------ | :------ | :-------------------------------------------------------------- |
| token         | address | the address of token.                                           |
| tokenAmount   | uint256 | the amount of token including decimals.                         |
| priceMantissa | uint256 | - the price of token (used in verifying the signature).         |
| priceDecimals | uint8   | - the price decimals (used in verifying the signature).         |
| validTo       | uint256 | - the timestamp in seconds (used in verifying the signature).   |
| signature     | bytes   | - the backend signature of secp256k1. length is 65 bytes.       |
