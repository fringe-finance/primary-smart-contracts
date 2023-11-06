# PrimaryLendingPlatformWrappedTokenGatewayZksync

## Overview

#### License: MIT

## 

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

### liquidateWithProjectETH (0x3d82a5ca)

```solidity
function liquidateWithProjectETH(
    address _account,
    address _lendingToken,
    uint256 _lendingTokenAmount,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) public payable nonReentrant
```

Liquidates a position by providing project tokens in Ether and update related token's prices.


Parameters:

| Name                | Type      | Description                                                      |
| :------------------ | :-------- | :--------------------------------------------------------------- |
| _account            | address   | Address of the account to be liquidated.                         |
| _lendingToken       | address   | Address of the lending token.                                    |
| _lendingTokenAmount | uint256   | Amount of lending tokens to liquidate.                           |
| priceIds            | bytes32[] | An array of price identifiers used to update the price oracle.   |
| updateData          | bytes[]   | An array of update data used to update the price oracle.         |

### liquidateWithLendingETH (0x49b009d4)

```solidity
function liquidateWithLendingETH(
    address _account,
    address _projectToken,
    uint256 _lendingTokenAmount,
    bytes32[] memory priceIds,
    bytes[] calldata updateData,
    uint256 updateFee
) public payable nonReentrant
```

Liquidates a position by providing lending tokens in Ether and update related token's prices.


Parameters:

| Name                | Type      | Description                                                      |
| :------------------ | :-------- | :--------------------------------------------------------------- |
| _account            | address   | Address of the account to be liquidated.                         |
| _projectToken       | address   | Address of the project token.                                    |
| _lendingTokenAmount | uint256   | Amount of lending tokens in Ether to liquidate.                  |
| priceIds            | bytes32[] | An array of price identifiers used to update the price oracle.   |
| updateData          | bytes[]   | An array of update data used to update the price oracle.         |
| updateFee           | uint256   | Update fee pays for updating price.                              |

### leveragedBorrowWithProjectETH (0xd5790a86)

```solidity
function leveragedBorrowWithProjectETH(
    address _lendingToken,
    uint256 _notionalExposure,
    uint256 _marginCollateralAmount,
    bytes memory buyCalldata,
    uint8 leverageType,
    bytes32[] memory priceIds,
    bytes[] calldata updateData,
    uint256 updateFee
) public payable nonReentrant
```

Borrows lending tokens in a leveraged position using project tokens in Ether and update related token's prices.


Parameters:

| Name                    | Type      | Description                                                      |
| :---------------------- | :-------- | :--------------------------------------------------------------- |
| _lendingToken           | address   | Address of the lending token.                                    |
| _notionalExposure       | uint256   | The notional exposure of the leveraged position.                 |
| _marginCollateralAmount | uint256   | Amount of collateral in margin.                                  |
| buyCalldata             | bytes     | Calldata for buying project tokens.                              |
| leverageType            | uint8     | The type of leverage.                                            |
| priceIds                | bytes32[] | An array of price identifiers used to update the price oracle.   |
| updateData              | bytes[]   | An array of update data used to update the price oracle.         |
| updateFee               | uint256   | Update fee pays for updating price.                              |
