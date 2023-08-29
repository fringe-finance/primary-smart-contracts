# LPPriceProvider

## Contract Description


License: MIT

## 

```solidity
contract LPPriceProvider is PriceProvider, Initializable, AccessControlUpgradeable
```

The LPPriceProvider contract is the contract that provides the functionality of getting the latest price from Uniswap V2 LP tokens.

Contract that provides the functionality of getting the latest price from Uniswap V2 LP tokens. Inherit from PriceProvider.
## Structs info

### LPMetadata

```solidity
struct LPMetadata {
	bool isActive;
	address base;
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

### SetLPTokenAndPriceProvider

```solidity
event SetLPTokenAndPriceProvider(address indexed token, address indexed priceProvider)
```

Emitted when the LPToken and its corresponding price provider are set.


Parameters:

| Name          | Type    | Description                                 |
| :------------ | :------ | :------------------------------------------ |
| token         | address | The address of the LPToken.                 |
| priceProvider | address | The address of the price provider contract. |

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


## State variables info

### usdDecimals (0x66a4b6c0)

```solidity
uint8 usdDecimals
```


### lpMetadata (0x1e3214d8)

```solidity
mapping(address => struct LPPriceProvider.LPMetadata) lpMetadata
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

Initializes the LPPriceProvider contract by setting up the access control roles and the number of decimals for the USD price.
### grandModerator (0x04ebc8b1)

```solidity
function grandModerator(address newModerator) public onlyAdmin
```

Grants the MODERATOR_ROLE to a new address.
Caller must be the admin.


Parameters:

| Name         | Type    | Description                       |
| :----------- | :------ | :-------------------------------- |
| newModerator | address | The address to grant the role to. |

### revokeModerator (0x36445636)

```solidity
function revokeModerator(address moderator) public onlyAdmin
```

Revokes the MODERATOR_ROLE from an address.
Caller must be the admin.


Parameters:

| Name      | Type    | Description                          |
| :-------- | :------ | :----------------------------------- |
| moderator | address | The address to revoke the role from. |

### setLPTokenAndProvider (0x98a0fb36)

```solidity
function setLPTokenAndProvider(
    address lpToken,
    address provider
) public onlyModerator
```

Sets the LP token and price provider for the given LP token address.
#### Requirements:
- `lpToken` cannot be the zero address.
- `provider` cannot be the zero address.


Parameters:

| Name     | Type    | Description                        |
| :------- | :------ | :--------------------------------- |
| lpToken  | address | The address of the LP token.       |
| provider | address | The address of the price provider. |

### changeActive (0x258a4532)

```solidity
function changeActive(address token, bool active) public override onlyModerator
```

Changes the active status of a token in the LPPriceProvider contract.
#### Requirements:
- The token must be listed in the contract.
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

Checks if a token is listed in the LPPriceProvider.


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

### getUSDPx (0x89378bc7)

```solidity
function getUSDPx(address lpToken) public view returns (uint256)
```

Returns the value of the given input as ETH per unit, multiplied by 2**112.


Parameters:

| Name    | Type    | Description                    |
| :------ | :------ | :----------------------------- |
| lpToken | address | The address of the LP token.   |


Return values:

| Name | Type    | Description                                      |
| :--- | :------ | :----------------------------------------------- |
| [0]  | uint256 | The USD price of the LP token in uint256 format. |

### getPrice (0x41976e09)

```solidity
function getPrice(
    address lpToken
) public view override returns (uint256 priceMantissa, uint8 priceDecimals)
```

Returns the price of the given LP token in USD.


Parameters:

| Name    | Type    | Description                    |
| :------ | :------ | :----------------------------- |
| lpToken | address | The address of the LP token.   |


Return values:

| Name          | Type    | Description                                                    |
| :------------ | :------ | :------------------------------------------------------------- |
| priceMantissa | uint256 | The price of the LP token in USD, represented as a mantissa.   |
| priceDecimals | uint8   | The number of decimals in the price of the LP token in USD.    |

### getEvaluation (0x81fd01ea)

```solidity
function getEvaluation(
    address lpToken,
    uint256 tokenAmount
) public view override returns (uint256 evaluation)
```

Returns the evaluation of a given amount of LP tokens in USD.


Parameters:

| Name        | Type    | Description                            |
| :---------- | :------ | :------------------------------------- |
| lpToken     | address | The address of the LP token.           |
| tokenAmount | uint256 | The amount of LP tokens to evaluate.   |


Return values:

| Name       | Type    | Description                                             |
| :--------- | :------ | :------------------------------------------------------ |
| evaluation | uint256 | The evaluation of the given amount of LP tokens in USD. |

### getPriceDecimals (0x1b30aafc)

```solidity
function getPriceDecimals() public view override returns (uint8)
```

Returns the number of decimals used for the price provided by this contract.


Return values:

| Name | Type  | Description                                                          |
| :--- | :---- | :------------------------------------------------------------------- |
| [0]  | uint8 | The number of decimals used for the price provided by this contract. |
