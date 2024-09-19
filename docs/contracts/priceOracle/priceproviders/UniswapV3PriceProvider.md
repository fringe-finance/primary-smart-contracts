# UniswapV3PriceProvider

## Overview

#### License: MIT

```solidity
contract UniswapV3PriceProvider is PriceProvider, Initializable, AccessControlUpgradeable
```


## Structs info

### UniswapV3Metadata

```solidity
struct UniswapV3Metadata {
	bool isActive;
	address[] aggregatorPath;
}
```


### UniswapV3MetadataPair

```solidity
struct UniswapV3MetadataPair {
	address token;
	address pairToken;
	uint8 tokenDecimals;
	uint8 pairTokenDecimals;
	uint32 pricePointTWAPperiod;
}
```


## Events info

### SetTokenAndPair

```solidity
event SetTokenAndPair(address indexed token, address indexed pair)
```

Emitted when the token and pair addresses are set for the UniswapV3PriceProvider contract.


Parameters:

| Name  | Type    | Description                             |
| :---- | :------ | :-------------------------------------- |
| token | address | The address of the token that is set.   |
| pair  | address | The address of the pair that is set.    |

### ChangeActive

```solidity
event ChangeActive(address indexed token, bool active)
```

Emitted when the active status of a token changes.


Parameters:

| Name   | Type    | Description                                                 |
| :----- | :------ | :---------------------------------------------------------- |
| token  | address | The address of the token whose active status has changed.   |
| active | bool    | The new active status of the token.                         |

### SetTokenDecimals

```solidity
event SetTokenDecimals(uint8 newTokenDecimals)
```

Emitted when the token decimals is set.


Parameters:

| Name             | Type  | Description             |
| :--------------- | :---- | :---------------------- |
| newTokenDecimals | uint8 | The new token decimals. |

### SetTokenAndAggregator

```solidity
event SetTokenAndAggregator(address indexed token, address[] aggregatorPath, uint32[] pricePointPeriod)
```

Emitted when a token and its corresponding UniswapV3 aggregator path are set.


Parameters:

| Name           | Type      | Description                                                                 |
| :------------- | :-------- | :-------------------------------------------------------------------------- |
| token          | address   | The address of the token.                                                   |
| aggregatorPath | address[] | The array of UniswapV3 aggregator pairs used to get the price of the token. |

## Constants info

### MODERATOR_ROLE (0x797669c9)

```solidity
bytes32 constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE")
```


### DESCRIPTION (0xf1ae8856)

```solidity
string constant DESCRIPTION = "Price provider that uses uniswapV3"
```


### MAX_PRICE_PATH_LENGTH (0x01a9a5d3)

```solidity
uint8 constant MAX_PRICE_PATH_LENGTH = 4
```


## State variables info

### tokenDecimals (0x3b97e856)

```solidity
uint8 tokenDecimals
```


### uniswapV3Metadata (0xe84cbb89)

```solidity
mapping(address => struct UniswapV3PriceProvider.UniswapV3Metadata) uniswapV3Metadata
```


### uniswapV3MetadataPair (0x918d7a98)

```solidity
mapping(address => struct UniswapV3PriceProvider.UniswapV3MetadataPair) uniswapV3MetadataPair
```


## Modifiers info

### onlyModerator

```solidity
modifier onlyModerator()
```

Modifier to restrict access to functions to only the contract moderator.
## Functions info

### initialize (0x8129fc1c)

```solidity
function initialize() public initializer
```

Initializes the contract by setting up the access control roles and the number of decimals for the USD token.
`decimals` is set to 18.
### setTokenDecimals (0xf2cf47be)

```solidity
function setTokenDecimals(uint8 newTokenDecimals) public onlyModerator
```

Sets the number of decimals used by the token.
Only the moderator can call this function.


Parameters:

| Name             | Type  | Description                                   |
| :--------------- | :---- | :-------------------------------------------- |
| newTokenDecimals | uint8 | The new number of decimals used by the token. |

### setTokenAndPair (0x8d46526f)

```solidity
function setTokenAndPair(
    address token,
    address[] memory aggregatorPath,
    uint32[] memory pricePointPeriod
) external onlyModerator
```

Set token and aggregator path.
#### Requirements:
- The token must be listed in the UniswapV3PriceProvider contract.
- Only the contract moderator can call this function.


Parameters:

| Name             | Type      | Description                           |
| :--------------- | :-------- | :------------------------------------ |
| token            | address   | The address of the token.             |
| aggregatorPath   | address[] | The address of the aggregator path.   |
| pricePointPeriod | uint32[]  | The period for the price point.       |

### changeActive (0x258a4532)

```solidity
function changeActive(address token, bool active) public override onlyModerator
```

Changes the active status of a token in the UniswapV3PriceProvider con
     tract.
#### Requirements:
- The token must be listed in the UniswapV3PriceProvider contract.
- Only the contract moderator can call this function.


Parameters:

| Name   | Type    | Description                                                 |
| :----- | :------ | :---------------------------------------------------------- |
| token  | address | The address of the token to change the active status for.   |
| active | bool    | The new active status of the token.                         |

### isListed (0xf794062e)

```solidity
function isListed(address token) public view override returns (bool)
```

Check if a token is listed on UniswapV3.


Parameters:

| Name  | Type    | Description                          |
| :---- | :------ | :----------------------------------- |
| token | address | The address of the token to check.   |


Return values:

| Name | Type | Description                             |
| :--- | :--- | :-------------------------------------- |
| [0]  | bool | isListed the is listed status of token. |

### isActive (0x9f8a13d7)

```solidity
function isActive(address token) public view override returns (bool)
```

Returns whether the specified token is active or not.


Parameters:

| Name  | Type    | Description                          |
| :---- | :------ | :----------------------------------- |
| token | address | The address of the token to check.   |


Return values:

| Name | Type | Description                                              |
| :--- | :--- | :------------------------------------------------------- |
| [0]  | bool | A boolean indicating whether the token is active or not. |

### getPrice (0x41976e09)

```solidity
function getPrice(
    address token
) public view override returns (uint256 priceMantissa, uint8 priceDecimals)
```

This function requires that the token is active in the price provider.
Returns the price of a given token in pairAsset, and the number of decimals for the price.


Parameters:

| Name  | Type    | Description                                      |
| :---- | :------ | :----------------------------------------------- |
| token | address | The address of the token to get the price for.   |


Return values:

| Name          | Type    | Description                             |
| :------------ | :------ | :-------------------------------------- |
| priceMantissa | uint256 | The price of the token in pairAsset.    |
| priceDecimals | uint8   | The number of decimals for the price.   |

### getUnderlyingTokenPrice (0x8020c854)

```solidity
function getUnderlyingTokenPrice(
    address token,
    address pair
) public view returns (uint256 price, uint8 priceDecimals, address pairAsset)
```


### getPriceDecimals (0x1b30aafc)

```solidity
function getPriceDecimals() public view override returns (uint8)
```

Returns the number of decimals used for the USD price.


Return values:

| Name | Type  | Description                                    |
| :--- | :---- | :--------------------------------------------- |
| [0]  | uint8 | The number of decimals used for the USD price. |

### getUniswapV3Metadata (0xb790348b)

```solidity
function getUniswapV3Metadata(
    address token
) public view returns (UniswapV3PriceProvider.UniswapV3Metadata memory)
```

Returns the metadata set up for token.


Parameters:

| Name  | Type    | Description                 |
| :---- | :------ | :-------------------------- |
| token | address | The address of the token.   |


Return values:

| Name | Type                                            | Description                                                                                                              |
| :--- | :---------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| [0]  | struct UniswapV3PriceProvider.UniswapV3Metadata | metadata The metadata includes the active status, pair address, pairAsset address, tokenDecimals, and pairAssetDecimals. |
