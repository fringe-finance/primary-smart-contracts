# ERC4626PriceProvider

## Overview

#### License: MIT

```solidity
contract ERC4626PriceProvider is PriceProvider, Initializable, AccessControlUpgradeable
```

The ERC4626PriceProvider contract is the contract that provides the functionality of getting the latest price from ERC-4626 tokens.

Contract that provides the functionality of getting the latest price from ERC-4626 tokens. Inherit from PriceProvider.
## Structs info

### ERC4626Metadata

```solidity
struct ERC4626Metadata {
	bool isActive;
	address base;
}
```


## Events info

### SetERC4626TokenAndPriceProvider

```solidity
event SetERC4626TokenAndPriceProvider(address indexed token, address indexed priceProvider)
```

Emitted when the ERC-4626P token and its corresponding price provider are set.


Parameters:

| Name          | Type    | Description                                 |
| :------------ | :------ | :------------------------------------------ |
| token         | address | The address of the ERC-4626 token.          |
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

### SetTokenDecimals

```solidity
event SetTokenDecimals(uint8 newTokenDecimals)
```

Emitted when the token decimals is set.


Parameters:

| Name             | Type  | Description             |
| :--------------- | :---- | :---------------------- |
| newTokenDecimals | uint8 | The new token decimals. |

## Constants info

### MODERATOR_ROLE (0x797669c9)

```solidity
bytes32 constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE")
```


## State variables info

### tokenDecimals (0x3b97e856)

```solidity
uint8 tokenDecimals
```


### erc4626Metadata (0x956f166c)

```solidity
mapping(address => struct ERC4626PriceProvider.ERC4626Metadata) erc4626Metadata
```


## Modifiers info

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

### setERC4626TokenAndProvider (0x09d38e15)

```solidity
function setERC4626TokenAndProvider(
    address erc4626Token,
    address provider
) public onlyModerator
```

Sets the ERC-4626 token and price provider for the given LP token address.

Requirements:
- `erc4626Token` cannot be the zero address.
- `provider` cannot be the zero address.


Parameters:

| Name         | Type    | Description                          |
| :----------- | :------ | :----------------------------------- |
| erc4626Token | address | The address of the ERC-4626 token.   |
| provider     | address | The address of the price provider.   |

### changeActive (0x258a4532)

```solidity
function changeActive(address token, bool active) public override onlyModerator
```

Changes the active status of a token in the ERC4626PriceProvider contract.

Requirements:
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

Checks if a token is listed in the ERC4626PriceProvider.


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
    address erc4626Token
) public view override returns (uint256 priceMantissa, uint8 priceDecimals)
```

Returns the price of the given ERC-4626 token in USD.


Parameters:

| Name         | Type    | Description                          |
| :----------- | :------ | :----------------------------------- |
| erc4626Token | address | The address of the ERC-4626 token.   |


Return values:

| Name          | Type    | Description                                                          |
| :------------ | :------ | :------------------------------------------------------------------- |
| priceMantissa | uint256 | The price of the ERC-4626 token in USD, represented as a mantissa.   |
| priceDecimals | uint8   | The number of decimals in the price of the ERC-4626 token in USD.    |

### getPriceDecimals (0x1b30aafc)

```solidity
function getPriceDecimals() public view override returns (uint8)
```

Returns the number of decimals used for the price provided by this contract.


Return values:

| Name | Type  | Description                                                          |
| :--- | :---- | :------------------------------------------------------------------- |
| [0]  | uint8 | The number of decimals used for the price provided by this contract. |
