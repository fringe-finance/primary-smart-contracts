# Solidity API

## FringeInterestRateModel

### MODERATOR_ROLE

```solidity
bytes32 MODERATOR_ROLE
```

### borrowRate

```solidity
uint256 borrowRate
```

### supplyRate

```solidity
uint256 supplyRate
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

### grandModerator

```solidity
function grandModerator(address newModerator) public
```

### revokeModerator

```solidity
function revokeModerator(address moderator) public
```

### setBorrowRate

```solidity
function setBorrowRate(uint256 newBorrowRate) public
```

### setSupplyRate

```solidity
function setSupplyRate(uint256 newSupplyRate) public
```

### getBorrowRate

```solidity
function getBorrowRate(uint256 cash, uint256 borrows, uint256 reserves) external view returns (uint256)
```

Calculates the current borrow rate per block

| Name | Type | Description |
| ---- | ---- | ----------- |
| cash | uint256 | The amount of cash in the market |
| borrows | uint256 | The amount of borrows in the market |
| reserves | uint256 | The amount of reserves in the market |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The borrow rate percentage per block as a mantissa (scaled by 1e18) |

### getSupplyRate

```solidity
function getSupplyRate(uint256 cash, uint256 borrows, uint256 reserves, uint256 reserveFactorMantissa) public view returns (uint256)
```

Calculates the current supply interest rate per block

| Name | Type | Description |
| ---- | ---- | ----------- |
| cash | uint256 | The total amount of cash the market has |
| borrows | uint256 | The total amount of borrows the market has outstanding |
| reserves | uint256 | The total amount of reserves the market has |
| reserveFactorMantissa | uint256 | The current reserve factor the market has |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The supply rate per block (as a percentage, and scaled by 1e18) |

