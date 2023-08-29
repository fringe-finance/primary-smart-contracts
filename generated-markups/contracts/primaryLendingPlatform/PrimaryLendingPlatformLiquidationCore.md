# PrimaryLendingPlatformLiquidationCore

## Abstract Contract Description


License: MIT

## 

```solidity
abstract contract PrimaryLendingPlatformLiquidationCore is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable
```

Core contract for liquidating loans on the PrimaryLendingPlatform.

Abstract contract that allows users to liquidate loans.
## Structs info

### Ratio

```solidity
struct Ratio {
	uint8 numerator;
	uint8 denominator;
}
```


### MaxLAParams

```solidity
struct MaxLAParams {
	uint256 numeratorMaxLA;
	uint256 denominatorMaxLA;
	uint256 calculatedMaxLA;
	uint256 maxLACompare;
}
```


## Events info

### Liquidate

```solidity
event Liquidate(address indexed liquidator, address indexed borrower, address lendingToken, address indexed prjAddress, uint256 amountPrjLiquidated)
```

Emitted when a liquidation occurs.


Parameters:

| Name                | Type    | Description                                                       |
| :------------------ | :------ | :---------------------------------------------------------------- |
| liquidator          | address | The address of the account that initiates the liquidation.        |
| borrower            | address | The address of the borrower whose position is being liquidated.   |
| lendingToken        | address | The address of the token being used for lending.                  |
| prjAddress          | address | The address of the project being liquidated.                      |
| amountPrjLiquidated | uint256 | The amount of the project's tokens being liquidated.              |

### SetPrimaryLendingPlatform

```solidity
event SetPrimaryLendingPlatform(address indexed newPrimaryLendingPlatform)
```

Emitted when the primary lending platform address is set.


Parameters:

| Name                      | Type    | Description                               |
| :------------------------ | :------ | :---------------------------------------- |
| newPrimaryLendingPlatform | address | The new primary lending platform address. |

### SetMinPartialLiquidationAmount

```solidity
event SetMinPartialLiquidationAmount(uint256 indexed newAmount)
```

Emitted when the minimum amount for partial liquidation is set.


Parameters:

| Name      | Type    | Description                                     |
| :-------- | :------ | :---------------------------------------------- |
| newAmount | uint256 | The new minimum amount for partial liquidation. |

### SetMaxLRF

```solidity
event SetMaxLRF(uint8 numeratorLRF, uint8 denominatorLRF)
```

Emitted when the maximum Liquidation Reserve Factor (LRF) is set.


Parameters:

| Name           | Type  | Description                          |
| :------------- | :---- | :----------------------------------- |
| numeratorLRF   | uint8 | The numerator of the LRF fraction.   |
| denominatorLRF | uint8 | The denominator of the LRF fraction. |

### SetLiquidatorRewardCalculationFactor

```solidity
event SetLiquidatorRewardCalculationFactor(uint8 numeratorLRF, uint8 denominatorLRF)
```

Emitted when the liquidator reward calculation factor is set.


Parameters:

| Name           | Type  | Description                                                  |
| :------------- | :---- | :----------------------------------------------------------- |
| numeratorLRF   | uint8 | The numerator of the liquidator reward calculation factor.   |
| denominatorLRF | uint8 | The denominator of the liquidator reward calculation factor. |

### SetTargetHealthFactor

```solidity
event SetTargetHealthFactor(uint8 numeratorHF, uint8 denominatorHF)
```

Emitted when the target health factor is set.


Parameters:

| Name          | Type  | Description                                  |
| :------------ | :---- | :------------------------------------------- |
| numeratorHF   | uint8 | The numerator of the target health factor.   |
| denominatorHF | uint8 | The denominator of the target health factor. |

## Constants info

### MODERATOR_ROLE (0x797669c9)

```solidity
bytes32 constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE")
```


### LIQUIDATOR_REWARD_FACTOR_DECIMAL (0x150f2191)

```solidity
uint256 constant LIQUIDATOR_REWARD_FACTOR_DECIMAL = 18
```


## State variables info

### minPartialLiquidationAmount (0x802937ac)

```solidity
uint256 minPartialLiquidationAmount
```


### targetHealthFactor (0x254cf439)

```solidity
struct PrimaryLendingPlatformLiquidationCore.Ratio targetHealthFactor
```


### liquidatorRewardCalcFactor (0xc9fd7f25)

```solidity
struct PrimaryLendingPlatformLiquidationCore.Ratio liquidatorRewardCalcFactor
```


### maxLRF (0x83958352)

```solidity
struct PrimaryLendingPlatformLiquidationCore.Ratio maxLRF
```


### primaryLendingPlatform (0x92641a7c)

```solidity
contract IPrimaryLendingPlatform primaryLendingPlatform
```


## Modifiers info

### onlyAdmin

```solidity
modifier onlyAdmin()
```

Modifier that only allows access to accounts with the DEFAULT_ADMIN_ROLE.
### onlyModerator

```solidity
modifier onlyModerator()
```

Modifier that only allows access to accounts with the MODERATOR_ROLE.
### isProjectTokenListed

```solidity
modifier isProjectTokenListed(address _projectToken)
```

Modifier that only allows access to project tokens that are listed on the PrimaryLendingPlatform.


Parameters:

| Name          | Type    | Description                       |
| :------------ | :------ | :-------------------------------- |
| _projectToken | address | The address of the project token. |

### isLendingTokenListed

```solidity
modifier isLendingTokenListed(address _lendingToken)
```

Modifier that only allows access to lending tokens that are listed on the PrimaryLendingPlatform.


Parameters:

| Name          | Type    | Description                       |
| :------------ | :------ | :-------------------------------- |
| _lendingToken | address | The address of the lending token. |

### onlyRelatedContracts

```solidity
modifier onlyRelatedContracts()
```

Modifier that only allows access to related contracts of the PrimaryLendingPlatform.
## Functions info

### initialize (0xc4d66de8)

```solidity
function initialize(address pit) public initializer
```

Initializes the contract with the provided PIT address.

Sets up initial roles, initializes AccessControl, and sets the provided PIT address.


Parameters:

| Name | Type    | Description                                         |
| :--- | :------ | :-------------------------------------------------- |
| pit  | address | The address of the PrimaryLendingPlatform contract. |

### setMinPartialLiquidationAmount (0x35f67981)

```solidity
function setMinPartialLiquidationAmount(
    uint256 newAmount
) external onlyModerator
```

Sets the minimum partial liquidation amount.
Can only be called by accounts with the MODERATOR_ROLE.


Parameters:

| Name      | Type    | Description                             |
| :-------- | :------ | :-------------------------------------- |
| newAmount | uint256 | The minimum partial liquidation amount. |

### setMaxLRF (0x1ed95f01)

```solidity
function setMaxLRF(
    uint8 numeratorLRF,
    uint8 denominatorLRF
) external onlyModerator
```

Sets the maximum Liquidation Reserve Factor (LRF) that can be used for liquidation.

Requirements:
- The denominator must not be zero.
- Only the moderator can call this function.


Parameters:

| Name           | Type  | Description                       |
| :------------- | :---- | :-------------------------------- |
| numeratorLRF   | uint8 | The numerator of the LRF ratio.   |
| denominatorLRF | uint8 | The denominator of the LRF ratio. |

### setLiquidatorRewardCalculationFactor (0x3495b179)

```solidity
function setLiquidatorRewardCalculationFactor(
    uint8 numeratorLRF,
    uint8 denominatorLRF
) external onlyModerator
```

Sets the liquidator reward calculation factor.

Requirements:
- The caller must have the `MODERATOR_ROLE` role.
- The denominatorLRF cannot be zero.


Parameters:

| Name           | Type  | Description                                                  |
| :------------- | :---- | :----------------------------------------------------------- |
| numeratorLRF   | uint8 | The numerator of the liquidator reward calculation factor.   |
| denominatorLRF | uint8 | The denominator of the liquidator reward calculation factor. |

### setPrimaryLendingPlatformAddress (0xcec5a0b0)

```solidity
function setPrimaryLendingPlatformAddress(
    address newPrimaryLendingPlatform
) external onlyModerator
```

Sets the address of the primary lending platform contract.

Requirements:
- Only the moderator can call this function.
- The new primary lending platform address must not be the zero address.


Parameters:

| Name                      | Type    | Description                                               |
| :------------------------ | :------ | :-------------------------------------------------------- |
| newPrimaryLendingPlatform | address | The address of the new primary lending platform contract. |

### setTargetHealthFactor (0xffac9b50)

```solidity
function setTargetHealthFactor(
    uint8 numeratorHF,
    uint8 denominatorHF
) external onlyModerator
```

Sets the target health factor.

Requirements:
- Only the moderator can call this function.
- The denominatorHF cannot be zero.


Parameters:

| Name          | Type  | Description                                   |
| :------------ | :---- | :-------------------------------------------- |
| numeratorHF   | uint8 | The numerator for the target health factor.   |
| denominatorHF | uint8 | The denominator for the target health factor. |

### getCurrentHealthFactor (0xb398f0e7)

```solidity
function getCurrentHealthFactor(
    address _account,
    address _projectToken,
    address _lendingToken
)
    public
    view
    returns (uint256 healthFactorNumerator, uint256 healthFactorDenominator)
```

Gets the current health factor of a specific account's position.


Parameters:

| Name          | Type    | Description                         |
| :------------ | :------ | :---------------------------------- |
| _account      | address | The address of the account.         |
| _projectToken | address | The address of the project token.   |
| _lendingToken | address | The address of the lending token.   |


Return values:

| Name                    | Type    | Description                           |
| :---------------------- | :------ | :------------------------------------ |
| healthFactorNumerator   | uint256 | The numerator of the health factor.   |
| healthFactorDenominator | uint256 | The denominator of the health factor. |

### getTokenPrice (0xc9f7153c)

```solidity
function getTokenPrice(
    address token,
    uint256 amount
) public view returns (uint256 price)
```

Gets the price of a token in USD.


Parameters:

| Name   | Type    | Description                 |
| :----- | :------ | :-------------------------- |
| token  | address | The address of the token.   |
| amount | uint256 | The amount of the token.    |


Return values:

| Name  | Type    | Description                    |
| :---- | :------ | :----------------------------- |
| price | uint256 | The price of the token in USD. |

### liquidatorRewardFactor (0x894c4d5b)

```solidity
function liquidatorRewardFactor(
    address _account,
    address _projectToken,
    address _lendingToken
) public view returns (uint256 lrfNumerator, uint256 lrfDenominator)
```

Calculates the liquidator reward factor (LRF) for a given position.

Formula: LRF = (1 + (1 - HF) * k)


Parameters:

| Name          | Type    | Description                                                       |
| :------------ | :------ | :---------------------------------------------------------------- |
| _account      | address | The address of the borrower whose position is being considered.   |
| _projectToken | address | The address of the project token.                                 |
| _lendingToken | address | The address of the lending token.                                 |


Return values:

| Name           | Type    | Description                                      |
| :------------- | :------ | :----------------------------------------------- |
| lrfNumerator   | uint256 | The numerator of the liquidator reward factor.   |
| lrfDenominator | uint256 | The denominator of the liquidator reward factor. |

### getMaxLiquidationAmount (0x7da157b9)

```solidity
function getMaxLiquidationAmount(
    address account,
    address projectToken,
    address lendingToken
) public view returns (uint256 maxLA)
```

Calculates the maximum liquidation amount (MaxLA) for a given position.

Formula: MaxLA = (LVR * CVc - THF * LVc) / (LRF * LVR - THF)


Parameters:

| Name         | Type    | Description                                                       |
| :----------- | :------ | :---------------------------------------------------------------- |
| account      | address | The address of the borrower whose position is being considered.   |
| projectToken | address | The address of the project token.                                 |
| lendingToken | address | The address of the lending token.                                 |


Return values:

| Name  | Type    | Description                                          |
| :---- | :------ | :--------------------------------------------------- |
| maxLA | uint256 | The maximum liquidation amount in the lending token. |

### getLiquidationAmount (0x90edd058)

```solidity
function getLiquidationAmount(
    address _account,
    address _projectToken,
    address _lendingToken
) public view returns (uint256 maxLA, uint256 minLA)
```

Returns the minimum and maximum liquidation amount for a given account, project token, and lending token.

Formula: 
- MinLA = min(MaxLA, MPA)
- MaxLA = (LVR * CVc - THF * LVc) / (LRF * LVR - THF)


Parameters:

| Name          | Type    | Description                                                  |
| :------------ | :------ | :----------------------------------------------------------- |
| _account      | address | The account for which to calculate the liquidation amount.   |
| _projectToken | address | The project token address.                                   |
| _lendingToken | address | The lending token address.                                   |


Return values:

| Name  | Type    | Description                       |
| :---- | :------ | :-------------------------------- |
| maxLA | uint256 | The maximum liquidation amount.   |
| minLA | uint256 | The minimum liquidation amount.   |
