# Solidity API

## IPrimaryIndexToken

### MODERATOR_ROLE

```solidity
function MODERATOR_ROLE() external view returns (bytes32)
```

_return keccak(&quot;MODERATOR_ROLE&quot;)_

### priceOracle

```solidity
function priceOracle() external view returns (address)
```

_return address of price oracle with interface of PriceProviderAggregator_

### projectTokens

```solidity
function projectTokens(uint256 projectTokenId) external view returns (address)
```

_return address project token in array &#x60;projectTokens&#x60;_

| Name | Type | Description |
| ---- | ---- | ----------- |
| projectTokenId | uint256 | - index of project token in array &#x60;projectTokens&#x60;. Numetates from 0 to array length - 1 |

### projectTokenInfo

```solidity
function projectTokenInfo(address projectToken) external view returns (struct IPrimaryIndexToken.ProjectTokenInfo)
```

_return info of project token, that declared in struct ProjectTokenInfo_

| Name | Type | Description |
| ---- | ---- | ----------- |
| projectToken | address | - address of project token in array &#x60;projectTokens&#x60;. Numetates from 0 to array length - 1 |

### lendingTokens

```solidity
function lendingTokens(uint256 lendingTokenId) external view returns (address)
```

_return address lending token in array &#x60;lendingTokens&#x60;_

| Name | Type | Description |
| ---- | ---- | ----------- |
| lendingTokenId | uint256 | - index of lending token in array &#x60;lendingTokens&#x60;. Numetates from 0 to array length - 1 |

### lendingTokenInfo

```solidity
function lendingTokenInfo(address lendingToken) external view returns (struct IPrimaryIndexToken.LendingTokenInfo)
```

_return info of lending token, that declared in struct LendingTokenInfo_

| Name | Type | Description |
| ---- | ---- | ----------- |
| lendingToken | address | - address of lending token in array &#x60;lendingTokens&#x60;. Numetates from 0 to array length - 1 |

### totalDepositedProjectToken

```solidity
function totalDepositedProjectToken(address projectToken) external view returns (uint256)
```

_return total amount of deposited project token_

| Name | Type | Description |
| ---- | ---- | ----------- |
| projectToken | address | - address of project token in array &#x60;projectTokens&#x60;. Numetates from 0 to array length - 1 |

### depositPosition

```solidity
function depositPosition(address account, address projectToken, address lendingToken) external view returns (struct IPrimaryIndexToken.DepositPosition)
```

_return deposit position struct_

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | - address of depositor |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

### borrowPosition

```solidity
function borrowPosition(address account, address projectToken, address lendingToken) external view returns (struct IPrimaryIndexToken.BorrowPosition)
```

_return borrow position struct_

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | - address of borrower |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

### totalBorrow

```solidity
function totalBorrow(address projectToken, address lendingToken) external view returns (uint256)
```

_return total borrow amount of &#x60;lendingToken&#x60; by &#x60;projectToken&#x60;_

| Name | Type | Description |
| ---- | ---- | ----------- |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

### borrowLimit

```solidity
function borrowLimit(address projectToken, address lendingToken) external view returns (uint256)
```

_return borrow limit amount of &#x60;lendingToken&#x60; by &#x60;projectToken&#x60;_

| Name | Type | Description |
| ---- | ---- | ----------- |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

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
  struct IPrimaryIndexToken.Ratio loanToValueRatio;
  struct IPrimaryIndexToken.Ratio liquidationThresholdFactor;
  struct IPrimaryIndexToken.Ratio liquidationIncentive;
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

### AddPrjToken

```solidity
event AddPrjToken(address tokenPrj)
```

### LoanToValueRatioSet

```solidity
event LoanToValueRatioSet(address tokenPrj, uint8 lvrNumerator, uint8 lvrDenominator)
```

### LiquidationThresholdFactorSet

```solidity
event LiquidationThresholdFactorSet(address tokenPrj, uint8 ltfNumerator, uint8 ltfDenominator)
```

### Deposit

```solidity
event Deposit(address who, address tokenPrj, uint256 prjDepositAmount, address beneficiar)
```

### Withdraw

```solidity
event Withdraw(address who, address tokenPrj, uint256 prjWithdrawAmount, address beneficiar)
```

### Supply

```solidity
event Supply(address who, address supplyToken, uint256 supplyAmount, address supplyBToken, uint256 amountSupplyBTokenReceived)
```

### Redeem

```solidity
event Redeem(address who, address redeemToken, address redeemBToken, uint256 redeemAmount)
```

### RedeemUnderlying

```solidity
event RedeemUnderlying(address who, address redeemToken, address redeemBToken, uint256 redeemAmountUnderlying)
```

### Borrow

```solidity
event Borrow(address who, address borrowToken, uint256 borrowAmount, address prjAddress, uint256 prjAmount)
```

### RepayBorrow

```solidity
event RepayBorrow(address who, address borrowToken, uint256 borrowAmount, address prjAddress, bool isPositionFullyRepaid)
```

### Liquidate

```solidity
event Liquidate(address liquidator, address borrower, address lendingToken, address prjAddress, uint256 amountPrjLiquidated)
```

### initialize

```solidity
function initialize() external
```

### addProjectToken

```solidity
function addProjectToken(address _projectToken, uint8 _loanToValueRatioNumerator, uint8 _loanToValueRatioDenominator, uint8 _liquidationTresholdFactorNumerator, uint8 _liquidationTresholdFactorDenominator, uint8 _liquidationIncentiveNumerator, uint8 _liquidationIncentiveDenominator) external
```

### removeProjectToken

```solidity
function removeProjectToken(uint256 _projectTokenId) external
```

### addLendingToken

```solidity
function addLendingToken(address _lendingToken, address _bLendingToken, bool _isPaused) external
```

### removeLendingToken

```solidity
function removeLendingToken(uint256 _lendingTokenId) external
```

### setPriceOracle

```solidity
function setPriceOracle(address _priceOracle) external
```

### grandModerator

```solidity
function grandModerator(address newModerator) external
```

### revokeModerator

```solidity
function revokeModerator(address moderator) external
```

### setBorrowLimit

```solidity
function setBorrowLimit(address projectToken, address lendingToken, uint256 _borrowLimit) external
```

_sets borrow limit_

| Name | Type | Description |
| ---- | ---- | ----------- |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |
| _borrowLimit | uint256 | - limit amount of lending token |

### setProjectTokenInfo

```solidity
function setProjectTokenInfo(address _projectToken, uint8 _loanToValueRatioNumerator, uint8 _loanToValueRatioDenominator, uint8 _liquidationTresholdFactorNumerator, uint8 _liquidationTresholdFactorDenominator, uint8 _liquidationIncentiveNumerator, uint8 _liquidationIncentiveDenominator) external
```

_sets project token info_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _projectToken | address | - address of project token |
| _loanToValueRatioNumerator | uint8 | - numerator of loan to value ratio |
| _loanToValueRatioDenominator | uint8 | - denominator of loan to value ratio |
| _liquidationTresholdFactorNumerator | uint8 | - numerator of liquidation treshold factor |
| _liquidationTresholdFactorDenominator | uint8 | - denominator of liquidation treshold factor |
| _liquidationIncentiveNumerator | uint8 | - numerator of liquidation incentive |
| _liquidationIncentiveDenominator | uint8 | - denominator of liquidation incentive |

### setPausedProjectToken

```solidity
function setPausedProjectToken(address _projectToken, bool _isDepositPaused, bool _isWithdrawPaused) external
```

_sets pause of project token_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _projectToken | address | - address of project token |
| _isDepositPaused | bool | - true - if pause, false - if unpause |
| _isWithdrawPaused | bool | - true - if pause, false - if unpause |

### setLendingTokenInfo

```solidity
function setLendingTokenInfo(address _lendingToken, address _bLendingToken, bool _isPaused) external
```

_sets pause of project token_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _lendingToken | address | - address of lending token |
| _bLendingToken | address | - address of bLendingToken |
| _isPaused | bool | - true - if pause, false - if unpause |

### setPausedLendingToken

```solidity
function setPausedLendingToken(address _lendingToken, bool _isPaused) external
```

_sets pause of lending token_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _lendingToken | address | - address of lending token |
| _isPaused | bool | - true - if pause, false - if unpause |

### deposit

```solidity
function deposit(address projectToken, address lendingToken, uint256 projectTokenAmount) external
```

_deposit project token to PrimaryIndexToken_

| Name | Type | Description |
| ---- | ---- | ----------- |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |
| projectTokenAmount | uint256 | - amount of project token to deposit |

### withdraw

```solidity
function withdraw(address projectToken, address lendingToken, uint256 projectTokenAmount) external
```

_withdraw project token from PrimaryIndexToken_

| Name | Type | Description |
| ---- | ---- | ----------- |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |
| projectTokenAmount | uint256 | - amount of project token to deposit |

### supply

```solidity
function supply(address lendingToken, uint256 lendingTokenAmount) external
```

_supply lending token_

| Name | Type | Description |
| ---- | ---- | ----------- |
| lendingToken | address | - address of lending token |
| lendingTokenAmount | uint256 | - amount of lending token to supply |

### redeem

```solidity
function redeem(address lendingToken, uint256 bLendingTokenAmount) external
```

_redeem lending token_

| Name | Type | Description |
| ---- | ---- | ----------- |
| lendingToken | address | - address of lending token |
| bLendingTokenAmount | uint256 | - amount of fLending token to redeem |

### redeemUnderlying

```solidity
function redeemUnderlying(address lendingToken, uint256 lendingTokenAmount) external
```

_redeem underlying lending token_

| Name | Type | Description |
| ---- | ---- | ----------- |
| lendingToken | address | - address of lending token |
| lendingTokenAmount | uint256 | - amount of lending token to redeem |

### borrow

```solidity
function borrow(address projectToken, address lendingToken, uint256 lendingTokenAmount) external
```

_borrow lending token_

| Name | Type | Description |
| ---- | ---- | ----------- |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |
| lendingTokenAmount | uint256 | - amount of lending token |

### repay

```solidity
function repay(address projectToken, address lendingToken, uint256 lendingTokenAmount) external
```

_repay lending token_

| Name | Type | Description |
| ---- | ---- | ----------- |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |
| lendingTokenAmount | uint256 | - amount of lending token |

### liquidate

```solidity
function liquidate(address account, address projectToken, address lendingToken) external
```

_liquidate borrow_

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | - address of borrower |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

### updateInterestInBorrowPosition

```solidity
function updateInterestInBorrowPosition(address account, address projectToken, address lendingToken) external
```

_update borrow position_

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | - address of borrower |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

### pit

```solidity
function pit(address account, address projectToken, address lendingToken) external view returns (uint256)
```

_return pit amount of borrow position_

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | - address of borrower |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

### pitRemaining

```solidity
function pitRemaining(address account, address projectToken, address lendingToken) external view returns (uint256)
```

_return pit remaining amount of borrow position_

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | - address of borrower |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

### liquidationThreshold

```solidity
function liquidationThreshold(address account, address projectToken, address lendingToken) external view returns (uint256)
```

_return liquidationThreshold of borrow position_

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | - address of borrower |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

### totalOutstanding

```solidity
function totalOutstanding(address account, address projectToken, address lendingToken) external view returns (uint256)
```

_return total outstanding of borrow position_

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | - address of borrower |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

### healthFactor

```solidity
function healthFactor(address account, address projectToken, address lendingToken) external view returns (uint256 numerator, uint256 denominator)
```

_return health factor of borrow position_

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | - address of borrower |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

### getProjectTokenEvaluation

```solidity
function getProjectTokenEvaluation(address projectToken, uint256 projectTokenAmount) external view returns (uint256)
```

_return evaluation in USD of &#x60;projectTokenAmount&#x60;_

| Name | Type | Description |
| ---- | ---- | ----------- |
| projectToken | address | - address of project token |
| projectTokenAmount | uint256 | - amount of project token |

### lendingTokensLength

```solidity
function lendingTokensLength() external view returns (uint256)
```

_return length of array &#x60;lendingTokens&#x60;_

### projectTokensLength

```solidity
function projectTokensLength() external view returns (uint256)
```

_return length of array &#x60;projectTokens&#x60;_

### getPosition

```solidity
function getPosition(address account, address projectToken, address lendingToken) external view returns (uint256 depositedProjectTokenAmount, uint256 loanBody, uint256 accrual, uint256 healthFactorNumerator, uint256 healthFactorDenominator)
```

_return deposit position and borrow position and instant health factor_

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | - address of borrower |
| projectToken | address | - address of project token |
| lendingToken | address | - address of lending token |

### decimals

```solidity
function decimals() external view returns (uint8)
```

_return decimals of PrimaryIndexToken_

