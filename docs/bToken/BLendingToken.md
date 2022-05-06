# Solidity API

## BLendingToken

### MODERATOR_ROLE

```solidity
bytes32 MODERATOR_ROLE
```

### primaryIndexToken

```solidity
address primaryIndexToken
```

### SetPrimaryIndexToken

```solidity
event SetPrimaryIndexToken(address oldPrimaryIndexToken, address newPrimaryIndexToken)
```

### init

```solidity
function init(address underlying_, contract Bondtroller bondtroller_, contract InterestRateModel interestRateModel_, uint256 initialExchangeRateMantissa_, string name_, string symbol_, uint8 decimals_, address admin_) public
```

### onlyAdmin

```solidity
modifier onlyAdmin()
```

### onlyPrimaryIndexToken

```solidity
modifier onlyPrimaryIndexToken()
```

### onlyModerator

```solidity
modifier onlyModerator()
```

### setPrimaryIndexToken

```solidity
function setPrimaryIndexToken(address _primaryIndexToken) public
```

### grandModerator

```solidity
function grandModerator(address newModerator) public
```

### revokeModerator

```solidity
function revokeModerator(address moderator) public
```

### setReserveFactor

```solidity
function setReserveFactor(uint256 reserveFactorMantissa) public
```

### mintTo

```solidity
function mintTo(address minter, uint256 mintAmount) external returns (uint256 err, uint256 mintedAmount)
```

### redeemTo

```solidity
function redeemTo(address redeemer, uint256 redeemTokens) external returns (uint256 redeemErr)
```

### redeemUnderlyingTo

```solidity
function redeemUnderlyingTo(address redeemer, uint256 redeemAmount) external returns (uint256 redeemUnderlyingError)
```

### borrowTo

```solidity
function borrowTo(address borrower, uint256 borrowAmount) external returns (uint256 borrowError)
```

### repayTo

```solidity
function repayTo(address payer, address borrower, uint256 repayAmount) external returns (uint256 repayBorrowError, uint256 amountRepayed)
```

### getEstimatedBorrowIndex

```solidity
function getEstimatedBorrowIndex() public view returns (uint256)
```

### getEstimatedBorrowBalanceStored

```solidity
function getEstimatedBorrowBalanceStored(address account) public view returns (uint256 accrual)
```

