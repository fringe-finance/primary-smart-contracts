# PrimaryLendingPlatformWrappedTokenGatewayCore

## Abstract Contract Description


License: MIT

## 

```solidity
abstract contract PrimaryLendingPlatformWrappedTokenGatewayCore is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable
```

Core contract for the Primary Lending Platform Wrapped Token Gateway Core

Abstract contract that defines the core functionality of the primary lending platform wrapped token gateway.
## Events info

### SetPrimaryLendingPlatform

```solidity
event SetPrimaryLendingPlatform(address newPrimaryLendingPlatform)
```

Emitted when the PrimaryLendingPlatform contract address is updated.


Parameters:

| Name                      | Type    | Description                                             |
| :------------------------ | :------ | :------------------------------------------------------ |
| newPrimaryLendingPlatform | address | The new address of the PrimaryLendingPlatform contract. |

### SetPITLiquidation

```solidity
event SetPITLiquidation(address newPITLiquidation)
```

Emitted when the PIT liquidation address is set.
### SetPITLeverage

```solidity
event SetPITLeverage(address newPITLeverage)
```

Emitted when the PIT (Pool Interest Token) leverage is set to a new address.


Parameters:

| Name           | Type    | Description                                   |
| :------------- | :------ | :-------------------------------------------- |
| newPITLeverage | address | The address of the new PIT leverage contract. |

## Constants info

### MODERATOR_ROLE (0x797669c9)

```solidity
bytes32 constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE")
```


## State variables info

### primaryLendingPlatform (0x92641a7c)

```solidity
contract IPrimaryLendingPlatform primaryLendingPlatform
```


### WETH (0xad5c4648)

```solidity
contract IWETH WETH
```


### pitLiquidation (0xf8514cae)

```solidity
contract IPrimaryLendingPlatformLiquidation pitLiquidation
```


### pitLeverage (0x22c7ddee)

```solidity
contract IPrimaryLendingPlatformLeverage pitLeverage
```


## Modifiers info

### onlyAdmin

```solidity
modifier onlyAdmin()
```

Modifier that allows only the admin to execute the function.
### onlyModerator

```solidity
modifier onlyModerator()
```

Modifier that allows only the moderator to execute the function.
### isProjectTokenListed

```solidity
modifier isProjectTokenListed(address projectToken)
```

Modifier that checks if the project token is listed.


Parameters:

| Name         | Type    | Description                   |
| :----------- | :------ | :---------------------------- |
| projectToken | address | Address of the project token. |

### isLendingTokenListed

```solidity
modifier isLendingTokenListed(address lendingToken)
```

Modifier that checks if the lending token is listed.


Parameters:

| Name         | Type    | Description                   |
| :----------- | :------ | :---------------------------- |
| lendingToken | address | Address of the lending token. |

## Functions info

### initialize (0xf8c8765e)

```solidity
function initialize(
    address pit,
    address weth,
    address pitLiquidationAddress,
    address pitLeverageAddress
) public initializer
```

Initializes the PrimaryLendingPlatformWrappedTokenGateway contract.


Parameters:

| Name                  | Type    | Description                                                |
| :-------------------- | :------ | :--------------------------------------------------------- |
| pit                   | address | Address of the primary index token contract.               |
| weth                  | address | Address of the wrapped Ether (WETH) token contract.        |
| pitLiquidationAddress | address | Address of the primary index token liquidation contract.   |
| pitLeverageAddress    | address | Address of the primary index token leverage contract.      |

### setPrimaryLendingPlatform (0xe801734a)

```solidity
function setPrimaryLendingPlatform(address newPit) external onlyModerator
```

Sets the address of the primary lending platform contract.

Requirements:
- `newPit` cannot be the zero address.
- Caller must be a moderator.


Parameters:

| Name   | Type    | Description                                               |
| :----- | :------ | :-------------------------------------------------------- |
| newPit | address | The address of the new primary lending platform contract. |

### setPITLiquidation (0x6ccf9e23)

```solidity
function setPITLiquidation(address newLiquidation) external onlyModerator
```

Only the moderator can call this function.

Sets the address of the PrimaryLendingPlatformLiquidation contract for PIT liquidation.

Requirements:
- `newLiquidation` cannot be the zero address.
- Caller must be a moderator.


Parameters:

| Name           | Type    | Description                                                          |
| :------------- | :------ | :------------------------------------------------------------------- |
| newLiquidation | address | The address of the new PrimaryLendingPlatformLiquidation contract.   |

### setPITLeverage (0x1a58ed4a)

```solidity
function setPITLeverage(address newLeverage) external onlyModerator
```

Sets the Primary Lending Platform Leverage contract address.

Requirements:
- `newLeverage` cannot be the zero address.
- Caller must be a moderator.


Parameters:

| Name        | Type    | Description                                                        |
| :---------- | :------ | :----------------------------------------------------------------- |
| newLeverage | address | The address of the new Primary Lending Platform Leverage contract. |

### getTotalOutstanding (0x75efd575)

```solidity
function getTotalOutstanding(
    address user,
    address projectToken
) public view returns (uint256 outstanding)
```

Returns the total outstanding balance of a user for a specific project token.


Parameters:

| Name         | Type    | Description                         |
| :----------- | :------ | :---------------------------------- |
| user         | address | The address of the user.            |
| projectToken | address | The address of the project token.   |


Return values:

| Name        | Type    | Description                                |
| :---------- | :------ | :----------------------------------------- |
| outstanding | uint256 | The total outstanding balance of the user. |

### deposit (0xd0e30db0)

```solidity
function deposit() external payable nonReentrant
```

Deposits Ether into the PrimaryLendingPlatformWrappedTokenGatewayCore contract and wraps it into WETH.
### supply (0x047fc9aa)

```solidity
function supply() external payable nonReentrant
```

Allows users to supply ETH to the PrimaryLendingPlatformWrappedTokenGatewayCore contract.
The ETH is converted to WETH and then transferred to the user's address.
The supplyFromRelatedContract function of the PrimaryLendingPlatform contract is called to supply the WETH to the user.
### redeem (0xdb006a75)

```solidity
function redeem(uint256 bLendingTokenAmount) external nonReentrant
```

Redeems the specified amount of bLendingToken for the underlying asset (WETH) and transfers it to the caller.


Parameters:

| Name                | Type    | Description                                                                                                                |
| :------------------ | :------ | :------------------------------------------------------------------------------------------------------------------------- |
| bLendingTokenAmount | uint256 | The amount of bLendingToken to redeem. If set to `type(uint256).max`, redeems all the bLendingToken balance of the caller. |

### redeemUnderlying (0x852a12e3)

```solidity
function redeemUnderlying(uint256 lendingTokenAmount) external nonReentrant
```

Redeems the underlying asset from the Primary Lending Platform and transfers it to the caller.


Parameters:

| Name               | Type    | Description                                |
| :----------------- | :------ | :----------------------------------------- |
| lendingTokenAmount | uint256 | The amount of the lending token to redeem. |

### repay (0x22867d78)

```solidity
function repay(
    address projectToken,
    uint256 lendingTokenAmount
) external payable nonReentrant
```

Repays the specified amount of the project token's Ether outstanding debt using the lending token.


Parameters:

| Name               | Type    | Description                                               |
| :----------------- | :------ | :-------------------------------------------------------- |
| projectToken       | address | The address of the project token.                         |
| lendingTokenAmount | uint256 | The amount of the lending token to be used for repayment. |

### receive

```solidity
receive() external payable
```

Only WETH contract is allowed to transfer ETH here. Prevent other addresses to send Ether to this contract.
### fallback

```solidity
fallback() external payable
```

Reverts any fallback calls to the contract.