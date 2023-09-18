# PrimaryLendingPlatformV2Zksync

## Contract Description


License: MIT

## 

```solidity
contract PrimaryLendingPlatformV2Zksync is PrimaryLendingPlatformV2Core
```

The PrimaryLendingPlatformV2Zksync contract is the contract that provides the functionality for lending platform system.

Contract that provides the functionality for lending platform system. Inherit from PrimaryLendingPlatformV2Core.
## Functions info

### withdraw (0x127b642e)

```solidity
function withdraw(
    address projectToken,
    uint256 projectTokenAmount,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable isProjectTokenListed(projectToken) nonReentrant
```

Withdraws project tokens from the caller's deposit position.

Allows a user to withdraw project tokens and update related token's prices.

Requirements:
- The project token is listed on the platform.
- The project token is not paused for withdrawals.
- The project token amount and deposited project token amount in the user's deposit position is greater than 0.

Effects:
- Update price of related tokens.
- The deposited amount for the user and the specified project token is decreased by the withdrawn amount.
- The total deposited project tokens for the specified token is decreased by the withdrawn amount.
- If the user has an outstanding loan for the project token, the interest in their borrow position may be updated.
- The specified beneficiary receives the withdrawn project tokens.


Parameters:

| Name               | Type      | Description                                                            |
| :----------------- | :-------- | :--------------------------------------------------------------------- |
| projectToken       | address   | The address of the project token to withdraw.                          |
| projectTokenAmount | uint256   | The amount of project tokens to withdraw.                              |
| priceIds           | bytes32[] | An array of bytes32 price identifiers to update.                       |
| updateData         | bytes[]   | An array of bytes update data for the corresponding price identifiers. |

### withdrawFromRelatedContracts (0x9afab2ec)

```solidity
function withdrawFromRelatedContracts(
    address projectToken,
    uint256 projectTokenAmount,
    address user,
    address beneficiary,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
)
    external
    payable
    isProjectTokenListed(projectToken)
    nonReentrant
    returns (uint256)
```

Withdraws project tokens from related contracts and update related token's prices.

Requirements:
- The project token is listed on the platform.
- The project token is not paused for withdrawals.
- The project token amount and deposited project token amount in the user's deposit position is greater than 0.

Effects:
- Update price of related tokens.
- The deposited amount for the user and the specified project token is decreased by the withdrawn amount.
- The total deposited project tokens for the specified token is decreased by the withdrawn amount.
- If the user has an outstanding loan for the project token, the interest in their borrow position may be updated.


Parameters:

| Name               | Type      | Description                                                              |
| :----------------- | :-------- | :----------------------------------------------------------------------- |
| projectToken       | address   | The address of the project token to withdraw.                            |
| projectTokenAmount | uint256   | The amount of project tokens to withdraw.                                |
| user               | address   | The address of the user withdrawing the tokens.                          |
| beneficiary        | address   | The address of the beneficiary receiving the tokens.                     |
| priceIds           | bytes32[] | An array of bytes32 price identifiers to update.                         |
| updateData         | bytes[]   | An array of bytes update data for the corresponding price identifiers.   |


Return values:

| Name | Type    | Description                                                                |
| :--- | :------ | :------------------------------------------------------------------------- |
| [0]  | uint256 | The amount of project tokens withdrawn and transferred to the beneficiary. |

### borrow (0xf6c0b770)

```solidity
function borrow(
    address projectToken,
    address lendingToken,
    uint256 lendingTokenAmount,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
)
    external
    payable
    isProjectTokenListed(projectToken)
    isLendingTokenListed(lendingToken)
    nonReentrant
```

Borrows lending tokens for the caller.

Allows a user to borrow lending tokens by providing project tokens as collateral and update related token's prices.

Requirements:
- The project token is listed on the platform.
- The lending token is listed on the platform.
- The user must not have a leverage position for the `projectToken`.
- The `lendingToken` address must not be address(0).
- The `lendingTokenAmount` must be greater than zero.
- If the user already has a lending token for the `projectToken`, it must match the `lendingToken` address.

Effects:
- Update price of related tokens.
- Increases the borrower's borrow position in the given project and lending token.
- Increase the total borrow statistics.
- Updates the borrower's current lending token used for collateral if the current lending token is address(0).
- Transfers the lending tokens to the borrower..


Parameters:

| Name               | Type      | Description                                                      |
| :----------------- | :-------- | :--------------------------------------------------------------- |
| projectToken       | address   | The address of the project token used as collateral.             |
| lendingToken       | address   | The address of the lending token being borrowed.                 |
| lendingTokenAmount | uint256   | The amount of lending token being borrowed.                      |
| priceIds           | bytes32[] | An array of price identifiers used to update the price oracle.   |
| updateData         | bytes[]   | An array of update data used to update the price oracle.         |

### borrowFromRelatedContract (0x07f4a25c)

```solidity
function borrowFromRelatedContract(
    address projectToken,
    address lendingToken,
    uint256 lendingTokenAmount,
    address user,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
)
    external
    payable
    isProjectTokenListed(projectToken)
    isLendingTokenListed(lendingToken)
    nonReentrant
    onlyRelatedContracts
    returns (uint256)
```

Allows a related contract to borrow lending tokens on behalf of a user by providing project tokens as collateral and update related token's prices.

Requirements:
- The project token is listed on the platform.
- Caller is a related contract.
- The lending token is listed on the platform.
- The user must not have a leverage position for the `projectToken`.
- The `lendingToken` address must not be address(0).
- The `lendingTokenAmount` must be greater than zero.
- If the user already has a lending token for the `projectToken`, it must match the `lendingToken` address.

Effects:
- Update price of related tokens.
- Increases the borrower's borrow position in the given project and lending token.
- Increase the total borrow statistics.
- Updates the borrower's current lending token used for collateral if the current lending token is address(0).
- Transfers the lending tokens to the borrower.


Parameters:

| Name               | Type      | Description                                                                      |
| :----------------- | :-------- | :------------------------------------------------------------------------------- |
| projectToken       | address   | The address of the project token being used as collateral.                       |
| lendingToken       | address   | The address of the lending token being borrowed.                                 |
| lendingTokenAmount | uint256   | The amount of lending tokens to be borrowed.                                     |
| user               | address   | The address of the user on whose behalf the lending tokens are being borrowed.   |
| priceIds           | bytes32[] | An array of price identifiers used to update the price oracle.                   |
| updateData         | bytes[]   | An array of update data used to update the price oracle.                         |


Return values:

| Name | Type    | Description                       |
| :--- | :------ | :-------------------------------- |
| [0]  | uint256 | amount of lending tokens borrowed |

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

Returns the PIT (primary index token) value for a given account and position after a position is opened after updating related token's prices.

Formula: pit = $ * LVR of position.


Parameters:

| Name         | Type      | Description                                                      |
| :----------- | :-------- | :--------------------------------------------------------------- |
| account      | address   | Address of the account.                                          |
| projectToken | address   | Address of the project token.                                    |
| lendingToken | address   | Address of the lending token.                                    |
| priceIds     | bytes32[] | An array of price identifiers used to update the price oracle.   |
| updateData   | bytes[]   | An array of update data used to update the price oracle.         |


Return values:

| Name | Type    | Description    |
| :--- | :------ | :------------- |
| [0]  | uint256 | The PIT value. |

### pitCollateralWithUpdatePrices (0x902b6286)

```solidity
function pitCollateralWithUpdatePrices(
    address account,
    address projectToken,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256)
```

Returns the PIT (primary index token) value for a given account and collateral before a position is opened after updating related token's prices.

Formula: pit = $ * LVR of project token.


Parameters:

| Name         | Type      | Description                                                      |
| :----------- | :-------- | :--------------------------------------------------------------- |
| account      | address   | Address of the account.                                          |
| projectToken | address   | Address of the project token.                                    |
| priceIds     | bytes32[] | An array of price identifiers used to update the price oracle.   |
| updateData   | bytes[]   | An array of update data used to update the price oracle.         |


Return values:

| Name | Type    | Description    |
| :--- | :------ | :------------- |
| [0]  | uint256 | The PIT value. |

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

Returns the remaining PIT (primary index token) of a user's borrow position for a specific project token and lending token after updating related token's prices.


Parameters:

| Name         | Type      | Description                                                      |
| :----------- | :-------- | :--------------------------------------------------------------- |
| account      | address   | The address of the user's borrow position.                       |
| projectToken | address   | The address of the project token.                                |
| lendingToken | address   | The address of the lending token.                                |
| priceIds     | bytes32[] | An array of price identifiers used to update the price oracle.   |
| updateData   | bytes[]   | An array of update data used to update the price oracle.         |


Return values:

| Name | Type    | Description                                      |
| :--- | :------ | :----------------------------------------------- |
| [0]  | uint256 | The remaining PIT of the user's borrow position. |

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

Returns the health factor of a user's borrow position for a specific project token and lending token after updating related token's prices.


Parameters:

| Name         | Type      | Description                                                      |
| :----------- | :-------- | :--------------------------------------------------------------- |
| account      | address   | The address of the user's borrow position.                       |
| projectToken | address   | The address of the project token.                                |
| lendingToken | address   | The address of the lending token.                                |
| priceIds     | bytes32[] | An array of price identifiers used to update the price oracle.   |
| updateData   | bytes[]   | An array of update data used to update the price oracle.         |


Return values:

| Name        | Type    | Description                           |
| :---------- | :------ | :------------------------------------ |
| numerator   | uint256 | The numerator of the health factor.   |
| denominator | uint256 | The denominator of the health factor. |

### getTokenEvaluationWithUpdatePrices (0x4d247b46)

```solidity
function getTokenEvaluationWithUpdatePrices(
    address token,
    uint256 tokenAmount,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256)
```

Returns the evaluation of a specific token amount in USD after updating related token's prices.


Parameters:

| Name        | Type      | Description                                                      |
| :---------- | :-------- | :--------------------------------------------------------------- |
| token       | address   | The address of the token to evaluate.                            |
| tokenAmount | uint256   | The amount of the token to evaluate.                             |
| priceIds    | bytes32[] | An array of price identifiers used to update the price oracle.   |
| updateData  | bytes[]   | An array of update data used to update the price oracle.         |


Return values:

| Name | Type    | Description                        |
| :--- | :------ | :--------------------------------- |
| [0]  | uint256 | The evaluated token amount in USD. |

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

Returns the details of a user's borrow position for a specific project token and lending token after updating related token's prices.


Parameters:

| Name         | Type      | Description                                                      |
| :----------- | :-------- | :--------------------------------------------------------------- |
| account      | address   | The address of the user's borrow position.                       |
| projectToken | address   | The address of the project token.                                |
| lendingToken | address   | The address of the lending token.                                |
| priceIds     | bytes32[] | An array of price identifiers used to update the price oracle.   |
| updateData   | bytes[]   | An array of update data used to update the price oracle.         |


Return values:

| Name                        | Type    | Description                                             |
| :-------------------------- | :------ | :------------------------------------------------------ |
| depositedProjectTokenAmount | uint256 | The amount of project tokens deposited by the user.     |
| loanBody                    | uint256 | The amount of the lending token borrowed by the user.   |
| accrual                     | uint256 | The accrued interest of the borrow position.            |
| healthFactorNumerator       | uint256 | The numerator of the health factor.                     |
| healthFactorDenominator     | uint256 | The denominator of the health factor.                   |

### getTotalBorrowPerLendingTokenWithUpdatePrices (0x6ae013a5)

```solidity
function getTotalBorrowPerLendingTokenWithUpdatePrices(
    address lendingToken,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256)
```

Gets total borrow amount in USD for a specific lending token after updating related token's prices.


Parameters:

| Name         | Type      | Description                                                      |
| :----------- | :-------- | :--------------------------------------------------------------- |
| lendingToken | address   | The address of the lending token.                                |
| priceIds     | bytes32[] | An array of price identifiers used to update the price oracle.   |
| updateData   | bytes[]   | An array of update data used to update the price oracle.         |


Return values:

| Name | Type    | Description                     |
| :--- | :------ | :------------------------------ |
| [0]  | uint256 | The total borrow amount in USD. |

### getTotalBorrowPerCollateralWithUpdatePrices (0x22d44652)

```solidity
function getTotalBorrowPerCollateralWithUpdatePrices(
    address projectToken,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256)
```

Gets total borrow amount in USD per collateral for a specific project token after updating related token's prices.


Parameters:

| Name         | Type      | Description                                                      |
| :----------- | :-------- | :--------------------------------------------------------------- |
| projectToken | address   | The address of the project token.                                |
| priceIds     | bytes32[] | An array of price identifiers used to update the price oracle.   |
| updateData   | bytes[]   | An array of update data used to update the price oracle.         |


Return values:

| Name | Type    | Description                     |
| :--- | :------ | :------------------------------ |
| [0]  | uint256 | The total borrow amount in USD. |

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

Converts the total outstanding amount of a user's borrow position to USD after updating related token's prices.


Parameters:

| Name         | Type      | Description                                                      |
| :----------- | :-------- | :--------------------------------------------------------------- |
| account      | address   | The address of the user account.                                 |
| projectToken | address   | The address of the project token                                 |
| lendingToken | address   | The address of the lending token.                                |
| priceIds     | bytes32[] | An array of price identifiers used to update the price oracle.   |
| updateData   | bytes[]   | An array of update data used to update the price oracle.         |


Return values:

| Name | Type    | Description                          |
| :--- | :------ | :----------------------------------- |
| [0]  | uint256 | The total outstanding amount in USD. |

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

Calculates the collateral available for withdrawal based on the loan-to-value ratio of a specific project token after updating related token's prices.


Parameters:

| Name         | Type      | Description                                                      |
| :----------- | :-------- | :--------------------------------------------------------------- |
| account      | address   | Address of the user.                                             |
| projectToken | address   | Address of the project token.                                    |
| lendingToken | address   | Address of the lending token.                                    |
| priceIds     | bytes32[] | An array of price identifiers used to update the price oracle.   |
| updateData   | bytes[]   | An array of update data used to update the price oracle.         |


Return values:

| Name                        | Type    | Description                                                             |
| :-------------------------- | :------ | :---------------------------------------------------------------------- |
| collateralProjectToWithdraw | uint256 | The amount of collateral available for withdrawal in the project token. |

### getLendingAvailableToBorrowWithUpdatePrices (0x5da267d7)

```solidity
function getLendingAvailableToBorrowWithUpdatePrices(
    address account,
    address projectToken,
    address lendingToken,
    bytes32[] memory priceIds,
    bytes[] calldata updateData
) external payable returns (uint256 availableToBorrow)
```

Calculates the lending token available amount for borrowing after updating related token's prices.


Parameters:

| Name         | Type      | Description                                                      |
| :----------- | :-------- | :--------------------------------------------------------------- |
| account      | address   | Address of the user.                                             |
| projectToken | address   | Address of the project token.                                    |
| lendingToken | address   | Address of the lending token.                                    |
| priceIds     | bytes32[] | An array of price identifiers used to update the price oracle.   |
| updateData   | bytes[]   | An array of update data used to update the price oracle.         |


Return values:

| Name              | Type    | Description                                                 |
| :---------------- | :------ | :---------------------------------------------------------- |
| availableToBorrow | uint256 | The amount of lending token available amount for borrowing. |
