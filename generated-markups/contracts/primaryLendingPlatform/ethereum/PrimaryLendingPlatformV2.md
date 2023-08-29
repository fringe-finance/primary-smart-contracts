# PrimaryLendingPlatformV2

## Contract Description


License: MIT

## 

```solidity
contract PrimaryLendingPlatformV2 is PrimaryLendingPlatformV2Core
```

The PrimaryLendingPlatformV2 contract is the contract that provides the functionality for lending platform system.

Contract that provides the functionality for lending platform system. Inherit from PrimaryLendingPlatformV2Core.
## Functions info

### withdraw (0xf3fef3a3)

```solidity
function withdraw(
    address projectToken,
    uint256 projectTokenAmount
) external isProjectTokenListed(projectToken) nonReentrant
```

Withdraws project tokens from the caller's deposit position.

Allows a user to withdraw a given amount of a project token from their deposit position.

Requirements:
- The project token is listed on the platform.
- The project token is not paused for withdrawals.
- The project token amount and deposited project token amount in the user's deposit position is greater than 0.

Effects:
- The deposited amount for the user and the specified project token is decreased by the withdrawn amount.
- The total deposited project tokens for the specified token is decreased by the withdrawn amount.
- If the user has an outstanding loan for the project token, the interest in their borrow position may be updated.
- The specified beneficiary receives the withdrawn project tokens.


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
)
    external
    isProjectTokenListed(projectToken)
    onlyRelatedContracts
    nonReentrant
    returns (uint256)
```

Allows a related contract to initiate a withdrawal of a given amount of a project token from a user's deposit position.

Requirements:
- The project token is listed on the platform.
- Caller is a related contract.
- The project token is not paused for withdrawals.
- The project token amount and deposited project token amount in the user's deposit position is greater than 0.

Effects:
- The deposited amount for the user and the specified project token is decreased by the withdrawn amount.
- The total deposited project tokens for the specified token is decreased by the withdrawn amount.
- If the user has an outstanding loan for the project token, the interest in their borrow position may be updated.
- The specified beneficiary receives the withdrawn project tokens.


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

### borrow (0x5224372c)

```solidity
function borrow(
    address projectToken,
    address lendingToken,
    uint256 lendingTokenAmount
)
    external
    isProjectTokenListed(projectToken)
    isLendingTokenListed(lendingToken)
    nonReentrant
```

Borrows lending tokens for the caller.

Allows a user to borrow lending tokens by providing project tokens as collateral.

Requirements:
- The project token is listed on the platform.
- The lending token is listed on the platform.
- The user must not have a leverage position for the `projectToken`.
- The `lendingToken` address must not be address(0).
- The `lendingTokenAmount` must be greater than zero.
- If the user already has a lending token for the `projectToken`, it must match the `lendingToken` address.

Effects:
- Increases the borrower's borrow position in the given project and lending token.
- Increase the total borrow statistics.
- Updates the borrower's current lending token used for collateral if the current lending token is address(0).
- Transfers the lending tokens to the borrower.


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
)
    external
    isProjectTokenListed(projectToken)
    isLendingTokenListed(lendingToken)
    onlyRelatedContracts
    nonReentrant
    returns (uint256)
```

Allows a related contract to borrow lending tokens on behalf of a user by providing project tokens as collateral.

Requirements:
- The project token is listed on the platform.
- Caller is a related contract.
- The lending token is listed on the platform.
- The user must not have a leverage position for the `projectToken`.
- The `lendingToken` address must not be address(0).
- The `lendingTokenAmount` must be greater than zero.
- If the user already has a lending token for the `projectToken`, it must match the `lendingToken` address.

Effects:
- Increases the borrower's borrow position in the given project and lending token.
- Increase the total borrow statistics.
- Updates the borrower's current lending token used for collateral if the current lending token is address(0).
- Transfers the lending tokens to the borrower.


Parameters:

| Name               | Type    | Description                                                                      |
| :----------------- | :------ | :------------------------------------------------------------------------------- |
| projectToken       | address | The address of the project token being used as collateral.                       |
| lendingToken       | address | The address of the lending token being borrowed.                                 |
| lendingTokenAmount | uint256 | The amount of lending tokens to be borrowed.                                     |
| user               | address | The address of the user on whose behalf the lending tokens are being borrowed.   |


Return values:

| Name | Type    | Description                       |
| :--- | :------ | :-------------------------------- |
| [0]  | uint256 | amount of lending tokens borrowed |
