# IPriceOracle

## Overview

#### License: MIT

```solidity
interface IPriceOracle
```


## Functions info

### MODERATOR_ROLE (0x797669c9)

```solidity
function MODERATOR_ROLE() external view returns (bytes32)
```


### volatilityCapFixedPercent (0x34bdb935)

```solidity
function volatilityCapFixedPercent()
    external
    view
    returns (address priceProvider)
```


### minSampleInterval (0x69a7f273)

```solidity
function minSampleInterval(address token) external view returns (bool)
```


### logMaturingAge (0x89a1e81f)

```solidity
function logMaturingAge(address token) external view returns (bool)
```


### longTWAPperiod (0x7ccad678)

```solidity
function longTWAPperiod(address token) external view returns (bool)
```


### grantModerator (0x6981c7ae)

```solidity
function grantModerator(address newModerator) external
```


### revokeModerator (0x36445636)

```solidity
function revokeModerator(address moderator) external
```


### setPriceProviderAggregator (0x5ff22c42)

```solidity
function setPriceProviderAggregator(
    address newPriceProviderAggregator
) external
```

Set the price provider aggregator contract address


Parameters:

| Name                       | Type    | Description                                               |
| :------------------------- | :------ | :-------------------------------------------------------- |
| newPriceProviderAggregator | address | The address of the new price provider aggregator contract |

### setVolatilityCapFixedPercent (0x7eddca25)

```solidity
function setVolatilityCapFixedPercent(
    uint16 _volatilityCapFixedPercent
) external
```

Set the volatility cap fixed percent


Parameters:

| Name                       | Type   | Description                          |
| :------------------------- | :----- | :----------------------------------- |
| _volatilityCapFixedPercent | uint16 | The new volatility cap fixed percent |

### setMinSampleInterval (0x7ec0974b)

```solidity
function setMinSampleInterval(uint256 _minSampleInterval) external
```

Set the minimum sample interval


Parameters:

| Name               | Type    | Description                     |
| :----------------- | :------ | :------------------------------ |
| _minSampleInterval | uint256 | The new minimum sample interval |

### setLogMaturingAge (0xb7fb9223)

```solidity
function setLogMaturingAge(uint256 _logMaturingAge) external
```

Set the log maturing age


Parameters:

| Name            | Type    | Description              |
| :-------------- | :------ | :----------------------- |
| _logMaturingAge | uint256 | The new log maturing age |

### setLongTWAPperiod (0x8597bfb5)

```solidity
function setLongTWAPperiod(uint256 _longTWAPperiod) external
```

Set the long TWAP period


Parameters:

| Name            | Type    | Description              |
| :-------------- | :------ | :----------------------- |
| _longTWAPperiod | uint256 | The new long TWAP period |

### updateFinalPrices (0x8bb6b7f9)

```solidity
function updateFinalPrices(address token) external
```

Calculates the final TWAP prices of a token.


Parameters:

| Name  | Type    | Description               |
| :---- | :------ | :------------------------ |
| token | address | The address of the token. |

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
    external
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

returns the non-TWAP price in USD evaluation of token by its `tokenAmount`


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
) external view returns (uint256 priceMantissa, uint8 priceDecimals)
```

price = priceMantissa / (10 ** priceDecimals)

returns tuple (priceMantissa, priceDecimals)


Parameters:

| Name  | Type    | Description                                   |
| :---- | :------ | :-------------------------------------------- |
| token | address | the address of token which price is to return |
