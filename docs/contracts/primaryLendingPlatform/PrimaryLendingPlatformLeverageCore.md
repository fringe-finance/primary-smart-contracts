# PrimaryLendingPlatformLeverageCore

## Overview

#### License: MIT

```solidity
abstract contract PrimaryLendingPlatformLeverageCore is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable
```

The PrimaryLendingPlatformLeverageCore contract is the core contract for the leverage functionality of the primary lending platform.

Contract that allows users to leverage their positions using the exchange aggregator.
## Enums info

### LeverageType

```solidity
enum LeverageType {
	 AMPLIFY,
	 MARGIN_TRADE
}
```


## Structs info

### Ratio

```solidity
struct Ratio {
	uint8 numerator;
	uint8 denominator;
}
```


## Events info

### SetExchangeAggregator

```solidity
event SetExchangeAggregator(address indexed exchangeAggregator, address indexed registryAggregator)
```

Emitted when the exchange aggregator and registry aggregator addresses are set.


Parameters:

| Name               | Type    | Description                               |
| :----------------- | :------ | :---------------------------------------- |
| exchangeAggregator | address | The address of the exchange aggregator.   |
| registryAggregator | address | The address of the registry aggregator.   |

### LeveragedBorrow

```solidity
event LeveragedBorrow(address user, address projectToken, address lendingToken, uint256 notionalExposure, uint256 lendingAmount, uint256 margin, uint256 addingAmount, uint256 totalDepositedAmount, uint256 amountReceive)
```

Emitted when a user leverages their borrowing position.


Parameters:

| Name                 | Type    | Description                                                              |
| :------------------- | :------ | :----------------------------------------------------------------------- |
| user                 | address | The address of the user who leveraged their position.                    |
| projectToken         | address | The address of the project token being used for leverage.                |
| lendingToken         | address | The address of the lending token being used for leverage.                |
| notionalExposure     | uint256 | The total notional exposure of the user's position.                      |
| lendingAmount        | uint256 | The amount of the lending token being borrowed.                          |
| margin               | uint256 | The margin required for the leverage.                                    |
| addingAmount         | uint256 | The amount of the project token being added to the position.             |
| totalDepositedAmount | uint256 | The total amount of the project token deposited in the position.         |
| amountReceive        | uint256 | The amount of the lending token received by the user after the leverage. |

### SetPrimaryLendingPlatform

```solidity
event SetPrimaryLendingPlatform(address indexed newPrimaryLendingPlatform)
```

Emitted when the primary lending platform address is set.


Parameters:

| Name                      | Type    | Description                               |
| :------------------------ | :------ | :---------------------------------------- |
| newPrimaryLendingPlatform | address | The new primary lending platform address. |

## Constants info

### MODERATOR_ROLE (0x797669c9)

```solidity
bytes32 constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE")
```


### BUFFER_PERCENTAGE (0x952038c2)

```solidity
uint16 constant BUFFER_PERCENTAGE = 500
```


## State variables info

### isLeveragePosition (0x3226d284)

```solidity
mapping(address => mapping(address => bool)) isLeveragePosition
```


### primaryLendingPlatform (0x92641a7c)

```solidity
contract IPrimaryLendingPlatform primaryLendingPlatform
```


### exchangeAggregator (0x60df4f35)

```solidity
address exchangeAggregator
```


### registryAggregator (0xf38cb29a)

```solidity
address registryAggregator
```


### typeOfLeveragePosition (0x4118a1bd)

```solidity
mapping(address => mapping(address => enum PrimaryLendingPlatformLeverageCore.LeverageType)) typeOfLeveragePosition
```


## Modifiers info

### onlyModerator

```solidity
modifier onlyModerator()
```

Modifier to restrict access to only the contract moderator.
### isProjectTokenListed

```solidity
modifier isProjectTokenListed(address projectToken)
```

Modifier to check if the given project token is listed on the primary lending platform.


Parameters:

| Name         | Type    | Description                                |
| :----------- | :------ | :----------------------------------------- |
| projectToken | address | The address of the project token to check. |

### isLendingTokenListed

```solidity
modifier isLendingTokenListed(address lendingToken)
```

Modifier to check if the given lending token is listed on the primary lending platform.


Parameters:

| Name         | Type    | Description                                |
| :----------- | :------ | :----------------------------------------- |
| lendingToken | address | The address of the lending token to check. |

### isPrimaryLendingPlatform

```solidity
modifier isPrimaryLendingPlatform()
```

Modifier to check if the caller is the primary lending platform contract.
### onlyRelatedContracts

```solidity
modifier onlyRelatedContracts()
```

Modifier to check if the caller is a related contract of the primary lending platform.
## Functions info

### initialize (0xc4d66de8)

```solidity
function initialize(address pit) public initializer
```

Initializes the contract with the given parameters.
This function is called only once when deploying the contract.


Parameters:

| Name | Type    | Description                                      |
| :--- | :------ | :----------------------------------------------- |
| pit  | address | The address of the primary index token contract. |

### setExchangeAggregator (0x3c4841b4)

```solidity
function setExchangeAggregator(
    address exchangeAggregatorAddress,
    address registryAggregatorAddress
) external onlyModerator
```

Updates the Exchange Aggregator contract and registry contract addresses.

Requirements:
- The caller must be the moderator.
- `exchangeAggregatorAddress` must not be the zero address.
- `registryAggregatorAddress` must be a valid Augustus contract if it is not the zero address.


Parameters:

| Name                      | Type    | Description                                            |
| :------------------------ | :------ | :----------------------------------------------------- |
| exchangeAggregatorAddress | address | The new address of the Exchange Aggregator contract.   |
| registryAggregatorAddress | address | The new address of the Aggregator registry contract.   |

### setPrimaryLendingPlatformAddress (0xcec5a0b0)

```solidity
function setPrimaryLendingPlatformAddress(
    address newPrimaryLendingPlatform
) external onlyModerator
```

Sets the address of the primary lending platform contract.

Requirements:
- Only the moderator can call this function.
- The new primary lending platform address cannot be the zero address.


Parameters:

| Name                      | Type    | Description                                               |
| :------------------------ | :------ | :-------------------------------------------------------- |
| newPrimaryLendingPlatform | address | The address of the new primary lending platform contract. |

### getTokenPrice (0xd02641a0)

```solidity
function getTokenPrice(
    address token
) public view returns (uint256 collateralPrice, uint256 capitalPrice)
```

Returns the price of a given token in USD.


Parameters:

| Name  | Type    | Description                                     |
| :---- | :------ | :---------------------------------------------- |
| token | address | The address of the token to get the price of.   |


Return values:

| Name            | Type    | Description                      |
| :-------------- | :------ | :------------------------------- |
| collateralPrice | uint256 | The price of the token in USD.   |
| capitalPrice    | uint256 | The price of the token in USD.   |

### calculateLendingTokenCount (0xcc65e637)

```solidity
function calculateLendingTokenCount(
    address lendingToken,
    uint256 notionalValue
) public view returns (uint256 lendingTokenCount)
```

Calculates the lending token count for a given notional value.


Parameters:

| Name          | Type    | Description                                                                 |
| :------------ | :------ | :-------------------------------------------------------------------------- |
| lendingToken  | address | The address of the lending token.                                           |
| notionalValue | uint256 | The notional value for which the lending token count is to be calculated.   |


Return values:

| Name              | Type    | Description                         |
| :---------------- | :------ | :---------------------------------- |
| lendingTokenCount | uint256 | The calculated lending token count. |

### deleteLeveragePosition (0x0614a25a)

```solidity
function deleteLeveragePosition(
    address user,
    address projectToken
) external isPrimaryLendingPlatform
```

Deletes a leverage position for a user and project token.
The caller must be the primary lending platform.


Parameters:

| Name         | Type    | Description                       |
| :----------- | :------ | :-------------------------------- |
| user         | address | The address of the user.          |
| projectToken | address | The address of the project token. |

### calculateAddingAmount (0x545c5699)

```solidity
function calculateAddingAmount(
    address user,
    address projectToken,
    uint256 marginCollateralCount
) public view returns (uint256 addingAmount)
```

Calculates the additional collateral amount needed for the specified user and project token.


Parameters:

| Name                  | Type    | Description                         |
| :-------------------- | :------ | :---------------------------------- |
| user                  | address | The address of the user.            |
| projectToken          | address | The address of the project token.   |
| marginCollateralCount | uint256 | The margin collateral amount.       |


Return values:

| Name         | Type    | Description                              |
| :----------- | :------ | :--------------------------------------- |
| addingAmount | uint256 | The additional collateral amount needed. |

### getLeverageType (0x68faa77f)

```solidity
function getLeverageType(
    address borrower,
    address projectToken
) public view returns (uint8)
```

Gets type of Leverage Position for given borrower and projectToken.


Parameters:

| Name         | Type    | Description                                                        |
| :----------- | :------ | :----------------------------------------------------------------- |
| borrower     | address | The address of the borrower who's creating the leverage position   |
| projectToken | address | The address of the token being used as collateral.                 |


Return values:

| Name | Type  | Description                                                                  |
| :--- | :---- | :--------------------------------------------------------------------------- |
| [0]  | uint8 | type of leverage position or max of uint8 if leverage position is not exist. |
