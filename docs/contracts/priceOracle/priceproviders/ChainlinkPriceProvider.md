# ChainlinkPriceProvider

## Overview

#### License: MIT

## 

```solidity
contract ChainlinkPriceProvider is PriceProvider, Initializable, AccessControlUpgradeable
```

The ChainlinkPriceProvider contract is the contract that provides the functionality for getting the price of a token using Chainlink.
## Structs info

### ChainlinkMetadata

```solidity
struct ChainlinkMetadata {
	bool isActive;
	address[] aggregatorPath;
}
```


## Events info

### GrantModeratorRole

```solidity
event GrantModeratorRole(address indexed newModerator)
```

Emitted when the moderator role is granted to a new address.


Parameters:

| Name         | Type    | Description                       |
| :----------- | :------ | :-------------------------------- |
| newModerator | address | The address of the new moderator. |

### RevokeModeratorRole

```solidity
event RevokeModeratorRole(address indexed moderator)
```

Emitted when the moderator role is revoked from an address.


Parameters:

| Name      | Type    | Description                                 |
| :-------- | :------ | :------------------------------------------ |
| moderator | address | The address of the moderator to be revoked. |

### SetTokenAndAggregator

```solidity
event SetTokenAndAggregator(address indexed token, address[] aggregatorPath)
```

Emitted when a token and its corresponding Chainlink aggregator path are set.


Parameters:

| Name           | Type      | Description                                                                     |
| :------------- | :-------- | :------------------------------------------------------------------------------ |
| token          | address   | The address of the token.                                                       |
| aggregatorPath | address[] | The array of Chainlink aggregator addresses used to get the price of the token. |

### ChangeActive

```solidity
event ChangeActive(address indexed token, bool active)
```

Emitted when the active status of a token is changed.


Parameters:

| Name   | Type    | Description                                                |
| :----- | :------ | :--------------------------------------------------------- |
| token  | address | The address of the token whose active status is changed.   |
| active | bool    | The new active status of the token.                        |

### SetTimeOut

```solidity
event SetTimeOut(address indexed aggregatorPath, uint256 newTimeOut)
```

Emitted when the time out for a Chainlink aggregator path is set.


Parameters:

| Name           | Type    | Description                                     |
| :------------- | :------ | :---------------------------------------------- |
| aggregatorPath | address | The address of the Chainlink aggregator path.   |
| newTimeOut     | uint256 | The new time out value in seconds.              |

## Constants info

### MODERATOR_ROLE (0x797669c9)

```solidity
bytes32 constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE")
```


### DESCRIPTION (0xf1ae8856)

```solidity
string constant DESCRIPTION = "Price provider that uses chainlink"
```


### MAX_PRICE_PATH_LENGTH (0x01a9a5d3)

```solidity
uint8 constant MAX_PRICE_PATH_LENGTH = 5
```


## State variables info

### usdDecimals (0x66a4b6c0)

```solidity
uint8 usdDecimals
```


### timeOuts (0x2a6377a9)

```solidity
mapping(address => uint256) timeOuts
```


### chainlinkMetadata (0x8cc19163)

```solidity
mapping(address => struct ChainlinkPriceProvider.ChainlinkMetadata) chainlinkMetadata
```


## Modifiers info

### onlyAdmin

```solidity
modifier onlyAdmin()
```

Modifier to restrict access to functions to only the contract's admin.
### onlyModerator

```solidity
modifier onlyModerator()
```

Modifier to restrict access to functions to only the contract's moderator.
## Functions info

### initialize (0x8129fc1c)

```solidity
function initialize() public initializer
```

Initializes the contract by setting up the access control roles and assigning them to the contract deployer.
The `DEFAULT_ADMIN_ROLE` and `MODERATOR_ROLE` roles are set up with the contract deployer as the initial role bearer.
`usdDecimals` is set to 6.
### grantModerator (0x6981c7ae)

```solidity
function grantModerator(address newModerator) public onlyAdmin
```

Grants the moderator role to a new address.


Parameters:

| Name         | Type    | Description                       |
| :----------- | :------ | :-------------------------------- |
| newModerator | address | The address of the new moderator. |

### revokeModerator (0x36445636)

```solidity
function revokeModerator(address moderator) public onlyAdmin
```

Revokes the moderator role from an address.


Parameters:

| Name      | Type    | Description                                 |
| :-------- | :------ | :------------------------------------------ |
| moderator | address | The address of the moderator to be revoked. |

### setTimeOut (0x60c74154)

```solidity
function setTimeOut(
    address aggregatorPath,
    uint256 newTimeOut
) external onlyModerator
```

Sets the timeout value corresponding to the aggregatorPath.

Example: ETH/USD have a new answer is written when the off-chain data moves more than the
0.5% deviation threshold or 3600 seconds have passed since the last answer was written on-chain.
So, the timeOut value for each aggregator will be equal to the heartbeat threshold value plus a
period of time to make the transaction update the price, that time period can be 60s or a little more.


Parameters:

| Name           | Type    | Description                                                                                                                                                                                                   |
| :------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| aggregatorPath | address | The address of chainlink aggregator contract.                                                                                                                                                                 |
| newTimeOut     | uint256 | It is the amount of time it takes for a new round of aggregation to start after a specified
 amount of time since the last update plus a period of time waiting for new price update transactions to execute. |

### setTokenAndAggregator (0xedc607b0)

```solidity
function setTokenAndAggregator(
    address token,
    address[] memory aggregatorPath
) public onlyModerator
```

Set token and aggregator path.


Parameters:

| Name           | Type      | Description                         |
| :------------- | :-------- | :---------------------------------- |
| token          | address   | The address of the token.           |
| aggregatorPath | address[] | The address of the aggregator path. |

### changeActive (0x258a4532)

```solidity
function changeActive(address token, bool active) public override onlyModerator
```

Change active status of token.


Parameters:

| Name   | Type    | Description                 |
| :----- | :------ | :-------------------------- |
| token  | address | The address of the token.   |
| active | bool    | The active status of token. |

### isListed (0xf794062e)

```solidity
function isListed(address token) public view override returns (bool)
```

Returns the is listed status of token.


Parameters:

| Name  | Type    | Description             |
| :---- | :------ | :---------------------- |
| token | address | the address of token.   |


Return values:

| Name | Type | Description                             |
| :--- | :--- | :-------------------------------------- |
| [0]  | bool | isListed the is listed status of token. |

### isActive (0x9f8a13d7)

```solidity
function isActive(address token) public view override returns (bool)
```

Returns the is active status of token.


Parameters:

| Name  | Type    | Description             |
| :---- | :------ | :---------------------- |
| token | address | the address of token.   |


Return values:

| Name | Type | Description                             |
| :--- | :--- | :-------------------------------------- |
| [0]  | bool | isActive the is active status of token. |

### getLatestPrice (0x16345f18)

```solidity
function getLatestPrice(
    address aggregatorPath
) public view virtual returns (uint256)
```

ReturnS the latest price after performing sanity check and staleness check.


Parameters:

| Name           | Type    | Description                                     |
| :------------- | :------ | :---------------------------------------------- |
| aggregatorPath | address | The address of chainlink aggregator contract.   |


Return values:

| Name | Type    | Description                |
| :--- | :------ | :------------------------- |
| [0]  | uint256 | The latest price (answer). |

### getPrice (0x41976e09)

```solidity
function getPrice(
    address token
) public view override returns (uint256 priceMantissa, uint8 priceDecimals)
```

Returns the latest asset price mantissa and price decimals. 

[price] = USD/token
- First step is get priceMantissa with priceDecimals by this formula:
price = 1 * 10 ** tokenDecimals * (chainlinkPrice_1 / 10 ** priceDecimals_1) * ... * (chainlinkPrice_n / 10 ** priceDecimals_n) =
= 10 ** tokenDecimals (chainlinkPrice_1 * ... * chainlinkPrice_n) / 10 ** (priceDecimals_1 + ... + priceDecimals_n)
- Second step is scale priceMantissa to usdDecimals.


Parameters:

| Name  | Type    | Description        |
| :---- | :------ | :----------------- |
| token | address | the token address. |

### getEvaluation (0x81fd01ea)

```solidity
function getEvaluation(
    address token,
    uint256 tokenAmount
) public view override returns (uint256 evaluation)
```

Returns the evaluation of a given token amount in USD using the Chainlink price feed.


Parameters:

| Name        | Type    | Description                             |
| :---------- | :------ | :-------------------------------------- |
| token       | address | The address of the token to evaluate.   |
| tokenAmount | uint256 | The amount of tokens to evaluate.       |


Return values:

| Name       | Type    | Description                                |
| :--------- | :------ | :----------------------------------------- |
| evaluation | uint256 | The evaluation of the token amount in USD. |

### getPriceDecimals (0x1b30aafc)

```solidity
function getPriceDecimals() public view override returns (uint8)
```

Returns the number of decimals used for the price provided by the Chainlink oracle.


Return values:

| Name | Type  | Description                                |
| :--- | :---- | :----------------------------------------- |
| [0]  | uint8 | The number of decimals used for the price. |

### getChainlinkMetadata (0xd718fc11)

```solidity
function getChainlinkMetadata(
    address token
) public view returns (ChainlinkPriceProvider.ChainlinkMetadata memory)
```

Returns the metadata set up for token.


Parameters:

| Name  | Type    | Description                 |
| :---- | :------ | :-------------------------- |
| token | address | The address of the token.   |


Return values:

| Name | Type                                            | Description                                                                                                                           |
| :--- | :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| [0]  | struct ChainlinkPriceProvider.ChainlinkMetadata | metadata The metadata includes active status of token and array of Chainlink aggregator addresses used to get the price of the token. |
