# PrimaryIndexToken









## Methods

### DEFAULT_ADMIN_ROLE

```solidity
function DEFAULT_ADMIN_ROLE() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### MODERATOR_ROLE

```solidity
function MODERATOR_ROLE() external view returns (bytes32)
```






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
function addProjectToken(address _projectToken, uint8 _loanToValueRatioNumerator, uint8 _loanToValueRatioDenominator, uint8 _liquidationThresholdFactorNumerator, uint8 _liquidationThresholdFactorDenominator, uint8 _liquidationIncentiveNumerator, uint8 _liquidationIncentiveDenominator) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _projectToken | address | undefined |
| _loanToValueRatioNumerator | uint8 | undefined |
| _loanToValueRatioDenominator | uint8 | undefined |
| _liquidationThresholdFactorNumerator | uint8 | undefined |
| _liquidationThresholdFactorDenominator | uint8 | undefined |
| _liquidationIncentiveNumerator | uint8 | undefined |
| _liquidationIncentiveDenominator | uint8 | undefined |

### borrow

```solidity
function borrow(address projectToken, address lendingToken, uint256 lendingTokenAmount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| projectToken | address | undefined |
| lendingToken | address | undefined |
| lendingTokenAmount | uint256 | undefined |

### borrowLimit

```solidity
function borrowLimit(address, address) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### borrowPosition

```solidity
function borrowPosition(address, address, address) external view returns (uint256 loanBody, uint256 accrual)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | address | undefined |
| _2 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| loanBody | uint256 | undefined |
| accrual | uint256 | undefined |

### decimals

```solidity
function decimals() external pure returns (uint8)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint8 | undefined |

### deposit

```solidity
function deposit(address projectToken, address lendingToken, uint256 projectTokenAmount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| projectToken | address | undefined |
| lendingToken | address | undefined |
| projectTokenAmount | uint256 | undefined |

### depositPosition

```solidity
function depositPosition(address, address, address) external view returns (uint256 depositedProjectTokenAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | address | undefined |
| _2 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| depositedProjectTokenAmount | uint256 | undefined |

### getPosition

```solidity
function getPosition(address account, address projectToken, address lendingToken) external view returns (uint256 depositedProjectTokenAmount, uint256 loanBody, uint256 accrual, uint256 healthFactorNumerator, uint256 healthFactorDenominator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |
| projectToken | address | undefined |
| lendingToken | address | undefined |

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





#### Parameters

| Name | Type | Description |
|---|---|---|
| projectToken | address | undefined |
| projectTokenAmount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getRoleAdmin

```solidity
function getRoleAdmin(bytes32 role) external view returns (bytes32)
```



*Returns the admin role that controls `role`. See {grantRole} and {revokeRole}. To change a role&#39;s admin, use {_setRoleAdmin}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### grandModerator

```solidity
function grandModerator(address newModerator) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| newModerator | address | undefined |

### grantRole

```solidity
function grantRole(bytes32 role, address account) external nonpayable
```



*Grants `role` to `account`. If `account` had not been already granted `role`, emits a {RoleGranted} event. Requirements: - the caller must have ``role``&#39;s admin role.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### hasRole

```solidity
function hasRole(bytes32 role, address account) external view returns (bool)
```



*Returns `true` if `account` has been granted `role`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### healthFactor

```solidity
function healthFactor(address account, address projectToken, address lendingToken) external view returns (uint256 numerator, uint256 denominator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |
| projectToken | address | undefined |
| lendingToken | address | undefined |

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
function lendingTokenInfo(address) external view returns (bool isListed, bool isPaused, contract BLendingToken bLendingToken)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| isListed | bool | undefined |
| isPaused | bool | undefined |
| bLendingToken | contract BLendingToken | undefined |

### lendingTokens

```solidity
function lendingTokens(uint256) external view returns (address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### lendingTokensLength

```solidity
function lendingTokensLength() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### liquidate

```solidity
function liquidate(address account, address projectToken, address lendingToken) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |
| projectToken | address | undefined |
| lendingToken | address | undefined |

### liquidationThreshold

```solidity
function liquidationThreshold(address account, address projectToken, address lendingToken) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |
| projectToken | address | undefined |
| lendingToken | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### name

```solidity
function name() external view returns (string)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### pit

```solidity
function pit(address account, address projectToken, address lendingToken) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |
| projectToken | address | undefined |
| lendingToken | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### pitRemaining

```solidity
function pitRemaining(address account, address projectToken, address lendingToken) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |
| projectToken | address | undefined |
| lendingToken | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### priceOracle

```solidity
function priceOracle() external view returns (contract IPriceProviderAggregator)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IPriceProviderAggregator | undefined |

### projectTokenInfo

```solidity
function projectTokenInfo(address) external view returns (bool isListed, bool isDepositPaused, bool isWithdrawPaused, struct PrimaryIndexToken.Ratio loanToValueRatio, struct PrimaryIndexToken.Ratio liquidationThresholdFactor, struct PrimaryIndexToken.Ratio liquidationIncentive)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| isListed | bool | undefined |
| isDepositPaused | bool | undefined |
| isWithdrawPaused | bool | undefined |
| loanToValueRatio | PrimaryIndexToken.Ratio | undefined |
| liquidationThresholdFactor | PrimaryIndexToken.Ratio | undefined |
| liquidationIncentive | PrimaryIndexToken.Ratio | undefined |

### projectTokens

```solidity
function projectTokens(uint256) external view returns (address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### projectTokensLength

```solidity
function projectTokensLength() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### redeem

```solidity
function redeem(address lendingToken, uint256 bLendingTokenAmount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| lendingToken | address | undefined |
| bLendingTokenAmount | uint256 | undefined |

### redeemUnderlying

```solidity
function redeemUnderlying(address lendingToken, uint256 lendingTokenAmount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| lendingToken | address | undefined |
| lendingTokenAmount | uint256 | undefined |

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

### renounceRole

```solidity
function renounceRole(bytes32 role, address account) external nonpayable
```



*Revokes `role` from the calling account. Roles are often managed via {grantRole} and {revokeRole}: this function&#39;s purpose is to provide a mechanism for accounts to lose their privileges if they are compromised (such as when a trusted device is misplaced). If the calling account had been granted `role`, emits a {RoleRevoked} event. Requirements: - the caller must be `account`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### repay

```solidity
function repay(address projectToken, address lendingToken, uint256 lendingTokenAmount) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| projectToken | address | undefined |
| lendingToken | address | undefined |
| lendingTokenAmount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### revokeModerator

```solidity
function revokeModerator(address moderator) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| moderator | address | undefined |

### revokeRole

```solidity
function revokeRole(bytes32 role, address account) external nonpayable
```



*Revokes `role` from `account`. If `account` had been granted `role`, emits a {RoleRevoked} event. Requirements: - the caller must have ``role``&#39;s admin role.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### setBorrowLimit

```solidity
function setBorrowLimit(address projectToken, address lendingToken, uint256 _borrowLimit) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| projectToken | address | undefined |
| lendingToken | address | undefined |
| _borrowLimit | uint256 | undefined |

### setLendingTokenInfo

```solidity
function setLendingTokenInfo(address _lendingToken, address _bLendingToken, bool _isPaused) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _lendingToken | address | undefined |
| _bLendingToken | address | undefined |
| _isPaused | bool | undefined |

### setPausedLendingToken

```solidity
function setPausedLendingToken(address _lendingToken, bool _isPaused) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _lendingToken | address | undefined |
| _isPaused | bool | undefined |

### setPausedProjectToken

```solidity
function setPausedProjectToken(address _projectToken, bool _isDepositPaused, bool _isWithdrawPaused) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _projectToken | address | undefined |
| _isDepositPaused | bool | undefined |
| _isWithdrawPaused | bool | undefined |

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
function setProjectTokenInfo(address _projectToken, uint8 _loanToValueRatioNumerator, uint8 _loanToValueRatioDenominator, uint8 _liquidationThresholdFactorNumerator, uint8 _liquidationThresholdFactorDenominator, uint8 _liquidationIncentiveNumerator, uint8 _liquidationIncentiveDenominator) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _projectToken | address | undefined |
| _loanToValueRatioNumerator | uint8 | undefined |
| _loanToValueRatioDenominator | uint8 | undefined |
| _liquidationThresholdFactorNumerator | uint8 | undefined |
| _liquidationThresholdFactorDenominator | uint8 | undefined |
| _liquidationIncentiveNumerator | uint8 | undefined |
| _liquidationIncentiveDenominator | uint8 | undefined |

### supply

```solidity
function supply(address lendingToken, uint256 lendingTokenAmount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| lendingToken | address | undefined |
| lendingTokenAmount | uint256 | undefined |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) external view returns (bool)
```



*See {IERC165-supportsInterface}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| interfaceId | bytes4 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### symbol

```solidity
function symbol() external view returns (string)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### totalBorrow

```solidity
function totalBorrow(address, address) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### totalDepositedProjectToken

```solidity
function totalDepositedProjectToken(address) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### totalOutstanding

```solidity
function totalOutstanding(address account, address projectToken, address lendingToken) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |
| projectToken | address | undefined |
| lendingToken | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### updateInterestInBorrowPositions

```solidity
function updateInterestInBorrowPositions(address account, address lendingToken) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |
| lendingToken | address | undefined |

### withdraw

```solidity
function withdraw(address projectToken, address lendingToken, uint256 projectTokenAmount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| projectToken | address | undefined |
| lendingToken | address | undefined |
| projectTokenAmount | uint256 | undefined |



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
event Deposit(address indexed who, address indexed tokenPrj, address lendingToken, uint256 prjDepositAmount, address indexed beneficiary)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| who `indexed` | address | undefined |
| tokenPrj `indexed` | address | undefined |
| lendingToken  | address | undefined |
| prjDepositAmount  | uint256 | undefined |
| beneficiary `indexed` | address | undefined |

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

### LiquidationIncentiveSet

```solidity
event LiquidationIncentiveSet(address indexed tokenPrj, uint8 ltfNumerator, uint8 ltfDenominator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| tokenPrj `indexed` | address | undefined |
| ltfNumerator  | uint8 | undefined |
| ltfDenominator  | uint8 | undefined |

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

### RoleAdminChanged

```solidity
event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| previousAdminRole `indexed` | bytes32 | undefined |
| newAdminRole `indexed` | bytes32 | undefined |

### RoleGranted

```solidity
event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| account `indexed` | address | undefined |
| sender `indexed` | address | undefined |

### RoleRevoked

```solidity
event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| account `indexed` | address | undefined |
| sender `indexed` | address | undefined |

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
event Withdraw(address indexed who, address indexed tokenPrj, address lendingToken, uint256 prjWithdrawAmount, address indexed beneficiary)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| who `indexed` | address | undefined |
| tokenPrj `indexed` | address | undefined |
| lendingToken  | address | undefined |
| prjWithdrawAmount  | uint256 | undefined |
| beneficiary `indexed` | address | undefined |



