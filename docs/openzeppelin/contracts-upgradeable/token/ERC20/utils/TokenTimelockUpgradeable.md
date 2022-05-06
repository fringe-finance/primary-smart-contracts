# Solidity API

## TokenTimelockUpgradeable

_A token holder contract that will allow a beneficiary to extract the
tokens after a given release time.

Useful for simple vesting schedules like &quot;advisors get all of their tokens
after 1 year&quot;._

### _token

```solidity
contract IERC20Upgradeable _token
```

### _beneficiary

```solidity
address _beneficiary
```

### _releaseTime

```solidity
uint256 _releaseTime
```

### __TokenTimelock_init

```solidity
function __TokenTimelock_init(contract IERC20Upgradeable token_, address beneficiary_, uint256 releaseTime_) internal
```

### __TokenTimelock_init_unchained

```solidity
function __TokenTimelock_init_unchained(contract IERC20Upgradeable token_, address beneficiary_, uint256 releaseTime_) internal
```

### token

```solidity
function token() public view virtual returns (contract IERC20Upgradeable)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract IERC20Upgradeable | the token being held. |

### beneficiary

```solidity
function beneficiary() public view virtual returns (address)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | the beneficiary of the tokens. |

### releaseTime

```solidity
function releaseTime() public view virtual returns (uint256)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the time when the tokens are released. |

### release

```solidity
function release() public virtual
```

Transfers tokens held by timelock to beneficiary.

### __gap

```solidity
uint256[50] __gap
```

