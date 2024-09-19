# PriceOracle

## Overview

#### License: MIT

```solidity
contract PriceOracle is Initializable, AccessControlUpgradeable
```


## Structs info

### GovernedPrice

```solidity
struct GovernedPrice {
	uint64 timestamp;
	uint256 collateralPrice;
	uint256 capitalPrice;
}
```


### PriceInfo

```solidity
struct PriceInfo {
	uint64 timestamp;
	uint256 collateralPrice;
	uint256 capitalPrice;
}
```


## Events info

### PriceUpdated

```solidity
event PriceUpdated(address indexed token, uint64 currentTime, uint256 twapCollateralPrice, uint256 twapCapitalPrice)
```

Emitted when the price of a token is updated.


Parameters:

| Name  | Type    | Description               |
| :---- | :------ | :------------------------ |
| token | address | The address of the token. |

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

### SetVolatilityCapFixedPercent

```solidity
event SetVolatilityCapFixedPercent(uint16 tvcUp, uint16 tvcDown)
```

Emitted when the new volatilityCapFixedPercent value is set.


Parameters:

| Name    | Type   | Description            |
| :------ | :----- | :--------------------- |
| tvcUp   | uint16 | The new tvcUp value.   |
| tvcDown | uint16 | The new tvcDown value. |

### SetPriceProviderAggregator

```solidity
event SetPriceProviderAggregator(address newPriceProviderAggregator)
```

Emitted when the PriceProviderAggregator contract is set.


Parameters:

| Name                       | Type    | Description                                      |
| :------------------------- | :------ | :----------------------------------------------- |
| newPriceProviderAggregator | address | The address of PriceProviderAggregator contract. |

## Constants info

### MODERATOR_ROLE (0x797669c9)

```solidity
bytes32 constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE")
```


### PERCENTAGE_DECIMALS (0x90706425)

```solidity
uint16 constant PERCENTAGE_DECIMALS = 10000
```


### SECONDS_PER_HOUR (0x4df86126)

```solidity
uint16 constant SECONDS_PER_HOUR = 1 hours
```


## State variables info

### priceProviderAggregator (0x407e906e)

```solidity
contract IPriceProviderAggregator priceProviderAggregator
```


### tokenPriceDecimals (0x7420b62b)

```solidity
uint8 tokenPriceDecimals
```


### tvcUp (0x465d98a3)

```solidity
uint16 tvcUp
```

The up time-based volatility cap (TVC-up) in percentage.
### tvcDown (0x8e8a4131)

```solidity
uint16 tvcDown
```

The down time-based volatility cap (TVC-down) in percentage.
### mostGovernedPrice (0x086dc126)

```solidity
mapping(address => struct PriceOracle.GovernedPrice) mostGovernedPrice
```

Used in volatility cap rule calculations.
Mapping address of token => GovernedPrice
### priceInfo (0x6d048d53)

```solidity
mapping(address => struct PriceOracle.PriceInfo) priceInfo
```

The final price after update price by calcFinalPrices function.
Mapping address of token => PriceInfo.
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

### initialize (0x1c4b995a)

```solidity
function initialize(
    address _priceProviderAggregator,
    uint16 _tvcUp,
    uint16 _tvcDown
) public initializer
```

Initializes the contract by setting up the access control roles and assigning them to the contract deployer.
The `DEFAULT_ADMIN_ROLE` and `MODERATOR_ROLE` roles are set up with the contract deployer as the initial role bearer.
`tokenPriceDecimals` is set to 10.


Parameters:

| Name                     | Type    | Description                                        |
| :----------------------- | :------ | :------------------------------------------------- |
| _priceProviderAggregator | address | The address of PriceProviderAggregator contract.   |
| _tvcUp                   | uint16  | The tvcUp value.                                   |
| _tvcDown                 | uint16  | The tvcDown value.                                 |

### grantModerator (0x6981c7ae)

```solidity
function grantModerator(address newModerator) external onlyAdmin
```

Grants the moderator role to a new address.


Parameters:

| Name         | Type    | Description                       |
| :----------- | :------ | :-------------------------------- |
| newModerator | address | The address of the new moderator. |

### revokeModerator (0x36445636)

```solidity
function revokeModerator(address moderator) external onlyAdmin
```

Revokes the moderator role from an address.


Parameters:

| Name      | Type    | Description                                 |
| :-------- | :------ | :------------------------------------------ |
| moderator | address | The address of the moderator to be revoked. |

### setPriceProviderAggregator (0x5ff22c42)

```solidity
function setPriceProviderAggregator(
    address newPriceProviderAggregator
) external onlyModerator
```

Set the price provider aggregator contract address

Requirements:
- The caller must be the moderator.
- `newPriceProviderAggregator` cannot be the zero address.


Parameters:

| Name                       | Type    | Description                                               |
| :------------------------- | :------ | :-------------------------------------------------------- |
| newPriceProviderAggregator | address | The address of the new price provider aggregator contract |

### setVolatilityCapFixedPercent (0x079957a9)

```solidity
function setVolatilityCapFixedPercent(
    uint16 _tvcUp,
    uint16 _tvcDown
) external onlyModerator
```

Set the volatility cap fixed percent

Requirements:
- The caller must be the moderator.
- `_volatilityCapFixedPercent` cannot be greater PERCENTAGE_DECIMALS.


Parameters:

| Name     | Type   | Description           |
| :------- | :----- | :-------------------- |
| _tvcUp   | uint16 | The new tvcUp value   |
| _tvcDown | uint16 | The new tvcDown value |

### updateFinalPrices (0x8bb6b7f9)

```solidity
function updateFinalPrices(address token) external
```

Calculates the final TWAP prices of a token.


Parameters:

| Name  | Type    | Description               |
| :---- | :------ | :------------------------ |
| token | address | The address of the token. |

### getUpdatedReportedPrice (0x41f2231a)

```solidity
function getUpdatedReportedPrice(
    address token,
    bytes32[] memory priceIds,
    bytes[] memory updateData
) external payable returns (uint256)
```

price = priceMantissa / (10 ** priceDecimals)

returns tuple (priceMantissa, priceDecimals) after update price.


Parameters:

| Name       | Type      | Description                                     |
| :--------- | :-------- | :---------------------------------------------- |
| token      | address   | the address of token which price is to return   |
| priceIds   | bytes32[] | The priceIds need to update.                    |
| updateData | bytes[]   | The updateData provided by PythNetwork.         |

### getMostTWAPprice (0xbc124cfd)

```solidity
function getMostTWAPprice(
    address token
)
    external
    view
    returns (
        uint8 priceDecimals,
        uint64 timestamp,
        uint256 collateralPrice,
        uint256 capitalPrice
    )
```

Returns the most recent TWAP price of a token.


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

### getEstimatedTWAPprice (0x29f839b2)

```solidity
function getEstimatedTWAPprice(
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

Returns the non-TWAP price of a token.


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

returns the most TWAP price in USD evaluation of token by its `tokenAmount`


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

### getEstimatedEvaluation (0xebb19c1a)

```solidity
function getEstimatedEvaluation(
    address token,
    uint256 tokenAmount
)
    external
    view
    returns (uint256 collateralEvaluation, uint256 capitalEvaluation)
```

returns the estimated-TWAP price in USD evaluation of token by its `tokenAmount`


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

### getReportedPrice (0xdbd57337)

```solidity
function getReportedPrice(
    address token
) public view returns (uint256 priceMantissa)
```

price = priceMantissa / (10 ** priceDecimals)

returns tuple (priceMantissa, priceDecimals)


Parameters:

| Name  | Type    | Description                                   |
| :---- | :------ | :-------------------------------------------- |
| token | address | the address of token which price is to return |
