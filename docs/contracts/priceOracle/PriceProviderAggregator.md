# PriceProviderAggregator

## Overview

#### License: MIT

```solidity
contract PriceProviderAggregator is Initializable, AccessControlUpgradeable
```

The PriceProviderAggregator contract is the contract that provides the functionality of getting the latest price from different price providers.

Contract that provides the functionality of getting the latest price from different price providers.
## Events info

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

### SetPriceOracle

```solidity
event SetPriceOracle(address indexed priceOracle)
```

Emitted when the priceOracle is set.


Parameters:

| Name        | Type    | Description                          |
| :---------- | :------ | :----------------------------------- |
| priceOracle | address | The address of priceOracle contract. |

### SetPrimaryLendingPlatform

```solidity
event SetPrimaryLendingPlatform(address indexed newPrimaryLendingPlatform)
```

Emitted when the primary lending platform address is set.


Parameters:

| Name                      | Type    | Description                                      |
| :------------------------ | :------ | :----------------------------------------------- |
| newPrimaryLendingPlatform | address | The new address of the primary lending platform. |

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

### priceOracle (0x2630c12f)

```solidity
contract IPriceOracle priceOracle
```


### primaryLendingPlatform (0x92641a7c)

```solidity
contract IPrimaryLendingPlatform primaryLendingPlatform
```


### tokenPriceProvider (0xa33540f1)

```solidity
mapping(address => address) tokenPriceProvider
```


## Modifiers info

### onlyModerator

```solidity
modifier onlyModerator()
```

Modifier to check if the caller has the MODERATOR_ROLE.
## Functions info

### initialize (0xc4d66de8)

```solidity
function initialize(address newPriceOracle) public initializer
```

This function should only be called once during contract deployment.
Initializes the contract by setting up the access control roles and assigning the default and moderator roles to the contract deployer.


Parameters:

| Name           | Type    | Description                                    |
| :------------- | :------ | :--------------------------------------------- |
| newPriceOracle | address | The address of the new PriceOracle contract.   |

### setTokenAndPriceProvider (0x072f27b0)

```solidity
function setTokenAndPriceProvider(
    address token,
    address priceProvider
) public onlyModerator
```

Sets price provider to `token` and its corresponding price provider.

Requirements:
- The caller must be the moderator.
- `token` cannot be the zero address.
- `priceProvider` cannot be the zero address.


Parameters:

| Name          | Type    | Description                                                                       |
| :------------ | :------ | :-------------------------------------------------------------------------------- |
| token         | address | the address of token.                                                             |
| priceProvider | address | the address of price provider. Should implement the interface of `PriceProvider`. |

### setPriceOracle (0x530e784f)

```solidity
function setPriceOracle(address newPriceOracle) external onlyModerator
```

Sets new priceOracle contract.
Requirements:
- The caller must be the moderator.
- `newPriceOracle` cannot be the zero address.


Parameters:

| Name           | Type    | Description                              |
| :------------- | :------ | :--------------------------------------- |
| newPriceOracle | address | The address of new PriceOracle contract. |

### setPrimaryLendingPlatform (0xe801734a)

```solidity
function setPrimaryLendingPlatform(address plp) external onlyModerator
```

Sets the address of the primary lending platform contract.


Parameters:

| Name | Type    | Description                                                                                                 |
| :--- | :------ | :---------------------------------------------------------------------------------------------------------- |
| plp  | address | The address of the primary lending platform contract.  Requirements: - `plp` cannot be the zero address. |

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

### updateMultiFinalPrices (0x1e5f85e6)

```solidity
function updateMultiFinalPrices(address[] memory token) external
```

Calculates and update multiple the final TWAP prices of a token.


Parameters:

| Name  | Type      | Description                                |
| :---- | :-------- | :----------------------------------------- |
| token | address[] | The token array needs to update the price. |

### getTokensUpdateFinalPrices (0xef290120)

```solidity
function getTokensUpdateFinalPrices(
    address projectToken,
    address actualLendingToken,
    bool isBorrow
) public view returns (address[] memory tokens)
```

This function is called when performing operations using token prices, to determine which tokens will need to update their final price.


Parameters:

| Name               | Type    | Description                                                                                              |
| :----------------- | :------ | :------------------------------------------------------------------------------------------------------- |
| projectToken       | address | Address of the project token.                                                                            |
| actualLendingToken | address | Address of the lending token.                                                                            |
| isBorrow           | bool    | Whether getting the list of tokens for updateFinalPrices is related to the borrowing operation or not.   |


Return values:

| Name   | Type      | Description                                      |
| :----- | :-------- | :----------------------------------------------- |
| tokens | address[] | Array of tokens that need to update final price. |

### getPrice (0x41976e09)

```solidity
function getPrice(
    address token
)
    public
    view
    returns (
        uint8 priceDecimals,
        uint64 timestamp,
        uint256 collateralPrice,
        uint256 capitalPrice
    )
```

Returns the most recent TWAP price or non-TWAP price of a token.

Formula: price = priceMantissa / (10 ** priceDecimals)


Parameters:

| Name  | Type    | Description                 |
| :---- | :------ | :-------------------------- |
| token | address | The address of the token.   |


Return values:

| Name            | Type    | Description                                |
| :-------------- | :------ | :----------------------------------------- |
| priceDecimals   | uint8   | The decimals of the price.                 |
| timestamp       | uint64  | The last updated timestamp of the price.   |
| collateralPrice | uint256 | The collateral price of the token.         |
| capitalPrice    | uint256 | The capital price of the token.            |

### getEvaluation (0x81fd01ea)

```solidity
function getEvaluation(
    address token,
    uint256 tokenAmount
)
    external
    view
    returns (uint256 collateralEvaluation, uint256 capitalEvaluation)
```

returns the most TWAP price or non-TWAP price in USD evaluation of token by its `tokenAmount`


Parameters:

| Name        | Type    | Description                        |
| :---------- | :------ | :--------------------------------- |
| token       | address | the address of token to evaluate   |
| tokenAmount | uint256 | the amount of token to evaluate    |


Return values:

| Name                 | Type    | Description                                                            |
| :------------------- | :------ | :--------------------------------------------------------------------- |
| collateralEvaluation | uint256 | the USD evaluation of token by its `tokenAmount` in collateral price   |
| capitalEvaluation    | uint256 | the USD evaluation of token by its `tokenAmount` in capital price      |

### getMostEvaluation (0x894b23cd)

```solidity
function getMostEvaluation(
    address token,
    uint256 tokenAmount
)
    external
    view
    returns (uint256 collateralEvaluation, uint256 capitalEvaluation)
```

returns the last stored TWAP price in USD evaluation of token by its `tokenAmount`


Parameters:

| Name        | Type    | Description                        |
| :---------- | :------ | :--------------------------------- |
| token       | address | the address of token to evaluate   |
| tokenAmount | uint256 | the amount of token to evaluate    |


Return values:

| Name                 | Type    | Description                                                            |
| :------------------- | :------ | :--------------------------------------------------------------------- |
| collateralEvaluation | uint256 | the USD evaluation of token by its `tokenAmount` in collateral price   |
| capitalEvaluation    | uint256 | the USD evaluation of token by its `tokenAmount` in capital price      |
