# PriceProviderAggregator

## Overview

#### License: MIT

## 

```solidity
contract PriceProviderAggregator is Initializable, AccessControlUpgradeable
```

The PriceProviderAggregator contract is the contract that provides the functionality of getting the latest price from different price providers.

Contract that provides the functionality of getting the latest price from different price providers.
## Structs info

### PriceProviderInfo

```solidity
struct PriceProviderInfo {
	address priceProvider;
	bool hasSignedFunction;
}
```


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

### SetTokenAndPriceProvider

```solidity
event SetTokenAndPriceProvider(address indexed token, address indexed priceProvider)
```

Emitted when the price provider is set to a token.


Parameters:

| Name          | Type    | Description                                             |
| :------------ | :------ | :------------------------------------------------------ |
| token         | address | The address of the token whose price provider is set.   |
| priceProvider | address | The address of the price provider.                      |

### ChangeActive

```solidity
event ChangeActive(address indexed priceProvider, address indexed token, bool active)
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


### tokenPriceProvider (0xa33540f1)

```solidity
mapping(address => struct PriceProviderAggregator.PriceProviderInfo) tokenPriceProvider
```


## Modifiers info

### onlyAdmin

```solidity
modifier onlyAdmin()
```

Modifier to check if the caller has the DEFAULT_ADMIN_ROLE.
### onlyModerator

```solidity
modifier onlyModerator()
```

Modifier to check if the caller has the MODERATOR_ROLE.
## Functions info

### initialize (0x8129fc1c)

```solidity
function initialize() public initializer
```

This function should only be called once during contract deployment.
Initializes the contract by setting up the access control roles and assigning the default and moderator roles to the contract deployer.

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

### setTokenAndPriceProvider (0x3ca82a11)

```solidity
function setTokenAndPriceProvider(
    address token,
    address priceProvider,
    bool hasFunctionWithSign
) public onlyModerator
```

Sets price provider to `token` and its corresponding price provider.

Requirements:
- The caller must be the moderator.
- `token` cannot be the zero address.
- `priceProvider` cannot be the zero address.


Parameters:

| Name                | Type    | Description                                                                                                               |
| :------------------ | :------ | :------------------------------------------------------------------------------------------------------------------------ |
| token               | address | the address of token.                                                                                                     |
| priceProvider       | address | the address of price provider. Should implement the interface of `PriceProvider`.                                         |
| hasFunctionWithSign | bool    | true - if price provider has function with signatures. false - if price provider does not have function with signatures. |

### changeActive (0x3651084e)

```solidity
function changeActive(
    address priceProvider,
    address token,
    bool active
) public onlyModerator
```

Allows the moderator to change the active status of a price provider for a specific token.

Requirements:
- The caller must be the moderator.
- The token's current price provider must match the provided price provider address.


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
) public view returns (uint256 priceMantissa, uint8 priceDecimals)
```

Returns the price of a given token.

Formula: price = priceMantissa / (10 ** priceDecimals)


Parameters:

| Name  | Type    | Description                                      |
| :---- | :------ | :----------------------------------------------- |
| token | address | The address of the token to get the price for.   |


Return values:

| Name          | Type    | Description                                          |
| :------------ | :------ | :--------------------------------------------------- |
| priceMantissa | uint256 | The price of the token, represented as a mantissa.   |
| priceDecimals | uint8   | The number of decimal places in the token's price.   |

### getPriceSigned (0x19ed931d)

```solidity
function getPriceSigned(
    address token,
    uint256 priceMantissa,
    uint256 validTo,
    bytes memory signature
) public view returns (uint256 priceMantissa_, uint8 priceDecimals)
```

Returns the tupple (priceMantissa, priceDecimals) of token multiplied by 10 ** priceDecimals given by price provider.
price can be calculated as  priceMantissa / (10 ** priceDecimals).
i.e. price = priceMantissa / (10 ** priceDecimals).


Parameters:

| Name          | Type    | Description                                                   |
| :------------ | :------ | :------------------------------------------------------------ |
| token         | address | The address of token.                                         |
| priceMantissa | uint256 | The price of token (used in verifying the signature).         |
| validTo       | uint256 | The timestamp in seconds (used in verifying the signature).   |
| signature     | bytes   | The backend signature of secp256k1. length is 65 bytes.       |


Return values:

| Name           | Type    | Description                                   |
| :------------- | :------ | :-------------------------------------------- |
| priceMantissa_ | uint256 | The price of the token as a signed integer.   |
| priceDecimals  | uint8   | The number of decimals for the price.         |

### getEvaluation (0x81fd01ea)

```solidity
function getEvaluation(
    address token,
    uint256 tokenAmount
) public view returns (uint256 evaluation)
```

Returns the evaluation of a given token amount based on the price provided by the registered price provider.


Parameters:

| Name        | Type    | Description                             |
| :---------- | :------ | :-------------------------------------- |
| token       | address | The address of the token to evaluate.   |
| tokenAmount | uint256 | The amount of tokens to evaluate.       |


Return values:

| Name       | Type    | Description                         |
| :--------- | :------ | :---------------------------------- |
| evaluation | uint256 | The evaluation of the token amount. |

### getEvaluationSigned (0xa5c68226)

```solidity
function getEvaluationSigned(
    address token,
    uint256 tokenAmount,
    uint256 priceMantissa,
    uint256 validTo,
    bytes memory signature
) public view returns (uint256 evaluation)
```

Returns the evaluation of a token based on its price and amount, using a price provider that may or may not require a signature.


Parameters:

| Name          | Type    | Description                                             |
| :------------ | :------ | :------------------------------------------------------ |
| token         | address | The address of the token to evaluate.                   |
| tokenAmount   | uint256 | The amount of tokens to evaluate.                       |
| priceMantissa | uint256 | The price mantissa of the token.                        |
| validTo       | uint256 | The timestamp until which the evaluation is valid.      |
| signature     | bytes   | The signature required by the price provider, if any.   |


Return values:

| Name       | Type    | Description                  |
| :--------- | :------ | :--------------------------- |
| evaluation | uint256 | The evaluation of the token. |
