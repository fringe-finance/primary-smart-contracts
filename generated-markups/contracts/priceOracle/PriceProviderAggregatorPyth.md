# PriceProviderAggregatorPyth

## Contract Description


License: MIT

## 

```solidity
contract PriceProviderAggregatorPyth is PriceProviderAggregator
```

The PriceProviderAggregatorPyth contract is the contract that provides the functionality of getting the latest price from PythNetwork.

Contract that provides the functionality of getting the latest price from PythNetwork. Inherit from PriceProviderAggregator.
## Events info

### SetPythPriceProvider

```solidity
event SetPythPriceProvider(address indexed newPythPriceProvider)
```

Emitted when a new Pyth price provider is set.
## State variables info

### pythPriceProvider (0x5ea2a7a9)

```solidity
address pythPriceProvider
```


## Functions info

### setPythPriceProvider (0x2ebccb0f)

```solidity
function setPythPriceProvider(
    address newPythPriceProvider
) external onlyModerator
```

Sets PythPriceProvider contract.

Requirements:
- The caller must be the moderator.
- `newPythPriceProvider` must not be the zero address.


Parameters:

| Name                 | Type    | Description                                |
| :------------------- | :------ | :----------------------------------------- |
| newPythPriceProvider | address | The address of PythPriceProvider contract. |

### updatePrices (0x0aa9adbc)

```solidity
function updatePrices(
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable
```

Performs a price update if the price is no longer valid.


Parameters:

| Name       | Type      | Description                             |
| :--------- | :-------- | :-------------------------------------- |
| priceIds   | bytes32[] | The priceIds need to update.            |
| updateData | bytes[]   | The updateData provided by PythNetwork. |

### getUpdatedPrice (0xe8ad2b23)

```solidity
function getUpdatedPrice(
    address token,
    bytes[] calldata updateData
) external payable returns (uint256 priceMantissa, uint8 priceDecimals)
```

Returns the latest price of a given token in USD after update price if price provider is pythPriceProvider.


Parameters:

| Name       | Type    | Description                                     |
| :--------- | :------ | :---------------------------------------------- |
| token      | address | The address of the token to get the price of.   |
| updateData | bytes[] | The updateData provided by PythNetwork.         |


Return values:

| Name          | Type    | Description                                                 |
| :------------ | :------ | :---------------------------------------------------------- |
| priceMantissa | uint256 | The price of the token in USD, represented as a mantissa.   |
| priceDecimals | uint8   | The number of decimal places in the price of the token.     |

### getExpiredPriceFeeds (0xe1f67b13)

```solidity
function getExpiredPriceFeeds(
    address[] memory token,
    uint256 timeBeforeExpiration
) external view returns (bytes32[] memory priceIds, uint256 updateFee)
```

Returns the priceId array to update the price before expiration and the update fee.


Parameters:

| Name                 | Type      | Description                                                                   |
| :------------------- | :-------- | :---------------------------------------------------------------------------- |
| token                | address[] | The address array of tokens needs to check if the price is about to expire.   |
| timeBeforeExpiration | uint256   | Time before expiration.                                                       |


Return values:

| Name      | Type      | Description                                    |
| :-------- | :-------- | :--------------------------------------------- |
| priceIds  | bytes32[] | The priceId array needs to update the price.   |
| updateFee | uint256   | The update fee.                                |

### getEvaluationUnsafe (0xb03ec98d)

```solidity
function getEvaluationUnsafe(
    address token,
    uint256 tokenAmount
) public view returns (uint256 evaluation)
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
