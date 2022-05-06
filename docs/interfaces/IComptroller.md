# Solidity API

## IComptroller

### isComptroller

```solidity
function isComptroller() external view returns (bool)
```

Indicator that this is a Comptroller contract (for inspection)

### getAssetsIn

```solidity
function getAssetsIn(address account) external view returns (address[])
```

### getAccountLiquidity

```solidity
function getAccountLiquidity(address account) external view returns (uint256, uint256, uint256)
```

### checkMembership

```solidity
function checkMembership(address account, address cToken) external view returns (bool)
```

### getPrimaryIndexTokenAddress

```solidity
function getPrimaryIndexTokenAddress() external view returns (address)
```

### enterMarkets

```solidity
function enterMarkets(address[] cTokens) external returns (uint256[])
```

### enterMarket

```solidity
function enterMarket(address cToken, address borrower) external returns (uint256)
```

### exitMarket

```solidity
function exitMarket(address cToken) external returns (uint256)
```

### mintAllowed

```solidity
function mintAllowed(address cToken, address minter, uint256 mintAmount) external returns (uint256)
```

### mintVerify

```solidity
function mintVerify(address cToken, address minter, uint256 mintAmount, uint256 mintTokens) external
```

### redeemAllowed

```solidity
function redeemAllowed(address cToken, address redeemer, uint256 redeemTokens) external returns (uint256)
```

### redeemVerify

```solidity
function redeemVerify(address cToken, address redeemer, uint256 redeemAmount, uint256 redeemTokens) external
```

### borrowAllowed

```solidity
function borrowAllowed(address cToken, address borrower, uint256 borrowAmount) external returns (uint256)
```

### borrowVerify

```solidity
function borrowVerify(address cToken, address borrower, uint256 borrowAmount) external
```

### repayBorrowAllowed

```solidity
function repayBorrowAllowed(address cToken, address payer, address borrower, uint256 repayAmount) external returns (uint256)
```

### repayBorrowVerify

```solidity
function repayBorrowVerify(address cToken, address payer, address borrower, uint256 repayAmount, uint256 borrowerIndex) external
```

### liquidateBorrowAllowed

```solidity
function liquidateBorrowAllowed(address cTokenBorrowed, address cTokenCollateral, address liquidator, address borrower, uint256 repayAmount) external returns (uint256)
```

### liquidateBorrowVerify

```solidity
function liquidateBorrowVerify(address cTokenBorrowed, address cTokenCollateral, address liquidator, address borrower, uint256 repayAmount, uint256 seizeTokens) external
```

### seizeAllowed

```solidity
function seizeAllowed(address cTokenCollateral, address cTokenBorrowed, address liquidator, address borrower, uint256 seizeTokens) external returns (uint256)
```

### seizeVerify

```solidity
function seizeVerify(address cTokenCollateral, address cTokenBorrowed, address liquidator, address borrower, uint256 seizeTokens) external
```

### transferAllowed

```solidity
function transferAllowed(address cToken, address src, address dst, uint256 transferTokens) external returns (uint256)
```

### transferVerify

```solidity
function transferVerify(address cToken, address src, address dst, uint256 transferTokens) external
```

### liquidateCalculateSeizeTokens

```solidity
function liquidateCalculateSeizeTokens(address cTokenBorrowed, address cTokenCollateral, uint256 repayAmount) external view returns (uint256, uint256)
```

