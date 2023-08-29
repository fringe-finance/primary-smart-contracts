# PrimaryLendingPlatformModerator

## Contract Description


License: MIT

## 

```solidity
contract PrimaryLendingPlatformModerator is Initializable, AccessControlUpgradeable
```

The PrimaryLendingPlatformModerator contract is the contract that provides the functionality for moderating the primary lending platform.

Contract for managing the moderators of the PrimaryLendingPlatform contract.
## Events info

### AddPrjToken

```solidity
event AddPrjToken(address indexed tokenPrj, string indexed name, string indexed symbol)
```

Emitted when a project token is added to the platform.


Parameters:

| Name     | Type    | Description                         |
| :------- | :------ | :---------------------------------- |
| tokenPrj | address | The address of the project token.   |
| name     | string  | The name of the project token.      |
| symbol   | string  | The symbol of the project token.    |

### RemoveProjectToken

```solidity
event RemoveProjectToken(address indexed tokenPrj)
```

Emitted when a project token is removed from the platform.


Parameters:

| Name     | Type    | Description                       |
| :------- | :------ | :-------------------------------- |
| tokenPrj | address | The address of the project token. |

### AddLendingToken

```solidity
event AddLendingToken(address indexed lendingToken, string indexed name, string indexed symbol)
```

Emitted when a lending token is added to the platform.


Parameters:

| Name         | Type    | Description                         |
| :----------- | :------ | :---------------------------------- |
| lendingToken | address | The address of the lending token.   |
| name         | string  | The name of the lending token.      |
| symbol       | string  | The symbol of the lending token.    |

### RemoveLendingToken

```solidity
event RemoveLendingToken(address indexed lendingToken)
```

Emitted when a lending token is removed from the platform.


Parameters:

| Name         | Type    | Description                       |
| :----------- | :------ | :-------------------------------- |
| lendingToken | address | The address of the lending token. |

### SetPausedProjectToken

```solidity
event SetPausedProjectToken(address indexed projectToken, bool isDepositPaused, bool isWithdrawPaused)
```

Emitted when the deposit or withdraw functionality of a project token is paused or unpaused.


Parameters:

| Name             | Type    | Description                                                |
| :--------------- | :------ | :--------------------------------------------------------- |
| projectToken     | address | The address of the project token.                          |
| isDepositPaused  | bool    | Whether the deposit functionality is paused or unpaused.   |
| isWithdrawPaused | bool    | Whether the withdraw functionality is paused or unpaused.  |

### SetPausedLendingToken

```solidity
event SetPausedLendingToken(address indexed lendingToken, bool isPaused)
```

Emitted when the borrow functionality of a lending token is paused or unpaused.


Parameters:

| Name         | Type    | Description                                             |
| :----------- | :------ | :------------------------------------------------------ |
| lendingToken | address | The address of the lending token.                       |
| isPaused     | bool    | Whether the borrow functionality is paused or unpaused. |

### SetBorrowLimitPerCollateralAsset

```solidity
event SetBorrowLimitPerCollateralAsset(address indexed projectToken, uint256 borrowLimit)
```

Emitted when the borrow limit per collateral asset is set for a project token.


Parameters:

| Name         | Type    | Description                            |
| :----------- | :------ | :------------------------------------- |
| projectToken | address | The address of the project token.      |
| borrowLimit  | uint256 | The borrow limit per collateral asset. |

### SetBorrowLimitPerLendingAsset

```solidity
event SetBorrowLimitPerLendingAsset(address indexed lendingToken, uint256 borrowLimit)
```

Emitted when the borrow limit per lending asset is set for a lending token.


Parameters:

| Name         | Type    | Description                         |
| :----------- | :------ | :---------------------------------- |
| lendingToken | address | The address of the lending token.   |
| borrowLimit  | uint256 | The borrow limit per lending asset. |

### LoanToValueRatioSet

```solidity
event LoanToValueRatioSet(address indexed tokenPrj, uint8 lvrNumerator, uint8 lvrDenominator)
```

Emitted when the loan-to-value ratio is set for a project token.


Parameters:

| Name           | Type    | Description                                 |
| :------------- | :------ | :------------------------------------------ |
| tokenPrj       | address | The address of the project token.           |
| lvrNumerator   | uint8   | The numerator of the loan-to-value ratio.   |
| lvrDenominator | uint8   | The denominator of the loan-to-value ratio. |

### GrandModerator

```solidity
event GrandModerator(address indexed moderator)
```

Emitted when a moderator is granted access to the platform.


Parameters:

| Name      | Type    | Description                   |
| :-------- | :------ | :---------------------------- |
| moderator | address | The address of the moderator. |

### RevokeModerator

```solidity
event RevokeModerator(address indexed moderator)
```

Emitted when a moderator's access to the platform is revoked.


Parameters:

| Name      | Type    | Description                   |
| :-------- | :------ | :---------------------------- |
| moderator | address | The address of the moderator. |

### SetPrimaryLendingPlatformLeverage

```solidity
event SetPrimaryLendingPlatformLeverage(address indexed newPrimaryLendingPlatformLeverage)
```

Emitted when the leverage of the PrimaryLendingPlatform contract is set.


Parameters:

| Name                              | Type    | Description                                              |
| :-------------------------------- | :------ | :------------------------------------------------------- |
| newPrimaryLendingPlatformLeverage | address | The new leverage of the PrimaryLendingPlatform contract. |

### SetPriceOracle

```solidity
event SetPriceOracle(address indexed newOracle)
```

Emitted when the price oracle contract is set.


Parameters:

| Name      | Type    | Description                                   |
| :-------- | :------ | :-------------------------------------------- |
| newOracle | address | The address of the new price oracle contract. |

### AddRelatedContracts

```solidity
event AddRelatedContracts(address indexed relatedContract)
```

Emitted when a related contract is added to the platform.


Parameters:

| Name            | Type    | Description                          |
| :-------------- | :------ | :----------------------------------- |
| relatedContract | address | The address of the related contract. |

### RemoveRelatedContracts

```solidity
event RemoveRelatedContracts(address indexed relatedContract)
```

Emitted when a related contract is removed from the platform.


Parameters:

| Name            | Type    | Description                          |
| :-------------- | :------ | :----------------------------------- |
| relatedContract | address | The address of the related contract. |

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


## Modifiers info

### onlyAdmin

```solidity
modifier onlyAdmin()
```

Modifier to check if the caller has the admin role.
### onlyModerator

```solidity
modifier onlyModerator()
```

Modifier to check if the caller has the moderator role.
### isProjectTokenListed

```solidity
modifier isProjectTokenListed(address projectToken)
```

Modifier to check if a project token is listed on the platform.


Parameters:

| Name         | Type    | Description                       |
| :----------- | :------ | :-------------------------------- |
| projectToken | address | The address of the project token. |

### isLendingTokenListed

```solidity
modifier isLendingTokenListed(address lendingToken)
```

Modifier to check if a lending token is listed on the platform.


Parameters:

| Name         | Type    | Description                       |
| :----------- | :------ | :-------------------------------- |
| lendingToken | address | The address of the lending token. |

## Functions info

### initialize (0xc4d66de8)

```solidity
function initialize(address pit) public initializer
```

Initializes the contract by setting up the default admin role, the moderator role, and the primary index token.


Parameters:

| Name | Type    | Description                             |
| :--- | :------ | :-------------------------------------- |
| pit  | address | The address of the primary index token. |

### grandModerator (0x04ebc8b1)

```solidity
function grandModerator(address newModerator) external onlyAdmin
```

Grants the moderator role to a new address.
#### Requirements:
- Called by the admin role.
- The new moderator address must not be the zero address.


Parameters:

| Name         | Type    | Description                       |
| :----------- | :------ | :-------------------------------- |
| newModerator | address | The address of the new moderator. |

### revokeModerator (0x36445636)

```solidity
function revokeModerator(address moderator) external onlyAdmin
```

Revokes the moderator role from an address.
#### Requirements:
- Called by the admin role.
- The moderator address must not be the zero address.


Parameters:

| Name      | Type    | Description                                 |
| :-------- | :------ | :------------------------------------------ |
| moderator | address | The address of the moderator to be revoked. |

### transferAdminRole (0xada8f919)

```solidity
function transferAdminRole(address newAdmin) external onlyAdmin
```

Transfers the admin role to a new address.
#### Requirements:
- Called by the admin role.
- The moderator address must not be the zero address.


Parameters:

| Name     | Type    | Description                   |
| :------- | :------ | :---------------------------- |
| newAdmin | address | The address of the new admin. |

### transferAdminRoleForPIT (0x23e0f33e)

```solidity
function transferAdminRoleForPIT(
    address currentAdmin,
    address newAdmin
) external onlyAdmin
```

Transfers the admin role for the primary index token to a new address.
#### Requirements:
- Called by the admin role.
- The current admin address must not be the zero address.
- The new admin address must not be the zero address.


Parameters:

| Name         | Type    | Description                         |
| :----------- | :------ | :---------------------------------- |
| currentAdmin | address | The address of the current admin.   |
| newAdmin     | address | The address of the new admin.       |

### addProjectToken (0xf8095cb9)

```solidity
function addProjectToken(
    address projectToken,
    uint8 loanToValueRatioNumerator,
    uint8 loanToValueRatioDenominator
) public onlyAdmin
```

Adds a project token to the platform with the specified loan-to-value ratio.


Parameters:

| Name                        | Type    | Description                                                                                                                                                                                                                                                                                                                                                              |
| :-------------------------- | :------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| projectToken                | address | The address of the project token to be added.                                                                                                                                                                                                                                                                                                                            |
| loanToValueRatioNumerator   | uint8   | The numerator of the loan-to-value ratio.                                                                                                                                                                                                                                                                                                                                |
| loanToValueRatioDenominator | uint8   | The denominator of the loan-to-value ratio. #### Requirements: - The project token address must not be the zero address. - Only the admin can call this function. #### Effects: - Adds the project token to the platform. - Sets the loan-to-value ratio for the project token. - Sets the pause status for deposit and withdrawal of the project token to false. |

### removeProjectToken (0xcb69ae80)

```solidity
function removeProjectToken(
    uint256 projectTokenId
)
    external
    onlyAdmin
    isProjectTokenListed(primaryLendingPlatform.projectTokens(projectTokenId))
```

Removes a project token from the primary lending platform.


Parameters:

| Name           | Type    | Description                                                                                                                                                                                                                   |
| :------------- | :------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| projectTokenId | uint256 | The ID of the project token to be removed. #### Requirements: - The caller must be an admin. - The project token must be listed on the primary lending platform. - The total deposited project token amount must be zero. |

### addLendingToken (0x1d0957e9)

```solidity
function addLendingToken(
    address lendingToken,
    address bLendingToken,
    bool isPaused,
    uint8 loanToValueRatioNumerator,
    uint8 loanToValueRatioDenominator
) external onlyAdmin
```

Adds a new lending token to the platform.


Parameters:

| Name                        | Type    | Description                                                                                                                                                                                                                                                                                                                                                                             |
| :-------------------------- | :------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| lendingToken                | address | The address of the lending token to be added.                                                                                                                                                                                                                                                                                                                                           |
| bLendingToken               | address | The address of the corresponding bLending token.                                                                                                                                                                                                                                                                                                                                        |
| isPaused                    | bool    | A boolean indicating whether the lending token is paused or not.                                                                                                                                                                                                                                                                                                                        |
| loanToValueRatioNumerator   | uint8   | The numerator of the loan-to-value ratio for the lending token.                                                                                                                                                                                                                                                                                                                         |
| loanToValueRatioDenominator | uint8   | The denominator of the loan-to-value ratio for the lending token. #### Requirements: - The lending token address and bLending token address must not be zero. - Only the admin can call this function. #### Effects: - Adds the lending token to the platform. - Sets the loan-to-value ratio for the lending token. - Sets the pause status for borrowing of the lending token. |

### removeLendingToken (0xe032563a)

```solidity
function removeLendingToken(
    uint256 lendingTokenId
)
    external
    onlyAdmin
    isLendingTokenListed(primaryLendingPlatform.lendingTokens(lendingTokenId))
```

Removes a lending token from the primary lending platform.


Parameters:

| Name           | Type    | Description                                                                                                                                                                                                                             |
| :------------- | :------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| lendingTokenId | uint256 | The ID of the lending token to be removed. #### Requirements: - The caller must have admin role. - The lending token must be listed in the primary lending platform. - There must be no borrow of the lending token in any project. |

### setPrimaryLendingPlatformLeverage (0xa1ab5419)

```solidity
function setPrimaryLendingPlatformLeverage(
    address newPrimaryLendingPlatformLeverage
) external onlyAdmin
```

Sets the address of the primary lending platform leverage contract.
#### Requirements:
- Only the admin can call this function.
- The new address must not be the zero address.


Parameters:

| Name                              | Type    | Description                                                        |
| :-------------------------------- | :------ | :----------------------------------------------------------------- |
| newPrimaryLendingPlatformLeverage | address | The address of the new primary lending platform leverage contract. |

### setPriceOracle (0x530e784f)

```solidity
function setPriceOracle(address newOracle) external onlyAdmin
```

Sets the price oracle address for the primary lending platform.
#### Requirements:
- Only the admin can call this function.
- The new address must not be the zero address.


Parameters:

| Name      | Type    | Description                             |
| :-------- | :------ | :-------------------------------------- |
| newOracle | address | The new price oracle address to be set. |

### addRelatedContracts (0x83bb578d)

```solidity
function addRelatedContracts(address newRelatedContract) external onlyAdmin
```

Adds an address to the list of related contracts.
#### Requirements:
- Only the admin can call this function.
- The new address must not be the zero address.


Parameters:

| Name               | Type    | Description                                          |
| :----------------- | :------ | :--------------------------------------------------- |
| newRelatedContract | address | The address of the new related contract to be added. |

### removeRelatedContracts (0x3b3e330b)

```solidity
function removeRelatedContracts(address relatedContract) external onlyAdmin
```

Removes an address from the list of related contracts.
#### Requirements:
- Only the admin can call this function.
- The new address must not be the zero address.


Parameters:

| Name            | Type    | Description                                        |
| :-------------- | :------ | :------------------------------------------------- |
| relatedContract | address | The address of the related contract to be removed. |

### setProjectTokenInfo (0x4a5333bc)

```solidity
function setProjectTokenInfo(
    address projectToken,
    bool isDepositPaused,
    bool isWithdrawPaused,
    uint8 loanToValueRatioNumerator,
    uint8 loanToValueRatioDenominator
) public onlyModerator
```

Sets the project token information such as deposit and withdraw pause status, and loan-to-value ratio for a given project token.
#### Requirements:
- The `loanToValueRatioNumerator` must be less than or equal to `loanToValueRatioDenominator`.
- Only the moderator can call this function.


Parameters:

| Name                        | Type    | Description                                                                      |
| :-------------------------- | :------ | :------------------------------------------------------------------------------- |
| projectToken                | address | The address of the project token.                                                |
| isDepositPaused             | bool    | The boolean value indicating whether deposit is paused for the project token.    |
| isWithdrawPaused            | bool    | The boolean value indicating whether withdraw is paused for the project token.   |
| loanToValueRatioNumerator   | uint8   | The numerator value of the loan-to-value ratio for the project token.            |
| loanToValueRatioDenominator | uint8   | The denominator value of the loan-to-value ratio for the project token.          |

### setPausedProjectToken (0x2c67c660)

```solidity
function setPausedProjectToken(
    address projectToken,
    bool isDepositPaused,
    bool isWithdrawPaused
) public onlyModerator isProjectTokenListed(projectToken)
```

Sets the deposit and withdraw pause status for a project token.


Parameters:

| Name             | Type    | Description                                                      |
| :--------------- | :------ | :--------------------------------------------------------------- |
| projectToken     | address | The address of the project token.                                |
| isDepositPaused  | bool    | The boolean value indicating whether deposit is paused or not.   |
| isWithdrawPaused | bool    | The boolean value indicating whether withdraw is paused or not.  |

### setLendingTokenInfo (0x821363a0)

```solidity
function setLendingTokenInfo(
    address lendingToken,
    address bLendingToken,
    bool isPaused,
    uint8 loanToValueRatioNumerator,
    uint8 loanToValueRatioDenominator
) public onlyModerator
```

Sets the lending token information for the primary lending platform.
#### Requirements:
- The function can only be called by the moderator.
- The underlying asset of the bLending token must be the same as the lending token.


Parameters:

| Name                        | Type    | Description                                                        |
| :-------------------------- | :------ | :----------------------------------------------------------------- |
| lendingToken                | address | The address of the lending token.                                  |
| bLendingToken               | address | The address of the corresponding bLending token.                   |
| isPaused                    | bool    | A boolean indicating whether the lending token is paused or not.   |
| loanToValueRatioNumerator   | uint8   | The numerator of the loan-to-value ratio.                          |
| loanToValueRatioDenominator | uint8   | The denominator of the loan-to-value ratio.                        |

### setPausedLendingToken (0x58841bee)

```solidity
function setPausedLendingToken(
    address lendingToken,
    bool isPaused
) public onlyModerator isLendingTokenListed(lendingToken)
```

Sets the pause status for a lending token.
#### Requirements:
- The function can only be called by the moderator.
- The lending token must be listed on the primary lending platform.


Parameters:

| Name         | Type    | Description                                 |
| :----------- | :------ | :------------------------------------------ |
| lendingToken | address | The address of the lending token.           |
| isPaused     | bool    | The new pause status for the lending token. |

### setBorrowLimitPerCollateralAsset (0x8e85cdfa)

```solidity
function setBorrowLimitPerCollateralAsset(
    address projectToken,
    uint256 borrowLimit
) external onlyModerator isProjectTokenListed(projectToken)
```

Sets the borrow limit per collateral for a given project token.
#### Requirements:
- The function can only be called by the moderator.
- The project token must be listed on the primary lending platform.
- The borrow limit must be greater than zero.
- The project token address must not be the zero address.


Parameters:

| Name         | Type    | Description                                            |
| :----------- | :------ | :----------------------------------------------------- |
| projectToken | address | The project token for which to set the borrow limit.   |
| borrowLimit  | uint256 | The new borrow limit.                                  |

### setBorrowLimitPerLendingAsset (0x92a39190)

```solidity
function setBorrowLimitPerLendingAsset(
    address lendingToken,
    uint256 borrowLimit
) external onlyModerator isLendingTokenListed(lendingToken)
```

Sets the borrow limit per lending asset for a given lending token.
#### Requirements:
- The function can only be called by the moderator.
- The lending token must be listed on the primary lending platform.
- The borrow limit must be greater than zero.
- The lendingToken token address must not be the zero address.


Parameters:

| Name         | Type    | Description                                            |
| :----------- | :------ | :----------------------------------------------------- |
| lendingToken | address | The lending token for which to set the borrow limit.   |
| borrowLimit  | uint256 | The new borrow limit.                                  |
