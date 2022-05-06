# Solidity API

## PrimaryIndexToken

### MODERATOR_ROLE

```solidity
bytes32 MODERATOR_ROLE
```

### name

```solidity
string name
```

### symbol

```solidity
string symbol
```

### priceOracle

```solidity
contract IPriceProviderAggregator priceOracle
```

### projectTokens

```solidity
address[] projectTokens
```

### projectTokenInfo

```solidity
mapping(address &#x3D;&gt; struct PrimaryIndexToken.ProjectTokenInfo) projectTokenInfo
```

### lendingTokens

```solidity
address[] lendingTokens
```

### lendingTokenInfo

```solidity
mapping(address &#x3D;&gt; struct PrimaryIndexToken.LendingTokenInfo) lendingTokenInfo
```

### totalDepositedProjectToken

```solidity
mapping(address &#x3D;&gt; uint256) totalDepositedProjectToken
```

### depositPosition

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; struct PrimaryIndexToken.DepositPosition))) depositPosition
```

### borrowPosition

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; struct PrimaryIndexToken.BorrowPosition))) borrowPosition
```

### totalBorrow

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; uint256)) totalBorrow
```

### borrowLimit

```solidity
mapping(address &#x3D;&gt; mapping(address &#x3D;&gt; uint256)) borrowLimit
```

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
  struct PrimaryIndexToken.Ratio loanToValueRatio;
  struct PrimaryIndexToken.Ratio liquidationThresholdFactor;
  struct PrimaryIndexToken.Ratio liquidationIncentive;
}
```

### LendingTokenInfo

```solidity
struct LendingTokenInfo {
  bool isListed;
  bool isPaused;
  contract BLendingToken bLendingToken;
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

### LiquidationIncentiveSet

```solidity
event LiquidationIncentiveSet(address tokenPrj, uint8 ltfNumerator, uint8 ltfDenominator)
```

### Deposit

```solidity
event Deposit(address who, address tokenPrj, address lendingToken, uint256 prjDepositAmount, address beneficiary)
```

### Withdraw

```solidity
event Withdraw(address who, address tokenPrj, address lendingToken, uint256 prjWithdrawAmount, address beneficiary)
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
function initialize() public
```

### onlyAdmin

```solidity
modifier onlyAdmin()
```

### onlyModerator

```solidity
modifier onlyModerator()
```

### isProjectTokenListed

```solidity
modifier isProjectTokenListed(address projectToken)
```

### isLendingTokenListed

```solidity
modifier isLendingTokenListed(address lendingToken)
```

### addProjectToken

```solidity
function addProjectToken(address _projectToken, uint8 _loanToValueRatioNumerator, uint8 _loanToValueRatioDenominator, uint8 _liquidationThresholdFactorNumerator, uint8 _liquidationThresholdFactorDenominator, uint8 _liquidationIncentiveNumerator, uint8 _liquidationIncentiveDenominator) public
```

### removeProjectToken

```solidity
function removeProjectToken(uint256 _projectTokenId) public
```

### addLendingToken

```solidity
function addLendingToken(address _lendingToken, address _bLendingToken, bool _isPaused) public
```

### removeLendingToken

```solidity
function removeLendingToken(uint256 _lendingTokenId) public
```

### setPriceOracle

```solidity
function setPriceOracle(address _priceOracle) public
```

### grandModerator

```solidity
function grandModerator(address newModerator) public
```

### revokeModerator

```solidity
function revokeModerator(address moderator) public
```

### setBorrowLimit

```solidity
function setBorrowLimit(address projectToken, address lendingToken, uint256 _borrowLimit) public
```

### setProjectTokenInfo

```solidity
function setProjectTokenInfo(address _projectToken, uint8 _loanToValueRatioNumerator, uint8 _loanToValueRatioDenominator, uint8 _liquidationThresholdFactorNumerator, uint8 _liquidationThresholdFactorDenominator, uint8 _liquidationIncentiveNumerator, uint8 _liquidationIncentiveDenominator) public
```

### setPausedProjectToken

```solidity
function setPausedProjectToken(address _projectToken, bool _isDepositPaused, bool _isWithdrawPaused) public
```

### setLendingTokenInfo

```solidity
function setLendingTokenInfo(address _lendingToken, address _bLendingToken, bool _isPaused) public
```

### setPausedLendingToken

```solidity
function setPausedLendingToken(address _lendingToken, bool _isPaused) public
```

### deposit

```solidity
function deposit(address projectToken, address lendingToken, uint256 projectTokenAmount) public
```

### withdraw

```solidity
function withdraw(address projectToken, address lendingToken, uint256 projectTokenAmount) public
```

### supply

```solidity
function supply(address lendingToken, uint256 lendingTokenAmount) public
```

### redeem

```solidity
function redeem(address lendingToken, uint256 bLendingTokenAmount) public
```

### redeemUnderlying

```solidity
function redeemUnderlying(address lendingToken, uint256 lendingTokenAmount) public
```

### borrow

```solidity
function borrow(address projectToken, address lendingToken, uint256 lendingTokenAmount) public
```

### repay

```solidity
function repay(address projectToken, address lendingToken, uint256 lendingTokenAmount) public returns (uint256)
```

### repayInternal

```solidity
function repayInternal(address repairer, address borrower, address projectToken, address lendingToken, uint256 lendingTokenAmount) internal returns (uint256)
```

### liquidate

```solidity
function liquidate(address account, address projectToken, address lendingToken) public
```

### updateInterestInBorrowPositions

```solidity
function updateInterestInBorrowPositions(address account, address lendingToken) public
```

### pit

```solidity
function pit(address account, address projectToken, address lendingToken) public view returns (uint256)
```

### pitRemaining

```solidity
function pitRemaining(address account, address projectToken, address lendingToken) public view returns (uint256)
```

### liquidationThreshold

```solidity
function liquidationThreshold(address account, address projectToken, address lendingToken) public view returns (uint256)
```

### totalOutstanding

```solidity
function totalOutstanding(address account, address projectToken, address lendingToken) public view returns (uint256)
```

### healthFactor

```solidity
function healthFactor(address account, address projectToken, address lendingToken) public view returns (uint256 numerator, uint256 denominator)
```

### getProjectTokenEvaluation

```solidity
function getProjectTokenEvaluation(address projectToken, uint256 projectTokenAmount) public view returns (uint256)
```

### lendingTokensLength

```solidity
function lendingTokensLength() public view returns (uint256)
```

### projectTokensLength

```solidity
function projectTokensLength() public view returns (uint256)
```

### getPosition

```solidity
function getPosition(address account, address projectToken, address lendingToken) public view returns (uint256 depositedProjectTokenAmount, uint256 loanBody, uint256 accrual, uint256 healthFactorNumerator, uint256 healthFactorDenominator)
```

### decimals

```solidity
function decimals() public pure returns (uint8)
```

