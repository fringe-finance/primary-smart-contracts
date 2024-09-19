# IPrimaryLendingPlatformLiquidation

## Overview

#### License: MIT

```solidity
interface IPrimaryLendingPlatformLiquidation
```


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
    returns (address[] memory assets, uint256[] memory assetAmounts)
```

The function to be called when a user wants to liquidate their position. Support liquidation with hot borrowing or not.


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
    returns (address[] memory assets, uint256[] memory assetAmounts)
```

The function to be called when a user wants to liquidate their position. Support liquidation with hot borrowing or not.


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
