# IPriceProviderAggregator

## Interface Description


License: MIT

## 

```solidity
interface IPriceProviderAggregator
```


## Functions info

### setTokenAndPriceProvider (0x3ca82a11)

```solidity
function setTokenAndPriceProvider(
    address token,
    address priceProvider,
    bool hasFunctionWithSign
) external
```

Sets price provider to `token` and its corresponding price provider.


Parameters:

| Name                | Type    | Description                                                                                                               |
| :------------------ | :------ | :------------------------------------------------------------------------------------------------------------------------ |
| token               | address | the address of token.                                                                                                     |
| priceProvider       | address | the address of price provider. Should implement the interface of `PriceProvider`.                                         |
| hasFunctionWithSign | bool    | true - if price provider has function with signatures.
 false - if price provider does not have function with signatures. |

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

### getPrice (0x41976e09)

```solidity
function getPrice(
    address token
) external view returns (uint256 priceMantissa, uint8 priceDecimals)
```

returns tuple (priceMantissa, priceDecimals).
price = priceMantissa / (10 ** priceDecimals)


Parameters:

| Name  | Type    | Description                                  |
| :---- | :------ | :------------------------------------------- |
| token | address | the address of token wich price is to return |

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

### getEvaluation (0x81fd01ea)

```solidity
function getEvaluation(
    address token,
    uint256 tokenAmount
) external view returns (uint256 evaluation)
```

Returns the USD evaluation of token by its `tokenAmount`.


Parameters:

| Name        | Type    | Description                         |
| :---------- | :------ | :---------------------------------- |
| token       | address | the address of token to evaluate.   |
| tokenAmount | uint256 | the amount of token to evaluate.    |

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
