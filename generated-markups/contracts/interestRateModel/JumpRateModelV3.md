# JumpRateModelV3

## Contract Description


License: MIT

## 

```solidity
contract JumpRateModelV3 is Initializable, InterestRateModel, AccessControlUpgradeable
```

V3 interest rate Model.
## Structs info

### BlendingTokenInfo

```solidity
struct BlendingTokenInfo {
	uint256 gainPerBlock;
	uint256 jumGainPerBlock;
	uint256 targetUtil;
}
```


### RateInfo

```solidity
struct RateInfo {
	uint256 lastInterestRate;
	uint256 lastAccrualBlockNumber;
	uint256 maxBorrowRate;
}
```


## Events info

### NewInterestParams

```solidity
event NewInterestParams(uint256 gainPerBlock, uint256 jumGainPerBlock, uint256 targetUtil)
```

Emitted when the owner of the interest rate model is updated.


Parameters:

| Name            | Type    | Description                |
| :-------------- | :------ | :------------------------- |
| gainPerBlock    | uint256 | The new gainPerBlock.      |
| jumGainPerBlock | uint256 | The new jumGainPerBlock.   |
| targetUtil      | uint256 | The new targetUtil.        |

### NewOwner

```solidity
event NewOwner(address newOwner)
```

Emitted when the owner of the contract is updated.


Parameters:

| Name     | Type    | Description                   |
| :------- | :------ | :---------------------------- |
| newOwner | address | The address of the new owner. |

### NewInterest

```solidity
event NewInterest(uint256 appliedBlock, uint256 interestRate)
```

Emitted when a new interest rate is set.


Parameters:

| Name         | Type    | Description                                                |
| :----------- | :------ | :--------------------------------------------------------- |
| appliedBlock | uint256 | The block number at which the interest rate was applied.   |
| interestRate | uint256 | The new interest rate.                                     |

## Constants info

### MODERATOR_ROLE (0x797669c9)

```solidity
bytes32 constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE")
```


## State variables info

### blocksPerYear (0xa385fb96)

```solidity
uint256 blocksPerYear
```

The approximate number of blocks per year that is assumed by the interest rate model.
### blendingTokenInfo (0x582d785a)

```solidity
mapping(address => struct JumpRateModelV3.BlendingTokenInfo) blendingTokenInfo
```


### rateInfo (0x3a86fb41)

```solidity
mapping(address => struct JumpRateModelV3.RateInfo) rateInfo
```


### isBlendingTokenSupport (0xb7979487)

```solidity
mapping(address => bool) isBlendingTokenSupport
```


## Modifiers info

### onlyBlendingToken

```solidity
modifier onlyBlendingToken()
```

Modifier to restrict access to only the blending token contract.
### onlyAdmin

```solidity
modifier onlyAdmin()
```

Modifier to check if the caller is the default admin role.
### onlyModerator

```solidity
modifier onlyModerator()
```

Modifier to check if the caller has the moderator role.
## Functions info

### initialize (0xfe4b84df)

```solidity
function initialize(uint256 blocksPerYear_) public initializer
```

Constructs an interest rate model.


Parameters:

| Name           | Type    | Description                                 |
| :------------- | :------ | :------------------------------------------ |
| blocksPerYear_ | uint256 | Number of blocks in a year for compounding. |

### grandModerator (0x04ebc8b1)

```solidity
function grandModerator(address newModerator) public onlyAdmin
```

Grants the `MODERATOR_ROLE` to a new address.
The caller must have the `ADMIN_ROLE`.


Parameters:

| Name         | Type    | Description                       |
| :----------- | :------ | :-------------------------------- |
| newModerator | address | The address to grant the role to. |

### revokeModerator (0x36445636)

```solidity
function revokeModerator(address moderator) public onlyAdmin
```

Revokes the moderator role from the specified address.
The caller must have the admin role.


Parameters:

| Name      | Type    | Description                                           |
| :-------- | :------ | :---------------------------------------------------- |
| moderator | address | The address of the moderator to revoke the role from. |

### updateJumpRateModel (0x10b86276)

```solidity
function updateJumpRateModel(
    uint256 gainPerYear,
    uint256 jumGainPerYear,
    uint256 targetUtil_,
    address blendingToken
) external onlyModerator
```

Updates the parameters of the interest rate model (only callable by owner, i.e. Timelock).
Only the contract moderator can call this function.


Parameters:

| Name           | Type    | Description                                                               |
| :------------- | :------ | :------------------------------------------------------------------------ |
| gainPerYear    | uint256 | The rate of increase in interest rate wrt utilization (scaled by 1e18).   |
| jumGainPerYear | uint256 | The jumGainPerBlock after hitting a specified utilization point.          |
| targetUtil_    | uint256 | The utilization point at which the jump multiplier is applied.            |

### setBlockPerYear (0x03700d6b)

```solidity
function setBlockPerYear(uint256 blocksPerYear_) external onlyModerator
```

Sets the number of blocks per year for the JumpRateModelV3 contract.
Only the contract moderator can call this function.


Parameters:

| Name           | Type    | Description                        |
| :------------- | :------ | :--------------------------------- |
| blocksPerYear_ | uint256 | The new number of blocks per year. |

### addBLendingTokenSuport (0x9c59d8ec)

```solidity
function addBLendingTokenSuport(
    address blendingToken,
    uint256 gainPerYear,
    uint256 jumGainPerYear,
    uint256 targetUtil_,
    uint256 newMaxBorrow
) external onlyModerator
```

Adds support for a new blending token to the JumpRateModelV3 contract.
#### Requirements:
- `blendingToken` cannot be the zero address.
- Only the contract moderator can call this function.


Parameters:

| Name           | Type    | Description                                             |
| :------------- | :------ | :------------------------------------------------------ |
| blendingToken  | address | The address of the blending token to add support for.   |
| gainPerYear    | uint256 | The gain per year for the blending token.               |
| jumGainPerYear | uint256 | The jump gain per year for the blending token.          |
| targetUtil_    | uint256 | The target utilization rate for the blending token.     |
| newMaxBorrow   | uint256 | The new maximum borrow rate for the blending token.     |

### removeBLendingTokenSuport (0x3fddd839)

```solidity
function removeBLendingTokenSuport(address _blending) external onlyModerator
```

Removes blending token support for the specified blending token address.
#### Requirements:
- `_blending` cannot be the zero address.
- `_blending` must be a supported blending token.


Parameters:

| Name      | Type    | Description                                              |
| :-------- | :------ | :------------------------------------------------------- |
| _blending | address | The address of the blending token to remove support for. |

### setMaxBorrowRate (0xa8801029)

```solidity
function setMaxBorrowRate(
    address blendingToken,
    uint256 newMaxBorrow
) external onlyModerator
```

Sets the maximum borrow rate for a blending token.
#### Requirements:
- The caller must have the `onlyModerator` modifier.
- The blending token must be supported by the contract.


Parameters:

| Name          | Type    | Description                            |
| :------------ | :------ | :------------------------------------- |
| blendingToken | address | The address of the blending token.     |
| newMaxBorrow  | uint256 | The new maximum borrow rate to be set. |

### updateBlockNumber (0x938c9cf6)

```solidity
function updateBlockNumber(address blendingToken) public onlyModerator
```

Updates the block number for a given blending token.
#### Requirements:
- The caller must have the `onlyModerator` modifier.
- The blending token must be supported.


Parameters:

| Name          | Type    | Description                                  |
| :------------ | :------ | :------------------------------------------- |
| blendingToken | address | The address of the blending token to update. |

### utilizationRate (0x6e71e2d8)

```solidity
function utilizationRate(
    uint256 cash,
    uint256 borrows,
    uint256 reserves
) public pure returns (uint256)
```

Calculates the utilization rate of the market: `borrows / (cash + borrows - reserves)`.


Parameters:

| Name     | Type    | Description                                                |
| :------- | :------ | :--------------------------------------------------------- |
| cash     | uint256 | The amount of cash in the market.                          |
| borrows  | uint256 | The amount of borrows in the market.                       |
| reserves | uint256 | The amount of reserves in the market (currently unused).   |


Return values:

| Name | Type    | Description                                           |
| :--- | :------ | :---------------------------------------------------- |
| [0]  | uint256 | The utilization rate as a mantissa between [0, 1e18]. |

### getInterestRateChange (0x86959d81)

```solidity
function getInterestRateChange(
    uint256 cash,
    uint256 borrows,
    uint256 reserves,
    address blendingToken
) public view returns (int256)
```

Calculates the change in the interest rate per block per block.


Parameters:

| Name     | Type    | Description                             |
| :------- | :------ | :-------------------------------------- |
| cash     | uint256 | The amount of cash in the market.       |
| borrows  | uint256 | The amount of borrows in the market.    |
| reserves | uint256 | The amount of reserves in the market.   |


Return values:

| Name | Type   | Description                                                                         |
| :--- | :----- | :---------------------------------------------------------------------------------- |
| [0]  | int256 | The change in the interest rate per block per block as a mantissa (scaled by 1e18). |

### getBlockNumber (0x42cbb15c)

```solidity
function getBlockNumber() public view returns (uint256)
```

Function to simply retrieve block number.
This exists mainly for inheriting test contracts to stub this result.
### storeBorrowRate (0x5eeaafea)

```solidity
function storeBorrowRate(
    uint256 cash,
    uint256 borrows,
    uint256 reserves
) public override onlyBlendingToken returns (uint256)
```

Calculates the current borrow rate per block, with the error code expected by the market.


Parameters:

| Name     | Type    | Description                             |
| :------- | :------ | :-------------------------------------- |
| cash     | uint256 | The amount of cash in the market.       |
| borrows  | uint256 | The amount of borrows in the market.    |
| reserves | uint256 | The amount of reserves in the market.   |


Return values:

| Name | Type    | Description                                                          |
| :--- | :------ | :------------------------------------------------------------------- |
| [0]  | uint256 | The borrow rate percentage per block as a mantissa (scaled by 1e18). |

### getSupplyRate (0x32dc9b1c)

```solidity
function getSupplyRate(
    uint256 cash,
    uint256 borrows,
    uint256 reserves,
    uint256 reserveFactorMantissa,
    address blendingToken
) public view override returns (uint256)
```

Calculates the current supply rate per block.


Parameters:

| Name                  | Type    | Description                                  |
| :-------------------- | :------ | :------------------------------------------- |
| cash                  | uint256 | The amount of cash in the market.            |
| borrows               | uint256 | The amount of borrows in the market.         |
| reserves              | uint256 | The amount of reserves in the market.        |
| reserveFactorMantissa | uint256 | The current reserve factor for the market.   |


Return values:

| Name | Type    | Description                                                          |
| :--- | :------ | :------------------------------------------------------------------- |
| [0]  | uint256 | The supply rate percentage per block as a mantissa (scaled by 1e18). |

### getBorrowRate (0x89469df9)

```solidity
function getBorrowRate(
    uint256 cash,
    uint256 borrows,
    uint256 reserves,
    address blendingToken
) external view override returns (uint256)
```

Calculates the current borrow rate per block.


Parameters:

| Name     | Type    | Description                             |
| :------- | :------ | :-------------------------------------- |
| cash     | uint256 | The amount of cash in the market.       |
| borrows  | uint256 | The amount of borrows in the market.    |
| reserves | uint256 | The amount of reserves in the market.   |


Return values:

| Name | Type    | Description                                                          |
| :--- | :------ | :------------------------------------------------------------------- |
| [0]  | uint256 | The borrow rate percentage per block as a mantissa (scaled by 1e18). |
