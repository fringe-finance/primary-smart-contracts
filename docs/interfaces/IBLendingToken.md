# IBLendingToken









## Methods

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256)
```

Get the token balance of the `owner`



#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | The address of the account to query |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | The number of tokens owned by `owner` |

### borrowBalanceCurrent

```solidity
function borrowBalanceCurrent(address account) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### borrowBalanceStored

```solidity
function borrowBalanceStored(address account) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### borrowTo

```solidity
function borrowTo(address projectToken, address borrower, uint256 borrowAmount) external nonpayable returns (uint256 borrowError)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| projectToken | address | undefined |
| borrower | address | undefined |
| borrowAmount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| borrowError | uint256 | undefined |

### exchangeRateStored

```solidity
function exchangeRateStored() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### mintTo

```solidity
function mintTo(address minter, uint256 mintAmount) external nonpayable returns (uint256 err, uint256 mintedAmount)
```

Sender supplies assets into the market and receives cTokens in exchange

*Accrues interest whether or not the operation succeeds, unless reverted*

#### Parameters

| Name | Type | Description |
|---|---|---|
| minter | address | the address of account which earn liquidity |
| mintAmount | uint256 | The amount of the underlying asset to supply to minter return uint 0=success, otherwise a failure (see ErrorReporter.sol for details) return uint minted amount |

#### Returns

| Name | Type | Description |
|---|---|---|
| err | uint256 | undefined |
| mintedAmount | uint256 | undefined |

### redeemTo

```solidity
function redeemTo(address redeemer, uint256 redeemTokens) external nonpayable returns (uint256)
```

Sender redeems cTokens in exchange for the underlying asset

*Accrues interest whether or not the operation succeeds, unless reverted*

#### Parameters

| Name | Type | Description |
|---|---|---|
| redeemer | address | undefined |
| redeemTokens | uint256 | The number of cTokens to redeem into underlying |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### redeemUnderlyingTo

```solidity
function redeemUnderlyingTo(address redeemer, uint256 redeemAmount) external nonpayable returns (uint256)
```

Sender redeems cTokens in exchange for a specified amount of underlying asset

*Accrues interest whether or not the operation succeeds, unless reverted*

#### Parameters

| Name | Type | Description |
|---|---|---|
| redeemer | address | undefined |
| redeemAmount | uint256 | The amount of underlying to redeem |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint 0=success, otherwise a failure (see ErrorReporter.sol for details) |

### repayBorrowTo

```solidity
function repayBorrowTo(address projectToken, address payer, uint256 repayAmount) external nonpayable returns (uint256 repayBorrowError, uint256 amountRepayed)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| projectToken | address | undefined |
| payer | address | undefined |
| repayAmount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| repayBorrowError | uint256 | undefined |
| amountRepayed | uint256 | undefined |

### repayBorrowToBorrower

```solidity
function repayBorrowToBorrower(address projectToken, address payer, address borrower, uint256 repayAmount) external nonpayable returns (uint256 repayBorrowError, uint256 amountRepayed)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| projectToken | address | undefined |
| payer | address | undefined |
| borrower | address | undefined |
| repayAmount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| repayBorrowError | uint256 | undefined |
| amountRepayed | uint256 | undefined |

### totalBorrows

```solidity
function totalBorrows() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |




