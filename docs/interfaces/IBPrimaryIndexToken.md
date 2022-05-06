# Solidity API

## IBPrimaryIndexToken

### mintTo

```solidity
function mintTo(address minter, uint256 mintAmount) external returns (uint256 err, uint256 mintedAmount)
```

Sender supplies assets into the market and receives cTokens in exchange

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| minter | address | the address of account which earn liquidity |
| mintAmount | uint256 | The amount of the underlying asset to supply to minter return uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) return uint minted amount |

### redeemTo

```solidity
function redeemTo(address redeemer, uint256 redeemTokens) external returns (uint256)
```

Sender redeems cTokens in exchange for the underlying asset

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| redeemer | address |  |
| redeemTokens | uint256 | The number of cTokens to redeem into underlying |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### redeemUnderlyingTo

```solidity
function redeemUnderlyingTo(uint256 redeemAmount) external returns (uint256)
```

Sender redeems cTokens in exchange for a specified amount of underlying asset

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| redeemAmount | uint256 | The amount of underlying to redeem |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256)
```

Get the token balance of the &#x60;owner&#x60;

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address of the account to query |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The number of tokens owned by &#x60;owner&#x60; |

