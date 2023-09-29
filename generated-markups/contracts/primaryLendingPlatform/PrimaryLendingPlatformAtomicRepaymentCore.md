# PrimaryLendingPlatformAtomicRepaymentCore

## Abstract Contract Description


License: MIT

## 

```solidity
abstract contract PrimaryLendingPlatformAtomicRepaymentCore is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable
```

Core contract for the atomic repayment functionality for the PrimaryLendingPlatform contract.

Abstract contract that implements the atomic repayment core functionality for the PrimaryLendingPlatform contract.
## Events info

### SetPrimaryLendingPlatform

```solidity
event SetPrimaryLendingPlatform(address indexed newPrimaryLendingPlatform)
```

Emitted when the primary lending platform address is set.


Parameters:

| Name                      | Type    | Description                                      |
| :------------------------ | :------ | :----------------------------------------------- |
| newPrimaryLendingPlatform | address | The new address of the primary lending platform. |

### AtomicRepayment

```solidity
event AtomicRepayment(address indexed user, address indexed collateral, address indexed lendingAsset, uint256 amountSold, uint256 amountReceive)
```

Emitted when an atomic repayment is executed, where a user sells collateral to repay a loan.


Parameters:

| Name          | Type    | Description                                                           |
| :------------ | :------ | :-------------------------------------------------------------------- |
| user          | address | The address of the user who executed the atomic repayment.            |
| collateral    | address | The address of the collateral asset sold by the user.                 |
| lendingAsset  | address | The address of the lending asset that was repaid.                     |
| amountSold    | uint256 | The amount of collateral sold by the user.                            |
| amountReceive | uint256 | The amount of lending asset received by the user after the repayment. |

## Constants info

### MODERATOR_ROLE (0x797669c9)

```solidity
bytes32 constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE")
```


## State variables info

### primaryLendingPlatform (0x92641a7c)

```solidity
contract IPrimaryLendingPlatform primaryLendingPlatform
```


### exchangeAggregator (0x60df4f35)

```solidity
address exchangeAggregator
```


## Modifiers info

### onlyAdmin

```solidity
modifier onlyAdmin()
```

Throws if the caller is not the admin.
### onlyModerator

```solidity
modifier onlyModerator()
```

Throws if the caller is not the moderator.
### isProjectTokenListed

```solidity
modifier isProjectTokenListed(address projectToken)
```

Throws if the project token is not listed.


Parameters:

| Name         | Type    | Description                |
| :----------- | :------ | :------------------------- |
| projectToken | address | The project token address. |

## Functions info

### initialize (0xc4d66de8)

```solidity
function initialize(address pit) public initializer
```

Sets up initial roles, initializes AccessControl, and sets the provided PIT address


Parameters:

| Name | Type    | Description                                         |
| :--- | :------ | :-------------------------------------------------- |
| pit  | address | The address of the PrimaryLendingPlatform contract. |

### setPrimaryLendingPlatform (0xe801734a)

```solidity
function setPrimaryLendingPlatform(address pit) external onlyModerator
```

Sets the address of the primary lending platform contract.


Parameters:

| Name | Type    | Description                                                                                                 |
| :--- | :------ | :---------------------------------------------------------------------------------------------------------- |
| pit  | address | The address of the primary lending platform contract.
 
 Requirements:
 - `pit` cannot be the zero address. |

### getTotalOutstanding (0x00fe5da3)

```solidity
function getTotalOutstanding(
    address user,
    address projectToken,
    address lendingAsset
) public view returns (uint256 outstanding)
```

Calculates the outstanding amount (i.e., loanBody + accrual) for a given user, project token, and lending token.


Parameters:

| Name         | Type    | Description                                                      |
| :----------- | :------ | :--------------------------------------------------------------- |
| user         | address | The user for which to compute the outstanding amount.            |
| projectToken | address | The project token for which to compute the outstanding amount.   |
| lendingAsset | address | The lending token for which to compute the outstanding amount.   |


Return values:

| Name        | Type    | Description                                                            |
| :---------- | :------ | :--------------------------------------------------------------------- |
| outstanding | uint256 | The outstanding amount for the user, project token, and lending token. |

### getLendingToken (0x2ce36230)

```solidity
function getLendingToken(
    address user,
    address projectToken
) public view returns (address actualLendingToken)
```

Returns the actual lending token address for a user and project token.


Parameters:

| Name         | Type    | Description                  |
| :----------- | :------ | :--------------------------- |
| user         | address | The user address.            |
| projectToken | address | The project token address.   |


Return values:

| Name               | Type    | Description                       |
| :----------------- | :------ | :-------------------------------- |
| actualLendingToken | address | The actual lending token address. |

### getRemainingDeposit (0xf8f8b436)

```solidity
function getRemainingDeposit(
    address user,
    address projectToken
) public view returns (uint256 remainingDeposit)
```

Returns the remaining deposit of a user for a specific project token.


Parameters:

| Name         | Type    | Description                         |
| :----------- | :------ | :---------------------------------- |
| user         | address | The address of the user.            |
| projectToken | address | The address of the project token.   |


Return values:

| Name             | Type    | Description                                              |
| :--------------- | :------ | :------------------------------------------------------- |
| remainingDeposit | uint256 | The remaining deposit of the user for the project token. |

### getAvailableRepaidAmount (0x2c26e154)

```solidity
function getAvailableRepaidAmount(
    address user,
    address projectToken,
    address lendingToken
) public view returns (uint256 availableLendingAmount)
```

Returns the available repaid amount for a user in a specific project token and lending token.


Parameters:

| Name         | Type    | Description                         |
| :----------- | :------ | :---------------------------------- |
| user         | address | The address of the user.            |
| projectToken | address | The address of the project token.   |
| lendingToken | address | The address of the lending token.   |


Return values:

| Name                   | Type    | Description                                       |
| :--------------------- | :------ | :------------------------------------------------ |
| availableLendingAmount | uint256 | The available repaid amount in the lending token. |
