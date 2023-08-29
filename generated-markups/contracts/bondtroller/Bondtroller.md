# Bondtroller

## Contract Description


License: MIT

## 

```solidity
contract Bondtroller is BondtrollerV5Storage, BondtrollerErrorReporter, ExponentialNoError, Initializable
```

Author: Bonded

Contract for managing the Bond market and its associated BToken contracts.
## Events info

### MarketListed

```solidity
event MarketListed(BToken bToken)
```

Emitted when an admin supports a market
### MarketEntered

```solidity
event MarketEntered(BToken bToken, address account)
```

Emitted when an account enters a market
### MarketExited

```solidity
event MarketExited(BToken bToken, address account)
```

Emitted when an account exits a market
### NewPriceOracle

```solidity
event NewPriceOracle(address oldPriceOracle, address newPriceOracle)
```

Emitted when price oracle is changed
### NewPauseGuardian

```solidity
event NewPauseGuardian(address oldPauseGuardian, address newPauseGuardian)
```

Emitted when pause guardian is changed
### GlobalActionPaused

```solidity
event GlobalActionPaused(string action, bool pauseState)
```

Emitted when an action is paused globally
### ActionPaused

```solidity
event ActionPaused(BToken bToken, string action, bool pauseState)
```

Emitted when an action is paused on a market
### NewBorrowCap

```solidity
event NewBorrowCap(BToken indexed bToken, uint256 newBorrowCap)
```

Emitted when borrow cap for a bToken is changed
### NewBorrowCapGuardian

```solidity
event NewBorrowCapGuardian(address oldBorrowCapGuardian, address newBorrowCapGuardian)
```

Emitted when borrow cap guardian is changed
### CompGranted

```solidity
event CompGranted(address recipient, uint256 amount)
```

Emitted when COMP is granted by admin
### NewPrimaryLendingPlatform

```solidity
event NewPrimaryLendingPlatform(address oldPrimaryLendingPlatform, address newPrimaryLendingPlatform)
```


### NewAdmin

```solidity
event NewAdmin(address newAdmin)
```

Emitted when admin address is changed by previous admin
## State variables info

### primaryLendingPlatform (0x92641a7c)

```solidity
address primaryLendingPlatform
```

the address of primary index token
## Modifiers info

### onlyPrimaryLendingPlatform

```solidity
modifier onlyPrimaryLendingPlatform()
```

Throws if called by any account other than the primary index token.
## Functions info

### init (0xe1c7392a)

```solidity
function init() public initializer
```

Initializes the Bondtroller contract by setting the admin to the sender's address and setting the pause guardian to the admin.
### getPrimaryLendingPlatformAddress (0xaa0e4edd)

```solidity
function getPrimaryLendingPlatformAddress() external view returns (address)
```

Returns the address of the primary lending platform.


Return values:

| Name | Type    | Description                                  |
| :--- | :------ | :------------------------------------------- |
| [0]  | address | The address of the primary lending platform. |

### getAssetsIn (0xabfceffc)

```solidity
function getAssetsIn(address account) external view returns (BToken[] memory)
```

Returns the assets an account has entered.


Parameters:

| Name    | Type    | Description                                      |
| :------ | :------ | :----------------------------------------------- |
| account | address | The address of the account to pull assets for.   |


Return values:

| Name | Type              | Description                                             |
| :--- | :---------------- | :------------------------------------------------------ |
| [0]  | contract BToken[] | A dynamic list with the assets the account has entered. |

### checkMembership (0x929fe9a1)

```solidity
function checkMembership(
    address account,
    BToken bToken
) external view returns (bool)
```

Returns whether the given account is entered in the given asset.


Parameters:

| Name    | Type            | Description                            |
| :------ | :-------------- | :------------------------------------- |
| account | address         | The address of the account to check.   |
| bToken  | contract BToken | The bToken to check.                   |


Return values:

| Name | Type | Description                                           |
| :--- | :--- | :---------------------------------------------------- |
| [0]  | bool | True if the account is in the asset, otherwise false. |

### changeAdmin (0x8f283970)

```solidity
function changeAdmin(address newAdmin) external
```

Changes the admin address of the Bondtroller contract.


Parameters:

| Name     | Type    | Description                      |
| :------- | :------ | :------------------------------- |
| newAdmin | address | The new admin address to be set. |

### enterMarkets (0xc2998238)

```solidity
function enterMarkets(
    address[] memory bTokens
) public onlyPrimaryLendingPlatform returns (uint256[] memory)
```

Add assets to be included in account liquidity calculation.


Parameters:

| Name    | Type      | Description                                                  |
| :------ | :-------- | :----------------------------------------------------------- |
| bTokens | address[] | The list of addresses of the bToken markets to be enabled.   |


Return values:

| Name | Type      | Description                                                          |
| :--- | :-------- | :------------------------------------------------------------------- |
| [0]  | uint256[] | Success indicator for whether each corresponding market was entered. |

### enterMarket (0x24991d66)

```solidity
function enterMarket(
    address bToken,
    address borrower
) public onlyPrimaryLendingPlatform returns (BondtrollerErrorReporter.Error)
```

Allows a borrower to enter a market by adding the corresponding BToken to the market and updating the borrower's status.


Parameters:

| Name     | Type    | Description                                         |
| :------- | :------ | :-------------------------------------------------- |
| bToken   | address | The address of the BToken to add to the market.     |
| borrower | address | The address of the borrower to update status for.   |


Return values:

| Name | Type                                | Description                                                      |
| :--- | :---------------------------------- | :--------------------------------------------------------------- |
| [0]  | enum BondtrollerErrorReporter.Error | An Error code indicating if the operation was successful or not. |

### exitMarket (0xede4edd0)

```solidity
function exitMarket(
    address cTokenAddress
) external onlyPrimaryLendingPlatform returns (uint256)
```

Removes asset from sender's account liquidity calculation.
Sender must not have an outstanding borrow balance in the asset,
or be providing necessary collateral for an outstanding borrow.


Parameters:

| Name          | Type    | Description                               |
| :------------ | :------ | :---------------------------------------- |
| cTokenAddress | address | The address of the asset to be removed.   |


Return values:

| Name | Type    | Description                                                |
| :--- | :------ | :--------------------------------------------------------- |
| [0]  | uint256 | Whether or not the account successfully exited the market. |

### mintAllowed (0x4ef4c3e1)

```solidity
function mintAllowed(
    address bToken,
    address minter,
    uint256 mintAmount
) external view returns (uint256)
```

Checks if the account should be allowed to mint tokens in the given market.


Parameters:

| Name       | Type    | Description                                                                     |
| :--------- | :------ | :------------------------------------------------------------------------------ |
| bToken     | address | The market to verify the mint against.                                          |
| minter     | address | The account which would get the minted tokens.                                  |
| mintAmount | uint256 | The amount of underlying being supplied to the market in exchange for tokens.   |


Return values:

| Name | Type    | Description                                                                           |
| :--- | :------ | :------------------------------------------------------------------------------------ |
| [0]  | uint256 | 0 if the mint is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol). |

### mintVerify (0x41c728b9)

```solidity
function mintVerify(
    address bToken,
    address minter,
    uint256 actualMintAmount,
    uint256 mintTokens
) external
```

Validates mint and reverts on rejection. May emit logs.


Parameters:

| Name             | Type    | Description                                        |
| :--------------- | :------ | :------------------------------------------------- |
| bToken           | address | Asset being minted.                                |
| minter           | address | The address minting the tokens.                    |
| actualMintAmount | uint256 | The amount of the underlying asset being minted.   |
| mintTokens       | uint256 | The number of tokens being minted.                 |

### redeemAllowed (0xeabe7d91)

```solidity
function redeemAllowed(
    address bToken,
    address redeemer,
    uint256 redeemTokens
) external view returns (uint256)
```

Checks if the account should be allowed to redeem tokens in the given market.


Parameters:

| Name         | Type    | Description                                                                 |
| :----------- | :------ | :-------------------------------------------------------------------------- |
| bToken       | address | The market to verify the redeem against.                                    |
| redeemer     | address | The account which would redeem the tokens.                                  |
| redeemTokens | uint256 | The number of bTokens to exchange for the underlying asset in the market.   |


Return values:

| Name | Type    | Description                                                                             |
| :--- | :------ | :-------------------------------------------------------------------------------------- |
| [0]  | uint256 | 0 if the redeem is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol). |

### redeemVerify (0x51dff989)

```solidity
function redeemVerify(
    address bToken,
    address redeemer,
    uint256 redeemAmount,
    uint256 redeemTokens
) external pure
```

Validates redeem and reverts on rejection. May emit logs.


Parameters:

| Name         | Type    | Description                                          |
| :----------- | :------ | :--------------------------------------------------- |
| bToken       | address | Asset being redeemed.                                |
| redeemer     | address | The address redeeming the tokens.                    |
| redeemAmount | uint256 | The amount of the underlying asset being redeemed.   |
| redeemTokens | uint256 | The number of tokens being redeemed.                 |

### borrowAllowed (0xda3d454c)

```solidity
function borrowAllowed(
    address bToken,
    address borrower,
    uint256 borrowAmount
) external returns (uint256)
```

Checks if the account should be allowed to borrow the underlying asset of the given market.


Parameters:

| Name         | Type    | Description                                          |
| :----------- | :------ | :--------------------------------------------------- |
| bToken       | address | The market to verify the borrow against.             |
| borrower     | address | The account which would borrow the asset.            |
| borrowAmount | uint256 | The amount of underlying the account would borrow.   |


Return values:

| Name | Type    | Description                                                                             |
| :--- | :------ | :-------------------------------------------------------------------------------------- |
| [0]  | uint256 | 0 if the borrow is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol). |

### borrowVerify (0x5c778605)

```solidity
function borrowVerify(
    address bToken,
    address borrower,
    uint256 borrowAmount
) external
```

Validates borrow and reverts on rejection. May emit logs.


Parameters:

| Name         | Type    | Description                                             |
| :----------- | :------ | :------------------------------------------------------ |
| bToken       | address | Asset whose underlying is being borrowed.               |
| borrower     | address | The address borrowing the underlying.                   |
| borrowAmount | uint256 | The amount of the underlying asset requested to borrow. |

### repayBorrowAllowed (0x24008a62)

```solidity
function repayBorrowAllowed(
    address bToken,
    address payer,
    address borrower,
    uint256 repayAmount
) external view returns (uint256)
```

Checks if the account should be allowed to repay a borrow in the given market.


Parameters:

| Name        | Type    | Description                                                   |
| :---------- | :------ | :------------------------------------------------------------ |
| bToken      | address | The market to verify the repay against.                       |
| payer       | address | The account which would repay the asset.                      |
| borrower    | address | The account which would borrowed the asset.                   |
| repayAmount | uint256 | The amount of the underlying asset the account would repay.   |


Return values:

| Name | Type    | Description                                                                            |
| :--- | :------ | :------------------------------------------------------------------------------------- |
| [0]  | uint256 | 0 if the repay is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol). |

### repayBorrowVerify (0x1ededc91)

```solidity
function repayBorrowVerify(
    address bToken,
    address payer,
    address borrower,
    uint256 actualRepayAmount,
    uint256 borrowerIndex
) external
```

Validates repayBorrow and reverts on rejection. May emit logs.


Parameters:

| Name              | Type    | Description                            |
| :---------------- | :------ | :------------------------------------- |
| bToken            | address | Asset being repaid.                    |
| payer             | address | The address repaying the borrow.       |
| borrower          | address | The address of the borrower.           |
| actualRepayAmount | uint256 | The amount of underlying being repaid. |

### transferAllowed (0xbdcdc258)

```solidity
function transferAllowed(
    address bToken,
    address src,
    address dst,
    uint256 transferTokens
) external returns (uint256)
```

Checks if the account should be allowed to transfer tokens in the given market.


Parameters:

| Name           | Type    | Description                                  |
| :------------- | :------ | :------------------------------------------- |
| bToken         | address | The market to verify the transfer against.   |
| src            | address | The account which sources the tokens.        |
| dst            | address | The account which receives the tokens.       |
| transferTokens | uint256 | The number of bTokens to transfer.           |


Return values:

| Name | Type    | Description                                                                               |
| :--- | :------ | :---------------------------------------------------------------------------------------- |
| [0]  | uint256 | 0 if the transfer is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol). |

### transferVerify (0x6a56947e)

```solidity
function transferVerify(
    address bToken,
    address src,
    address dst,
    uint256 transferTokens
) external onlyPrimaryLendingPlatform
```

Validates transfer and reverts on rejection. May emit logs.


Parameters:

| Name           | Type    | Description                              |
| :------------- | :------ | :--------------------------------------- |
| bToken         | address | Asset being transferred.                 |
| src            | address | The account which sources the tokens.    |
| dst            | address | The account which receives the tokens.   |
| transferTokens | uint256 | The number of bTokens to transfer.       |

### setPriceOracle (0x530e784f)

```solidity
function setPriceOracle(address newOracle) public returns (uint256)
```

Sets a new price oracle for the bondtroller.
Admin function to set a new price oracle.


Return values:

| Name | Type    | Description                                                                 |
| :--- | :------ | :-------------------------------------------------------------------------- |
| [0]  | uint256 | uint256 0=success, otherwise a failure (see ErrorReporter.sol for details). |

### setPrimaryLendingPlatformAddress (0xcec5a0b0)

```solidity
function setPrimaryLendingPlatformAddress(
    address _newPrimaryLendingPlatform
) external returns (uint256)
```

Sets the address of the primary lending platform.


Parameters:

| Name                       | Type    | Description                                        |
| :------------------------- | :------ | :------------------------------------------------- |
| _newPrimaryLendingPlatform | address | The new address of the primary lending platform.   |


Return values:

| Name | Type    | Description                                                              |
| :--- | :------ | :----------------------------------------------------------------------- |
| [0]  | uint256 | uint 0=success, otherwise a failure (see ErrorReporter.sol for details). |

### supportMarket (0xcab4f84c)

```solidity
function supportMarket(BToken bToken) external returns (uint256)
```

Add the market to the markets mapping and set it as listed.
Admin function to set isListed and add support for the market.


Parameters:

| Name   | Type            | Description                                  |
| :----- | :-------------- | :------------------------------------------- |
| bToken | contract BToken | The address of the market (token) to list.   |


Return values:

| Name | Type    | Description                                                           |
| :--- | :------ | :-------------------------------------------------------------------- |
| [0]  | uint256 | uint256 0=success, otherwise a failure. (See enum Error for details). |

### setMarketBorrowCaps (0x186db48f)

```solidity
function setMarketBorrowCaps(
    BToken[] calldata bTokens,
    uint256[] calldata newBorrowCaps
) external
```

Sets the given borrow caps for the given bToken markets. Borrowing that brings total borrows to or above borrow cap will revert.
Admin or borrowCapGuardian function to set the borrow caps. A borrow cap of 0 corresponds to unlimited borrowing.


Parameters:

| Name          | Type              | Description                                                                                         |
| :------------ | :---------------- | :-------------------------------------------------------------------------------------------------- |
| bTokens       | contract BToken[] | The addresses of the markets (tokens) to change the borrow caps for.                                |
| newBorrowCaps | uint256[]         | The new borrow cap values in underlying to be set. A value of 0 corresponds to unlimited borrowing. |

### setBorrowCapGuardian (0xd7ae7763)

```solidity
function setBorrowCapGuardian(address newBorrowCapGuardian) external
```

Admin function to change the Borrow Cap Guardian.


Parameters:

| Name                 | Type    | Description                                 |
| :------------------- | :------ | :------------------------------------------ |
| newBorrowCapGuardian | address | The address of the new Borrow Cap Guardian. |

### setPauseGuardian (0x48bde20c)

```solidity
function setPauseGuardian(address newPauseGuardian) public returns (uint256)
```

Admin function to change the Pause Guardian.


Parameters:

| Name             | Type    | Description                              |
| :--------------- | :------ | :--------------------------------------- |
| newPauseGuardian | address | The address of the new Pause Guardian.   |


Return values:

| Name | Type    | Description                                                           |
| :--- | :------ | :-------------------------------------------------------------------- |
| [0]  | uint256 | uint256 0=success, otherwise a failure. (See enum Error for details). |

### setMintPaused (0x3e0cdfd3)

```solidity
function setMintPaused(BToken bToken, bool state) public returns (bool)
```

Pauses or unpauses minting of a specific BToken.


Parameters:

| Name   | Type            | Description                                                  |
| :----- | :-------------- | :----------------------------------------------------------- |
| bToken | contract BToken | The address of the BToken to pause or unpause minting for.   |
| state  | bool            | The boolean state to set the minting pause status to.        |


Return values:

| Name | Type | Description                                                                 |
| :--- | :--- | :-------------------------------------------------------------------------- |
| [0]  | bool | A boolean indicating whether the minting pause status was successfully set. |

### setBorrowPaused (0xb6606d1c)

```solidity
function setBorrowPaused(BToken bToken, bool state) public returns (bool)
```

Pauses or unpauses borrowing for a given market.


Parameters:

| Name   | Type            | Description                                                |
| :----- | :-------------- | :--------------------------------------------------------- |
| bToken | contract BToken | The address of the BToken to pause or unpause borrowing.   |
| state  | bool            | The boolean state to set the borrowing pause to.           |


Return values:

| Name | Type | Description                                                |
| :--- | :--- | :--------------------------------------------------------- |
| [0]  | bool | A boolean indicating whether the operation was successful. |

### setTransferPaused (0x9d488a0c)

```solidity
function setTransferPaused(bool state) public returns (bool)
```

Sets the transfer pause state.


Parameters:

| Name  | Type | Description                     |
| :---- | :--- | :------------------------------ |
| state | bool | The new transfer pause state.   |


Return values:

| Name | Type | Description                                |
| :--- | :--- | :----------------------------------------- |
| [0]  | bool | bool Returns the new transfer pause state. |

### setSeizePaused (0x43b5f5be)

```solidity
function setSeizePaused(bool state) public returns (bool)
```

Sets the state of the seizeGuardianPaused variable to the given state.


Parameters:

| Name  | Type | Description                                          |
| :---- | :--- | :--------------------------------------------------- |
| state | bool | The new state of the seizeGuardianPaused variable.   |


Return values:

| Name | Type | Description                                        |
| :--- | :--- | :------------------------------------------------- |
| [0]  | bool | The new state of the seizeGuardianPaused variable. |

### getAllMarkets (0xb0772d0b)

```solidity
function getAllMarkets() public view returns (BToken[] memory)
```

Returns all of the markets.
The automatic getter may be used to access an individual market.


Return values:

| Name | Type              | Description                   |
| :--- | :---------------- | :---------------------------- |
| [0]  | contract BToken[] | The list of market addresses. |

### isDeprecated (0x94543c15)

```solidity
function isDeprecated(BToken bToken) public view returns (bool)
```

Returns true if the given bToken market has been deprecated.
All borrows in a deprecated bToken market can be immediately liquidated.


Parameters:

| Name   | Type            | Description                        |
| :----- | :-------------- | :--------------------------------- |
| bToken | contract BToken | The market to check if deprecated. |

### getBlockNumber (0x42cbb15c)

```solidity
function getBlockNumber() public view returns (uint256)
```

Returns the current block number.


Return values:

| Name | Type    | Description                                 |
| :--- | :------ | :------------------------------------------ |
| [0]  | uint256 | uint representing the current block number. |
