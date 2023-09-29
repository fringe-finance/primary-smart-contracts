# IBPrimaryLendingPlatform

## Interface Description


License: MIT

## 

```solidity
interface IBPrimaryLendingPlatform
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
| mintAmount | uint256 | The amount of the underlying asset to supply to minter
 return uint256 0=success, otherwise a failure (see ErrorReporter.sol for details)
 return uint256 minted amount |

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

### redeemUnderlyingTo (0x0508b57d)

```solidity
function redeemUnderlyingTo(uint256 redeemAmount) external returns (uint256)
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
