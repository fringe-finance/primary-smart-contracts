# UniswapV2PriceProvider

## Contract Description


License: MIT

## 

```solidity
contract UniswapV2PriceProvider is PriceProvider, Initializable, AccessControlUpgradeable
```

This implementation can be affected by price manipulation due to not using TWAP.
For development purposes only
## Structs info

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

### GrandModeratorRole

```solidity
event GrandModeratorRole(address indexed newModerator)
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

### SetTokenAndPair

```solidity
event SetTokenAndPair(address indexed token, address indexed pair)
```

Emitted when the token and pair addresses are set for the UniswapV2PriceProvider contract.


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
mapping(address => struct UniswapV2PriceProvider.UniswapV2Metadata) uniswapV2Metadata
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

Modifier to restrict access to functions to only the contract moderator.
## Functions info

### initialize (0x8129fc1c)

```solidity
function initialize() public initializer
```

Initializes the contract by setting up the access control roles and the number of decimals for the USD token.
### grandModerator (0x04ebc8b1)

```solidity
function grandModerator(address newModerator) public onlyAdmin
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

### setTokenAndPair (0xa6ff9e94)

```solidity
function setTokenAndPair(address token, address pair) public onlyModerator
```

Sets the token and pair addresses for the UniswapV2PriceProvider contract.

Requirements:
- `token` and `pair` addresses must not be zero.
- Only the contract moderator can call this function.
- The `token` and `pair` addresses must be valid.
- The `metadata` struct for the `token` address must be updated with the `pair` address, `pairAsset` address, `tokenDecimals`, and `pairAssetDecimals`.


Parameters:

| Name  | Type    | Description                           |
| :---- | :------ | :------------------------------------ |
| token | address | The address of the token to be set.   |
| pair  | address | The address of the pair to be set.    |

### changeActive (0x258a4532)

```solidity
function changeActive(address token, bool active) public override onlyModerator
```

Changes the active status of a token in the UniswapV2PriceProvider contract.

Requirements:
- The token must be listed in the UniswapV2PriceProvider contract.
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

Check if a token is listed on UniswapV2.


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
) public view override returns (uint256 price, uint8 priceDecimals)
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
| price         | uint256 | The price of the token in pairAsset.    |
| priceDecimals | uint8   | The number of decimals for the price.   |

### getEvaluation (0x81fd01ea)

```solidity
function getEvaluation(
    address token,
    uint256 tokenAmount
) public view override returns (uint256 evaluation)
```

Returns the evaluation of a given token amount in USD using the UniswapV2 price oracle.


Parameters:

| Name        | Type    | Description                             |
| :---------- | :------ | :-------------------------------------- |
| token       | address | The address of the token to evaluate.   |
| tokenAmount | uint256 | The amount of tokens to evaluate.       |


Return values:

| Name       | Type    | Description                                |
| :--------- | :------ | :----------------------------------------- |
| evaluation | uint256 | The evaluation of the token amount in USD. |

### getReserves (0x32749461)

```solidity
function getReserves(
    address uniswapPair,
    address tokenA,
    address tokenB
) public view returns (uint256 reserveA, uint256 reserveB)
```

Returns the reserves of the specified Uniswap V2 pair for the given tokens.


Parameters:

| Name        | Type    | Description                           |
| :---------- | :------ | :------------------------------------ |
| uniswapPair | address | The address of the Uniswap V2 pair.   |
| tokenA      | address | The address of the first token.       |
| tokenB      | address | The address of the second token.      |


Return values:

| Name     | Type    | Description                       |
| :------- | :------ | :-------------------------------- |
| reserveA | uint256 | The reserve of the first token.   |
| reserveB | uint256 | The reserve of the second token.  |

### getPriceDecimals (0x1b30aafc)

```solidity
function getPriceDecimals() public view override returns (uint8)
```

Returns the number of decimals used for the USD price.


Return values:

| Name | Type  | Description                                    |
| :--- | :---- | :--------------------------------------------- |
| [0]  | uint8 | The number of decimals used for the USD price. |
