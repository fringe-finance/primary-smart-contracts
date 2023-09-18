# IComptroller

## Interface Description


License: MIT

## 

```solidity
interface IComptroller
```


## Functions info

### isComptroller (0x007e3dd2)

```solidity
function isComptroller() external view returns (bool)
```

Indicator that this is a Comptroller contract (for inspection)
### getAssetsIn (0xabfceffc)

```solidity
function getAssetsIn(address account) external view returns (address[] memory)
```


### getAccountLiquidity (0x5ec88c79)

```solidity
function getAccountLiquidity(
    address account
) external view returns (uint256, uint256, uint256)
```


### checkMembership (0x929fe9a1)

```solidity
function checkMembership(
    address account,
    address cToken
) external view returns (bool)
```


### getPrimaryLendingPlatformAddress (0xaa0e4edd)

```solidity
function getPrimaryLendingPlatformAddress() external view returns (address)
```


### enterMarkets (0xc2998238)

```solidity
function enterMarkets(
    address[] memory cTokens
) external returns (uint256[] memory)
```


### enterMarket (0x24991d66)

```solidity
function enterMarket(
    address cToken,
    address borrower
) external returns (uint256)
```


### exitMarket (0xede4edd0)

```solidity
function exitMarket(address cToken) external returns (uint256)
```


### mintAllowed (0x4ef4c3e1)

```solidity
function mintAllowed(
    address cToken,
    address minter,
    uint256 mintAmount
) external returns (uint256)
```


### mintVerify (0x41c728b9)

```solidity
function mintVerify(
    address cToken,
    address minter,
    uint256 mintAmount,
    uint256 mintTokens
) external
```


### redeemAllowed (0xeabe7d91)

```solidity
function redeemAllowed(
    address cToken,
    address redeemer,
    uint256 redeemTokens
) external returns (uint256)
```


### redeemVerify (0x51dff989)

```solidity
function redeemVerify(
    address cToken,
    address redeemer,
    uint256 redeemAmount,
    uint256 redeemTokens
) external
```


### borrowAllowed (0xda3d454c)

```solidity
function borrowAllowed(
    address cToken,
    address borrower,
    uint256 borrowAmount
) external returns (uint256)
```


### borrowVerify (0x5c778605)

```solidity
function borrowVerify(
    address cToken,
    address borrower,
    uint256 borrowAmount
) external
```


### repayBorrowAllowed (0x24008a62)

```solidity
function repayBorrowAllowed(
    address cToken,
    address payer,
    address borrower,
    uint256 repayAmount
) external returns (uint256)
```


### repayBorrowVerify (0x1ededc91)

```solidity
function repayBorrowVerify(
    address cToken,
    address payer,
    address borrower,
    uint256 repayAmount,
    uint256 borrowerIndex
) external
```


### liquidateBorrowAllowed (0x5fc7e71e)

```solidity
function liquidateBorrowAllowed(
    address cTokenBorrowed,
    address cTokenCollateral,
    address liquidator,
    address borrower,
    uint256 repayAmount
) external returns (uint256)
```


### liquidateBorrowVerify (0x47ef3b3b)

```solidity
function liquidateBorrowVerify(
    address cTokenBorrowed,
    address cTokenCollateral,
    address liquidator,
    address borrower,
    uint256 repayAmount,
    uint256 seizeTokens
) external
```


### seizeAllowed (0xd02f7351)

```solidity
function seizeAllowed(
    address cTokenCollateral,
    address cTokenBorrowed,
    address liquidator,
    address borrower,
    uint256 seizeTokens
) external returns (uint256)
```


### seizeVerify (0x6d35bf91)

```solidity
function seizeVerify(
    address cTokenCollateral,
    address cTokenBorrowed,
    address liquidator,
    address borrower,
    uint256 seizeTokens
) external
```


### transferAllowed (0xbdcdc258)

```solidity
function transferAllowed(
    address cToken,
    address src,
    address dst,
    uint256 transferTokens
) external returns (uint256)
```


### transferVerify (0x6a56947e)

```solidity
function transferVerify(
    address cToken,
    address src,
    address dst,
    uint256 transferTokens
) external
```


### liquidateCalculateSeizeTokens (0xc488847b)

```solidity
function liquidateCalculateSeizeTokens(
    address cTokenBorrowed,
    address cTokenCollateral,
    uint256 repayAmount
) external view returns (uint256, uint256)
```

