# PrimaryLendingPlatformWrappedTokenGateway

## Contract Description


License: MIT

## 

```solidity
contract PrimaryLendingPlatformWrappedTokenGateway is PrimaryLendingPlatformWrappedTokenGatewayCore
```

The PrimaryLendingPlatformWrappedTokenGateway contract is the contract that provides the functionality for lending platform system using WETH.

Contract that provides the functionality for lending platform system using WETH. Inherit from PrimaryLendingPlatformWrappedTokenGatewayCore.
## Functions info

### withdraw (0x2e1a7d4d)

```solidity
function withdraw(uint256 projectTokenAmount) external nonReentrant
```

Allows users to withdraw their WETH tokens and receive Ether.


Parameters:

| Name               | Type    | Description                           |
| :----------------- | :------ | :------------------------------------ |
| projectTokenAmount | uint256 | Amount of project tokens to withdraw. |

### borrow (0x4b8a3529)

```solidity
function borrow(
    address projectToken,
    uint256 lendingTokenAmount
) external nonReentrant
```

Borrows lending tokens for the caller and converts them to Ether.


Parameters:

| Name               | Type    | Description                         |
| :----------------- | :------ | :---------------------------------- |
| projectToken       | address | Address of the project token.       |
| lendingTokenAmount | uint256 | Amount of lending tokens to borrow. |

### liquidateWithProjectETH (0x533db6ec)

```solidity
function liquidateWithProjectETH(
    address account,
    address lendingToken,
    uint256 lendingTokenAmount
) external nonReentrant
```

Liquidates a position by providing project tokens in Ether.


Parameters:

| Name               | Type    | Description                                |
| :----------------- | :------ | :----------------------------------------- |
| account            | address | Address of the account to be liquidated.   |
| lendingToken       | address | Address of the lending token.              |
| lendingTokenAmount | uint256 | Amount of lending tokens to liquidate.     |

### liquidateWithLendingETH (0xa6439636)

```solidity
function liquidateWithLendingETH(
    address account,
    address projectToken,
    uint256 lendingTokenAmount
) external payable nonReentrant
```

Liquidates a position by providing lending tokens in Ether.


Parameters:

| Name               | Type    | Description                                     |
| :----------------- | :------ | :---------------------------------------------- |
| account            | address | Address of the account to be liquidated.        |
| projectToken       | address | Address of the project token.                   |
| lendingTokenAmount | uint256 | Amount of lending tokens in Ether to liquidate. |

### leveragedBorrowWithProjectETH (0xe59f0fe0)

```solidity
function leveragedBorrowWithProjectETH(
    address lendingToken,
    uint256 notionalExposure,
    uint256 marginCollateralAmount,
    bytes memory buyCalldata,
    uint8 leverageType
) external payable nonReentrant
```

Borrows lending tokens in a leveraged position using project tokens in Ether.


Parameters:

| Name                   | Type    | Description                                        |
| :--------------------- | :------ | :------------------------------------------------- |
| lendingToken           | address | Address of the lending token.                      |
| notionalExposure       | uint256 | The notional exposure of the leveraged position.   |
| marginCollateralAmount | uint256 | Amount of collateral in margin.                    |
| buyCalldata            | bytes   | Calldata for buying project tokens.                |
