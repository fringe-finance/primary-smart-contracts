# IComptroller









## Methods

### borrowAllowed

```solidity
function borrowAllowed(address cToken, address borrower, uint256 borrowAmount) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| cToken | address | undefined |
| borrower | address | undefined |
| borrowAmount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### borrowVerify

```solidity
function borrowVerify(address cToken, address borrower, uint256 borrowAmount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| cToken | address | undefined |
| borrower | address | undefined |
| borrowAmount | uint256 | undefined |

### checkMembership

```solidity
function checkMembership(address account, address cToken) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |
| cToken | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### enterMarket

```solidity
function enterMarket(address cToken, address borrower) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| cToken | address | undefined |
| borrower | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### enterMarkets

```solidity
function enterMarkets(address[] cTokens) external nonpayable returns (uint256[])
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| cTokens | address[] | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256[] | undefined |

### exitMarket

```solidity
function exitMarket(address cToken) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| cToken | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getAccountLiquidity

```solidity
function getAccountLiquidity(address account) external view returns (uint256, uint256, uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |
| _1 | uint256 | undefined |
| _2 | uint256 | undefined |

### getAssetsIn

```solidity
function getAssetsIn(address account) external view returns (address[])
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address[] | undefined |

### getPrimaryIndexTokenAddress

```solidity
function getPrimaryIndexTokenAddress() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### isComptroller

```solidity
function isComptroller() external view returns (bool)
```

Indicator that this is a Comptroller contract (for inspection)




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### liquidateBorrowAllowed

```solidity
function liquidateBorrowAllowed(address cTokenBorrowed, address cTokenCollateral, address liquidator, address borrower, uint256 repayAmount) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| cTokenBorrowed | address | undefined |
| cTokenCollateral | address | undefined |
| liquidator | address | undefined |
| borrower | address | undefined |
| repayAmount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### liquidateBorrowVerify

```solidity
function liquidateBorrowVerify(address cTokenBorrowed, address cTokenCollateral, address liquidator, address borrower, uint256 repayAmount, uint256 seizeTokens) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| cTokenBorrowed | address | undefined |
| cTokenCollateral | address | undefined |
| liquidator | address | undefined |
| borrower | address | undefined |
| repayAmount | uint256 | undefined |
| seizeTokens | uint256 | undefined |

### liquidateCalculateSeizeTokens

```solidity
function liquidateCalculateSeizeTokens(address cTokenBorrowed, address cTokenCollateral, uint256 repayAmount) external view returns (uint256, uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| cTokenBorrowed | address | undefined |
| cTokenCollateral | address | undefined |
| repayAmount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |
| _1 | uint256 | undefined |

### mintAllowed

```solidity
function mintAllowed(address cToken, address minter, uint256 mintAmount) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| cToken | address | undefined |
| minter | address | undefined |
| mintAmount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### mintVerify

```solidity
function mintVerify(address cToken, address minter, uint256 mintAmount, uint256 mintTokens) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| cToken | address | undefined |
| minter | address | undefined |
| mintAmount | uint256 | undefined |
| mintTokens | uint256 | undefined |

### redeemAllowed

```solidity
function redeemAllowed(address cToken, address redeemer, uint256 redeemTokens) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| cToken | address | undefined |
| redeemer | address | undefined |
| redeemTokens | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### redeemVerify

```solidity
function redeemVerify(address cToken, address redeemer, uint256 redeemAmount, uint256 redeemTokens) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| cToken | address | undefined |
| redeemer | address | undefined |
| redeemAmount | uint256 | undefined |
| redeemTokens | uint256 | undefined |

### repayBorrowAllowed

```solidity
function repayBorrowAllowed(address cToken, address payer, address borrower, uint256 repayAmount) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| cToken | address | undefined |
| payer | address | undefined |
| borrower | address | undefined |
| repayAmount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### repayBorrowVerify

```solidity
function repayBorrowVerify(address cToken, address payer, address borrower, uint256 repayAmount, uint256 borrowerIndex) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| cToken | address | undefined |
| payer | address | undefined |
| borrower | address | undefined |
| repayAmount | uint256 | undefined |
| borrowerIndex | uint256 | undefined |

### seizeAllowed

```solidity
function seizeAllowed(address cTokenCollateral, address cTokenBorrowed, address liquidator, address borrower, uint256 seizeTokens) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| cTokenCollateral | address | undefined |
| cTokenBorrowed | address | undefined |
| liquidator | address | undefined |
| borrower | address | undefined |
| seizeTokens | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### seizeVerify

```solidity
function seizeVerify(address cTokenCollateral, address cTokenBorrowed, address liquidator, address borrower, uint256 seizeTokens) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| cTokenCollateral | address | undefined |
| cTokenBorrowed | address | undefined |
| liquidator | address | undefined |
| borrower | address | undefined |
| seizeTokens | uint256 | undefined |

### transferAllowed

```solidity
function transferAllowed(address cToken, address src, address dst, uint256 transferTokens) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| cToken | address | undefined |
| src | address | undefined |
| dst | address | undefined |
| transferTokens | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### transferVerify

```solidity
function transferVerify(address cToken, address src, address dst, uint256 transferTokens) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| cToken | address | undefined |
| src | address | undefined |
| dst | address | undefined |
| transferTokens | uint256 | undefined |




