# PrimaryLendingPlatformProxyAdmin









## Methods

### appendUpgrade

```solidity
function appendUpgrade(contract TransparentUpgradeableProxy proxy, address newImplementation) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| proxy | contract TransparentUpgradeableProxy | undefined |
| newImplementation | address | undefined |

### changeProxyAdmin

```solidity
function changeProxyAdmin(contract TransparentUpgradeableProxy proxy, address newAdmin) external nonpayable
```



*Changes the admin of `proxy` to `newAdmin`. Requirements: - This contract must be the current admin of `proxy`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| proxy | contract TransparentUpgradeableProxy | undefined |
| newAdmin | address | undefined |

### delayPeriod

```solidity
function delayPeriod() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getProxyAdmin

```solidity
function getProxyAdmin(contract TransparentUpgradeableProxy proxy) external view returns (address)
```



*Returns the current admin of `proxy`. Requirements: - This contract must be the admin of `proxy`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| proxy | contract TransparentUpgradeableProxy | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### getProxyImplementation

```solidity
function getProxyImplementation(contract TransparentUpgradeableProxy proxy) external view returns (address)
```



*Returns the current implementation of `proxy`. Requirements: - This contract must be the admin of `proxy`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| proxy | contract TransparentUpgradeableProxy | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### minimumDelayPeriod

```solidity
function minimumDelayPeriod() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.*


### setDelayPeriod

```solidity
function setDelayPeriod(uint256 _delayPeriod) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _delayPeriod | uint256 | undefined |

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined |

### upgrade

```solidity
function upgrade(contract TransparentUpgradeableProxy proxy, address implementation) external nonpayable
```



*Upgrades `proxy` to `implementation`. See {TransparentUpgradeableProxy-upgradeTo}. Requirements: - This contract must be the admin of `proxy`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| proxy | contract TransparentUpgradeableProxy | undefined |
| implementation | address | undefined |

### upgradeAndCall

```solidity
function upgradeAndCall(contract TransparentUpgradeableProxy proxy, address implementation, bytes data) external payable
```



*Upgrades `proxy` to `implementation` and calls a function on the new implementation. See {TransparentUpgradeableProxy-upgradeToAndCall}. Requirements: - This contract must be the admin of `proxy`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| proxy | contract TransparentUpgradeableProxy | undefined |
| implementation | address | undefined |
| data | bytes | undefined |

### upgradeData

```solidity
function upgradeData(address) external view returns (uint256 appendTimestamp, uint256 delayPeriod, address oldImplementation, address newImplementation)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| appendTimestamp | uint256 | undefined |
| delayPeriod | uint256 | undefined |
| oldImplementation | address | undefined |
| newImplementation | address | undefined |



## Events

### AppendUpgrade

```solidity
event AppendUpgrade(address indexed proxy, uint256 appendTimestamp, uint256 delayPeriod, address oldImplementation, address newImplementation)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| proxy `indexed` | address | undefined |
| appendTimestamp  | uint256 | undefined |
| delayPeriod  | uint256 | undefined |
| oldImplementation  | address | undefined |
| newImplementation  | address | undefined |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

### SetDelayPeriod

```solidity
event SetDelayPeriod(uint256 oldDelayPeriod, uint256 newDelayPeriod)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| oldDelayPeriod  | uint256 | undefined |
| newDelayPeriod  | uint256 | undefined |

### Upgrade

```solidity
event Upgrade(address indexed proxy, uint256 upgradeTimestamp, address oldImplementation, address newImplementation)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| proxy `indexed` | address | undefined |
| upgradeTimestamp  | uint256 | undefined |
| oldImplementation  | address | undefined |
| newImplementation  | address | undefined |



