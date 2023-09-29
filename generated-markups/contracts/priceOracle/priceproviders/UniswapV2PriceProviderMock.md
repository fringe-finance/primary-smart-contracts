# UniswapV2PriceProviderMock

## Contract Description


License: MIT

## 

```solidity
contract UniswapV2PriceProviderMock is PriceProvider, Initializable, AccessControlUpgradeable
```

This implementation can be affected by price manipulation due to not using TWAP.
For development purposes only
## Structs info

### PriceInfo

```solidity
struct PriceInfo {
	uint256 price;
	uint8 tokenDecimals;
}
```


### UniswapV2Metadata

```solidity
struct UniswapV2Metadata {
	bool isActive;
	address pair;
	address pairAsset;
	uint8 tokenDecimals;
	uint8 pairAssetDecimals;
}
```


## Events info

### GrantModeratorRole

```solidity
event GrantModeratorRole(address indexed newModerator)
```


### RevokeModeratorRole

```solidity
event RevokeModeratorRole(address indexed moderator)
```


### SetTokenAndPrice

```solidity
event SetTokenAndPrice(address indexed token, uint256 price)
```


### ChangeActive

```solidity
event ChangeActive(address indexed token, bool active)
```


## Constants info

### MODERATOR_ROLE (0x797669c9)

```solidity
bytes32 constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE")
```


### DESCRIPTION (0xf1ae8856)

```solidity
string constant DESCRIPTION = "Price provider that uses uniswapV2"
```


## State variables info

### usdDecimals (0x66a4b6c0)

```solidity
uint8 usdDecimals
```


### uniswapV2Metadata (0x809205db)

```solidity
mapping(address => struct UniswapV2PriceProviderMock.UniswapV2Metadata) uniswapV2Metadata
```


### tokenPrice (0x84ba3f69)

```solidity
mapping(address => struct UniswapV2PriceProviderMock.PriceInfo) tokenPrice
```


## Modifiers info

### onlyAdmin

```solidity
modifier onlyAdmin()
```


### onlyModerator

```solidity
modifier onlyModerator()
```


## Functions info

### initialize (0x8129fc1c)

```solidity
function initialize() public initializer
```


### grantModerator (0x6981c7ae)

```solidity
function grantModerator(address newModerator) public onlyAdmin
```


### revokeModerator (0x36445636)

```solidity
function revokeModerator(address moderator) public onlyAdmin
```


### setTokenAndPrice (0x179750ec)

```solidity
function setTokenAndPrice(address token, uint256 price) public onlyModerator
```


### changeActive (0x258a4532)

```solidity
function changeActive(address token, bool active) public override onlyModerator
```

Changes the active status of a token.


Parameters:

| Name   | Type    | Description                                                 |
| :----- | :------ | :---------------------------------------------------------- |
| token  | address | The address of the token to change the active status for.   |
| active | bool    | The new active status of the token.                         |

### isListed (0xf794062e)

```solidity
function isListed(address token) public view override returns (bool)
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

### isActive (0x9f8a13d7)

```solidity
function isActive(address token) public view override returns (bool)
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

### getPrice (0x41976e09)

```solidity
function getPrice(
    address token
) public view override returns (uint256 price, uint8 priceDecimals)
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

### getEvaluation (0x81fd01ea)

```solidity
function getEvaluation(
    address token,
    uint256 tokenAmount
) public view override returns (uint256 evaluation)
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

### getReserves (0x32749461)

```solidity
function getReserves(
    address uniswapPair,
    address tokenA,
    address tokenB
) public view returns (uint256 reserveA, uint256 reserveB)
```


### getPriceDecimals (0x1b30aafc)

```solidity
function getPriceDecimals() public view override returns (uint8)
```

Returns the number of decimal places for the price returned by the price provider.


Return values:

| Name          | Type  | Description                                 |
| :------------ | :---- | :------------------------------------------ |
| priceDecimals | uint8 | The number of decimal places for the price. |
