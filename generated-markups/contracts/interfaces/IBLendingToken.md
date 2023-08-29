# IBLendingToken

## Interface Description


License: MIT

## 

```solidity
interface IBLendingToken
```


## Functions info

### mintTo (0x449a52f8)

```solidity
function mintTo(
    address minter,
    uint256 mintAmount
) external returns (uint256 err, uint256 mintedAmount)
```

Sender supplies assets into the market and receives cTokens in exchange

Accrues interest whether or not the operation succeeds, unless reverted


Parameters:

| Name       | Type    | Description                                                                                                                                                             |
| :--------- | :------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| minter     | address | the address of account which earn liquidity                                                                                                                             |
| mintAmount | uint256 | The amount of the underlying asset to supply to minter return uint256 0=success, otherwise a failure (see ErrorReporter.sol for details) return uint256 minted amount |

### redeemTo (0x2f7605fb)

```solidity
function redeemTo(
    address redeemer,
    uint256 redeemTokens
) external returns (uint256)
```

Sender redeems cTokens in exchange for the underlying asset

Accrues interest whether or not the operation succeeds, unless reverted


Parameters:

| Name         | Type    | Description                                       |
| :----------- | :------ | :------------------------------------------------ |
| redeemTokens | uint256 | The number of cTokens to redeem into underlying   |


Return values:

| Name | Type    | Description                                                                |
| :--- | :------ | :------------------------------------------------------------------------- |
| [0]  | uint256 | uint256 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### redeemUnderlyingTo (0x6664aa78)

```solidity
function redeemUnderlyingTo(
    address redeemer,
    uint256 redeemAmount
) external returns (uint256)
```

Sender redeems cTokens in exchange for a specified amount of underlying asset

Accrues interest whether or not the operation succeeds, unless reverted


Parameters:

| Name         | Type    | Description                          |
| :----------- | :------ | :----------------------------------- |
| redeemAmount | uint256 | The amount of underlying to redeem   |


Return values:

| Name | Type    | Description                                                                |
| :--- | :------ | :------------------------------------------------------------------------- |
| [0]  | uint256 | uint256 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### borrowTo (0xfda0241d)

```solidity
function borrowTo(
    address borrower,
    uint256 borrowAmount
) external returns (uint256 borrowError)
```


### repayTo (0x99c93213)

```solidity
function repayTo(
    address payer,
    address borrower,
    uint256 repayAmount
) external returns (uint256 repayBorrowError, uint256 amountRepayed)
```


### repayBorrowToBorrower (0xc8146d33)

```solidity
function repayBorrowToBorrower(
    address projectToken,
    address payer,
    address borrower,
    uint256 repayAmount
) external returns (uint256 repayBorrowError, uint256 amountRepayed)
```


### balanceOf (0x70a08231)

```solidity
function balanceOf(address owner) external view returns (uint256)
```

Get the token balance of the `owner`


Parameters:

| Name  | Type    | Description                           |
| :---- | :------ | :------------------------------------ |
| owner | address | The address of the account to query   |


Return values:

| Name | Type    | Description                           |
| :--- | :------ | :------------------------------------ |
| [0]  | uint256 | The number of tokens owned by `owner` |

### borrowBalanceCurrent (0x17bfdfbc)

```solidity
function borrowBalanceCurrent(address account) external returns (uint256)
```


### borrowBalanceStored (0x95dd9193)

```solidity
function borrowBalanceStored(address account) external view returns (uint256)
```


### totalSupply (0x18160ddd)

```solidity
function totalSupply() external view returns (uint256)
```


### totalBorrows (0x47bd3718)

```solidity
function totalBorrows() external view returns (uint256)
```


### exchangeRateStored (0x182df0f5)

```solidity
function exchangeRateStored() external view returns (uint256)
```


### underlying (0x6f307dc3)

```solidity
function underlying() external view returns (address)
```


### getEstimatedBorrowBalanceStored (0xb9ade142)

```solidity
function getEstimatedBorrowBalanceStored(
    address account
) external view returns (uint256 accrual)
```

