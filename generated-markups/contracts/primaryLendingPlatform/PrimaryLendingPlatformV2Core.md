# PrimaryLendingPlatformV2Core

## Abstract Contract Description


License: MIT

## 

```solidity
abstract contract PrimaryLendingPlatformV2Core is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable
```

Core contract for the Primary Lending Platform V2.

Abstract contract that defines the core functionality of the primary lending platform.
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
	PrimaryLendingPlatformV2Core.Ratio loanToValueRatio;
}
```


### LendingTokenInfo

```solidity
struct LendingTokenInfo {
	bool isListed;
	bool isPaused;
	BLendingToken bLendingToken;
	PrimaryLendingPlatformV2Core.Ratio loanToValueRatio;
}
```


### BorrowPosition

```solidity
struct BorrowPosition {
	uint256 loanBody;
	uint256 accrual;
}
```


## Events info

### Deposit

```solidity
event Deposit(address indexed who, address indexed tokenPrj, uint256 prjDepositAmount, address indexed beneficiary)
```

Emitted when a user deposits project tokens.


Parameters:

| Name             | Type    | Description                                                           |
| :--------------- | :------ | :-------------------------------------------------------------------- |
| who              | address | The address of the user who deposited the tokens.                     |
| tokenPrj         | address | The address of the project token that was deposited.                  |
| prjDepositAmount | uint256 | The amount of project tokens that were deposited.                     |
| beneficiary      | address | The address of the beneficiary who will receive the deposited tokens. |

### Withdraw

```solidity
event Withdraw(address indexed who, address indexed tokenPrj, address lendingToken, uint256 prjWithdrawAmount, address indexed beneficiary)
```

Emitted when a user withdraws project tokens.


Parameters:

| Name              | Type    | Description                                                           |
| :---------------- | :------ | :-------------------------------------------------------------------- |
| who               | address | The address of the user who withdrew the tokens.                      |
| tokenPrj          | address | The address of the project token that was withdrawn.                  |
| lendingToken      | address | The address of the lending token that was used as collateral.         |
| prjWithdrawAmount | uint256 | The amount of project tokens that were withdrawn.                     |
| beneficiary       | address | The address of the beneficiary who will receive the withdrawn tokens. |

### Supply

```solidity
event Supply(address indexed who, address indexed supplyToken, uint256 supplyAmount, address indexed supplyBToken, uint256 amountSupplyBTokenReceived)
```

Emitted when a user supplies lending tokens.


Parameters:

| Name                       | Type    | Description                                                                        |
| :------------------------- | :------ | :--------------------------------------------------------------------------------- |
| who                        | address | The address of the user who supplied the tokens.                                   |
| supplyToken                | address | The address of the token that was supplied.                                        |
| supplyAmount               | uint256 | The amount of tokens that were supplied.                                           |
| supplyBToken               | address | The address of the bToken that was received in exchange for the supplied tokens.   |
| amountSupplyBTokenReceived | uint256 | The amount of bTokens that were received in exchange for the supplied tokens.      |

### Redeem

```solidity
event Redeem(address indexed who, address indexed redeemToken, address indexed redeemBToken, uint256 redeemAmount)
```

Emitted when a user redeems bTokens for the underlying token.


Parameters:

| Name         | Type    | Description                                        |
| :----------- | :------ | :------------------------------------------------- |
| who          | address | The address of the user who redeemed the tokens.   |
| redeemToken  | address | The address of the token that was redeemed.        |
| redeemBToken | address | The address of the bToken that was redeemed.       |
| redeemAmount | uint256 | The amount of bTokens that were redeemed.          |

### RedeemUnderlying

```solidity
event RedeemUnderlying(address indexed who, address indexed redeemToken, address indexed redeemBToken, uint256 redeemAmountUnderlying)
```

Emitted when a user redeems underlying token for the bToken.


Parameters:

| Name                   | Type    | Description                                         |
| :--------------------- | :------ | :-------------------------------------------------- |
| who                    | address | The address of the user who redeemed the tokens.    |
| redeemToken            | address | The address of the token that was redeemed.         |
| redeemBToken           | address | The address of the bToken that was redeemed.        |
| redeemAmountUnderlying | uint256 | The amount of underlying tokens that were redeemed. |

### Borrow

```solidity
event Borrow(address indexed who, address indexed borrowToken, uint256 borrowAmount, address indexed prjAddress, uint256 prjAmount)
```

Emitted when a user borrows lending tokens.


Parameters:

| Name         | Type    | Description                                                     |
| :----------- | :------ | :-------------------------------------------------------------- |
| who          | address | The address of the user who borrowed the tokens.                |
| borrowToken  | address | The address of the token that was borrowed.                     |
| borrowAmount | uint256 | The amount of tokens that were borrowed.                        |
| prjAddress   | address | The address of the project token that was used as collateral.   |
| prjAmount    | uint256 | The amount of project tokens that were used as collateral.      |

### RepayBorrow

```solidity
event RepayBorrow(address indexed who, address indexed borrowToken, uint256 borrowAmount, address indexed prjAddress, bool isPositionFullyRepaid)
```

Emitted when a user repays borrowed lending tokens.


Parameters:

| Name                  | Type    | Description                                                         |
| :-------------------- | :------ | :------------------------------------------------------------------ |
| who                   | address | The address of the user who repaid the tokens.                      |
| borrowToken           | address | The address of the token that was repaid.                           |
| borrowAmount          | uint256 | The amount of tokens that were repaid.                              |
| prjAddress            | address | The address of the project token that was used as collateral.       |
| isPositionFullyRepaid | bool    | A boolean indicating whether the entire borrow position was repaid. |

### SetModeratorContract

```solidity
event SetModeratorContract(address indexed newAddress)
```

Emitted when the moderator contract address is updated.


Parameters:

| Name       | Type    | Description                                |
| :--------- | :------ | :----------------------------------------- |
| newAddress | address | The address of the new moderator contract. |

## Constants info

### MODERATOR_ROLE (0x797669c9)

```solidity
bytes32 constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE")
```


## State variables info

### priceOracle (0x2630c12f)

```solidity
contract IPriceProviderAggregator priceOracle
```


### projectTokens (0xb269449f)

```solidity
address[] projectTokens
```


### projectTokenInfo (0x85f4da5c)

```solidity
mapping(address => struct PrimaryLendingPlatformV2Core.ProjectTokenInfo) projectTokenInfo
```


### lendingTokens (0x6f5f74f2)

```solidity
address[] lendingTokens
```


### lendingTokenInfo (0x3299093b)

```solidity
mapping(address => struct PrimaryLendingPlatformV2Core.LendingTokenInfo) lendingTokenInfo
```


### totalDepositedProjectToken (0xef867f0f)

```solidity
mapping(address => uint256) totalDepositedProjectToken
```


### depositedAmount (0xe0c32ec4)

```solidity
mapping(address => mapping(address => uint256)) depositedAmount
```


### borrowPosition (0xa9ce9417)

```solidity
mapping(address => mapping(address => mapping(address => struct PrimaryLendingPlatformV2Core.BorrowPosition))) borrowPosition
```


### totalBorrow (0xb090cf22)

```solidity
mapping(address => mapping(address => uint256)) totalBorrow
```


### borrowLimit (0x676573bf)

```solidity
mapping(address => mapping(address => uint256)) borrowLimit
```


### borrowLimitPerCollateral (0x739d7547)

```solidity
mapping(address => uint256) borrowLimitPerCollateral
```


### totalBorrowPerLendingToken (0xc3ee8b6f)

```solidity
mapping(address => uint256) totalBorrowPerLendingToken
```


### borrowLimitPerLendingToken (0x9f9184db)

```solidity
mapping(address => uint256) borrowLimitPerLendingToken
```


### lendingTokenPerCollateral (0x6705fb1b)

```solidity
mapping(address => mapping(address => address)) lendingTokenPerCollateral
```


### isRelatedContract (0x25de3084)

```solidity
mapping(address => bool) isRelatedContract
```


### primaryLendingPlatformLeverage (0x10c0bbed)

```solidity
contract IPrimaryLendingPlatformLeverage primaryLendingPlatformLeverage
```


### primaryLendingPlatformModerator (0xf32d0f2f)

```solidity
address primaryLendingPlatformModerator
```


## Modifiers info

### onlyAdmin

```solidity
modifier onlyAdmin()
```

Modifier that allows only the admin to call the function.
### isProjectTokenListed

```solidity
modifier isProjectTokenListed(address projectToken)
```

Modifier that requires the project token to be listed.


Parameters:

| Name         | Type    | Description                       |
| :----------- | :------ | :-------------------------------- |
| projectToken | address | The address of the project token. |

### isLendingTokenListed

```solidity
modifier isLendingTokenListed(address lendingToken)
```

Modifier that requires the lending token to be listed.


Parameters:

| Name         | Type    | Description                       |
| :----------- | :------ | :-------------------------------- |
| lendingToken | address | The address of the lending token. |

### onlyRelatedContracts

```solidity
modifier onlyRelatedContracts()
```

Modifier that allows only related contracts to call the function.
### onlyModeratorContract

```solidity
modifier onlyModeratorContract()
```

Modifier that allows only the moderator contract to call the function.
## Functions info

### initialize (0x8129fc1c)

```solidity
function initialize() public initializer
```

Initializes the contract and sets the name, symbol, and default roles.
### setPrimaryLendingPlatformModerator (0x4123cf11)

```solidity
function setPrimaryLendingPlatformModerator(
    address newModeratorContract
) external onlyAdmin
```

Sets the address of the new moderator contract for the Primary Lending Platform.

Requirements:
- `newModeratorContract` cannot be the zero address.
- Only the admin can call this function.


Parameters:

| Name                 | Type    | Description                                |
| :------------------- | :------ | :----------------------------------------- |
| newModeratorContract | address | The address of the new moderator contract. |

### setPriceOracle (0x530e784f)

```solidity
function setPriceOracle(address newPriceOracle) external onlyModeratorContract
```

Sets the price oracle contract address.

Requirements:
- Only the moderator contract can call this function.


Parameters:

| Name           | Type    | Description                                   |
| :------------- | :------ | :-------------------------------------------- |
| newPriceOracle | address | The address of the new price oracle contract. |

### setPrimaryLendingPlatformLeverage (0xa1ab5419)

```solidity
function setPrimaryLendingPlatformLeverage(
    address newPrimaryLendingPlatformLeverage
) external onlyModeratorContract
```

Sets the address of the new primary index token leverage contract by the moderator contract.

Requirements:
- Only the moderator contract can call this function.


Parameters:

| Name                              | Type    | Description                                                   |
| :-------------------------------- | :------ | :------------------------------------------------------------ |
| newPrimaryLendingPlatformLeverage | address | The address of the new primary index token leverage contract. |

### setRelatedContract (0xdcb4252a)

```solidity
function setRelatedContract(
    address relatedContract,
    bool isRelated
) public onlyModeratorContract
```

Sets the related contract status for a given contract address.

Requirements:
- The caller must be the moderator contract.


Parameters:

| Name            | Type    | Description                                                  |
| :-------------- | :------ | :----------------------------------------------------------- |
| relatedContract | address | The address of the contract to set the related status for.   |
| isRelated       | bool    | The related status to set for the contract.                  |

### removeProjectToken (0x3af44bfa)

```solidity
function removeProjectToken(
    uint256 projectTokenId,
    address projectToken
) external onlyModeratorContract
```

Removes a project token from the platform.

Requirements:
- The caller must be the moderator contract.
- The project token must exist in the platform.


Parameters:

| Name           | Type    | Description                                 |
| :------------- | :------ | :------------------------------------------ |
| projectTokenId | uint256 | The ID of the project token to remove.      |
| projectToken   | address | The address of the project token to remove. |

### removeLendingToken (0xc1ab02ee)

```solidity
function removeLendingToken(
    uint256 lendingTokenId,
    address lendingToken
) external onlyModeratorContract
```

Removes a lending token from the platform.

Requirements:
- The caller must be the moderator contract.
- The lending token address must be valid.


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
) external onlyModeratorContract
```

Sets the borrow limit for a specific collateral asset.

Requirements:
- The caller must be the moderator contract.


Parameters:

| Name           | Type    | Description                                    |
| :------------- | :------ | :--------------------------------------------- |
| projectToken   | address | The address of the collateral asset.           |
| newBorrowLimit | uint256 | The new borrow limit for the collateral asset. |

### setBorrowLimitPerLendingAsset (0x92a39190)

```solidity
function setBorrowLimitPerLendingAsset(
    address lendingToken,
    uint256 newBorrowLimit
) external onlyModeratorContract
```

Sets the borrow limit for a specific lending asset.

Requirements:
- The caller must be the moderator contract.


Parameters:

| Name           | Type    | Description                                 |
| :------------- | :------ | :------------------------------------------ |
| lendingToken   | address | The address of the lending asset.           |
| newBorrowLimit | uint256 | The new borrow limit for the lending asset. |

### setProjectTokenInfo (0x4a5333bc)

```solidity
function setProjectTokenInfo(
    address projectToken,
    bool isDepositPaused,
    bool isWithdrawPaused,
    uint8 loanToValueRatioNumerator,
    uint8 loanToValueRatioDenominator
) external onlyModeratorContract
```

Sets the information of a project token.

Requirements:
- The caller must be the moderator contract.


Parameters:

| Name                        | Type    | Description                                                              |
| :-------------------------- | :------ | :----------------------------------------------------------------------- |
| projectToken                | address | The address of the project token.                                        |
| isDepositPaused             | bool    | A boolean indicating whether deposit is paused for the project token.    |
| isWithdrawPaused            | bool    | A boolean indicating whether withdraw is paused for the project token.   |
| loanToValueRatioNumerator   | uint8   | The numerator of the loan-to-value ratio for the project token.          |
| loanToValueRatioDenominator | uint8   | The denominator of the loan-to-value ratio for the project token.        |

### setPausedProjectToken (0x2c67c660)

```solidity
function setPausedProjectToken(
    address projectToken,
    bool isDepositPaused,
    bool isWithdrawPaused
) external onlyModeratorContract
```

Sets the deposit and withdraw pause status for a given project token.

Requirements:
- The caller must be the moderator contract.


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
) external onlyModeratorContract
```

Sets the lending token information for a given lending token.

Requirements:
- The caller must be the moderator contract.


Parameters:

| Name                        | Type    | Description                                                        |
| :-------------------------- | :------ | :----------------------------------------------------------------- |
| lendingToken                | address | The address of the lending token.                                  |
| bLendingToken               | address | The address of the corresponding bLending token.                   |
| isPaused                    | bool    | A boolean indicating whether the lending token is paused or not.   |
| loanToValueRatioNumerator   | uint8   | The numerator of the loan-to-value ratio for the lending token.    |
| loanToValueRatioDenominator | uint8   | The denominator of the loan-to-value ratio for the lending token.  |

### setPausedLendingToken (0x58841bee)

```solidity
function setPausedLendingToken(
    address lendingToken,
    bool isPaused
) external onlyModeratorContract isLendingTokenListed(lendingToken)
```

Sets the pause status of a lending token.

Requirements:
- The caller must be the moderator contract.
- The lending token must be listed.


Parameters:

| Name         | Type    | Description                         |
| :----------- | :------ | :---------------------------------- |
| lendingToken | address | The address of the lending token.   |
| isPaused     | bool    | The pause status to be set.         |

### deposit (0x47e7ef24)

```solidity
function deposit(
    address projectToken,
    uint256 projectTokenAmount
) external isProjectTokenListed(projectToken) nonReentrant
```

Deposits project tokens into the platform.

Deposits project tokens and calculates the deposit position.

Requirements:
- The project token must be listed.
- The project token must not be paused for deposits.
- The project token amount must be greater than 0.

Effects:
- Transfers the project tokens from the user to the contract.
- Calculates the deposit position for the user.


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
) external isProjectTokenListed(projectToken) nonReentrant onlyRelatedContracts
```

Deposits project tokens from related contracts into the platform.

Requirements:
- The project token must be listed.
- Caller must be a related contract.
- The project token must not be paused for deposits.
- The project token amount must be greater than 0.

Effects:
- Transfers the project tokens from the user to the contract.
- Calculates the deposit position for the user.


Parameters:

| Name               | Type    | Description                                          |
| :----------------- | :------ | :--------------------------------------------------- |
| projectToken       | address | The address of the project token being deposited.    |
| projectTokenAmount | uint256 | The amount of project tokens being deposited.        |
| user               | address | The address of the user depositing the tokens.       |
| beneficiary        | address | The address of the beneficiary receiving the tokens. |

### calcAndTransferDepositPosition (0x556d4704)

```solidity
function calcAndTransferDepositPosition(
    address projectToken,
    uint256 projectTokenAmount,
    address user,
    address receiver
)
    external
    isProjectTokenListed(projectToken)
    onlyRelatedContracts
    nonReentrant
    returns (uint256)
```

Calculates and transfers the deposit position of a user for a specific project token.

Requirements:
- The project token must be listed.
- Called by a related contract.

Effects:
- Decreases the deposited project token amount in the user's deposit position.
- Decreases the total deposited project token amount.
- Transfers the project tokens to the receiver.


Parameters:

| Name               | Type    | Description                                                            |
| :----------------- | :------ | :--------------------------------------------------------------------- |
| projectToken       | address | The address of the project token.                                      |
| projectTokenAmount | uint256 | The amount of project token to transfer.                               |
| user               | address | The address of the user whose deposit position is being transferred.   |
| receiver           | address | The address of the receiver of the project token.                      |


Return values:

| Name | Type    | Description                              |
| :--- | :------ | :--------------------------------------- |
| [0]  | uint256 | The amount of project token transferred. |

### calcDepositPosition (0xdf5e6bed)

```solidity
function calcDepositPosition(
    address projectToken,
    uint256 projectTokenAmount,
    address user
) external isProjectTokenListed(projectToken) onlyRelatedContracts nonReentrant
```

Calculates the deposit position for a user based on the project token, project token amount and user address.

Requirements:
- The project token must be listed.
- Called by a related contract.


Parameters:

| Name               | Type    | Description                         |
| :----------------- | :------ | :---------------------------------- |
| projectToken       | address | The address of the project token.   |
| projectTokenAmount | uint256 | The amount of project token.        |
| user               | address | The address of the user.            |

### getCollateralAvailableToWithdraw (0x72620613)

```solidity
function getCollateralAvailableToWithdraw(
    address account,
    address projectToken,
    address lendingToken
) public view returns (uint256 collateralProjectToWithdraw)
```

Calculates the amount of collateral available to withdraw for a given account, project token and lending token.


Parameters:

| Name         | Type    | Description                         |
| :----------- | :------ | :---------------------------------- |
| account      | address | The address of the account.         |
| projectToken | address | The address of the project token.   |
| lendingToken | address | The address of the lending token.   |


Return values:

| Name                        | Type    | Description                                     |
| :-------------------------- | :------ | :---------------------------------------------- |
| collateralProjectToWithdraw | uint256 | The amount of collateral available to withdraw. |

### supply (0xf2b9fdb8)

```solidity
function supply(
    address lendingToken,
    uint256 lendingTokenAmount
) external isLendingTokenListed(lendingToken) nonReentrant
```

Supplies a specified amount of a lending token to the platform.

Allows a user to supply a specified amount of a lending token to the platform.


Parameters:

| Name               | Type    | Description                                                                                                                                                                                                                                                                                                                                                  |
| :----------------- | :------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| lendingToken       | address | The address of the lending token being supplied.                                                                                                                                                                                                                                                                                                             |
| lendingTokenAmount | uint256 | The amount of the lending token being supplied.
 
 Requirements:
 - The lending token is listed.
 - The lending token is not paused.
 - The lending token amount is greater than 0.
 - Minting the bLendingTokens is successful and the minted amount is greater than 0.
 
 Effects:
 - Mints the corresponding bLendingTokens and credits them to the user. |

### supplyFromRelatedContract (0xb3c38b6e)

```solidity
function supplyFromRelatedContract(
    address lendingToken,
    uint256 lendingTokenAmount,
    address user
) external isLendingTokenListed(lendingToken) onlyRelatedContracts nonReentrant
```

Supplies a certain amount of lending tokens to the platform from a specific user.

Requirements:
- The lending token is listed.
- Called by a related contract.
- The lending token is not paused.
- The lending token amount is greater than 0.
- Minting the bLendingTokens is successful and the minted amount is greater than 0.

Effects:
- Mints the corresponding bLendingTokens and credits them to the user.


Parameters:

| Name               | Type    | Description                                |
| :----------------- | :------ | :----------------------------------------- |
| lendingToken       | address | Address of the lending token.              |
| lendingTokenAmount | uint256 | Amount of lending tokens to be supplied.   |
| user               | address | Address of the user.                       |

### redeem (0x1e9a6950)

```solidity
function redeem(
    address lendingToken,
    uint256 bLendingTokenAmount
) external isLendingTokenListed(lendingToken) nonReentrant
```

Redeems a specified amount of bLendingToken from the platform.

Function that performs the redemption of bLendingToken and returns the corresponding lending token to user.

Requirements:
- The lendingToken is listed.
- The lending token should not be paused.
- The bLendingTokenAmount should be greater than zero.
- The redemption of bLendingToken should not result in a redemption error.

Effects:
- Burns the bLendingTokens from the user.
- Transfers the corresponding lending tokens to the user.


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
) external isLendingTokenListed(lendingToken) onlyRelatedContracts nonReentrant
```

Function that performs the redemption of bLendingToken on behalf of a user and returns the corresponding lending token to the user by related contract.

Requirements:
- The lendingToken is listed.
     _ - Called by a related contract.
- The lending token should not be paused.
- The bLendingTokenAmount should be greater than zero.
- The redemption of bLendingToken should not result in a redemption error.

Effects:
- Burns the bLendingTokens from the user.
- Transfers the corresponding lending tokens to the user.


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
) external isLendingTokenListed(lendingToken) nonReentrant
```

Redeems a specified amount of lendingToken from the platform.

Function that performs the redemption of lending token and returns the corresponding underlying token to user.

Requirements:
- The lending token is listed.
- The lending token should not be paused.
- The lendingTokenAmount should be greater than zero.
- The redemption of lendingToken should not result in a redemption error.

Effects:
- Transfers the corresponding underlying tokens to the user.


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
) external isLendingTokenListed(lendingToken) onlyRelatedContracts nonReentrant
```

Function that performs the redemption of lending token on behalf of a user and returns the corresponding underlying token to the user by related contract.

Requirements:
- The lending token is listed.
- Called by a related contract.
- The lending token should not be paused.
- The lendingTokenAmount should be greater than zero.
- The redemption of lendingToken should not result in a redemption error.

Effects:
- Transfers the corresponding underlying tokens to the user.


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
)
    external
    isProjectTokenListed(projectToken)
    isLendingTokenListed(lendingToken)
    onlyRelatedContracts
    nonReentrant
```

Allows a related contract to calculate the new borrow position of a user.

Requirements:
- The project token must be listed.
- The lending token must be listed.
- Called by a related contract.


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
) public view returns (uint256 availableToBorrow)
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
)
    external
    isProjectTokenListed(projectToken)
    isLendingTokenListed(lendingToken)
    nonReentrant
    returns (uint256)
```

Repays a specified amount of lendingToken for a given project token and lending token.

Allows a borrower to repay their outstanding loan for a given project token and lending token.

Requirements:
- The project token must be listed.
- The lending token must be listed.
- The lending amount must be greater than 0.
- The borrower must have an outstanding loan for the given project and lending token before.

Effects:
Updates the interest in the borrower's borrow positions for the given `lendingToken`.
- Repays the specified `lendingTokenAmount` towards the borrower's loan.
- May fully or partially repay the borrow position, depending on the repayment amount and outstanding loan.


Parameters:

| Name               | Type    | Description                              |
| :----------------- | :------ | :--------------------------------------- |
| projectToken       | address | The project token's address.             |
| lendingToken       | address | The lending token's address.             |
| lendingTokenAmount | uint256 | The amount of lending tokens to repay.   |


Return values:

| Name | Type    | Description                               |
| :--- | :------ | :---------------------------------------- |
| [0]  | uint256 | amount of lending tokens actually repaid. |

### repayFromRelatedContract (0xf432e4e2)

```solidity
function repayFromRelatedContract(
    address projectToken,
    address lendingToken,
    uint256 lendingTokenAmount,
    address repairer,
    address borrower
)
    external
    isProjectTokenListed(projectToken)
    isLendingTokenListed(lendingToken)
    onlyRelatedContracts
    nonReentrant
    returns (uint256)
```

Allows a related contract to repay the outstanding loan for a given borrower's project token and lending token.

Requirements:
- The project token must be listed.
- The lending token must be listed.
- Called by a related contract.
- The lending amount must be greater than 0.
- The borrower must have an outstanding loan for the given project and lending token before.

Effects:
Updates the interest in the borrower's borrow positions for the given `lendingToken`.
- Repays the specified `lendingTokenAmount` towards the borrower's loan.
- May fully or partially repay the borrow position, depending on the repayment amount and outstanding loan.


Parameters:

| Name               | Type    | Description                                          |
| :----------------- | :------ | :--------------------------------------------------- |
| projectToken       | address | The project token's address.                         |
| lendingToken       | address | The lending token's address.                         |
| lendingTokenAmount | uint256 | The amount of lending tokens to repay.               |
| repairer           | address | The address that initiated the repair transaction.   |
| borrower           | address | The borrower's address.                              |


Return values:

| Name | Type    | Description                               |
| :--- | :------ | :---------------------------------------- |
| [0]  | uint256 | amount of lending tokens actually repaid. |

### updateInterestInBorrowPositions (0x9a812edd)

```solidity
function updateInterestInBorrowPositions(
    address account,
    address lendingToken
) public
```

This function is called to update the interest in a borrower's borrow position.


Parameters:

| Name         | Type    | Description                   |
| :----------- | :------ | :---------------------------- |
| account      | address | Address of the borrower.      |
| lendingToken | address | Address of the lending token. |

### pit (0x72d456af)

```solidity
function pit(
    address account,
    address projectToken,
    address lendingToken
) public view returns (uint256)
```

Returns the PIT (primary index token) value for a given account and position after a position is opened.

Formula: pit = $ * LVR of position.


Parameters:

| Name         | Type    | Description                     |
| :----------- | :------ | :------------------------------ |
| account      | address | Address of the account.         |
| projectToken | address | Address of the project token.   |
| lendingToken | address | Address of the lending token.   |


Return values:

| Name | Type    | Description    |
| :--- | :------ | :------------- |
| [0]  | uint256 | The PIT value. |

### pitCollateral (0x1893be9f)

```solidity
function pitCollateral(
    address account,
    address projectToken
) public view returns (uint256)
```

Returns the PIT (primary index token) value for a given account and collateral before a position is opened.

Formula: pit = $ * LVR of project token.


Parameters:

| Name         | Type    | Description                     |
| :----------- | :------ | :------------------------------ |
| account      | address | Address of the account.         |
| projectToken | address | Address of the project token.   |


Return values:

| Name | Type    | Description    |
| :--- | :------ | :------------- |
| [0]  | uint256 | The PIT value. |

### getLendingToken (0x2ce36230)

```solidity
function getLendingToken(
    address user,
    address projectToken
) public view returns (address actualLendingToken)
```

Returns the actual lending token of a user's borrow position for a specific project token.


Parameters:

| Name         | Type    | Description                                  |
| :----------- | :------ | :------------------------------------------- |
| user         | address | The address of the user's borrow position.   |
| projectToken | address | The address of the project token.            |


Return values:

| Name               | Type    | Description                              |
| :----------------- | :------ | :--------------------------------------- |
| actualLendingToken | address | The address of the actual lending token. |

### pitRemaining (0xd1a3d2ae)

```solidity
function pitRemaining(
    address account,
    address projectToken,
    address lendingToken
) public view returns (uint256 remaining)
```

Returns the remaining PIT (primary index token) of a user's borrow position.


Parameters:

| Name         | Type    | Description                                  |
| :----------- | :------ | :------------------------------------------- |
| account      | address | The address of the user's borrow position.   |
| projectToken | address | The address of the project token.            |
| lendingToken | address | The address of the lending token.            |


Return values:

| Name      | Type    | Description                                      |
| :-------- | :------ | :----------------------------------------------- |
| remaining | uint256 | The remaining PIT of the user's borrow position. |

### totalOutstanding (0xac15382f)

```solidity
function totalOutstanding(
    address account,
    address projectToken,
    address lendingToken
) public view returns (uint256)
```

Returns the total outstanding amount of a user's borrow position for a specific project token and lending token.


Parameters:

| Name         | Type    | Description                                  |
| :----------- | :------ | :------------------------------------------- |
| account      | address | The address of the user's borrow position.   |
| projectToken | address | The address of the project token.            |
| lendingToken | address | The address of the lending token.            |


Return values:

| Name | Type    | Description                                             |
| :--- | :------ | :------------------------------------------------------ |
| [0]  | uint256 | total outstanding amount of the user's borrow position. |

### healthFactor (0xcc224bff)

```solidity
function healthFactor(
    address account,
    address projectToken,
    address lendingToken
) public view returns (uint256 numerator, uint256 denominator)
```

Returns the health factor of a user's borrow position for a specific project token and lending token.


Parameters:

| Name         | Type    | Description                                  |
| :----------- | :------ | :------------------------------------------- |
| account      | address | The address of the user's borrow position.   |
| projectToken | address | The address of the project token.            |
| lendingToken | address | The address of the lending token.            |


Return values:

| Name        | Type    | Description                           |
| :---------- | :------ | :------------------------------------ |
| numerator   | uint256 | The numerator of the health factor.   |
| denominator | uint256 | The denominator of the health factor. |

### getTokenEvaluation (0x3598a7a9)

```solidity
function getTokenEvaluation(
    address token,
    uint256 tokenAmount
) public view returns (uint256)
```

Returns the price of a specific token amount in USD.


Parameters:

| Name        | Type    | Description                             |
| :---------- | :------ | :-------------------------------------- |
| token       | address | The address of the token to evaluate.   |
| tokenAmount | uint256 | The amount of the token to evaluate.    |


Return values:

| Name | Type    | Description                        |
| :--- | :------ | :--------------------------------- |
| [0]  | uint256 | The evaluated token amount in USD. |

### lendingTokensLength (0x2412b575)

```solidity
function lendingTokensLength() public view returns (uint256)
```

Returns the length of the lending tokens array.


Return values:

| Name | Type    | Description                             |
| :--- | :------ | :-------------------------------------- |
| [0]  | uint256 | The length of the lending tokens array. |

### projectTokensLength (0x4a41d29e)

```solidity
function projectTokensLength() public view returns (uint256)
```

Returns the length of the project tokens array.


Return values:

| Name | Type    | Description                             |
| :--- | :------ | :-------------------------------------- |
| [0]  | uint256 | The length of the project tokens array. |

### getPosition (0x713390f5)

```solidity
function getPosition(
    address account,
    address projectToken,
    address lendingToken
)
    public
    view
    returns (
        uint256 depositedProjectTokenAmount,
        uint256 loanBody,
        uint256 accrual,
        uint256 healthFactorNumerator,
        uint256 healthFactorDenominator
    )
```

Returns the details of a user's borrow position for a specific project token and lending token.


Parameters:

| Name         | Type    | Description                                  |
| :----------- | :------ | :------------------------------------------- |
| account      | address | The address of the user's borrow position.   |
| projectToken | address | The address of the project token.            |
| lendingToken | address | The address of the lending token.            |


Return values:

| Name                        | Type    | Description                                             |
| :-------------------------- | :------ | :------------------------------------------------------ |
| depositedProjectTokenAmount | uint256 | The amount of project tokens deposited by the user.     |
| loanBody                    | uint256 | The amount of the lending token borrowed by the user.   |
| accrual                     | uint256 | The accrued interest of the borrow position.            |
| healthFactorNumerator       | uint256 | The numerator of the health factor.                     |
| healthFactorDenominator     | uint256 | The denominator of the health factor.                   |

### getDepositedAmount (0x0fefc251)

```solidity
function getDepositedAmount(
    address projectToken,
    address user
) public view returns (uint256)
```

Returns the amount of project tokens deposited by a user for a specific project token and collateral token.


Parameters:

| Name         | Type    | Description                         |
| :----------- | :------ | :---------------------------------- |
| projectToken | address | The address of the project token.   |
| user         | address | The address of the user.            |


Return values:

| Name | Type    | Description                                     |
| :--- | :------ | :---------------------------------------------- |
| [0]  | uint256 | amount of project tokens deposited by the user. |

### getRelatedContract (0x2060128e)

```solidity
function getRelatedContract(address relatedContract) public view returns (bool)
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

### getTotalBorrowPerCollateral (0x65647a59)

```solidity
function getTotalBorrowPerCollateral(
    address projectToken
) public view returns (uint256)
```

Gets total borrow amount in USD per collateral for a specific project token.


Parameters:

| Name         | Type    | Description                         |
| :----------- | :------ | :---------------------------------- |
| projectToken | address | The address of the project token.   |


Return values:

| Name | Type    | Description                     |
| :--- | :------ | :------------------------------ |
| [0]  | uint256 | The total borrow amount in USD. |

### getTotalBorrowPerLendingToken (0x961540e1)

```solidity
function getTotalBorrowPerLendingToken(
    address lendingToken
) public view returns (uint256)
```

Gets total borrow amount in USD for a specific lending token.


Parameters:

| Name         | Type    | Description                         |
| :----------- | :------ | :---------------------------------- |
| lendingToken | address | The address of the lending token.   |


Return values:

| Name | Type    | Description                     |
| :--- | :------ | :------------------------------ |
| [0]  | uint256 | The total borrow amount in USD. |

### totalOutstandingInUSD (0xb189b70a)

```solidity
function totalOutstandingInUSD(
    address account,
    address projectToken,
    address lendingToken
) public view returns (uint256)
```

Converts the total outstanding amount of a user's borrow position to USD.


Parameters:

| Name         | Type    | Description                         |
| :----------- | :------ | :---------------------------------- |
| account      | address | The address of the user account.    |
| projectToken | address | The address of the project token.   |
| lendingToken | address | The address of the lending token.   |


Return values:

| Name | Type    | Description                          |
| :--- | :------ | :----------------------------------- |
| [0]  | uint256 | The total outstanding amount in USD. |

### getLoanToValueRatio (0xe84dc1b3)

```solidity
function getLoanToValueRatio(
    address projectToken,
    address lendingToken
) public view returns (uint256 lvrNumerator, uint256 lvrDenominator)
```

Gets the loan to value ratio of a position made by a project token and a lending token.


Parameters:

| Name         | Type    | Description                         |
| :----------- | :------ | :---------------------------------- |
| projectToken | address | The address of the project token.   |
| lendingToken | address | The address of the lending token.   |


Return values:

| Name           | Type    | Description                                 |
| :------------- | :------ | :------------------------------------------ |
| lvrNumerator   | uint256 | The numerator of the loan to value ratio.   |
| lvrDenominator | uint256 | The denominator of the loan to value ratio. |
