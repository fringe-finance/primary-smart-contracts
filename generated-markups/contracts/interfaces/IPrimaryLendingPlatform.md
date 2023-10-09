# IPrimaryLendingPlatform

## Interface Description


License: MIT

## 

```solidity
interface IPrimaryLendingPlatform
```


## Structs info

### Ratio

```solidity
struct Ratio {
	uint8 numerator;
	uint8 denominator;
}
```


### ProjectTokenInfo

```solidity
struct ProjectTokenInfo {
	bool isListed;
	bool isDepositPaused;
	bool isWithdrawPaused;
	IPrimaryLendingPlatform.Ratio loanToValueRatio;
}
```


### LendingTokenInfo

```solidity
struct LendingTokenInfo {
	bool isListed;
	bool isPaused;
	address bLendingToken;
}
```


### DepositPosition

```solidity
struct DepositPosition {
	uint256 depositedProjectTokenAmount;
}
```


### BorrowPosition

```solidity
struct BorrowPosition {
	uint256 loanBody;
	uint256 accrual;
}
```


## Functions info

### grantRole (0x2f2ff15d)

```solidity
function grantRole(bytes32 role, address newModerator) external
```

Grants the role to a new account.


Parameters:

| Name         | Type    | Description                                    |
| :----------- | :------ | :--------------------------------------------- |
| role         | bytes32 | The role to grant.                             |
| newModerator | address | The address of the account receiving the role. |

### revokeRole (0xd547741f)

```solidity
function revokeRole(bytes32 role, address moderator) external
```

Revokes the moderator role from an account.


Parameters:

| Name      | Type    | Description                                 |
| :-------- | :------ | :------------------------------------------ |
| role      | bytes32 | The role to revoke.                         |
| moderator | address | The address of the account losing the role. |

### setPrimaryLendingPlatformModeratorModerator (0xa0290239)

```solidity
function setPrimaryLendingPlatformModeratorModerator(
    address newModeratorContract
) external
```

Sets the address of the new moderator contract by the admin.


Parameters:

| Name                 | Type    | Description                                |
| :------------------- | :------ | :----------------------------------------- |
| newModeratorContract | address | The address of the new moderator contract. |

### setPriceOracle (0x530e784f)

```solidity
function setPriceOracle(address newPriceOracle) external
```

Sets the address of the new price oracle by the moderator contract.


Parameters:

| Name           | Type    | Description                                   |
| :------------- | :------ | :-------------------------------------------- |
| newPriceOracle | address | The address of the new price oracle contract. |

### setPrimaryLendingPlatformLeverage (0xa1ab5419)

```solidity
function setPrimaryLendingPlatformLeverage(
    address newPrimaryLendingPlatformLeverage
) external
```

Sets the address of the new primary index token leverage contract by the moderator contract.


Parameters:

| Name                              | Type    | Description                                                   |
| :-------------------------------- | :------ | :------------------------------------------------------------ |
| newPrimaryLendingPlatformLeverage | address | The address of the new primary index token leverage contract. |

### setRelatedContract (0xdcb4252a)

```solidity
function setRelatedContract(address relatedContract, bool isRelated) external
```

Sets whether an address is a related contract or not by the moderator contract.


Parameters:

| Name            | Type    | Description                                                 |
| :-------------- | :------ | :---------------------------------------------------------- |
| relatedContract | address | The address of the contract to be set as related.           |
| isRelated       | bool    | Boolean to indicate whether the contract is related or not. |

### removeProjectToken (0x3af44bfa)

```solidity
function removeProjectToken(
    uint256 projectTokenId,
    address projectToken
) external
```

Removes a project token from the list by the moderator contract.


Parameters:

| Name           | Type    | Description                                     |
| :------------- | :------ | :---------------------------------------------- |
| projectTokenId | uint256 | The ID of the project token to be removed.      |
| projectToken   | address | The address of the project token to be removed. |

### removeLendingToken (0xc1ab02ee)

```solidity
function removeLendingToken(
    uint256 lendingTokenId,
    address lendingToken
) external
```

Removes a lending token from the list by the moderator contract.


Parameters:

| Name           | Type    | Description                                     |
| :------------- | :------ | :---------------------------------------------- |
| lendingTokenId | uint256 | The ID of the lending token to be removed.      |
| lendingToken   | address | The address of the lending token to be removed. |

### setBorrowLimitPerCollateralAsset (0x8e85cdfa)

```solidity
function setBorrowLimitPerCollateralAsset(
    address projectToken,
    uint256 newBorrowLimit
) external
```

Sets the borrow limit per collateral by the moderator contract.


Parameters:

| Name           | Type    | Description                         |
| :------------- | :------ | :---------------------------------- |
| projectToken   | address | The address of the project token.   |
| newBorrowLimit | uint256 | The new borrow limit.               |

### setBorrowLimitPerLendingAsset (0x92a39190)

```solidity
function setBorrowLimitPerLendingAsset(
    address lendingToken,
    uint256 newBorrowLimit
) external
```

Sets the borrow limit per lending asset by the moderator contract.


Parameters:

| Name           | Type    | Description                         |
| :------------- | :------ | :---------------------------------- |
| lendingToken   | address | The address of the lending token.   |
| newBorrowLimit | uint256 | The new borrow limit.               |

### setProjectTokenInfo (0x4a5333bc)

```solidity
function setProjectTokenInfo(
    address projectToken,
    bool isDepositPaused,
    bool isWithdrawPaused,
    uint8 loanToValueRatioNumerator,
    uint8 loanToValueRatioDenominator
) external
```

Sets the parameters for a project token


Parameters:

| Name                        | Type    | Description                                                      |
| :-------------------------- | :------ | :--------------------------------------------------------------- |
| projectToken                | address | The address of the project token                                 |
| isDepositPaused             | bool    | The new pause status for deposit                                 |
| isWithdrawPaused            | bool    | The new pause status for withdrawal                              |
| loanToValueRatioNumerator   | uint8   | The numerator of the loan-to-value ratio for the project token   |
| loanToValueRatioDenominator | uint8   | The denominator of the loan-to-value ratio for the project token |

### setPausedProjectToken (0x2c67c660)

```solidity
function setPausedProjectToken(
    address projectToken,
    bool isDepositPaused,
    bool isWithdrawPaused
) external
```

Pauses or unpauses deposits and withdrawals of a project token.


Parameters:

| Name             | Type    | Description                                                    |
| :--------------- | :------ | :------------------------------------------------------------- |
| projectToken     | address | The address of the project token.                              |
| isDepositPaused  | bool    | Boolean indicating whether deposits are paused or unpaused.    |
| isWithdrawPaused | bool    | Boolean indicating whether withdrawals are paused or unpaused. |

### setLendingTokenInfo (0x821363a0)

```solidity
function setLendingTokenInfo(
    address lendingToken,
    address bLendingToken,
    bool isPaused,
    uint8 loanToValueRatioNumerator,
    uint8 loanToValueRatioDenominator
) external
```

Sets the bLendingToken and paused status of a lending token.


Parameters:

| Name                        | Type    | Description                                                           |
| :-------------------------- | :------ | :-------------------------------------------------------------------- |
| lendingToken                | address | The address of the lending token.                                     |
| bLendingToken               | address | The address of the bLendingToken.                                     |
| isPaused                    | bool    | Boolean indicating whether the lending token is paused or unpaused.   |
| loanToValueRatioNumerator   | uint8   | The numerator of the loan-to-value ratio for the lending token.       |
| loanToValueRatioDenominator | uint8   | The denominator of the loan-to-value ratio for the lending token.     |

### setPausedLendingToken (0x58841bee)

```solidity
function setPausedLendingToken(address lendingToken, bool isPaused) external
```

Pauses or unpauses a lending token.


Parameters:

| Name         | Type    | Description                                                         |
| :----------- | :------ | :------------------------------------------------------------------ |
| lendingToken | address | The address of the lending token.                                   |
| isPaused     | bool    | Boolean indicating whether the lending token is paused or unpaused. |

### deposit (0x47e7ef24)

```solidity
function deposit(address projectToken, uint256 projectTokenAmount) external
```

Deposits project tokens and calculates the deposit position.


Parameters:

| Name               | Type    | Description                                         |
| :----------------- | :------ | :-------------------------------------------------- |
| projectToken       | address | The address of the project token to be deposited.   |
| projectTokenAmount | uint256 | The amount of project tokens to be deposited.       |

### depositFromRelatedContracts (0xbf423b75)

```solidity
function depositFromRelatedContracts(
    address projectToken,
    uint256 projectTokenAmount,
    address user,
    address beneficiary
) external
```

Deposits project tokens on behalf of a user from a related contract and calculates the deposit position.


Parameters:

| Name               | Type    | Description                                                            |
| :----------------- | :------ | :--------------------------------------------------------------------- |
| projectToken       | address | The address of the project token to be deposited.                      |
| projectTokenAmount | uint256 | The amount of project tokens to be deposited.                          |
| user               | address | The address of the user who representative deposit.                    |
| beneficiary        | address | The address of the beneficiary whose deposit position will be updated. |

### calcAndTransferDepositPosition (0x556d4704)

```solidity
function calcAndTransferDepositPosition(
    address projectToken,
    uint256 projectTokenAmount,
    address user,
    address receiver
) external returns (uint256)
```

Decreases the deposited project token amount of the user's deposit position by the given amount,
transfers the given amount of project tokens to the receiver, and returns the amount transferred.


Parameters:

| Name               | Type    | Description                                                       |
| :----------------- | :------ | :---------------------------------------------------------------- |
| projectToken       | address | The address of the project token being withdrawn                  |
| projectTokenAmount | uint256 | The amount of project tokens being withdrawn                      |
| user               | address | The address of the user whose deposit position is being updated   |
| receiver           | address | The address of the user receiving the withdrawn project tokens    |


Return values:

| Name | Type    | Description                                              |
| :--- | :------ | :------------------------------------------------------- |
| [0]  | uint256 | The amount of project tokens transferred to the receiver |

### calcDepositPosition (0xdf5e6bed)

```solidity
function calcDepositPosition(
    address projectToken,
    uint256 projectTokenAmount,
    address user
) external
```

Calculates the deposit position for a user's deposit of a given amount of a project token.


Parameters:

| Name               | Type    | Description                                        |
| :----------------- | :------ | :------------------------------------------------- |
| projectToken       | address | The address of the project token being deposited   |
| projectTokenAmount | uint256 | The amount of project tokens being deposited       |
| user               | address | The address of the user making the deposit         |

### withdraw (0xf3fef3a3)

```solidity
function withdraw(address projectToken, uint256 projectTokenAmount) external
```

Allows a user to withdraw a given amount of a project token from their deposit position.


Parameters:

| Name               | Type    | Description                                        |
| :----------------- | :------ | :------------------------------------------------- |
| projectToken       | address | The address of the project token being withdrawn   |
| projectTokenAmount | uint256 | The amount of project tokens being withdrawn       |

### withdrawFromRelatedContracts (0x1132a65f)

```solidity
function withdrawFromRelatedContracts(
    address projectToken,
    uint256 projectTokenAmount,
    address user,
    address beneficiary
) external returns (uint256)
```

Allows a related contract to initiate a withdrawal of a given amount of a project token from a user's deposit position.


Parameters:

| Name               | Type    | Description                                                              |
| :----------------- | :------ | :----------------------------------------------------------------------- |
| projectToken       | address | The address of the project token being withdrawn                         |
| projectTokenAmount | uint256 | The amount of project tokens being withdrawn                             |
| user               | address | The address of the user whose deposit position is being withdrawn from   |
| beneficiary        | address | The address of the user receiving the withdrawn project tokens           |


Return values:

| Name | Type    | Description                                                           |
| :--- | :------ | :-------------------------------------------------------------------- |
| [0]  | uint256 | amount of project tokens withdrawn and transferred to the beneficiary |

### withdraw (0x127b642e)

```solidity
function withdraw(
    address projectToken,
    uint256 projectTokenAmount,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable
```

Allows a user to withdraw a given amount of a project token from their deposit position.


Parameters:

| Name               | Type      | Description                                        |
| :----------------- | :-------- | :------------------------------------------------- |
| projectToken       | address   | The address of the project token being withdrawn   |
| projectTokenAmount | uint256   | The amount of project tokens being withdrawn       |
| priceIds           | bytes32[] | The priceIds need to update.                       |
| updateData         | bytes[]   | The updateData provided by PythNetwork.            |

### withdrawFromRelatedContracts (0x9afab2ec)

```solidity
function withdrawFromRelatedContracts(
    address projectToken,
    uint256 projectTokenAmount,
    address user,
    address beneficiary,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256)
```

Allows a related contract to initiate a withdrawal of a given amount of a project token from a user's deposit position.


Parameters:

| Name               | Type      | Description                                                              |
| :----------------- | :-------- | :----------------------------------------------------------------------- |
| projectToken       | address   | The address of the project token being withdrawn                         |
| projectTokenAmount | uint256   | The amount of project tokens being withdrawn                             |
| user               | address   | The address of the user whose deposit position is being withdrawn from   |
| beneficiary        | address   | The address of the user receiving the withdrawn project tokens           |
| priceIds           | bytes32[] | The priceIds need to update.                                             |
| updateData         | bytes[]   | The updateData provided by PythNetwork.                                  |


Return values:

| Name | Type    | Description                                                           |
| :--- | :------ | :-------------------------------------------------------------------- |
| [0]  | uint256 | amount of project tokens withdrawn and transferred to the beneficiary |

### borrow (0xf6c0b770)

```solidity
function borrow(
    address projectToken,
    address lendingToken,
    uint256 lendingTokenAmount,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable
```

Allows a user to borrow lending tokens by providing project tokens as collateral.


Parameters:

| Name               | Type    | Description                                                  |
| :----------------- | :------ | :----------------------------------------------------------- |
| projectToken       | address | The address of the project token being used as collateral.   |
| lendingToken       | address | The address of the lending token being borrowed.             |
| lendingTokenAmount | uint256 | The amount of lending tokens to be borrowed.                 |

### borrowFromRelatedContract (0x07f4a25c)

```solidity
function borrowFromRelatedContract(
    address projectToken,
    address lendingToken,
    uint256 lendingTokenAmount,
    address user,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256 amount)
```

Allows a related contract to borrow lending tokens on behalf of a user by providing project tokens as collateral.


Parameters:

| Name               | Type    | Description                                                                      |
| :----------------- | :------ | :------------------------------------------------------------------------------- |
| projectToken       | address | The address of the project token being used as collateral.                       |
| lendingToken       | address | The address of the lending token being borrowed.                                 |
| lendingTokenAmount | uint256 | The amount of lending tokens to be borrowed.                                     |
| user               | address | The address of the user on whose behalf the lending tokens are being borrowed.   |


Return values:

| Name   | Type    | Description                |
| :----- | :------ | :------------------------- |
| amount | uint256 | of lending tokens borrowed |

### borrow (0x5224372c)

```solidity
function borrow(
    address projectToken,
    address lendingToken,
    uint256 lendingTokenAmount
) external
```

Allows a user to borrow lending tokens by providing project tokens as collateral.


Parameters:

| Name               | Type    | Description                                                  |
| :----------------- | :------ | :----------------------------------------------------------- |
| projectToken       | address | The address of the project token being used as collateral.   |
| lendingToken       | address | The address of the lending token being borrowed.             |
| lendingTokenAmount | uint256 | The amount of lending tokens to be borrowed.                 |

### borrowFromRelatedContract (0x284a211e)

```solidity
function borrowFromRelatedContract(
    address projectToken,
    address lendingToken,
    uint256 lendingTokenAmount,
    address user
) external returns (uint256 amount)
```

Allows a related contract to borrow lending tokens on behalf of a user by providing project tokens as collateral.


Parameters:

| Name               | Type    | Description                                                                      |
| :----------------- | :------ | :------------------------------------------------------------------------------- |
| projectToken       | address | The address of the project token being used as collateral.                       |
| lendingToken       | address | The address of the lending token being borrowed.                                 |
| lendingTokenAmount | uint256 | The amount of lending tokens to be borrowed.                                     |
| user               | address | The address of the user on whose behalf the lending tokens are being borrowed.   |


Return values:

| Name   | Type    | Description                |
| :----- | :------ | :------------------------- |
| amount | uint256 | of lending tokens borrowed |

### supply (0xf2b9fdb8)

```solidity
function supply(address lendingToken, uint256 lendingTokenAmount) external
```

Supplies a certain amount of lending tokens to the platform.


Parameters:

| Name               | Type    | Description                              |
| :----------------- | :------ | :--------------------------------------- |
| lendingToken       | address | Address of the lending token.            |
| lendingTokenAmount | uint256 | Amount of lending tokens to be supplied. |

### supplyFromRelatedContract (0xb3c38b6e)

```solidity
function supplyFromRelatedContract(
    address lendingToken,
    uint256 lendingTokenAmount,
    address user
) external
```

Supplies a certain amount of lending tokens to the platform from a specific user.


Parameters:

| Name               | Type    | Description                                |
| :----------------- | :------ | :----------------------------------------- |
| lendingToken       | address | Address of the lending token.              |
| lendingTokenAmount | uint256 | Amount of lending tokens to be supplied.   |
| user               | address | Address of the user.                       |

### getCollateralAvailableToWithdraw (0x72620613)

```solidity
function getCollateralAvailableToWithdraw(
    address account,
    address projectToken,
    address lendingToken
) external returns (uint256 collateralProjectToWithdraw)
```

Calculates the collateral available for withdrawal based on the loan-to-value ratio of a specific project token.


Parameters:

| Name         | Type    | Description                     |
| :----------- | :------ | :------------------------------ |
| account      | address | Address of the user.            |
| projectToken | address | Address of the project token.   |
| lendingToken | address | Address of the lending token.   |


Return values:

| Name                        | Type    | Description                                                             |
| :-------------------------- | :------ | :---------------------------------------------------------------------- |
| collateralProjectToWithdraw | uint256 | The amount of collateral available for withdrawal in the project token. |

### redeem (0x1e9a6950)

```solidity
function redeem(address lendingToken, uint256 bLendingTokenAmount) external
```

Function that performs the redemption of bLendingToken and returns the corresponding lending token to the msg.sender.


Parameters:

| Name                | Type    | Description                               |
| :------------------ | :------ | :---------------------------------------- |
| lendingToken        | address | Address of the lending token.             |
| bLendingTokenAmount | uint256 | Amount of bLending tokens to be redeemed. |

### redeemFromRelatedContract (0x0bf6bd2f)

```solidity
function redeemFromRelatedContract(
    address lendingToken,
    uint256 bLendingTokenAmount,
    address user
) external
```

Function that performs the redemption of bLendingToken on behalf of a user and returns the corresponding lending token to the user by related contract.


Parameters:

| Name                | Type    | Description                                 |
| :------------------ | :------ | :------------------------------------------ |
| lendingToken        | address | Address of the lending token.               |
| bLendingTokenAmount | uint256 | Amount of bLending tokens to be redeemed.   |
| user                | address | Address of the user.                        |

### redeemUnderlying (0x96294178)

```solidity
function redeemUnderlying(
    address lendingToken,
    uint256 lendingTokenAmount
) external
```

Function that performs the redemption of lending token and returns the corresponding underlying token to the msg.sender.


Parameters:

| Name               | Type    | Description                              |
| :----------------- | :------ | :--------------------------------------- |
| lendingToken       | address | Address of the lending token.            |
| lendingTokenAmount | uint256 | Amount of lending tokens to be redeemed. |

### redeemUnderlyingFromRelatedContract (0xbdedb76c)

```solidity
function redeemUnderlyingFromRelatedContract(
    address lendingToken,
    uint256 lendingTokenAmount,
    address user
) external
```

Function that performs the redemption of lending token on behalf of a user and returns the corresponding underlying token to the user by related contract.


Parameters:

| Name               | Type    | Description                                |
| :----------------- | :------ | :----------------------------------------- |
| lendingToken       | address | Address of the lending token.              |
| lendingTokenAmount | uint256 | Amount of lending tokens to be redeemed.   |
| user               | address | Address of the user.                       |

### calcBorrowPosition (0x2dfee307)

```solidity
function calcBorrowPosition(
    address borrower,
    address projectToken,
    address lendingToken,
    uint256 lendingTokenAmount,
    address currentLendingToken
) external
```

Allows a related contract to calculate the new borrow position of a user.


Parameters:

| Name                | Type    | Description                                                                 |
| :------------------ | :------ | :-------------------------------------------------------------------------- |
| borrower            | address | The address of the user for whom the borrow position is being calculated.   |
| projectToken        | address | The address of the project token being used as collateral.                  |
| lendingToken        | address | The address of the lending token being borrowed.                            |
| lendingTokenAmount  | uint256 | The amount of lending tokens being borrowed.                                |
| currentLendingToken | address | The address of the current lending token being used as collateral.          |

### getLendingAvailableToBorrow (0x07445b52)

```solidity
function getLendingAvailableToBorrow(
    address account,
    address projectToken,
    address lendingToken
) external returns (uint256 availableToBorrow)
```

Calculates the lending token available amount for borrowing.


Parameters:

| Name         | Type    | Description                     |
| :----------- | :------ | :------------------------------ |
| account      | address | Address of the user.            |
| projectToken | address | Address of the project token.   |
| lendingToken | address | Address of the lending token.   |


Return values:

| Name              | Type    | Description                                                 |
| :---------------- | :------ | :---------------------------------------------------------- |
| availableToBorrow | uint256 | The amount of lending token available amount for borrowing. |

### repay (0x1da649cf)

```solidity
function repay(
    address projectToken,
    address lendingToken,
    uint256 lendingTokenAmount
) external returns (uint256)
```

Allows a borrower to repay their outstanding loan for a given project token and lending token.


Parameters:

| Name               | Type    | Description                             |
| :----------------- | :------ | :-------------------------------------- |
| projectToken       | address | The project token's address             |
| lendingToken       | address | The lending token's address             |
| lendingTokenAmount | uint256 | The amount of lending tokens to repay   |


Return values:

| Name | Type    | Description                              |
| :--- | :------ | :--------------------------------------- |
| [0]  | uint256 | amount of lending tokens actually repaid |

### repayFromRelatedContract (0xf432e4e2)

```solidity
function repayFromRelatedContract(
    address projectToken,
    address lendingToken,
    uint256 lendingTokenAmount,
    address repairer,
    address borrower
) external returns (uint256)
```

Allows a related contract to repay the outstanding loan for a given borrower's project token and lending token.


Parameters:

| Name               | Type    | Description                                         |
| :----------------- | :------ | :-------------------------------------------------- |
| projectToken       | address | The project token's address                         |
| lendingToken       | address | The lending token's address                         |
| lendingTokenAmount | uint256 | The amount of lending tokens to repay               |
| repairer           | address | The address that initiated the repair transaction   |
| borrower           | address | The borrower's address                              |


Return values:

| Name | Type    | Description                              |
| :--- | :------ | :--------------------------------------- |
| [0]  | uint256 | amount of lending tokens actually repaid |

### updateInterestInBorrowPositions (0x9a812edd)

```solidity
function updateInterestInBorrowPositions(
    address account,
    address lendingToken
) external
```

This function is called to update the interest in a borrower's borrow position.


Parameters:

| Name         | Type    | Description                   |
| :----------- | :------ | :---------------------------- |
| account      | address | Address of the borrower.      |
| lendingToken | address | Address of the lending token. |

### priceOracle (0x2630c12f)

```solidity
function priceOracle() external view returns (address)
```

return address of price oracle with interface of PriceProviderAggregator
### projectTokens (0xb269449f)

```solidity
function projectTokens(uint256 projectTokenId) external view returns (address)
```

return address project token in array `projectTokens`


Parameters:

| Name           | Type    | Description                                                                             |
| :------------- | :------ | :-------------------------------------------------------------------------------------- |
| projectTokenId | uint256 | - index of project token in array `projectTokens`. Numerates from 0 to array length - 1 |

### lendingTokens (0x6f5f74f2)

```solidity
function lendingTokens(uint256 lendingTokenId) external view returns (address)
```

return address lending token in array `lendingTokens`


Parameters:

| Name           | Type    | Description                                                                             |
| :------------- | :------ | :-------------------------------------------------------------------------------------- |
| lendingTokenId | uint256 | - index of lending token in array `lendingTokens`. Numerates from 0 to array length - 1 |

### projectTokenInfo (0x85f4da5c)

```solidity
function projectTokenInfo(
    address projectToken
) external view returns (IPrimaryLendingPlatform.ProjectTokenInfo memory)
```

Returns the info of the project token.


Return values:

| Name | Type                                            | Description                      |
| :--- | :---------------------------------------------- | :------------------------------- |
| [0]  | struct IPrimaryLendingPlatform.ProjectTokenInfo | The address of the project token |

### lendingTokenInfo (0x3299093b)

```solidity
function lendingTokenInfo(
    address lendingToken
) external view returns (IPrimaryLendingPlatform.LendingTokenInfo memory)
```

Returns the address of the lending token.


Return values:

| Name | Type                                            | Description                       |
| :--- | :---------------------------------------------- | :-------------------------------- |
| [0]  | struct IPrimaryLendingPlatform.LendingTokenInfo | The address of the lending token. |

### getRelatedContract (0x2060128e)

```solidity
function getRelatedContract(
    address relatedContract
) external view returns (bool)
```

Returns whether an address is a related contract or not.


Parameters:

| Name            | Type    | Description                             |
| :-------------- | :------ | :-------------------------------------- |
| relatedContract | address | The address of the contract to check.   |


Return values:

| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
| [0]  | bool | isRelated Boolean indicating whether the contract is related or not. |

### borrowLimitPerLendingToken (0x9f9184db)

```solidity
function borrowLimitPerLendingToken(
    address lendingToken
) external view returns (uint256)
```

Returns the borrow limit per lending token.


Return values:

| Name | Type    | Description                       |
| :--- | :------ | :-------------------------------- |
| [0]  | uint256 | The address of the lending token. |

### borrowLimitPerCollateral (0x739d7547)

```solidity
function borrowLimitPerCollateral(
    address projectToken
) external view returns (uint256)
```

Returns the borrow limit per collateral token.


Return values:

| Name | Type    | Description                       |
| :--- | :------ | :-------------------------------- |
| [0]  | uint256 | The address of the project token. |

### totalDepositedProjectToken (0xef867f0f)

```solidity
function totalDepositedProjectToken(
    address projectToken
) external view returns (uint256)
```

return total amount of deposited project token


Parameters:

| Name         | Type    | Description                                                                               |
| :----------- | :------ | :---------------------------------------------------------------------------------------- |
| projectToken | address | - address of project token in array `projectTokens`. Numerates from 0 to array length - 1 |

### totalBorrow (0xb090cf22)

```solidity
function totalBorrow(
    address projectToken,
    address lendingToken
) external view returns (uint256)
```

return total borrow amount of `lendingToken` by `projectToken`


Parameters:

| Name         | Type    | Description                  |
| :----------- | :------ | :--------------------------- |
| projectToken | address | - address of project token   |
| lendingToken | address | - address of lending token   |

### pit (0x72d456af)

```solidity
function pit(
    address account,
    address projectToken,
    address lendingToken
) external view returns (uint256)
```

Returns the PIT (primary index token) value for a given account and position after a position is opened


Parameters:

| Name         | Type    | Description                     |
| :----------- | :------ | :------------------------------ |
| account      | address | Address of the account.         |
| projectToken | address | Address of the project token.   |
| lendingToken | address | Address of the lending token.   |


Return values:

| Name | Type    | Description                            |
| :--- | :------ | :------------------------------------- |
| [0]  | uint256 | The PIT value. Formula: pit = $ * LVR |

### pitCollateral (0x1893be9f)

```solidity
function pitCollateral(
    address account,
    address projectToken
) external view returns (uint256)
```

Returns the PIT (primary index token) value for a given account and collateral before a position is opened


Parameters:

| Name         | Type    | Description                     |
| :----------- | :------ | :------------------------------ |
| account      | address | Address of the account.         |
| projectToken | address | Address of the project token.   |


Return values:

| Name | Type    | Description                            |
| :--- | :------ | :------------------------------------- |
| [0]  | uint256 | The PIT value. Formula: pit = $ * LVR |

### getLendingToken (0x2ce36230)

```solidity
function getLendingToken(
    address user,
    address projectToken
) external view returns (address actualLendingToken)
```

Returns the actual lending token of a user's borrow position for a specific project token


Parameters:

| Name         | Type    | Description                                 |
| :----------- | :------ | :------------------------------------------ |
| user         | address | The address of the user's borrow position   |
| projectToken | address | The address of the project token            |


Return values:

| Name               | Type    | Description                             |
| :----------------- | :------ | :-------------------------------------- |
| actualLendingToken | address | The address of the actual lending token |

### pitRemaining (0xd1a3d2ae)

```solidity
function pitRemaining(
    address account,
    address projectToken,
    address lendingToken
) external view returns (uint256 remaining)
```

Returns the remaining PIT (primary index token) of a user's borrow position


Parameters:

| Name         | Type    | Description                                 |
| :----------- | :------ | :------------------------------------------ |
| account      | address | The address of the user's borrow position   |
| projectToken | address | The address of the project token            |
| lendingToken | address | The address of the lending token            |


Return values:

| Name      | Type    | Description                                     |
| :-------- | :------ | :---------------------------------------------- |
| remaining | uint256 | The remaining PIT of the user's borrow position |

### totalOutstanding (0xac15382f)

```solidity
function totalOutstanding(
    address account,
    address projectToken,
    address lendingToken
) external view returns (uint256)
```

Returns the total outstanding amount of a user's borrow position for a specific project token and lending token


Parameters:

| Name         | Type    | Description                                 |
| :----------- | :------ | :------------------------------------------ |
| account      | address | The address of the user's borrow position   |
| projectToken | address | The address of the project token            |
| lendingToken | address | The address of the lending token            |


Return values:

| Name | Type    | Description                                            |
| :--- | :------ | :----------------------------------------------------- |
| [0]  | uint256 | total outstanding amount of the user's borrow position |

### healthFactor (0xcc224bff)

```solidity
function healthFactor(
    address account,
    address projectToken,
    address lendingToken
) external view returns (uint256 numerator, uint256 denominator)
```

Returns the health factor of a user's borrow position for a specific project token and lending token


Parameters:

| Name         | Type    | Description                                 |
| :----------- | :------ | :------------------------------------------ |
| account      | address | The address of the user's borrow position   |
| projectToken | address | The address of the project token            |
| lendingToken | address | The address of the lending token            |


Return values:

| Name        | Type    | Description                          |
| :---------- | :------ | :----------------------------------- |
| numerator   | uint256 | The numerator of the health factor   |
| denominator | uint256 | The denominator of the health factor |

### getTokenEvaluation (0x3598a7a9)

```solidity
function getTokenEvaluation(
    address token,
    uint256 tokenAmount
) external view returns (uint256)
```

Returns the evaluation of a specific token amount in USD


Parameters:

| Name        | Type    | Description                            |
| :---------- | :------ | :------------------------------------- |
| token       | address | The address of the token to evaluate   |
| tokenAmount | uint256 | The amount of the token to evaluate    |


Return values:

| Name | Type    | Description                       |
| :--- | :------ | :-------------------------------- |
| [0]  | uint256 | The evaluated token amount in USD |

### lendingTokensLength (0x2412b575)

```solidity
function lendingTokensLength() external view returns (uint256)
```

Returns the length of the lending tokens array


Return values:

| Name | Type    | Description                            |
| :--- | :------ | :------------------------------------- |
| [0]  | uint256 | The length of the lending tokens array |

### projectTokensLength (0x4a41d29e)

```solidity
function projectTokensLength() external view returns (uint256)
```

Returns the length of the project tokens array


Return values:

| Name | Type    | Description                            |
| :--- | :------ | :------------------------------------- |
| [0]  | uint256 | The length of the project tokens array |

### getPosition (0x713390f5)

```solidity
function getPosition(
    address account,
    address projectToken,
    address lendingToken
)
    external
    view
    returns (
        uint256 depositedProjectTokenAmount,
        uint256 loanBody,
        uint256 accrual,
        uint256 healthFactorNumerator,
        uint256 healthFactorDenominator
    )
```

Returns the details of a user's borrow position for a specific project token and lending token


Parameters:

| Name         | Type    | Description                                 |
| :----------- | :------ | :------------------------------------------ |
| account      | address | The address of the user's borrow position   |
| projectToken | address | The address of the project token            |
| lendingToken | address | The address of the lending token            |


Return values:

| Name                        | Type    | Description                                            |
| :-------------------------- | :------ | :----------------------------------------------------- |
| depositedProjectTokenAmount | uint256 | The amount of project tokens deposited by the user     |
| loanBody                    | uint256 | The amount of the lending token borrowed by the user   |
| accrual                     | uint256 | The accrued interest of the borrow position            |
| healthFactorNumerator       | uint256 | The numerator of the health factor                     |
| healthFactorDenominator     | uint256 | The denominator of the health factor                   |

### getDepositedAmount (0x0fefc251)

```solidity
function getDepositedAmount(
    address projectToken,
    address user
) external view returns (uint256)
```

Returns the amount of project tokens deposited by a user for a specific project token and collateral token


Parameters:

| Name         | Type    | Description                        |
| :----------- | :------ | :--------------------------------- |
| projectToken | address | The address of the project token   |
| user         | address | The address of the user            |


Return values:

| Name | Type    | Description                                    |
| :--- | :------ | :--------------------------------------------- |
| [0]  | uint256 | amount of project tokens deposited by the user |

### getTotalBorrowPerCollateral (0x65647a59)

```solidity
function getTotalBorrowPerCollateral(
    address projectToken
) external view returns (uint256)
```

Get total borrow amount in USD per collateral for a specific project token


Parameters:

| Name         | Type    | Description                        |
| :----------- | :------ | :--------------------------------- |
| projectToken | address | The address of the project token   |


Return values:

| Name | Type    | Description                    |
| :--- | :------ | :----------------------------- |
| [0]  | uint256 | The total borrow amount in USD |

### getTotalBorrowPerLendingToken (0x961540e1)

```solidity
function getTotalBorrowPerLendingToken(
    address lendingToken
) external view returns (uint256)
```

Get total borrow amount in USD for a specific lending token


Parameters:

| Name         | Type    | Description                        |
| :----------- | :------ | :--------------------------------- |
| lendingToken | address | The address of the lending token   |


Return values:

| Name | Type    | Description                    |
| :--- | :------ | :----------------------------- |
| [0]  | uint256 | The total borrow amount in USD |

### totalOutstandingInUSD (0xb189b70a)

```solidity
function totalOutstandingInUSD(
    address account,
    address projectToken,
    address lendingToken
) external view returns (uint256)
```

Convert the total outstanding amount of a user's borrow position to USD


Parameters:

| Name         | Type    | Description                        |
| :----------- | :------ | :--------------------------------- |
| account      | address | The address of the user account    |
| projectToken | address | The address of the project token   |
| lendingToken | address | The address of the lending token   |


Return values:

| Name | Type    | Description                         |
| :--- | :------ | :---------------------------------- |
| [0]  | uint256 | The total outstanding amount in USD |

### getLoanToValueRatio (0xe84dc1b3)

```solidity
function getLoanToValueRatio(
    address projectToken,
    address lendingToken
) external view returns (uint256 lvrNumerator, uint256 lvrDenominator)
```

Get the loan to value ratio of a position taken by a project token and a lending token


Parameters:

| Name         | Type    | Description                        |
| :----------- | :------ | :--------------------------------- |
| projectToken | address | The address of the project token   |
| lendingToken | address | The address of the lending token   |


Return values:

| Name           | Type    | Description                                |
| :------------- | :------ | :----------------------------------------- |
| lvrNumerator   | uint256 | The numerator of the loan to value ratio   |
| lvrDenominator | uint256 | The denominator of the loan to value ratio |

### pitWithUpdatePrices (0x865529ef)

```solidity
function pitWithUpdatePrices(
    address account,
    address projectToken,
    address lendingToken,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256)
```

Returns the PIT (primary index token) value for a given account and position after a position is opened after update price.


Parameters:

| Name         | Type      | Description                               |
| :----------- | :-------- | :---------------------------------------- |
| account      | address   | Address of the account.                   |
| projectToken | address   | Address of the project token.             |
| lendingToken | address   | Address of the lending token.             |
| priceIds     | bytes32[] | The priceIds need to update.              |
| updateData   | bytes[]   | The updateData provided by PythNetwork.   |


Return values:

| Name | Type    | Description                            |
| :--- | :------ | :------------------------------------- |
| [0]  | uint256 | The PIT value. Formula: pit = $ * LVR |

### pitCollateralWithUpdatePrices (0x902b6286)

```solidity
function pitCollateralWithUpdatePrices(
    address account,
    address projectToken,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256)
```

Returns the PIT (primary index token) value for a given account and collateral before a position is opened after update price.


Parameters:

| Name         | Type      | Description                               |
| :----------- | :-------- | :---------------------------------------- |
| account      | address   | Address of the account.                   |
| projectToken | address   | Address of the project token.             |
| priceIds     | bytes32[] | The priceIds need to update.              |
| updateData   | bytes[]   | The updateData provided by PythNetwork.   |


Return values:

| Name | Type    | Description                            |
| :--- | :------ | :------------------------------------- |
| [0]  | uint256 | The PIT value. Formula: pit = $ * LVR |

### pitRemainingWithUpdatePrices (0xe662d5c5)

```solidity
function pitRemainingWithUpdatePrices(
    address account,
    address projectToken,
    address lendingToken,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256)
```

Returns the remaining PIT (primary index token) of a user's borrow position after update price.


Parameters:

| Name         | Type      | Description                                 |
| :----------- | :-------- | :------------------------------------------ |
| account      | address   | The address of the user's borrow position   |
| projectToken | address   | The address of the project token            |
| lendingToken | address   | The address of the lending token            |
| priceIds     | bytes32[] | The priceIds need to update.                |
| updateData   | bytes[]   | The updateData provided by PythNetwork.     |


Return values:

| Name | Type    | Description                                               |
| :--- | :------ | :-------------------------------------------------------- |
| [0]  | uint256 | remaining The remaining PIT of the user's borrow position |

### estimatedPitRemainingWithUpdatePrices (0x0c0e14a3)

```solidity
function estimatedPitRemainingWithUpdatePrices(
    address account,
    address projectToken,
    address lendingToken,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256)
```

Returns the estimated remaining PIT (primary index token) of a user's borrow position


Parameters:

| Name         | Type      | Description                                 |
| :----------- | :-------- | :------------------------------------------ |
| account      | address   | The address of the user's borrow position   |
| projectToken | address   | The address of the project token            |
| lendingToken | address   | The address of the lending token            |
| priceIds     | bytes32[] | The priceIds need to update.                |
| updateData   | bytes[]   | The updateData provided by PythNetwork.     |


Return values:

| Name | Type    | Description                                                         |
| :--- | :------ | :------------------------------------------------------------------ |
| [0]  | uint256 | remaining The estimated remaining PIT of the user's borrow position |

### healthFactorWithUpdatePrices (0x52deb767)

```solidity
function healthFactorWithUpdatePrices(
    address account,
    address projectToken,
    address lendingToken,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256 numerator, uint256 denominator)
```

Returns the health factor of a user's borrow position for a specific project token and lending token after update price


Parameters:

| Name         | Type      | Description                                 |
| :----------- | :-------- | :------------------------------------------ |
| account      | address   | The address of the user's borrow position   |
| projectToken | address   | The address of the project token            |
| lendingToken | address   | The address of the lending token            |
| priceIds     | bytes32[] | The priceIds need to update.                |
| updateData   | bytes[]   | The updateData provided by PythNetwork.     |


Return values:

| Name        | Type    | Description                          |
| :---------- | :------ | :----------------------------------- |
| numerator   | uint256 | The numerator of the health factor   |
| denominator | uint256 | The denominator of the health factor |

### getTokenEvaluationWithUpdatePrices (0x4d247b46)

```solidity
function getTokenEvaluationWithUpdatePrices(
    address token,
    uint256 tokenAmount,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256)
```

Returns the evaluation of a specific token amount in USD after update price.


Parameters:

| Name        | Type      | Description                               |
| :---------- | :-------- | :---------------------------------------- |
| token       | address   | The address of the token to evaluate      |
| tokenAmount | uint256   | The amount of the token to evaluate       |
| priceIds    | bytes32[] | The priceIds need to update.              |
| updateData  | bytes[]   | The updateData provided by PythNetwork.   |


Return values:

| Name | Type    | Description                       |
| :--- | :------ | :-------------------------------- |
| [0]  | uint256 | The evaluated token amount in USD |

### getPositionWithUpdatePrices (0xa767ebd3)

```solidity
function getPositionWithUpdatePrices(
    address account,
    address projectToken,
    address lendingToken,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
)
    external
    payable
    returns (
        uint256 depositedProjectTokenAmount,
        uint256 loanBody,
        uint256 accrual,
        uint256 healthFactorNumerator,
        uint256 healthFactorDenominator
    )
```

Returns the details of a user's borrow position for a specific project token and lending token after update price


Parameters:

| Name         | Type      | Description                                 |
| :----------- | :-------- | :------------------------------------------ |
| account      | address   | The address of the user's borrow position   |
| projectToken | address   | The address of the project token            |
| lendingToken | address   | The address of the lending token            |
| priceIds     | bytes32[] | The priceIds need to update.                |
| updateData   | bytes[]   | The updateData provided by PythNetwork.     |


Return values:

| Name                        | Type    | Description                                            |
| :-------------------------- | :------ | :----------------------------------------------------- |
| depositedProjectTokenAmount | uint256 | The amount of project tokens deposited by the user     |
| loanBody                    | uint256 | The amount of the lending token borrowed by the user   |
| accrual                     | uint256 | The accrued interest of the borrow position            |
| healthFactorNumerator       | uint256 | The numerator of the health factor                     |
| healthFactorDenominator     | uint256 | The denominator of the health factor                   |

### getTotalBorrowPerLendingTokenWithUpdatePrices (0x6ae013a5)

```solidity
function getTotalBorrowPerLendingTokenWithUpdatePrices(
    address lendingToken,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256)
```

Get total borrow amount in USD for a specific lending token after update price


Parameters:

| Name         | Type      | Description                               |
| :----------- | :-------- | :---------------------------------------- |
| lendingToken | address   | The address of the lending token          |
| priceIds     | bytes32[] | The priceIds need to update.              |
| updateData   | bytes[]   | The updateData provided by PythNetwork.   |


Return values:

| Name | Type    | Description                    |
| :--- | :------ | :----------------------------- |
| [0]  | uint256 | The total borrow amount in USD |

### getTotalBorrowPerCollateralWithUpdatePrices (0x22d44652)

```solidity
function getTotalBorrowPerCollateralWithUpdatePrices(
    address projectToken,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256)
```

Get total borrow amount in USD per collateral for a specific project token after update price.


Parameters:

| Name         | Type      | Description                               |
| :----------- | :-------- | :---------------------------------------- |
| projectToken | address   | The address of the project token          |
| priceIds     | bytes32[] | The priceIds need to update.              |
| updateData   | bytes[]   | The updateData provided by PythNetwork.   |


Return values:

| Name | Type    | Description                    |
| :--- | :------ | :----------------------------- |
| [0]  | uint256 | The total borrow amount in USD |

### totalOutstandingInUSDWithUpdatePrices (0x010faf17)

```solidity
function totalOutstandingInUSDWithUpdatePrices(
    address account,
    address projectToken,
    address lendingToken,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256)
```

Convert the total outstanding amount of a user's borrow position to USD after update price.


Parameters:

| Name         | Type      | Description                               |
| :----------- | :-------- | :---------------------------------------- |
| account      | address   | The address of the user account           |
| projectToken | address   | The address of the project token          |
| lendingToken | address   | The address of the lending token          |
| priceIds     | bytes32[] | The priceIds need to update.              |
| updateData   | bytes[]   | The updateData provided by PythNetwork.   |


Return values:

| Name | Type    | Description                         |
| :--- | :------ | :---------------------------------- |
| [0]  | uint256 | The total outstanding amount in USD |

### totalEstimatedOutstandingInUSDWithUpdatePrices (0x7b78a351)

```solidity
function totalEstimatedOutstandingInUSDWithUpdatePrices(
    address account,
    address projectToken,
    address lendingToken,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256)
```

Returns the total estimated outstanding amount of a user's borrow position to USD after update price.


Parameters:

| Name         | Type      | Description                               |
| :----------- | :-------- | :---------------------------------------- |
| account      | address   | The address of the user account           |
| projectToken | address   | The address of the project token          |
| lendingToken | address   | The address of the lending token          |
| priceIds     | bytes32[] | The priceIds need to update.              |
| updateData   | bytes[]   | The updateData provided by PythNetwork.   |


Return values:

| Name | Type    | Description                                   |
| :--- | :------ | :-------------------------------------------- |
| [0]  | uint256 | The total estimated outstanding amount in USD |

### convertPitRemainingWithUpdatePrices (0x07a0e36c)

```solidity
function convertPitRemainingWithUpdatePrices(
    address account,
    address projectToken,
    address lendingToken,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256)
```

Convert the remaining pit amount to the corresponding lending token amount after update price.


Parameters:

| Name         | Type      | Description                               |
| :----------- | :-------- | :---------------------------------------- |
| account      | address   | The address of the user account           |
| projectToken | address   | The address of the project token          |
| lendingToken | address   | The address of the lending token          |
| priceIds     | bytes32[] | The priceIds need to update.              |
| updateData   | bytes[]   | The updateData provided by PythNetwork.   |


Return values:

| Name | Type    | Description                        |
| :--- | :------ | :--------------------------------- |
| [0]  | uint256 | The converted lending token amount |

### convertEstimatedPitRemainingWithUpdatePrices (0x7200b1ef)

```solidity
function convertEstimatedPitRemainingWithUpdatePrices(
    address account,
    address projectToken,
    address lendingToken,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256)
```

Convert the estimated remaining pit amount to the corresponding lending token amount after update price.


Parameters:

| Name         | Type      | Description                               |
| :----------- | :-------- | :---------------------------------------- |
| account      | address   | The address of the user account           |
| projectToken | address   | The address of the project token          |
| lendingToken | address   | The address of the lending token          |
| priceIds     | bytes32[] | The priceIds need to update.              |
| updateData   | bytes[]   | The updateData provided by PythNetwork.   |


Return values:

| Name | Type    | Description                        |
| :--- | :------ | :--------------------------------- |
| [0]  | uint256 | The estimated lending token amount |

### getCollateralAvailableToWithdrawWithUpdatePrices (0x45f0219c)

```solidity
function getCollateralAvailableToWithdrawWithUpdatePrices(
    address account,
    address projectToken,
    address lendingToken,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256 collateralProjectToWithdraw)
```

Calculates the collateral available for withdrawal based on the loan-to-value ratio of a specific project token after update price.


Parameters:

| Name         | Type      | Description                               |
| :----------- | :-------- | :---------------------------------------- |
| account      | address   | Address of the user.                      |
| projectToken | address   | Address of the project token.             |
| lendingToken | address   | Address of the lending token.             |
| priceIds     | bytes32[] | The priceIds need to update.              |
| updateData   | bytes[]   | The updateData provided by PythNetwork.   |


Return values:

| Name                        | Type    | Description                                                             |
| :-------------------------- | :------ | :---------------------------------------------------------------------- |
| collateralProjectToWithdraw | uint256 | The amount of collateral available for withdrawal in the project token. |

### getLendingAvailableToBorrow (0xdc8b040b)

```solidity
function getLendingAvailableToBorrow(
    address account,
    address projectToken,
    address lendingToken,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256 availableToBorrow)
```

Calculates the lending token available amount for borrowing after update price.


Parameters:

| Name         | Type      | Description                               |
| :----------- | :-------- | :---------------------------------------- |
| account      | address   | Address of the user.                      |
| projectToken | address   | Address of the project token.             |
| lendingToken | address   | Address of the lending token.             |
| priceIds     | bytes32[] | The priceIds need to update.              |
| updateData   | bytes[]   | The updateData provided by PythNetwork.   |


Return values:

| Name              | Type    | Description                                                 |
| :---------------- | :------ | :---------------------------------------------------------- |
| availableToBorrow | uint256 | The amount of lending token available amount for borrowing. |
