# PrimaryLendingPlatformLeverageZksync

## Overview

#### License: MIT

## 

```solidity
contract PrimaryLendingPlatformLeverageZksync is PrimaryLendingPlatformLeverageCore
```

The PrimaryLendingPlatformLeverageZksync contract is the contract that allows users to open leveraged positions for zksync network.

Contract that allows users to open leveraged positions using the OpenOcean exchange aggregator. Inherit from PrimaryLendingPlatformLeverageCore.
## Events info

### SetOpenOceanExchangeProxy

```solidity
event SetOpenOceanExchangeProxy(address indexed newOpenOceanExchangeProxy)
```

Emitted when the address of the OpenOceanExchangeProxy contract is set.


Parameters:

| Name                      | Type    | Description                                             |
| :------------------------ | :------ | :------------------------------------------------------ |
| newOpenOceanExchangeProxy | address | The address of the new OpenOceanExchangeProxy contract. |

## Functions info

### setExchangeAggregator (0x873e2a1b)

```solidity
function setExchangeAggregator(
    address exchangeAggregatorAddress
) external onlyModerator
```

Sets the address of the exchange aggregator contract.

Requirements:
- Only the moderator can call this function.
- The exchange aggregator address must not be the zero address.


Parameters:

| Name                      | Type    | Description                                      |
| :------------------------ | :------ | :----------------------------------------------- |
| exchangeAggregatorAddress | address | The address of the exchange aggregator contract. |

### leveragedBorrow (0x104daaf9)

```solidity
function leveragedBorrow(
    address projectToken,
    address lendingToken,
    uint256 notionalExposure,
    uint256 marginCollateralAmount,
    bytes memory buyCalldata,
    uint8 leverageType,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable nonReentrant
```

The function to be called when a user wants to leverage their position.

Executes a leveraged borrow for the borrower on the specified projectToken using the given lendingToken and update related token's prices.

Requirements:
- The project token is listed on the platform.
- The lending token is listed on the platform.
- Notional exposure must be greater than 0.
- The lending token must be the same as the current lending token or the current lending token must be address(0).
- The user must have a valid position for the given project token and lending token.

Effects:
- Update price of related tokens.
- Calculates the required `lendingTokenCount` based on `notionalExposure`.
- Performs a naked borrow using `_nakedBorrow` function.
- Approves the transfer of `lendingToken` to the system.
- Buys tokens on an exchange aggregator using `_buyOnExchangeAggregator` function.
- Collateralizes the loan with the received tokens using `_collateralizeLoan` function.
- Defers liquidity check using `_deferLiquidityCheck` function.
- Sets the leveraged position flag and type for the borrower.


Parameters:

| Name                   | Type      | Description                                                             |
| :--------------------- | :-------- | :---------------------------------------------------------------------- |
| projectToken           | address   | The address of the project token.                                       |
| lendingToken           | address   | The address of the lending token.                                       |
| notionalExposure       | uint256   | The desired notional exposure for the leverage position.                |
| marginCollateralAmount | uint256   | The amount of collateral to be added to the position as margin.         |
| buyCalldata            | bytes     | The calldata for buying the project token on the exchange aggregator.   |
| leverageType           | uint8     | The type of leverage position.                                          |
| priceIds               | bytes32[] | An array of bytes32 price identifiers to update.                        |
| updateData             | bytes[]   | An array of bytes update data for the corresponding price identifiers.  |

### leveragedBorrowFromRelatedContract (0x30c1f2fd)

```solidity
function leveragedBorrowFromRelatedContract(
    address projectToken,
    address lendingToken,
    uint256 notionalExposure,
    uint256 marginCollateralAmount,
    bytes memory buyCalldata,
    address borrower,
    uint8 leverageType,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable nonReentrant onlyRelatedContracts
```

Allows a related contract to borrow funds on behalf of a user to enter a leveraged position and update related token's prices.

Requirements:
- Caller must be a related contract.
- The project token is listed on the platform.
- The lending token is listed on the platform.
- Notional exposure must be greater than 0.
- The lending token must be the same as the current lending token or the current lending token must be address(0).
- The user must have a valid position for the given project token and lending token.

Effects:
- Update price of related tokens.
- Calculates the required `lendingTokenCount` based on `notionalExposure`.
- Performs a naked borrow using `_nakedBorrow` function.
- Approves the transfer of `lendingToken` to the system.
- Buys tokens on an exchange aggregator using `_buyOnExchangeAggregator` function.
- Collateralizes the loan with the received tokens using `_collateralizeLoan` function.
- Defers liquidity check using `_deferLiquidityCheck` function.
- Sets the leveraged position flag and type for the borrower.


Parameters:

| Name                   | Type      | Description                                                            |
| :--------------------- | :-------- | :--------------------------------------------------------------------- |
| projectToken           | address   | The address of the project token the user wants to invest in.          |
| lendingToken           | address   | The address of the lending token used for collateral.                  |
| notionalExposure       | uint256   | The notional exposure of the user's investment.                        |
| marginCollateralAmount | uint256   | The amount of collateral to be deposited by the user.                  |
| buyCalldata            | bytes     | The calldata used for buying the project token on the DEX.             |
| borrower               | address   | The address of the user for whom the funds are being borrowed.         |
| leverageType           | uint8     | The type of leverage position.                                         |
| priceIds               | bytes32[] | An array of bytes32 price identifiers to update.                       |
| updateData             | bytes[]   | An array of bytes update data for the corresponding price identifiers. |

### getTokenPriceWithUpdatePrices (0x3d2b7a27)

```solidity
function getTokenPriceWithUpdatePrices(
    address token,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256 price)
```

Returns the price of a given token in USD after updating related token's prices.


Parameters:

| Name       | Type      | Description                                                            |
| :--------- | :-------- | :--------------------------------------------------------------------- |
| token      | address   | The address of the token to get the price of.                          |
| priceIds   | bytes32[] | An array of bytes32 price identifiers to update.                       |
| updateData | bytes[]   | An array of bytes update data for the corresponding price identifiers. |


Return values:

| Name  | Type    | Description                      |
| :---- | :------ | :------------------------------- |
| price | uint256 | The price of the token in USD.   |

### calculateLendingTokenCountWithUpdatePrices (0xff7e86fa)

```solidity
function calculateLendingTokenCountWithUpdatePrices(
    address _lendingToken,
    uint256 notionalValue,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256 lendingTokenCount)
```

Calculates the lending token count for a given notional value after updating related token's prices.


Parameters:

| Name          | Type      | Description                                                                 |
| :------------ | :-------- | :-------------------------------------------------------------------------- |
| _lendingToken | address   | The address of the lending token.                                           |
| notionalValue | uint256   | The notional value for which the lending token count is to be calculated.   |
| priceIds      | bytes32[] | An array of bytes32 price identifiers to update.                            |
| updateData    | bytes[]   | An array of bytes update data for the corresponding price identifiers.      |


Return values:

| Name              | Type    | Description                         |
| :---------------- | :------ | :---------------------------------- |
| lendingTokenCount | uint256 | The calculated lending token count. |

### calculateMarginWithUpdatePrices (0xc708db5b)

```solidity
function calculateMarginWithUpdatePrices(
    address projectToken,
    address lendingToken,
    uint256 safetyMarginNumerator,
    uint256 safetyMarginDenominator,
    uint256 expAmount,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256 marginAmount)
```

Calculates the margin amount for a given position and safety margin after updating related token's prices.

Formula: Margin = ((Notional / LVR) * (1 + SafetyMargin)) - Notional


Parameters:

| Name                    | Type      | Description                                                              |
| :---------------------- | :-------- | :----------------------------------------------------------------------- |
| projectToken            | address   | The address of the project token.                                        |
| lendingToken            | address   | The address of the lending token.                                        |
| safetyMarginNumerator   | uint256   | The numerator of the safety margin ratio.                                |
| safetyMarginDenominator | uint256   | The denominator of the safety margin ratio.                              |
| expAmount               | uint256   | The exposure amount.                                                     |
| priceIds                | bytes32[] | An array of bytes32 price identifiers to update.                         |
| updateData              | bytes[]   | An array of bytes update data for the corresponding price identifiers.   |


Return values:

| Name         | Type    | Description                   |
| :----------- | :------ | :---------------------------- |
| marginAmount | uint256 | The calculated margin amount. |

### calculateSafetyMarginWithUpdatePrices (0xd7586b45)

```solidity
function calculateSafetyMarginWithUpdatePrices(
    address projectToken,
    address lendingToken,
    uint256 margin,
    uint256 exp,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
)
    external
    payable
    returns (uint256 safetyMarginNumerator, uint256 safetyMarginDenominator)
```

Calculates the safety margin numerator and denominator for a given position, margin, and exposure after updating related token's prices.

Formula: Safety Margin = ((Margin + Notional) / (Notional / LVR)) - 1


Parameters:

| Name         | Type      | Description                                                              |
| :----------- | :-------- | :----------------------------------------------------------------------- |
| projectToken | address   | The address of the project token.                                        |
| lendingToken | address   | The address of the lending token.                                        |
| margin       | uint256   | The margin amount.                                                       |
| exp          | uint256   | The exposure amount.                                                     |
| priceIds     | bytes32[] | An array of bytes32 price identifiers to update.                         |
| updateData   | bytes[]   | An array of bytes update data for the corresponding price identifiers.   |


Return values:

| Name                    | Type    | Description                               |
| :---------------------- | :------ | :---------------------------------------- |
| safetyMarginNumerator   | uint256 | The calculated safety margin numerator.   |
| safetyMarginDenominator | uint256 | The calculated safety margin denominator. |
