# PriceProviderAggregatorPyth

## Overview

#### License: MIT

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

### updateMultiFinalPricesWithUpdatePrice (0x2a92f7f1)

```solidity
function updateMultiFinalPricesWithUpdatePrice(
    address[] memory token,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable
```

Calculates and update multiple the final TWAP prices of a token after update price.


Parameters:

| Name       | Type      | Description                                  |
| :--------- | :-------- | :------------------------------------------- |
| token      | address[] | The token array needs to update the price.   |
| priceIds   | bytes32[] | The priceIds need to update.                 |
| updateData | bytes[]   | The updateData provided by PythNetwork.      |

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

### getUpdatedPrice (0xb876879d)

```solidity
function getUpdatedPrice(
    address token,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
)
    external
    payable
    returns (
        uint8 priceDecimals,
        uint64 timestamp,
        uint256 collateralPrice,
        uint256 capitalPrice
    )
```

Returns the latest price of a given token in USD after update price if price provider is pythPriceProvider.


Parameters:

| Name       | Type      | Description                                     |
| :--------- | :-------- | :---------------------------------------------- |
| token      | address   | The address of the token to get the price of.   |
| priceIds   | bytes32[] | The priceIds need to update price.              |
| updateData | bytes[]   | The updateData provided by PythNetwork.         |


Return values:

| Name            | Type    | Description                                                 |
| :-------------- | :------ | :---------------------------------------------------------- |
| priceDecimals   | uint8   | The number of decimal places in the price of the token.     |
| timestamp       | uint64  | The timestamp of the price.                                 |
| collateralPrice | uint256 | The price of the token in USD, represented as a mantissa.   |
| capitalPrice    | uint256 | The price of the token in USD, represented as a mantissa.   |

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
