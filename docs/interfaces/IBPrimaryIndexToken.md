# IBPrimaryIndexToken









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
function redeemUnderlyingTo(uint256 redeemAmount) external nonpayable returns (uint256)
```

Sender redeems cTokens in exchange for a specified amount of underlying asset

*Accrues interest whether or not the operation succeeds, unless reverted*

#### Parameters

| Name | Type | Description |
|---|---|---|
| redeemAmount | uint256 | The amount of underlying to redeem |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | uint 0=success, otherwise a failure (see ErrorReporter.sol for details) |




