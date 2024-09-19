# PrimaryLendingPlatformLiquidationZksync

## Overview

#### License: MIT

```solidity
contract PrimaryLendingPlatformLiquidationZksync is PrimaryLendingPlatformLiquidationCore
```

The PrimaryLendingPlatformLiquidationZksync contract is the contract that allows users to liquidate positions for zksync network.

Contract that allows users to liquidate positions. Inherit from PrimaryLendingPlatformLiquidationCore.
## Functions info

### liquidate (0xb44055fc)

```solidity
function liquidate(
    address _account,
    Asset.Info memory _prjInfo,
    Asset.Info memory _lendingInfo,
    uint256 _lendingTokenAmount,
    bytes32[] memory priceIds,
    bytes[] calldata updateData,
    bytes[] memory buyCalldata
)
    external
    payable
    isProjectTokenListed(_prjInfo.addr)
    isLendingTokenListed(_lendingInfo.addr)
    nonReentrant
    returns (address[] memory assets, uint256[] memory assetAmounts)
```

Liquidates a user's position based on the specified lending token amount and update related token's prices.

The function to be called when a user wants to liquidate their position. Support liquidation with hot borrowing or not.

Requirements:
- The project token is listed on the platform.
- The lending token is listed on the platform.
- The lending token amount must be greater than 0.
- The user must have a position for the given project token and lending token.
- The health factor must be less than 1.
- `_lendingTokenAmount` must be within the permissible range of liquidation amount.

Effects:
- Update price of related tokens.
- Calculates the health factor of the position using `getCurrentHealthFactor` function.
- Validates the health factor and ensures it's less than 1.
- Calculates the permissible liquidation range using `getLiquidationAmount` function.
- Validates `lendingTokenAmount` against the permissible range.
- Determines the amount of project token to send to the liquidator.
- Distributes rewards to the liquidator.


Parameters:

| Name                | Type              | Description                                                                                                                                                       |
| :------------------ | :---------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _account            | address           | The address of the borrower                                                                                                                                       |
| _prjInfo            | struct Asset.Info | Information about the project token, including its address and type.                                                                                              |
| _lendingInfo        | struct Asset.Info | Information about the lending token, including its address and type.                                                                                              |
| _lendingTokenAmount | uint256           | The amount of lending tokens to be used for liquidation                                                                                                           |
| priceIds            | bytes32[]         | An array of bytes32 price identifiers to update.                                                                                                                  |
| updateData          | bytes[]           | An array of bytes update data for the corresponding price identifiers.                                                                                            |
| buyCalldata         | bytes[]           | The calldata for buying the lending token from the exchange aggregator. If the calldata is empty, the liquidation will execute liquidation without hot borrowing. |

### liquidateFromModerator (0xc8359268)

```solidity
function liquidateFromModerator(
    address _account,
    Asset.Info memory _prjInfo,
    Asset.Info memory _lendingInfo,
    uint256 _lendingTokenAmount,
    address liquidator,
    bytes32[] memory priceIds,
    bytes[] calldata updateData,
    bytes[] memory buyCalldata
)
    external
    payable
    isProjectTokenListed(_prjInfo.addr)
    isLendingTokenListed(_lendingInfo.addr)
    onlyRelatedContracts
    nonReentrant
    returns (address[] memory assets, uint256[] memory assetAmounts)
```

Liquidates a portion of the borrower's debt using the lending token, called by a related contract and update related token's prices.

The function to be called when a user wants to liquidate their position. Support liquidation with hot borrowing or not.

Requirements:
- The project token is listed on the platform.
- The lending token is listed on the platform.
- Called by a related contract.
- The lending token amount must be greater than 0.
- The user must have a position for the given project token and lending token.
- The health factor must be less than 1.
- `_lendingTokenAmount` must be within the permissible range of liquidation amount.

Effects:
- Update price of related tokens.
- Calculates the health factor of the position using `getCurrentHealthFactor` function.
- Validates the health factor and ensures it's less than 1.
- Calculates the permissible liquidation range using `getLiquidationAmount` function.
- Validates `lendingTokenAmount` against the permissible range.
- Determines the amount of project token to send to the liquidator.
- Distributes rewards to the liquidator.


Parameters:

| Name                | Type              | Description                                                                                                                                                       |
| :------------------ | :---------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _account            | address           | The address of the borrower                                                                                                                                       |
| _prjInfo            | struct Asset.Info | Information about the project token, including its address and type.                                                                                              |
| _lendingInfo        | struct Asset.Info | Information about the lending token, including its address and type.                                                                                              |
| _lendingTokenAmount | uint256           | The amount of lending tokens to be used for liquidation                                                                                                           |
| liquidator          | address           | The address of the liquidator                                                                                                                                     |
| priceIds            | bytes32[]         | An array of bytes32 price identifiers to update.                                                                                                                  |
| updateData          | bytes[]           | An array of bytes update data for the corresponding price identifiers.                                                                                            |
| buyCalldata         | bytes[]           | The calldata for buying the lending token from the exchange aggregator. If the calldata is empty, the liquidation will execute liquidation without hot borrowing. |

### liquidatorRewardFactorWithUpdatePrices (0xe7f63838)

```solidity
function liquidatorRewardFactorWithUpdatePrices(
    address _account,
    address _projectToken,
    address _lendingToken,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256 lrfNumerator, uint256 lrfDenominator)
```

Calculates the liquidator reward factor (LRF) for a given position after after updating related token's prices.
####Formula:
- LRF = (1 + (1 - HF) * k)


Parameters:

| Name          | Type      | Description                                                              |
| :------------ | :-------- | :----------------------------------------------------------------------- |
| _account      | address   | The address of the borrower whose position is being considered.          |
| _projectToken | address   | The address of the project token.                                        |
| _lendingToken | address   | The address of the lending token.                                        |
| priceIds      | bytes32[] | An array of bytes32 price identifiers to update.                         |
| updateData    | bytes[]   | An array of bytes update data for the corresponding price identifiers.   |


Return values:

| Name           | Type    | Description                                      |
| :------------- | :------ | :----------------------------------------------- |
| lrfNumerator   | uint256 | The numerator of the liquidator reward factor.   |
| lrfDenominator | uint256 | The denominator of the liquidator reward factor. |

### getMaxLiquidationAmountWithUpdatePrices (0x25a695e5)

```solidity
function getMaxLiquidationAmountWithUpdatePrices(
    address _account,
    address _projectToken,
    address _lendingToken,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256 maxLA)
```

Calculates the maximum liquidation amount (MaxLA) for a given position after updating related token's prices.
####Formula:
- MaxLA = (LVR * CVc - THF * LVc) / (LRF * LVR - THF)


Parameters:

| Name          | Type      | Description                                                              |
| :------------ | :-------- | :----------------------------------------------------------------------- |
| _account      | address   | The address of the borrower whose position is being considered.          |
| _projectToken | address   | The address of the project token.                                        |
| _lendingToken | address   | The address of the lending token.                                        |
| priceIds      | bytes32[] | An array of bytes32 price identifiers to update.                         |
| updateData    | bytes[]   | An array of bytes update data for the corresponding price identifiers.   |


Return values:

| Name  | Type    | Description                                                |
| :---- | :------ | :--------------------------------------------------------- |
| maxLA | uint256 | The maximum liquidator reward amount in the lending token. |

### getLiquidationAmountWithUpdatePrices (0x02dfa5d4)

```solidity
function getLiquidationAmountWithUpdatePrices(
    address _account,
    address _projectToken,
    address _lendingToken,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256 maxLA, uint256 minLA)
```

Returns the minimum and maximum liquidation amount for a given account, project token, and lending token after updating related token's prices.

Formula:
- MinLA = min(MaxLA, MPA)
- MaxLA = (LVR * CVc - THF * LVc) / (LRF * LVR - THF)


Parameters:

| Name          | Type      | Description                                                              |
| :------------ | :-------- | :----------------------------------------------------------------------- |
| _account      | address   | The account for which to calculate the liquidation amount.               |
| _projectToken | address   | The project token address.                                               |
| _lendingToken | address   | The lending token address.                                               |
| priceIds      | bytes32[] | An array of bytes32 price identifiers to update.                         |
| updateData    | bytes[]   | An array of bytes update data for the corresponding price identifiers.   |


Return values:

| Name  | Type    | Description                       |
| :---- | :------ | :-------------------------------- |
| maxLA | uint256 | The maximum liquidation amount.   |
| minLA | uint256 | The minimum liquidation amount.   |
