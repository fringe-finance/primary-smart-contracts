# wstETHPriceProvider

## Contract Description


License: MIT

## 

```solidity
contract wstETHPriceProvider is PriceProvider, Initializable, AccessControlUpgradeable
```

Price provider that uses chainlink

This contract is used to get the price of wstETH in USD.
## Events info

### GrantModeratorRole

```solidity
event GrantModeratorRole(address indexed newModerator)
```

Emitted when the moderator role is granted to a new account.


Parameters:

| Name         | Type    | Description                                     |
| :----------- | :------ | :---------------------------------------------- |
| newModerator | address | The address to which moderator role is granted. |

### RevokeModeratorRole

```solidity
event RevokeModeratorRole(address indexed moderator)
```

Emitted when the moderator role is revoked from an account.


Parameters:

| Name      | Type    | Description                                       |
| :-------- | :------ | :------------------------------------------------ |
| moderator | address | The address from which moderator role is revoked. |

### SetTokenAndAggregator

```solidity
event SetTokenAndAggregator(address indexed token, address[] aggregatorPath)
```

Emitted when the wstETH address and aggregator path are set.


Parameters:

| Name           | Type      | Description                                                                |
| :------------- | :-------- | :------------------------------------------------------------------------- |
| token          | address   | The address of the wstETH token contract.                                  |
| aggregatorPath | address[] | The array of aggregator addresses to get the price feed for wstETH in USD. |

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


### wstETH (0x4aa07e64)

```solidity
address wstETH
```


### aggregatorPath (0x004645ff)

```solidity
address[] aggregatorPath
```


### timeOuts (0x2a6377a9)

```solidity
mapping(address => uint256) timeOuts
```


## Modifiers info

### onlyAdmin

```solidity
modifier onlyAdmin()
```

Modifier to restrict access to functions to only the contract admin.
### onlyModerator

```solidity
modifier onlyModerator()
```

Modifier to restrict access to functions to only the moderator role.
The caller must have the moderator role to execute the function.
## Functions info

### initialize (0x946d9204)

```solidity
function initialize(
    address _wstETH,
    address[] memory _aggregatorPath
) public initializer
```

Initializes the wstETH price provider contract with the given wstETH address and aggregator path.


Parameters:

| Name            | Type      | Description                                                                |
| :-------------- | :-------- | :------------------------------------------------------------------------- |
| _wstETH         | address   | The address of the wstETH token contract.                                  |
| _aggregatorPath | address[] | The array of aggregator addresses to get the price feed for wstETH in USD. |

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

### addAggregatorPath (0xbe04eba7)

```solidity
function addAggregatorPath(
    address[] memory _aggregatorPath
) public onlyModerator
```

Adds a new aggregator path for the price oracle.

Requirements:
- Only the moderator can call this function.
- The length of the aggregator path must not exceed MAX_PRICE_PATH_LENGTH.


Parameters:

| Name            | Type      | Description                          |
| :-------------- | :-------- | :----------------------------------- |
| _aggregatorPath | address[] | The new aggregator path to be added. |

### setTimeOut (0x60c74154)

```solidity
function setTimeOut(
    address aggregatorPath_,
    uint256 newTimeOut
) external onlyModerator
```

Sets the timeout value corresponding to the aggregatorPath.

Example: ETH/USD have a new answer is written when the off-chain data moves more than the
0.5% deviation threshold or 3600 seconds have passed since the last answer was written on-chain.
So, the timeOut value for each aggregator will be equal to the heartbeat threshold value plus a
period of time to make the transaction update the price, that time period can be 60s or a little more.


Parameters:

| Name            | Type    | Description                                                                                                                                                                                                   |
| :-------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| aggregatorPath_ | address | The address of chainlink aggregator contract.                                                                                                                                                                 |
| newTimeOut      | uint256 | It is the amount of time it takes for a new round of aggregation to start after a specified
 amount of time since the last update plus a period of time waiting for new price update transactions to execute. |

### isActive (0x9f8a13d7)

```solidity
function isActive(address token) public view override returns (bool)
```

Checks if the given token is active.


Parameters:

| Name  | Type    | Description                          |
| :---- | :------ | :----------------------------------- |
| token | address | The address of the token to check.   |


Return values:

| Name | Type | Description                                              |
| :--- | :--- | :------------------------------------------------------- |
| [0]  | bool | A boolean indicating whether the token is active or not. |

### getPriceSTETH (0xcd78d6d4)

```solidity
function getPriceSTETH() public view returns (uint256 priceMantissa)
```

Returns the price of stETH in USD.


Return values:

| Name          | Type    | Description                                    |
| :------------ | :------ | :--------------------------------------------- |
| priceMantissa | uint256 | The price of stETH in USD as a mantissa value. |

### getPrice (0x41976e09)

```solidity
function getPrice(
    address token
) public view override returns (uint256 priceMantissa, uint8 priceDecimals)
```

Returns the price of the given token in USD.


Parameters:

| Name  | Type    | Description                                      |
| :---- | :------ | :----------------------------------------------- |
| token | address | The address of the token to get the price for.   |


Return values:

| Name          | Type    | Description                                      |
| :------------ | :------ | :----------------------------------------------- |
| priceMantissa | uint256 | The price of the token in USD, scaled by 1e18.   |
| priceDecimals | uint8   | The number of decimals in the USD price.         |

### getEvaluation (0x81fd01ea)

```solidity
function getEvaluation(
    address token,
    uint256 tokenAmount
) public view override returns (uint256 evaluation)
```

Returns the evaluation of a given token amount in USD.


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

Returns the number of decimals used for the USD price.


Return values:

| Name | Type  | Description                                    |
| :--- | :---- | :--------------------------------------------- |
| [0]  | uint8 | The number of decimals used for the USD price. |

### getLatestPrice (0x16345f18)

```solidity
function getLatestPrice(
    address aggregatorPath_
) public view virtual returns (uint256)
```

Returns the latest price after performing sanity check and staleness check.


Parameters:

| Name            | Type    | Description                                     |
| :-------------- | :------ | :---------------------------------------------- |
| aggregatorPath_ | address | The address of chainlink aggregator contract.   |


Return values:

| Name | Type    | Description                |
| :--- | :------ | :------------------------- |
| [0]  | uint256 | The latest price (answer). |
