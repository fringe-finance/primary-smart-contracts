# BLendingToken

## Contract Description


License: MIT

## 

```solidity
contract BLendingToken is Initializable, BErc20, AccessControlUpgradeable
```

The BLendingToken contract
## Events info

### SetPrimaryLendingPlatform

```solidity
event SetPrimaryLendingPlatform(address indexed oldPrimaryLendingPlatform, address indexed newPrimaryLendingPlatform)
```

Emitted when the primary lending platform is set.


Parameters:

| Name                      | Type    | Description                                        |
| :------------------------ | :------ | :------------------------------------------------- |
| oldPrimaryLendingPlatform | address | The address of the old primary lending platform.   |
| newPrimaryLendingPlatform | address | The address of the new primary lending platform.   |

## Constants info

### MODERATOR_ROLE (0x797669c9)

```solidity
bytes32 constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE")
```


## State variables info

### primaryLendingPlatform (0x92641a7c)

```solidity
address primaryLendingPlatform
```


## Modifiers info

### onlyAdmin

```solidity
modifier onlyAdmin()
```

Modifier to check if the caller has the DEFAULT_ADMIN_ROLE.
### onlyPrimaryLendingPlatform

```solidity
modifier onlyPrimaryLendingPlatform()
```

Modifier to restrict access to functions that can only be called by the primary lending platform.
### onlyModerator

```solidity
modifier onlyModerator()
```

Modifier to check if the caller has the moderator role.
## Functions info

### init (0x4703d19c)

```solidity
function init(
    address underlying_,
    Bondtroller bondtroller_,
    InterestRateModel interestRateModel_,
    uint256 initialExchangeRateMantissa_,
    string memory name_,
    string memory symbol_,
    uint8 decimals_,
    address admin_
) public initializer
```

Initializes the bToken contract with the given parameters.


Parameters:

| Name                         | Type                       | Description                                                   |
| :--------------------------- | :------------------------- | :------------------------------------------------------------ |
| underlying_                  | address                    | The address of the underlying asset contract.                 |
| bondtroller_                 | contract Bondtroller       | The address of the Bondtroller contract.                      |
| interestRateModel_           | contract InterestRateModel | The address of the interest rate model contract.              |
| initialExchangeRateMantissa_ | uint256                    | The initial exchange rate mantissa for the bToken contract.   |
| name_                        | string                     | The name of the bToken contract.                              |
| symbol_                      | string                     | The symbol of the bToken contract.                            |
| decimals_                    | uint8                      | The number of decimals for the bToken contract.               |
| admin_                       | address                    | The address of the admin for the bToken contract.             |

### setPrimaryLendingPlatform (0xe801734a)

```solidity
function setPrimaryLendingPlatform(
    address _primaryLendingPlatform
) public onlyAdmin
```

Sets the primary lending platform for the BLendingToken contract.


Parameters:

| Name                    | Type    | Description                                            |
| :---------------------- | :------ | :----------------------------------------------------- |
| _primaryLendingPlatform | address | The address of the primary lending platform to be set. |

### grandModerator (0x04ebc8b1)

```solidity
function grandModerator(address newModerator) public onlyAdmin
```

Grants the `MODERATOR_ROLE` to a new address.


Parameters:

| Name         | Type    | Description                                   |
| :----------- | :------ | :-------------------------------------------- |
| newModerator | address | The address to grant the `MODERATOR_ROLE` to. |

### revokeModerator (0x36445636)

```solidity
function revokeModerator(address moderator) public onlyAdmin
```

Revokes the moderator role from the specified address.


Parameters:

| Name      | Type    | Description                                           |
| :-------- | :------ | :---------------------------------------------------- |
| moderator | address | The address of the moderator to revoke the role from. |

### transferAdminship (0x5be7cc16)

```solidity
function transferAdminship(address payable newAdmin) public onlyAdmin
```

Transfers the adminship to a new address.


Parameters:

| Name     | Type            | Description                   |
| :------- | :-------------- | :---------------------------- |
| newAdmin | address payable | The address of the new admin. |

### hasRoleModerator (0xd6526889)

```solidity
function hasRoleModerator(address account) public view override returns (bool)
```

Returns true if the specified account has the moderator role.


Parameters:

| Name    | Type    | Description                                    |
| :------ | :------ | :--------------------------------------------- |
| account | address | The address to check for the moderator role.   |


Return values:

| Name | Type | Description                                                             |
| :--- | :--- | :---------------------------------------------------------------------- |
| [0]  | bool | A boolean indicating whether the account has the moderator role or not. |

### mintTo (0x449a52f8)

```solidity
function mintTo(
    address minter,
    uint256 mintAmount
)
    external
    onlyPrimaryLendingPlatform
    returns (uint256 err, uint256 mintedAmount)
```

Mints new tokens to the specified minter address.


Parameters:

| Name       | Type    | Description                     |
| :--------- | :------ | :------------------------------ |
| minter     | address | The address of the minter.      |
| mintAmount | uint256 | The amount of tokens to mint.   |


Return values:

| Name         | Type    | Description                            |
| :----------- | :------ | :------------------------------------- |
| err          | uint256 | An error code (0 if successful).       |
| mintedAmount | uint256 | The amount of tokens that were minted. |

### redeemTo (0x2f7605fb)

```solidity
function redeemTo(
    address redeemer,
    uint256 redeemTokens
) external onlyPrimaryLendingPlatform returns (uint256 redeemErr)
```

Redeems `redeemTokens` amount of bTokens for underlying assets to the `redeemer` address.
Only the primary lending platform can call this function.


Parameters:

| Name         | Type    | Description                                                           |
| :----------- | :------ | :-------------------------------------------------------------------- |
| redeemer     | address | The address of the account that will receive the underlying assets.   |
| redeemTokens | uint256 | The amount of bTokens to be redeemed.                                 |


Return values:

| Name      | Type    | Description                                                                        |
| :-------- | :------ | :--------------------------------------------------------------------------------- |
| redeemErr | uint256 | An error code corresponding to the success or failure of the redemption operation. |

### redeemUnderlyingTo (0x6664aa78)

```solidity
function redeemUnderlyingTo(
    address redeemer,
    uint256 redeemAmount
) external onlyPrimaryLendingPlatform returns (uint256 redeemUnderlyingError)
```

Redeems `redeemAmount` of bTokens for underlying asset and transfers them to `redeemer`.
Only the primary lending platform can call this function.


Parameters:

| Name         | Type    | Description                                                          |
| :----------- | :------ | :------------------------------------------------------------------- |
| redeemer     | address | The address of the account that will receive the underlying asset.   |
| redeemAmount | uint256 | The amount of bTokens to redeem for underlying asset.                |


Return values:

| Name                  | Type    | Description                                                                    |
| :-------------------- | :------ | :----------------------------------------------------------------------------- |
| redeemUnderlyingError | uint256 | An error code corresponding to the success or failure of the redeem operation. |

### borrowTo (0xfda0241d)

```solidity
function borrowTo(
    address borrower,
    uint256 borrowAmount
) external onlyPrimaryLendingPlatform returns (uint256 borrowError)
```

Allows the primary lending platform to borrow tokens on behalf of a borrower.


Parameters:

| Name         | Type    | Description                            |
| :----------- | :------ | :------------------------------------- |
| borrower     | address | The address of the borrower.           |
| borrowAmount | uint256 | The amount of tokens to be borrowed.   |


Return values:

| Name        | Type    | Description                                                   |
| :---------- | :------ | :------------------------------------------------------------ |
| borrowError | uint256 | The error code (if any) returned by the borrowFresh function. |

### repayTo (0x99c93213)

```solidity
function repayTo(
    address payer,
    address borrower,
    uint256 repayAmount
)
    external
    onlyPrimaryLendingPlatform
    returns (uint256 repayBorrowError, uint256 amountRepaid)
```

Repays a specified amount of the calling user's borrow balance to a borrower.
Only callable by the primary lending platform.


Parameters:

| Name        | Type    | Description                                                          |
| :---------- | :------ | :------------------------------------------------------------------- |
| payer       | address | The address of the account that will be paying the borrow balance.   |
| borrower    | address | The address of the account with the borrow balance being repaid.     |
| repayAmount | uint256 | The amount of the borrow balance to repay.                           |


Return values:

| Name             | Type    | Description                                                                                                                     |
| :--------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------ |
| repayBorrowError | uint256 | The error code corresponding to the success or failure of the repay borrow operation.                                           |
| amountRepaid     | uint256 | The actual amount repaid, which may be less than the specified `repayAmount` if there is not enough balance available to repay. |

### getEstimatedBorrowIndex (0xcbebe597)

```solidity
function getEstimatedBorrowIndex() public view returns (uint256)
```

Calculates the estimated borrow index based on the current borrow interest rate and the number of blocks elapsed since the last accrual.


Return values:

| Name | Type    | Description                                    |
| :--- | :------ | :--------------------------------------------- |
| [0]  | uint256 | The estimated borrow index as a uint256 value. |

### getEstimatedBorrowBalanceStored (0xb9ade142)

```solidity
function getEstimatedBorrowBalanceStored(
    address account
) public view returns (uint256 accrual)
```

Returns the estimated borrow balance of an account based on the current borrow index.


Parameters:

| Name    | Type    | Description                                                 |
| :------ | :------ | :---------------------------------------------------------- |
| account | address | The address of the account to get the borrow balance for.   |


Return values:

| Name    | Type    | Description                                  |
| :------ | :------ | :------------------------------------------- |
| accrual | uint256 | The estimated borrow balance of the account. |
