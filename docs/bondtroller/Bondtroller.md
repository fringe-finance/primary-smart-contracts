# Bondtroller

*Bonded*

> Remastered from Compound&#39;s Bondtroller Contract





## Methods

### _borrowGuardianPaused

```solidity
function _borrowGuardianPaused() external view returns (bool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### _mintGuardianPaused

```solidity
function _mintGuardianPaused() external view returns (bool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### accountAssets

```solidity
function accountAssets(address, uint256) external view returns (contract BToken)
```

Per-account mapping of &quot;assets you are in&quot;, capped by maxAssets



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract BToken | undefined |

### accountMembership

```solidity
function accountMembership(address, address) external view returns (bool)
```

Per-market mapping of &quot;accounts in this asset&quot;



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### admin

```solidity
function admin() external view returns (address)
```

Administrator for this contract




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### allMarkets

```solidity
function allMarkets(uint256) external view returns (contract BToken)
```

A list of all markets



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract BToken | undefined |

### borrowAllowed

```solidity
function borrowAllowed(address bToken, address borrower, uint256 borrowAmount) external nonpayable returns (uint256)
```

Checks if the account should be allowed to borrow the underlying asset of the given market



#### Parameters

| Name | Type | Description |
|---|---|---|
| bToken | address | The market to verify the borrow against |
| borrower | address | The account which would borrow the asset |
| borrowAmount | uint256 | The amount of underlying the account would borrow |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | 0 if the borrow is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol) |

### borrowCapGuardian

```solidity
function borrowCapGuardian() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### borrowCaps

```solidity
function borrowCaps(address) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### borrowGuardianPaused

```solidity
function borrowGuardianPaused(address) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### borrowVerify

```solidity
function borrowVerify(address bToken, address borrower, uint256 borrowAmount) external nonpayable
```

Validates borrow and reverts on rejection. May emit logs.



#### Parameters

| Name | Type | Description |
|---|---|---|
| bToken | address | Asset whose underlying is being borrowed |
| borrower | address | The address borrowing the underlying |
| borrowAmount | uint256 | The amount of the underlying asset requested to borrow |

### checkMembership

```solidity
function checkMembership(address account, contract BToken bToken) external view returns (bool)
```

Returns whether the given account is entered in the given asset



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | The address of the account to check |
| bToken | contract BToken | The bToken to check |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | True if the account is in the asset, otherwise false. |

### closeFactorMantissa

```solidity
function closeFactorMantissa() external view returns (uint256)
```

Multiplier used to calculate the maximum repayAmount when liquidating a borrow




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### compAccrued

```solidity
function compAccrued(address) external view returns (uint256)
```

The COMP accrued but not yet transferred to each user



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### compBorrowState

```solidity
function compBorrowState(address) external view returns (uint224 index, uint32 block)
```

The COMP market borrow state for each market



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| index | uint224 | undefined |
| block | uint32 | undefined |

### compBorrowerIndex

```solidity
function compBorrowerIndex(address, address) external view returns (uint256)
```

The COMP borrow index for each market for each borrower as of the last time they accrued COMP



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### compContributorSpeeds

```solidity
function compContributorSpeeds(address) external view returns (uint256)
```

The portion of COMP that each contributor receives per block



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### compRate

```solidity
function compRate() external view returns (uint256)
```

The rate at which the flywheel distributes COMP, per block




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### compSpeeds

```solidity
function compSpeeds(address) external view returns (uint256)
```

The portion of compRate that each market currently receives



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### compSupplierIndex

```solidity
function compSupplierIndex(address, address) external view returns (uint256)
```

The COMP borrow index for each market for each supplier as of the last time they accrued COMP



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### compSupplyState

```solidity
function compSupplyState(address) external view returns (uint224 index, uint32 block)
```

The COMP market supply state for each market



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| index | uint224 | undefined |
| block | uint32 | undefined |

### enterMarket

```solidity
function enterMarket(address bToken, address borrower) external nonpayable returns (enum BondtrollerErrorReporter.Error)
```

Add asset to be included in account liquidity calculation



#### Parameters

| Name | Type | Description |
|---|---|---|
| bToken | address | The address of the bToken markets to be enabled |
| borrower | address | The address of user, which enters to market |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | enum BondtrollerErrorReporter.Error | undefined |

### enterMarkets

```solidity
function enterMarkets(address[] bTokens) external nonpayable returns (uint256[])
```

Add assets to be included in account liquidity calculation



#### Parameters

| Name | Type | Description |
|---|---|---|
| bTokens | address[] | The list of addresses of the bToken markets to be enabled |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256[] | Success indicator for whether each corresponding market was entered |

### exitMarket

```solidity
function exitMarket(address cTokenAddress) external nonpayable returns (uint256)
```

Removes asset from sender&#39;s account liquidity calculation

*Sender must not have an outstanding borrow balance in the asset,  or be providing necessary collateral for an outstanding borrow.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| cTokenAddress | address | The address of the asset to be removed |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Whether or not the account successfully exited the market |

### getAllMarkets

```solidity
function getAllMarkets() external view returns (contract BToken[])
```

Return all of the markets

*The automatic getter may be used to access an individual market.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract BToken[] | The list of market addresses |

### getAssetsIn

```solidity
function getAssetsIn(address account) external view returns (contract BToken[])
```

Returns the assets an account has entered



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | The address of the account to pull assets for |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract BToken[] | A dynamic list with the assets the account has entered |

### getBlockNumber

```solidity
function getBlockNumber() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getPrimaryIndexTokenAddress

```solidity
function getPrimaryIndexTokenAddress() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### init

```solidity
function init() external nonpayable
```






### isBondtroller

```solidity
function isBondtroller() external view returns (bool)
```

watermark that says that this is Bondtroller




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### isDeprecated

```solidity
function isDeprecated(contract BToken bToken) external view returns (bool)
```

Returns true if the given bToken market has been deprecated

*All borrows in a deprecated bToken market can be immediately liquidated*

#### Parameters

| Name | Type | Description |
|---|---|---|
| bToken | contract BToken | The market to check if deprecated |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### lastContributorBlock

```solidity
function lastContributorBlock(address) external view returns (uint256)
```

Last block at which a contributor&#39;s COMP rewards have been allocated



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### liquidationIncentiveMantissa

```solidity
function liquidationIncentiveMantissa() external view returns (uint256)
```

Multiplier representing the discount on collateral that a liquidator receives




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### markets

```solidity
function markets(address) external view returns (bool isListed, uint256 collateralFactorMantissa, bool isComped)
```

Official mapping of BTokens -&gt; Market metadata



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| isListed | bool | undefined |
| collateralFactorMantissa | uint256 | undefined |
| isComped | bool | undefined |

### maxAssets

```solidity
function maxAssets() external view returns (uint256)
```

Max number of assets a single account can participate in (borrow or use as collateral)




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### mintAllowed

```solidity
function mintAllowed(address bToken, address minter, uint256 mintAmount) external view returns (uint256)
```

Checks if the account should be allowed to mint tokens in the given market



#### Parameters

| Name | Type | Description |
|---|---|---|
| bToken | address | The market to verify the mint against |
| minter | address | The account which would get the minted tokens |
| mintAmount | uint256 | The amount of underlying being supplied to the market in exchange for tokens |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | 0 if the mint is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol) |

### mintGuardianPaused

```solidity
function mintGuardianPaused(address) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### mintVerify

```solidity
function mintVerify(address bToken, address minter, uint256 actualMintAmount, uint256 mintTokens) external nonpayable
```

Validates mint and reverts on rejection. May emit logs.



#### Parameters

| Name | Type | Description |
|---|---|---|
| bToken | address | Asset being minted |
| minter | address | The address minting the tokens |
| actualMintAmount | uint256 | The amount of the underlying asset being minted |
| mintTokens | uint256 | The number of tokens being minted |

### oracle

```solidity
function oracle() external view returns (address)
```

Oracle which gives the price of any given asset




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### pauseGuardian

```solidity
function pauseGuardian() external view returns (address)
```

The Pause Guardian can pause certain actions as a safety mechanism.  Actions which allow users to remove their own assets cannot be paused.  Liquidation / seizing / transfer can only be paused globally, not by market.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### primaryIndexToken

```solidity
function primaryIndexToken() external view returns (address)
```

the address of primary index token




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### redeemAllowed

```solidity
function redeemAllowed(address bToken, address redeemer, uint256 redeemTokens) external view returns (uint256)
```

Checks if the account should be allowed to redeem tokens in the given market



#### Parameters

| Name | Type | Description |
|---|---|---|
| bToken | address | The market to verify the redeem against |
| redeemer | address | The account which would redeem the tokens |
| redeemTokens | uint256 | The number of bTokens to exchange for the underlying asset in the market |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | 0 if the redeem is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol) |

### redeemVerify

```solidity
function redeemVerify(address bToken, address redeemer, uint256 redeemAmount, uint256 redeemTokens) external pure
```

Validates redeem and reverts on rejection. May emit logs.



#### Parameters

| Name | Type | Description |
|---|---|---|
| bToken | address | Asset being redeemed |
| redeemer | address | The address redeeming the tokens |
| redeemAmount | uint256 | The amount of the underlying asset being redeemed |
| redeemTokens | uint256 | The number of tokens being redeemed |

### repayBorrowAllowed

```solidity
function repayBorrowAllowed(address bToken, address payer, address borrower, uint256 repayAmount) external view returns (uint256)
```

Checks if the account should be allowed to repay a borrow in the given market



#### Parameters

| Name | Type | Description |
|---|---|---|
| bToken | address | The market to verify the repay against |
| payer | address | The account which would repay the asset |
| borrower | address | The account which would borrowed the asset |
| repayAmount | uint256 | The amount of the underlying asset the account would repay |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | 0 if the repay is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol) |

### repayBorrowVerify

```solidity
function repayBorrowVerify(address bToken, address payer, address borrower, uint256 actualRepayAmount, uint256 borrowerIndex) external nonpayable
```

Validates repayBorrow and reverts on rejection. May emit logs.



#### Parameters

| Name | Type | Description |
|---|---|---|
| bToken | address | Asset being repaid |
| payer | address | The address repaying the borrow |
| borrower | address | The address of the borrower |
| actualRepayAmount | uint256 | The amount of underlying being repaid |
| borrowerIndex | uint256 | undefined |

### seizeGuardianPaused

```solidity
function seizeGuardianPaused() external view returns (bool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### setBorrowCapGuardian

```solidity
function setBorrowCapGuardian(address newBorrowCapGuardian) external nonpayable
```

Admin function to change the Borrow Cap Guardian



#### Parameters

| Name | Type | Description |
|---|---|---|
| newBorrowCapGuardian | address | The address of the new Borrow Cap Guardian |

### setBorrowPaused

```solidity
function setBorrowPaused(contract BToken bToken, bool state) external nonpayable returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| bToken | contract BToken | undefined |
| state | bool | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### setMarketBorrowCaps

```solidity
function setMarketBorrowCaps(contract BToken[] bTokens, uint256[] newBorrowCaps) external nonpayable
```

Set the given borrow caps for the given bToken markets. Borrowing that brings total borrows to or above borrow cap will revert.

*Admin or borrowCapGuardian function to set the borrow caps. A borrow cap of 0 corresponds to unlimited borrowing.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| bTokens | contract BToken[] | The addresses of the markets (tokens) to change the borrow caps for |
| newBorrowCaps | uint256[] | The new borrow cap values in underlying to be set. A value of 0 corresponds to unlimited borrowing. |

### setMintPaused

```solidity
function setMintPaused(contract BToken bToken, bool state) external nonpayable returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| bToken | contract BToken | undefined |
| state | bool | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### setPauseGuardian

```solidity
function setPauseGuardian(address newPauseGuardian) external nonpayable returns (uint256)
```

Admin function to change the Pause Guardian



#### Parameters

| Name | Type | Description |
|---|---|---|
| newPauseGuardian | address | The address of the new Pause Guardian |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint 0=success, otherwise a failure. (See enum Error for details) |

### setPriceOracle

```solidity
function setPriceOracle(address newOracle) external nonpayable returns (uint256)
```

Sets a new price oracle for the bondtroller

*Admin function to set a new price oracle*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOracle | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### setPrimaryIndexTokenAddress

```solidity
function setPrimaryIndexTokenAddress(address _newPrimaryIndexToken) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _newPrimaryIndexToken | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### setSeizePaused

```solidity
function setSeizePaused(bool state) external nonpayable returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| state | bool | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### setTransferPaused

```solidity
function setTransferPaused(bool state) external nonpayable returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| state | bool | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### supportMarket

```solidity
function supportMarket(contract BToken bToken) external nonpayable returns (uint256)
```

Add the market to the markets mapping and set it as listed

*Admin function to set isListed and add support for the market*

#### Parameters

| Name | Type | Description |
|---|---|---|
| bToken | contract BToken | The address of the market (token) to list |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint 0=success, otherwise a failure. (See enum Error for details) |

### transferAllowed

```solidity
function transferAllowed(address bToken, address src, address dst, uint256 transferTokens) external nonpayable returns (uint256)
```

Checks if the account should be allowed to transfer tokens in the given market



#### Parameters

| Name | Type | Description |
|---|---|---|
| bToken | address | The market to verify the transfer against |
| src | address | The account which sources the tokens |
| dst | address | The account which receives the tokens |
| transferTokens | uint256 | The number of bTokens to transfer |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | 0 if the transfer is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol) |

### transferGuardianPaused

```solidity
function transferGuardianPaused() external view returns (bool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### transferVerify

```solidity
function transferVerify(address bToken, address src, address dst, uint256 transferTokens) external nonpayable
```

Validates transfer and reverts on rejection. May emit logs.



#### Parameters

| Name | Type | Description |
|---|---|---|
| bToken | address | Asset being transferred |
| src | address | The account which sources the tokens |
| dst | address | The account which receives the tokens |
| transferTokens | uint256 | The number of bTokens to transfer |



## Events

### ActionPaused

```solidity
event ActionPaused(contract BToken bToken, string action, bool pauseState)
```

Emitted when an action is paused globally



#### Parameters

| Name | Type | Description |
|---|---|---|
| bToken  | contract BToken | undefined |
| action  | string | undefined |
| pauseState  | bool | undefined |

### CompGranted

```solidity
event CompGranted(address recipient, uint256 amount)
```

Emitted when COMP is granted by admin



#### Parameters

| Name | Type | Description |
|---|---|---|
| recipient  | address | undefined |
| amount  | uint256 | undefined |

### Failure

```solidity
event Failure(uint256 error, uint256 info, uint256 detail)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| error  | uint256 | undefined |
| info  | uint256 | undefined |
| detail  | uint256 | undefined |

### MarketEntered

```solidity
event MarketEntered(contract BToken bToken, address account)
```

Emitted when an account enters a market



#### Parameters

| Name | Type | Description |
|---|---|---|
| bToken  | contract BToken | undefined |
| account  | address | undefined |

### MarketExited

```solidity
event MarketExited(contract BToken bToken, address account)
```

Emitted when an account exits a market



#### Parameters

| Name | Type | Description |
|---|---|---|
| bToken  | contract BToken | undefined |
| account  | address | undefined |

### MarketListed

```solidity
event MarketListed(contract BToken bToken)
```

Emitted when an admin supports a market



#### Parameters

| Name | Type | Description |
|---|---|---|
| bToken  | contract BToken | undefined |

### NewBorrowCap

```solidity
event NewBorrowCap(contract BToken indexed bToken, uint256 newBorrowCap)
```

Emitted when borrow cap for a bToken is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| bToken `indexed` | contract BToken | undefined |
| newBorrowCap  | uint256 | undefined |

### NewBorrowCapGuardian

```solidity
event NewBorrowCapGuardian(address oldBorrowCapGuardian, address newBorrowCapGuardian)
```

Emitted when borrow cap guardian is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldBorrowCapGuardian  | address | undefined |
| newBorrowCapGuardian  | address | undefined |

### NewPauseGuardian

```solidity
event NewPauseGuardian(address oldPauseGuardian, address newPauseGuardian)
```

Emitted when pause guardian is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldPauseGuardian  | address | undefined |
| newPauseGuardian  | address | undefined |

### NewPriceOracle

```solidity
event NewPriceOracle(address oldPriceOracle, address newPriceOracle)
```

Emitted when price oracle is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldPriceOracle  | address | undefined |
| newPriceOracle  | address | undefined |

### NewPrimaryIndexToken

```solidity
event NewPrimaryIndexToken(address oldPrimaryIndexToken, address newPrimaryIndexToken)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| oldPrimaryIndexToken  | address | undefined |
| newPrimaryIndexToken  | address | undefined |



