# TokenTimelockUpgradeable







*A token holder contract that will allow a beneficiary to extract the tokens after a given release time. Useful for simple vesting schedules like &quot;advisors get all of their tokens after 1 year&quot;.*

## Methods

### beneficiary

```solidity
function beneficiary() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | the beneficiary of the tokens. |

### release

```solidity
function release() external nonpayable
```

Transfers tokens held by timelock to beneficiary.




### releaseTime

```solidity
function releaseTime() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | the time when the tokens are released. |

### token

```solidity
function token() external view returns (contract IERC20Upgradeable)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IERC20Upgradeable | the token being held. |




