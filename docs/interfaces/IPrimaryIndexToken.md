# IPrimaryIndexToken









## Methods

### MODERATOR_ROLE

```solidity
function MODERATOR_ROLE() external view returns (bytes32)
```



*return keccak(&quot;MODERATOR_ROLE&quot;)*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### addLendingToken

```solidity
function addLendingToken(address _lendingToken, address _bLendingToken, bool _isPaused) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _lendingToken | address | undefined |
| _bLendingToken | address | undefined |
| _isPaused | bool | undefined |

### addProjectToken

```solidity
function addProjectToken(address _projectToken, uint8 _loanToValueRatioNumerator, uint8 _loanToValueRatioDenominator, uint8 _liquidationTresholdFactorNumerator, uint8 _liquidationTresholdFactorDenominator, uint8 _liquidationIncentiveNumerator, uint8 _liquidationIncentiveDenominator) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _projectToken | address | undefined |
| _loanToValueRatioNumerator | uint8 | undefined |
| _loanToValueRatioDenominator | uint8 | undefined |
| _liquidationTresholdFactorNumerator | uint8 | undefined |
| _liquidationTresholdFactorDenominator | uint8 | undefined |
| _liquidationIncentiveNumerator | uint8 | undefined |
| _liquidationIncentiveDenominator | uint8 | undefined |

### borrow

```solidity
function borrow(address projectToken, address lendingToken, uint256 lendingTokenAmount) external nonpayable
```



*borrow lending token*

#### Parameters

| Name | Type | Description |
|---|---|---|
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |
| lendingTokenAmount | uint256 | - amount of lending token |

### borrowLimit

```solidity
function borrowLimit(address projectToken, address lendingToken) external view returns (uint256)
```



*return borrow limit amount of `lendingToken` by `projectToken`*

#### Parameters

| Name | Type | Description |
|---|---|---|
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### borrowPosition

```solidity
function borrowPosition(address account, address projectToken, address lendingToken) external view returns (struct IPrimaryIndexToken.BorrowPosition)
```



*return borrow position struct*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | - address of borrower |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | IPrimaryIndexToken.BorrowPosition | undefined |

### decimals

```solidity
function decimals() external view returns (uint8)
```



*return decimals of PrimaryIndexToken*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint8 | undefined |

### deposit

```solidity
function deposit(address projectToken, address lendingToken, uint256 projectTokenAmount) external nonpayable
```



*deposit project token to PrimaryIndexToken*

#### Parameters

| Name | Type | Description |
|---|---|---|
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |
| projectTokenAmount | uint256 | - amount of project token to deposit |

### depositPosition

```solidity
function depositPosition(address account, address projectToken, address lendingToken) external view returns (struct IPrimaryIndexToken.DepositPosition)
```



*return deposit position struct*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | - address of depositor |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | IPrimaryIndexToken.DepositPosition | undefined |

### getPosition

```solidity
function getPosition(address account, address projectToken, address lendingToken) external view returns (uint256 depositedProjectTokenAmount, uint256 loanBody, uint256 accrual, uint256 healthFactorNumerator, uint256 healthFactorDenominator)
```



*return deposit position and borrow position and instant health factor*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | - address of borrower |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

#### Returns

| Name | Type | Description |
|---|---|---|
| depositedProjectTokenAmount | uint256 | undefined |
| loanBody | uint256 | undefined |
| accrual | uint256 | undefined |
| healthFactorNumerator | uint256 | undefined |
| healthFactorDenominator | uint256 | undefined |

### getProjectTokenEvaluation

```solidity
function getProjectTokenEvaluation(address projectToken, uint256 projectTokenAmount) external view returns (uint256)
```



*return evaluation in USD of `projectTokenAmount`*

#### Parameters

| Name | Type | Description |
|---|---|---|
| projectToken | address | - address of project token |
| projectTokenAmount | uint256 | - amount of project token |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### grandModerator

```solidity
function grandModerator(address newModerator) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| newModerator | address | undefined |

### healthFactor

```solidity
function healthFactor(address account, address projectToken, address lendingToken) external view returns (uint256 numerator, uint256 denominator)
```



*return health factor of borrow position*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | - address of borrower |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

#### Returns

| Name | Type | Description |
|---|---|---|
| numerator | uint256 | undefined |
| denominator | uint256 | undefined |

### initialize

```solidity
function initialize() external nonpayable
```






### lendingTokenInfo

```solidity
function lendingTokenInfo(address lendingToken) external view returns (struct IPrimaryIndexToken.LendingTokenInfo)
```



*return info of lending token, that declared in struct LendingTokenInfo*

#### Parameters

| Name | Type | Description |
|---|---|---|
| lendingToken | address | - address of lending token in array `lendingTokens`. Numetates from 0 to array length - 1 |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | IPrimaryIndexToken.LendingTokenInfo | undefined |

### lendingTokens

```solidity
function lendingTokens(uint256 lendingTokenId) external view returns (address)
```



*return address lending token in array `lendingTokens`*

#### Parameters

| Name | Type | Description |
|---|---|---|
| lendingTokenId | uint256 | - index of lending token in array `lendingTokens`. Numetates from 0 to array length - 1 |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### lendingTokensLength

```solidity
function lendingTokensLength() external view returns (uint256)
```



*return length of array `lendingTokens`*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### liquidate

```solidity
function liquidate(address account, address projectToken, address lendingToken) external nonpayable
```



*liquidate borrow*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | - address of borrower |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

### liquidationThreshold

```solidity
function liquidationThreshold(address account, address projectToken, address lendingToken) external view returns (uint256)
```



*return liquidationThreshold of borrow position*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | - address of borrower |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### pit

```solidity
function pit(address account, address projectToken, address lendingToken) external view returns (uint256)
```



*return pit amount of borrow position*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | - address of borrower |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### pitRemaining

```solidity
function pitRemaining(address account, address projectToken, address lendingToken) external view returns (uint256)
```



*return pit remaining amount of borrow position*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | - address of borrower |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### priceOracle

```solidity
function priceOracle() external view returns (address)
```



*return address of price oracle with interface of PriceProviderAggregator*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### projectTokenInfo

```solidity
function projectTokenInfo(address projectToken) external view returns (struct IPrimaryIndexToken.ProjectTokenInfo)
```



*return info of project token, that declared in struct ProjectTokenInfo*

#### Parameters

| Name | Type | Description |
|---|---|---|
| projectToken | address | - address of project token in array `projectTokens`. Numetates from 0 to array length - 1 |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | IPrimaryIndexToken.ProjectTokenInfo | undefined |

### projectTokens

```solidity
function projectTokens(uint256 projectTokenId) external view returns (address)
```



*return address project token in array `projectTokens`*

#### Parameters

| Name | Type | Description |
|---|---|---|
| projectTokenId | uint256 | - index of project token in array `projectTokens`. Numetates from 0 to array length - 1 |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### projectTokensLength

```solidity
function projectTokensLength() external view returns (uint256)
```



*return length of array `projectTokens`*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### redeem

```solidity
function redeem(address lendingToken, uint256 bLendingTokenAmount) external nonpayable
```



*redeem lending token*

#### Parameters

| Name | Type | Description |
|---|---|---|
| lendingToken | address | - address of lending token |
| bLendingTokenAmount | uint256 | - amount of fLending token to redeem |

### redeemUnderlying

```solidity
function redeemUnderlying(address lendingToken, uint256 lendingTokenAmount) external nonpayable
```



*redeem underlying lending token*

#### Parameters

| Name | Type | Description |
|---|---|---|
| lendingToken | address | - address of lending token |
| lendingTokenAmount | uint256 | - amount of lending token to redeem |

### removeLendingToken

```solidity
function removeLendingToken(uint256 _lendingTokenId) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _lendingTokenId | uint256 | undefined |

### removeProjectToken

```solidity
function removeProjectToken(uint256 _projectTokenId) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _projectTokenId | uint256 | undefined |

### repay

```solidity
function repay(address projectToken, address lendingToken, uint256 lendingTokenAmount) external nonpayable
```



*repay lending token*

#### Parameters

| Name | Type | Description |
|---|---|---|
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |
| lendingTokenAmount | uint256 | - amount of lending token |

### revokeModerator

```solidity
function revokeModerator(address moderator) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| moderator | address | undefined |

### setBorrowLimit

```solidity
function setBorrowLimit(address projectToken, address lendingToken, uint256 _borrowLimit) external nonpayable
```



*sets borrow limit*

#### Parameters

| Name | Type | Description |
|---|---|---|
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |
| _borrowLimit | uint256 | - limit amount of lending token |

### setLendingTokenInfo

```solidity
function setLendingTokenInfo(address _lendingToken, address _bLendingToken, bool _isPaused) external nonpayable
```



*sets pause of project token*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _lendingToken | address | - address of lending token |
| _bLendingToken | address | - address of bLendingToken |
| _isPaused | bool | - true - if pause, false - if unpause |

### setPausedLendingToken

```solidity
function setPausedLendingToken(address _lendingToken, bool _isPaused) external nonpayable
```



*sets pause of lending token*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _lendingToken | address | - address of lending token |
| _isPaused | bool | - true - if pause, false - if unpause |

### setPausedProjectToken

```solidity
function setPausedProjectToken(address _projectToken, bool _isDepositPaused, bool _isWithdrawPaused) external nonpayable
```



*sets pause of project token*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _projectToken | address | - address of project token |
| _isDepositPaused | bool | - true - if pause, false - if unpause |
| _isWithdrawPaused | bool | - true - if pause, false - if unpause |

### setPriceOracle

```solidity
function setPriceOracle(address _priceOracle) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _priceOracle | address | undefined |

### setProjectTokenInfo

```solidity
function setProjectTokenInfo(address _projectToken, uint8 _loanToValueRatioNumerator, uint8 _loanToValueRatioDenominator, uint8 _liquidationTresholdFactorNumerator, uint8 _liquidationTresholdFactorDenominator, uint8 _liquidationIncentiveNumerator, uint8 _liquidationIncentiveDenominator) external nonpayable
```



*sets project token info*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _projectToken | address | - address of project token |
| _loanToValueRatioNumerator | uint8 | - numerator of loan to value ratio |
| _loanToValueRatioDenominator | uint8 | - denominator of loan to value ratio |
| _liquidationTresholdFactorNumerator | uint8 | - numerator of liquidation treshold factor |
| _liquidationTresholdFactorDenominator | uint8 | - denominator of liquidation treshold factor |
| _liquidationIncentiveNumerator | uint8 | - numerator of liquidation incentive |
| _liquidationIncentiveDenominator | uint8 | - denominator of liquidation incentive |

### supply

```solidity
function supply(address lendingToken, uint256 lendingTokenAmount) external nonpayable
```



*supply lending token*

#### Parameters

| Name | Type | Description |
|---|---|---|
| lendingToken | address | - address of lending token |
| lendingTokenAmount | uint256 | - amount of lending token to supply |

### totalBorrow

```solidity
function totalBorrow(address projectToken, address lendingToken) external view returns (uint256)
```



*return total borrow amount of `lendingToken` by `projectToken`*

#### Parameters

| Name | Type | Description |
|---|---|---|
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### totalDepositedProjectToken

```solidity
function totalDepositedProjectToken(address projectToken) external view returns (uint256)
```



*return total amount of deposited project token*

#### Parameters

| Name | Type | Description |
|---|---|---|
| projectToken | address | - address of project token in array `projectTokens`. Numetates from 0 to array length - 1 |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### totalOutstanding

```solidity
function totalOutstanding(address account, address projectToken, address lendingToken) external view returns (uint256)
```



*return total outstanding of borrow position*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | - address of borrower |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### updateInterestInBorrowPosition

```solidity
function updateInterestInBorrowPosition(address account, address projectToken, address lendingToken) external nonpayable
```



*update borrow position*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | - address of borrower |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

### withdraw

```solidity
function withdraw(address projectToken, address lendingToken, uint256 projectTokenAmount) external nonpayable
```



*withdraw project token from PrimaryIndexToken*

#### Parameters

| Name | Type | Description |
|---|---|---|
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |
| projectTokenAmount | uint256 | - amount of project token to deposit |



## Events

### AddPrjToken

```solidity
event AddPrjToken(address indexed tokenPrj)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| tokenPrj `indexed` | address | undefined |

### Borrow

```solidity
event Borrow(address indexed who, address indexed borrowToken, uint256 borrowAmount, address indexed prjAddress, uint256 prjAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| who `indexed` | address | undefined |
| borrowToken `indexed` | address | undefined |
| borrowAmount  | uint256 | undefined |
| prjAddress `indexed` | address | undefined |
| prjAmount  | uint256 | undefined |

### Deposit

```solidity
event Deposit(address indexed who, address indexed tokenPrj, uint256 prjDepositAmount, address indexed beneficiar)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| who `indexed` | address | undefined |
| tokenPrj `indexed` | address | undefined |
| prjDepositAmount  | uint256 | undefined |
| beneficiar `indexed` | address | undefined |

### Liquidate

```solidity
event Liquidate(address indexed liquidator, address indexed borrower, address lendingToken, address indexed prjAddress, uint256 amountPrjLiquidated)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| liquidator `indexed` | address | undefined |
| borrower `indexed` | address | undefined |
| lendingToken  | address | undefined |
| prjAddress `indexed` | address | undefined |
| amountPrjLiquidated  | uint256 | undefined |

### LiquidationThresholdFactorSet

```solidity
event LiquidationThresholdFactorSet(address indexed tokenPrj, uint8 ltfNumerator, uint8 ltfDenominator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| tokenPrj `indexed` | address | undefined |
| ltfNumerator  | uint8 | undefined |
| ltfDenominator  | uint8 | undefined |

### LoanToValueRatioSet

```solidity
event LoanToValueRatioSet(address indexed tokenPrj, uint8 lvrNumerator, uint8 lvrDenominator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| tokenPrj `indexed` | address | undefined |
| lvrNumerator  | uint8 | undefined |
| lvrDenominator  | uint8 | undefined |

### Redeem

```solidity
event Redeem(address indexed who, address indexed redeemToken, address indexed redeemBToken, uint256 redeemAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| who `indexed` | address | undefined |
| redeemToken `indexed` | address | undefined |
| redeemBToken `indexed` | address | undefined |
| redeemAmount  | uint256 | undefined |

### RedeemUnderlying

```solidity
event RedeemUnderlying(address indexed who, address indexed redeemToken, address indexed redeemBToken, uint256 redeemAmountUnderlying)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| who `indexed` | address | undefined |
| redeemToken `indexed` | address | undefined |
| redeemBToken `indexed` | address | undefined |
| redeemAmountUnderlying  | uint256 | undefined |

### RepayBorrow

```solidity
event RepayBorrow(address indexed who, address indexed borrowToken, uint256 borrowAmount, address indexed prjAddress, bool isPositionFullyRepaid)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| who `indexed` | address | undefined |
| borrowToken `indexed` | address | undefined |
| borrowAmount  | uint256 | undefined |
| prjAddress `indexed` | address | undefined |
| isPositionFullyRepaid  | bool | undefined |

### Supply

```solidity
event Supply(address indexed who, address indexed supplyToken, uint256 supplyAmount, address indexed supplyBToken, uint256 amountSupplyBTokenReceived)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| who `indexed` | address | undefined |
| supplyToken `indexed` | address | undefined |
| supplyAmount  | uint256 | undefined |
| supplyBToken `indexed` | address | undefined |
| amountSupplyBTokenReceived  | uint256 | undefined |

### Withdraw

```solidity
event Withdraw(address indexed who, address indexed tokenPrj, uint256 prjWithdrawAmount, address indexed beneficiar)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| who `indexed` | address | undefined |
| tokenPrj `indexed` | address | undefined |
| prjWithdrawAmount  | uint256 | undefined |
| beneficiar `indexed` | address | undefined |



