# IPrimaryLendingPlatformLeverage

## Overview

#### License: MIT

```solidity
interface IPrimaryLendingPlatformLeverage
```


## Functions info

### isLeveragePosition (0x3226d284)

```solidity
function isLeveragePosition(
    address user,
    address projectToken
) external view returns (bool)
```

Checks if a user has a leverage position for a project token.


Parameters:

| Name         | Type    | Description                       |
| :----------- | :------ | :-------------------------------- |
| user         | address | The address of the user.          |
| projectToken | address | The address of the project token. |

### deleteLeveragePosition (0x0614a25a)

```solidity
function deleteLeveragePosition(address user, address projectToken) external
```

Deletes a leverage position for a user and project token.


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
) external view returns (uint256 addingAmount)
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

### leveragedBorrowFromRelatedContract (0xb21cacd5)

```solidity
function leveragedBorrowFromRelatedContract(
    Asset.Info memory prjInfo,
    Asset.Info memory lendingInfo,
    uint256 notionalExposure,
    uint256 marginCollateralAmount,
    bytes[] memory buyCalldata,
    address borrower,
    uint8 leverageType,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable
```

Allows a related contract to borrow funds on behalf of a user to enter a leveraged position and update related token's prices.


Parameters:

| Name                   | Type              | Description                                                            |
| :--------------------- | :---------------- | :--------------------------------------------------------------------- |
| prjInfo                | struct Asset.Info | Information about the project token, including its address and type.   |
| lendingInfo            | struct Asset.Info | Information about the lending token, including its address and type.   |
| notionalExposure       | uint256           | The notional exposure of the user's investment.                        |
| marginCollateralAmount | uint256           | The amount of collateral to be deposited by the user.                  |
| buyCalldata            | bytes[]           | The calldata used for buying the project token on the DEX.             |
| borrower               | address           | The address of the user for whom the funds are being borrowed.         |
| leverageType           | uint8             | The type of leverage position.                                         |
| priceIds               | bytes32[]         | An array of bytes32 price identifiers to update.                       |
| updateData             | bytes[]           | An array of bytes update data for the corresponding price identifiers. |
