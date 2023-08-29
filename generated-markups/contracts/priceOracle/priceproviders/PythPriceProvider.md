# PythPriceProvider

## Contract Description


License: MIT

## 

```solidity
contract PythPriceProvider is PriceProvider, Initializable, AccessControlUpgradeable
```

The PythPriceProvider contract is the contract that provides the functionality of getting the latest price from PythNetwork.

Contract that provides the functionality of getting the latest price from PythNetwork. Inherit from PriceProvider.
## Structs info

### PythMetadata

```solidity
struct PythMetadata {
	bytes32[] priceIdPath;
	bool isActive;
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

### SetTokenAndPriceIdPath

```solidity
event SetTokenAndPriceIdPath(address indexed token, bytes32[] priceIdPath)
```

Emitted when the token and its corresponding price ID path are set.


Parameters:

| Name        | Type      | Description                                                         |
| :---------- | :-------- | :------------------------------------------------------------------ |
| token       | address   | The address of the token.                                           |
| priceIdPath | bytes32[] | The array of bytes32 representing the path to the token's price ID. |

### SetPythOracle

```solidity
event SetPythOracle(address indexed newPythOracle)
```

Emitted when a new Pyth oracle address is set.


Parameters:

| Name          | Type    | Description                         |
| :------------ | :------ | :---------------------------------- |
| newPythOracle | address | The address of the new Pyth oracle. |

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
string constant DESCRIPTION = "Price provider that uses pyth"
```


### MAX_LENGTH_PRICE_ID_PATH (0x4e253e91)

```solidity
uint8 constant MAX_LENGTH_PRICE_ID_PATH = 5
```


## State variables info

### tokenDecimals (0x3b97e856)

```solidity
uint8 tokenDecimals
```


### pythOracle (0xf5d6ac90)

```solidity
address pythOracle
```


### validTimePeriod (0xcbdaeaba)

```solidity
uint256 validTimePeriod
```


### pythMetadata (0xbe3fd070)

```solidity
mapping(address => struct PythPriceProvider.PythMetadata) pythMetadata
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

Initializes the contract by setting up the access control roles and default values for tokenDecimals and validTimePeriod.
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

### setTokenAndPriceIdPath (0x970d6b21)

```solidity
function setTokenAndPriceIdPath(
    address token,
    bytes32[] memory newPriceIdPath
) public onlyModerator
```

Sets token and priceIdPath.


Parameters:

| Name           | Type      | Description                                                |
| :------------- | :-------- | :--------------------------------------------------------- |
| token          | address   | The address of token.                                      |
| newPriceIdPath | bytes32[] | The priceIdPath array used to get the price for the token. |

### setPythOracle (0x622bd118)

```solidity
function setPythOracle(address newPythOracle) public onlyModerator
```

Sets PythOracle contract.
#### Requirements:
- Only the moderator can call this function.
- The address of PythOracle contract must not be zero.


Parameters:

| Name          | Type    | Description                         |
| :------------ | :------ | :---------------------------------- |
| newPythOracle | address | The address of PythOracle contract. |

### setValidTimePeriod (0x9bd92cad)

```solidity
function setValidTimePeriod(uint256 newValidTimePeriod) public onlyModerator
```

Sets ValidTimePeriod is used to check if price is older than ValidTimePeriod to perform price update.
Only the moderator can call this function.


Parameters:

| Name               | Type    | Description                                                         |
| :----------------- | :------ | :------------------------------------------------------------------ |
| newValidTimePeriod | uint256 | The validity period for which the price cannot be older to be used. |

### changeActive (0x258a4532)

```solidity
function changeActive(address token, bool active) public override onlyModerator
```

Changes the active status of a token in the Pyth price provider.
#### Requirements:
- The token must be listed in the Pyth price provider.
- Only the moderator can call this function.


Parameters:

| Name   | Type    | Description                                                 |
| :----- | :------ | :---------------------------------------------------------- |
| token  | address | The address of the token to change the active status for.   |
| active | bool    | The new active status for the token.                        |

### updatePrices (0x0aa9adbc)

```solidity
function updatePrices(
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable override
```

Perform a price update if the price is no longer valid.


Parameters:

| Name       | Type      | Description                             |
| :--------- | :-------- | :-------------------------------------- |
| priceIds   | bytes32[] | The priceIds need to update.            |
| updateData | bytes[]   | The updateData provided by PythNetwork. |

### isListed (0xf794062e)

```solidity
function isListed(address token) public view override returns (bool)
```

Returns a boolean indicating whether the given token is listed in the Pyth price provider.


Parameters:

| Name  | Type    | Description                          |
| :---- | :------ | :----------------------------------- |
| token | address | The address of the token to check.   |


Return values:

| Name | Type | Description                                                                  |
| :--- | :--- | :--------------------------------------------------------------------------- |
| [0]  | bool | A boolean indicating whether the token is listed in the Pyth price provider. |

### isActive (0x9f8a13d7)

```solidity
function isActive(address token) public view override returns (bool)
```

Returns a boolean indicating whether the specified token is active or not.


Parameters:

| Name  | Type    | Description                          |
| :---- | :------ | :----------------------------------- |
| token | address | The address of the token to check.   |


Return values:

| Name | Type | Description                                                        |
| :--- | :--- | :----------------------------------------------------------------- |
| [0]  | bool | A boolean indicating whether the specified token is active or not. |

### getPrice (0x41976e09)

```solidity
function getPrice(
    address token
) public view override returns (uint256 priceMantissa, uint8 priceDecimals)
```

Returns the latest price of a given token in USD.
#### Requirements:
- This function retrieves the price of a token from the Pyth oracle and calculates the price in USD.
- If the retrieved price is too old, the function reverts.
- If the number of decimal places in the retrieved price is greater than the number of decimal places in the token, the function adjusts the price accordingly.
- This function is view-only and does not modify the state of the contract.


Parameters:

| Name  | Type    | Description                                     |
| :---- | :------ | :---------------------------------------------- |
| token | address | The address of the token to get the price of.   |


Return values:

| Name          | Type    | Description                                                 |
| :------------ | :------ | :---------------------------------------------------------- |
| priceMantissa | uint256 | The price of the token in USD, represented as a mantissa.   |
| priceDecimals | uint8   | The number of decimal places in the price of the token.     |

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

Returns the number of decimals used by the token.


Return values:

| Name | Type  | Description                               |
| :--- | :---- | :---------------------------------------- |
| [0]  | uint8 | The number of decimals used by the token. |

### getExpiredPriceFeeds (0xe1f67b13)

```solidity
function getExpiredPriceFeeds(
    address[] memory token,
    uint256 timeBeforeExpiration
) external view override returns (bytes32[] memory priceIds, uint256 updateFee)
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
