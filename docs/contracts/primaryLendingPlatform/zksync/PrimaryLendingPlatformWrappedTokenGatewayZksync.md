# PrimaryLendingPlatformWrappedTokenGatewayZksync

## Overview

#### License: MIT

```solidity
contract PrimaryLendingPlatformWrappedTokenGatewayZksync is PrimaryLendingPlatformWrappedTokenGatewayCore
```

The PrimaryLendingPlatformWrappedTokenGatewayZksync contract is the contract that provides the functionality for lending platform system using WETH for Zksync network.

Contract that provides the functionality for lending platform system using WETH. Inherit from PrimaryLendingPlatformWrappedTokenGatewayCore.
## Functions info

### withdraw (0x4143d0f6)

```solidity
function withdraw(
    uint256 projectTokenAmount,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) public payable nonReentrant
```

Allows users to withdraw their WETH tokens and receive Ether and update related token's prices.


Parameters:

| Name               | Type      | Description                                                      |
| :----------------- | :-------- | :--------------------------------------------------------------- |
| projectTokenAmount | uint256   | Amount of project tokens to withdraw.                            |
| priceIds           | bytes32[] | An array of price identifiers used to update the price oracle.   |
| updateData         | bytes[]   | An array of update data used to update the price oracle.         |

### borrow (0xbeadd4d8)

```solidity
function borrow(
    address projectToken,
    uint256 lendingTokenAmount,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) public payable nonReentrant
```

Borrows lending tokens for the caller and converts them to Ether and update related token's prices.


Parameters:

| Name               | Type      | Description                                                      |
| :----------------- | :-------- | :--------------------------------------------------------------- |
| projectToken       | address   | Address of the project token.                                    |
| lendingTokenAmount | uint256   | Amount of lending tokens to borrow.                              |
| priceIds           | bytes32[] | An array of price identifiers used to update the price oracle.   |
| updateData         | bytes[]   | An array of update data used to update the price oracle.         |

### supply (0xbb27018d)

```solidity
function supply(
    uint256 supplyAmount,
    bytes32[] memory priceIds,
    bytes[] calldata updateData,
    uint256 updateFee
) external payable nonReentrant
```

Allows users to supply ETH to the PrimaryLendingPlatformWrappedTokenGatewayCore contract.
The ETH is converted to WETH and then transferred to the user's address.
The supplyFromRelatedContract function of the PrimaryLendingPlatform contract is called to supply the WETH to the user.


Parameters:

| Name         | Type      | Description                                                      |
| :----------- | :-------- | :--------------------------------------------------------------- |
| supplyAmount | uint256   | The amount of ETH to supply.                                     |
| priceIds     | bytes32[] | An array of price identifiers used to update the price oracle.   |
| updateData   | bytes[]   | An array of update data used to update the price oracle.         |
| updateFee    | uint256   | Update fee pays for updating price.                              |

### redeem (0x964ccc4d)

```solidity
function redeem(
    uint256 bLendingTokenAmount,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable nonReentrant
```

Redeems the specified amount of bLendingToken for the underlying asset (WETH) and transfers it to the caller.


Parameters:

| Name                | Type      | Description                                                                                                                  |
| :------------------ | :-------- | :--------------------------------------------------------------------------------------------------------------------------- |
| bLendingTokenAmount | uint256   | The amount of bLendingToken to redeem. If set to `type(uint256).max`, redeems all the bLendingToken balance of the caller.   |
| priceIds            | bytes32[] | An array of price identifiers used to update the price oracle.                                                               |
| updateData          | bytes[]   | An array of update data used to update the price oracle.                                                                     |

### redeemUnderlying (0x0c2e2ed6)

```solidity
function redeemUnderlying(
    uint256 lendingTokenAmount,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable nonReentrant
```

Redeems the underlying asset from the Primary Lending Platform and transfers it to the caller.


Parameters:

| Name               | Type      | Description                                                      |
| :----------------- | :-------- | :--------------------------------------------------------------- |
| lendingTokenAmount | uint256   | The amount of the lending token to redeem.                       |
| priceIds           | bytes32[] | An array of price identifiers used to update the price oracle.   |
| updateData         | bytes[]   | An array of update data used to update the price oracle.         |

### liquidate (0xeca52d59)

```solidity
function liquidate(
    address _account,
    Asset.Info memory _prjInfo,
    Asset.Info memory _lendingInfo,
    uint256 _lendingTokenAmount,
    bytes32[] memory priceIds,
    bytes[] calldata updateData,
    uint256 updateFee,
    bytes[] memory buyCalldata
)
    public
    payable
    nonReentrant
    returns (address[] memory assets, uint256[] memory assetAmounts)
```

Liquidates a position by providing project tokens in Ether and update related token's prices.


Parameters:

| Name                | Type              | Description                                                                                                                                                       |
| :------------------ | :---------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _account            | address           | Address of the account to be liquidated.                                                                                                                          |
| _prjInfo            | struct Asset.Info | Information about the project token, including its address and type.                                                                                              |
| _lendingInfo        | struct Asset.Info | Information about the lending token, including its address and type.                                                                                              |
| _lendingTokenAmount | uint256           | Amount of lending tokens to liquidate.                                                                                                                            |
| priceIds            | bytes32[]         | An array of price identifiers used to update the price oracle.                                                                                                    |
| updateData          | bytes[]           | An array of update data used to update the price oracle.                                                                                                          |
| updateFee           | uint256           | Update fee pays for updating price.                                                                                                                               |
| buyCalldata         | bytes[]           | The calldata for buying the lending token from the exchange aggregator. If the calldata is empty, the liquidation will execute liquidation without hot borrowing. |

### leveragedBorrowWithProjectETH (0x291fd0dc)

```solidity
function leveragedBorrowWithProjectETH(
    Asset.Info memory _lendingInfo,
    uint256 _notionalExposure,
    uint256 _marginCollateralAmount,
    bytes[] memory buyCalldata,
    uint8 leverageType,
    bytes32[] memory priceIds,
    bytes[] calldata updateData,
    uint256 updateFee
) public payable nonReentrant
```

Borrows lending tokens in a leveraged position using project tokens in Ether and update related token's prices.


Parameters:

| Name                    | Type              | Description                                                            |
| :---------------------- | :---------------- | :--------------------------------------------------------------------- |
| _lendingInfo            | struct Asset.Info | Information about the lending token, including its address and type.   |
| _notionalExposure       | uint256           | The notional exposure of the leveraged position.                       |
| _marginCollateralAmount | uint256           | Amount of collateral in margin.                                        |
| buyCalldata             | bytes[]           | Calldata for buying project tokens.                                    |
| leverageType            | uint8             | The type of leverage.                                                  |
| priceIds                | bytes32[]         | An array of price identifiers used to update the price oracle.         |
| updateData              | bytes[]           | An array of update data used to update the price oracle.               |
| updateFee               | uint256           | Update fee pays for updating price.                                    |
