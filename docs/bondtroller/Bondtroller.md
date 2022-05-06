# Solidity API

## Bondtroller

### MarketListed

```solidity
event MarketListed(contract BToken bToken)
```

Emitted when an admin supports a market

### MarketEntered

```solidity
event MarketEntered(contract BToken bToken, address account)
```

Emitted when an account enters a market

### MarketExited

```solidity
event MarketExited(contract BToken bToken, address account)
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

### ActionPaused

```solidity
event ActionPaused(string action, bool pauseState)
```

Emitted when an action is paused globally

### ActionPaused

```solidity
event ActionPaused(contract BToken bToken, string action, bool pauseState)
```

Emitted when an action is paused on a market

### NewBorrowCap

```solidity
event NewBorrowCap(contract BToken bToken, uint256 newBorrowCap)
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

### NewPrimaryIndexToken

```solidity
event NewPrimaryIndexToken(address oldPrimaryIndexToken, address newPrimaryIndexToken)
```

### primaryIndexToken

```solidity
address primaryIndexToken
```

the address of primary index token

### init

```solidity
function init() public
```

### onlyPrimaryIndexToken

```solidity
modifier onlyPrimaryIndexToken()
```

### getPrimaryIndexTokenAddress

```solidity
function getPrimaryIndexTokenAddress() external view returns (address)
```

### getAssetsIn

```solidity
function getAssetsIn(address account) external view returns (contract BToken[])
```

Returns the assets an account has entered

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the account to pull assets for |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract BToken[] | A dynamic list with the assets the account has entered |

### checkMembership

```solidity
function checkMembership(address account, contract BToken bToken) external view returns (bool)
```

Returns whether the given account is entered in the given asset

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the account to check |
| bToken | contract BToken | The bToken to check |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if the account is in the asset, otherwise false. |

### enterMarkets

```solidity
function enterMarkets(address[] bTokens) public returns (uint256[])
```

Add assets to be included in account liquidity calculation

| Name | Type | Description |
| ---- | ---- | ----------- |
| bTokens | address[] | The list of addresses of the bToken markets to be enabled |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256[] | Success indicator for whether each corresponding market was entered |

### enterMarket

```solidity
function enterMarket(address bToken, address borrower) public returns (enum BondtrollerErrorReporter.Error)
```

Add asset to be included in account liquidity calculation

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | address | The address of the bToken markets to be enabled |
| borrower | address | The address of user, which enters to market |

### addToMarketInternal

```solidity
function addToMarketInternal(contract BToken bToken, address borrower) internal returns (enum BondtrollerErrorReporter.Error)
```

Add the market to the borrower&#x27;s &quot;assets in&quot; for liquidity calculations

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | contract BToken | The market to enter |
| borrower | address | The address of the account to modify |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | enum BondtrollerErrorReporter.Error | Success indicator for whether the market was entered |

### exitMarket

```solidity
function exitMarket(address cTokenAddress) external returns (uint256)
```

Removes asset from sender&#x27;s account liquidity calculation

_Sender must not have an outstanding borrow balance in the asset,
 or be providing necessary collateral for an outstanding borrow._

| Name | Type | Description |
| ---- | ---- | ----------- |
| cTokenAddress | address | The address of the asset to be removed |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Whether or not the account successfully exited the market |

### mintAllowed

```solidity
function mintAllowed(address bToken, address minter, uint256 mintAmount) external view returns (uint256)
```

Checks if the account should be allowed to mint tokens in the given market

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | address | The market to verify the mint against |
| minter | address | The account which would get the minted tokens |
| mintAmount | uint256 | The amount of underlying being supplied to the market in exchange for tokens |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | 0 if the mint is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol) /     f |

### mintVerify

```solidity
function mintVerify(address bToken, address minter, uint256 actualMintAmount, uint256 mintTokens) external
```

Validates mint and reverts on rejection. May emit logs.

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | address | Asset being minted |
| minter | address | The address minting the tokens |
| actualMintAmount | uint256 | The amount of the underlying asset being minted |
| mintTokens | uint256 | The number of tokens being minted /     f |

### redeemAllowed

```solidity
function redeemAllowed(address bToken, address redeemer, uint256 redeemTokens) external view returns (uint256)
```

Checks if the account should be allowed to redeem tokens in the given market

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | address | The market to verify the redeem against |
| redeemer | address | The account which would redeem the tokens |
| redeemTokens | uint256 | The number of bTokens to exchange for the underlying asset in the market |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | 0 if the redeem is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol) /     f |

### redeemAllowedInternal

```solidity
function redeemAllowedInternal(address bToken, address redeemer, uint256 redeemTokens) internal view returns (uint256)
```

### redeemVerify

```solidity
function redeemVerify(address bToken, address redeemer, uint256 redeemAmount, uint256 redeemTokens) external pure
```

Validates redeem and reverts on rejection. May emit logs.

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | address | Asset being redeemed |
| redeemer | address | The address redeeming the tokens |
| redeemAmount | uint256 | The amount of the underlying asset being redeemed |
| redeemTokens | uint256 | The number of tokens being redeemed /     f |

### borrowAllowed

```solidity
function borrowAllowed(address bToken, address borrower, uint256 borrowAmount) external returns (uint256)
```

Checks if the account should be allowed to borrow the underlying asset of the given market

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | address | The market to verify the borrow against |
| borrower | address | The account which would borrow the asset |
| borrowAmount | uint256 | The amount of underlying the account would borrow |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | 0 if the borrow is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol) /     f |

### borrowVerify

```solidity
function borrowVerify(address bToken, address borrower, uint256 borrowAmount) external
```

Validates borrow and reverts on rejection. May emit logs.

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | address | Asset whose underlying is being borrowed |
| borrower | address | The address borrowing the underlying |
| borrowAmount | uint256 | The amount of the underlying asset requested to borrow /     f |

### repayBorrowAllowed

```solidity
function repayBorrowAllowed(address bToken, address payer, address borrower, uint256 repayAmount) external view returns (uint256)
```

Checks if the account should be allowed to repay a borrow in the given market

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | address | The market to verify the repay against |
| payer | address | The account which would repay the asset |
| borrower | address | The account which would borrowed the asset |
| repayAmount | uint256 | The amount of the underlying asset the account would repay |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | 0 if the repay is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol) /     f |

### repayBorrowVerify

```solidity
function repayBorrowVerify(address bToken, address payer, address borrower, uint256 actualRepayAmount, uint256 borrowerIndex) external
```

Validates repayBorrow and reverts on rejection. May emit logs.

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | address | Asset being repaid |
| payer | address | The address repaying the borrow |
| borrower | address | The address of the borrower |
| actualRepayAmount | uint256 | The amount of underlying being repaid /     f |
| borrowerIndex | uint256 |  |

### transferAllowed

```solidity
function transferAllowed(address bToken, address src, address dst, uint256 transferTokens) external returns (uint256)
```

Checks if the account should be allowed to transfer tokens in the given market

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | address | The market to verify the transfer against |
| src | address | The account which sources the tokens |
| dst | address | The account which receives the tokens |
| transferTokens | uint256 | The number of bTokens to transfer |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | 0 if the transfer is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol) /     f |

### transferVerify

```solidity
function transferVerify(address bToken, address src, address dst, uint256 transferTokens) external
```

Validates transfer and reverts on rejection. May emit logs.

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | address | Asset being transferred |
| src | address | The account which sources the tokens |
| dst | address | The account which receives the tokens |
| transferTokens | uint256 | The number of bTokens to transfer /     f |

### setPriceOracle

```solidity
function setPriceOracle(address newOracle) public returns (uint256)
```

Sets a new price oracle for the bondtroller

_Admin function to set a new price oracle_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) /     f |

### setPrimaryIndexTokenAddress

```solidity
function setPrimaryIndexTokenAddress(address _newPrimaryIndexToken) external returns (uint256)
```

### supportMarket

```solidity
function supportMarket(contract BToken bToken) external returns (uint256)
```

Add the market to the markets mapping and set it as listed

_Admin function to set isListed and add support for the market_

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | contract BToken | The address of the market (token) to list |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure. (See enum Error for details) /     f |

### _addMarketInternal

```solidity
function _addMarketInternal(address bToken) internal
```

### setMarketBorrowCaps

```solidity
function setMarketBorrowCaps(contract BToken[] bTokens, uint256[] newBorrowCaps) external
```

Set the given borrow caps for the given bToken markets. Borrowing that brings total borrows to or above borrow cap will revert.

_Admin or borrowCapGuardian function to set the borrow caps. A borrow cap of 0 corresponds to unlimited borrowing._

| Name | Type | Description |
| ---- | ---- | ----------- |
| bTokens | contract BToken[] | The addresses of the markets (tokens) to change the borrow caps for |
| newBorrowCaps | uint256[] | The new borrow cap values in underlying to be set. A value of 0 corresponds to unlimited borrowing. /     f |

### setBorrowCapGuardian

```solidity
function setBorrowCapGuardian(address newBorrowCapGuardian) external
```

Admin function to change the Borrow Cap Guardian

| Name | Type | Description |
| ---- | ---- | ----------- |
| newBorrowCapGuardian | address | The address of the new Borrow Cap Guardian /     f |

### setPauseGuardian

```solidity
function setPauseGuardian(address newPauseGuardian) public returns (uint256)
```

Admin function to change the Pause Guardian

| Name | Type | Description |
| ---- | ---- | ----------- |
| newPauseGuardian | address | The address of the new Pause Guardian |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure. (See enum Error for details) /     f |

### setMintPaused

```solidity
function setMintPaused(contract BToken bToken, bool state) public returns (bool)
```

### setBorrowPaused

```solidity
function setBorrowPaused(contract BToken bToken, bool state) public returns (bool)
```

### setTransferPaused

```solidity
function setTransferPaused(bool state) public returns (bool)
```

### setSeizePaused

```solidity
function setSeizePaused(bool state) public returns (bool)
```

### adminOrInitializing

```solidity
function adminOrInitializing() internal view returns (bool)
```

Checks caller is admin, or this contract is becoming the new implementation
/
    f

### getAllMarkets

```solidity
function getAllMarkets() public view returns (contract BToken[])
```

Return all of the markets

_The automatic getter may be used to access an individual market._

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract BToken[] | The list of market addresses /     f |

### isDeprecated

```solidity
function isDeprecated(contract BToken bToken) public view returns (bool)
```

Returns true if the given bToken market has been deprecated

_All borrows in a deprecated bToken market can be immediately liquidated_

| Name | Type | Description |
| ---- | ---- | ----------- |
| bToken | contract BToken | The market to check if deprecated /     f |

### getBlockNumber

```solidity
function getBlockNumber() public view returns (uint256)
```

