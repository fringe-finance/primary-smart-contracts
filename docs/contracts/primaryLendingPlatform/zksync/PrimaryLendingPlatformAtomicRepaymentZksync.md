# PrimaryLendingPlatformAtomicRepaymentZksync

## Overview

#### License: MIT

## 

```solidity
contract PrimaryLendingPlatformAtomicRepaymentZksync is PrimaryLendingPlatformAtomicRepaymentCore
```

The PrimaryLendingPlatformAtomicRepaymentZksync contract is the contract that allows users to repay loans atomically for zksync network.

Contract that allows users to repay loans atomically using the OpenOcean exchange aggregator. Inherit from PrimaryLendingPlatformAtomicRepaymentCore.
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

### getTotalOutstandingWithUpdatePrices (0x2de2d471)

```solidity
function getTotalOutstandingWithUpdatePrices(
    address user,
    address projectToken,
    address lendingAsset,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256 outstanding)
```

Calculates the outstanding amount (i.e., loanBody + accrual) for a given user, project token, and lending token after updating related token's prices.


Parameters:

| Name         | Type      | Description                                                              |
| :----------- | :-------- | :----------------------------------------------------------------------- |
| user         | address   | The user for which to compute the outstanding amount.                    |
| projectToken | address   | The project token for which to compute the outstanding amount.           |
| lendingAsset | address   | The lending token for which to compute the outstanding amount.           |
| priceIds     | bytes32[] | An array of bytes32 price identifiers to update.                         |
| updateData   | bytes[]   | An array of bytes update data for the corresponding price identifiers.   |


Return values:

| Name        | Type    | Description                                                            |
| :---------- | :------ | :--------------------------------------------------------------------- |
| outstanding | uint256 | The outstanding amount for the user, project token, and lending token. |

### getAvailableRepaidAmountWithUpdatePrices (0x45da7ae5)

```solidity
function getAvailableRepaidAmountWithUpdatePrices(
    address user,
    address projectToken,
    address lendingToken,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256 availableLendingAmount)
```

Returns the available repaid amount for a user in a specific project token and lending token after updating related token's prices.


Parameters:

| Name         | Type      | Description                                                                  |
| :----------- | :-------- | :--------------------------------------------------------------------------- |
| user         | address   | The user for which to compute the available lending token amount.            |
| projectToken | address   | The project token for which to compute the available lending token amount.   |
| lendingToken | address   | The lending token for which to compute the available lending token amount.   |
| priceIds     | bytes32[] | An array of bytes32 price identifiers to update.                             |
| updateData   | bytes[]   | An array of bytes update data for the corresponding price identifiers.       |


Return values:

| Name                   | Type    | Description                                                 |
| :--------------------- | :------ | :---------------------------------------------------------- |
| availableLendingAmount | uint256 | The available lending token amount that the user can repay. |

### repayAtomic (0x5a0535c6)

```solidity
function repayAtomic(
    address prjToken,
    uint256 collateralAmount,
    bytes memory buyCalldata,
    bool isRepayFully,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable nonReentrant
```

Repays a loan atomically using the given project token as collateral.

Repays the loan in a single atomic transaction and update related token's prices.

Requirements:
- The project token is listed on the platform.
- The lending token is listed on the platform.
- Collateral amount must be greater than 0.
- The user must have a position for the given project token and lending token.

Effects:
- Update price of related tokens.
- Transfers the collateral amount from the user to the contract.
- Approves the collateral amount to the primary lending platform contract.
- Calculates the total outstanding amount for the user, project token, and lending token.
- Buys the lending token from the exchange aggregator.
- Deposits the collateral amount back to the primary lending platform contract.
- Approves the lending token amount to the primary lending platform contract.
- Repays the lending token amount to the primary lending platform contract.
- Transfers the remaining lending token amount to the user.
- Defers the liquidity check for the user, project token, and lending token.


Parameters:

| Name             | Type      | Description                                                                  |
| :--------------- | :-------- | :--------------------------------------------------------------------------- |
| prjToken         | address   | The project token to use as collateral.                                      |
| collateralAmount | uint256   | The amount of collateral to use.                                             |
| buyCalldata      | bytes     | The calldata for the swap operation.                                         |
| isRepayFully     | bool      | A boolean indicating whether the loan should be repaid fully or partially.   |
| priceIds         | bytes32[] | An array of bytes32 price identifiers to update.                             |
| updateData       | bytes[]   | An array of bytes update data for the corresponding price identifiers.       |
