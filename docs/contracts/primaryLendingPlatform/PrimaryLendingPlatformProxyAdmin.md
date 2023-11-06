# PrimaryLendingPlatformProxyAdmin

## Overview

#### License: MIT

## 

```solidity
contract PrimaryLendingPlatformProxyAdmin is ProxyAdmin
```

The PrimaryLendingPlatformProxyAdmin contract is the contract that provides the functionality for upgrading the proxy contracts.

Contract that provides the functionality for upgrading the proxy contracts. Inherit from ProxyAdmin.
## Structs info

### UpgradeData

```solidity
struct UpgradeData {
	uint256 appendTimestamp;
	uint256 delayPeriod;
	address oldImplementation;
	address newImplementation;
}
```


## Events info

### SetDelayPeriod

```solidity
event SetDelayPeriod(uint256 oldDelayPeriod, uint256 newDelayPeriod)
```

Emitted when the delay period is set.


Parameters:

| Name           | Type    | Description                   |
| :------------- | :------ | :---------------------------- |
| oldDelayPeriod | uint256 | The old delay period value.   |
| newDelayPeriod | uint256 | The new delay period value.   |

### AppendUpgrade

```solidity
event AppendUpgrade(address indexed proxy, uint256 appendTimestamp, uint256 delayPeriod, address oldImplementation, address newImplementation)
```

Emitted when a new upgrade is appended to the upgrade schedule.


Parameters:

| Name              | Type    | Description                                                    |
| :---------------- | :------ | :------------------------------------------------------------- |
| proxy             | address | The address of the proxy contract being upgraded.              |
| appendTimestamp   | uint256 | The timestamp when the upgrade was appended to the schedule.   |
| delayPeriod       | uint256 | The delay period before the upgrade can be executed.           |
| oldImplementation | address | The address of the current implementation contract.            |
| newImplementation | address | The address of the new implementation contract.                |

### Upgrade

```solidity
event Upgrade(address indexed proxy, uint256 upgradeTimestamp, address oldImplementation, address newImplementation)
```

Emitted when a proxy contract is upgraded to a new implementation.


Parameters:

| Name              | Type    | Description                                       |
| :---------------- | :------ | :------------------------------------------------ |
| proxy             | address | The address of the upgraded proxy contract.       |
| upgradeTimestamp  | uint256 | The timestamp of the upgrade.                     |
| oldImplementation | address | The address of the old implementation contract.   |
| newImplementation | address | The address of the new implementation contract.   |

## Constants info

### minimumDelayPeriod (0xf6a01ab1)

```solidity
uint256 constant minimumDelayPeriod = 1 days
```


## State variables info

### delayPeriod (0xb1c94d94)

```solidity
uint256 delayPeriod
```


### upgradeData (0xbbd0f915)

```solidity
mapping(address => struct PrimaryLendingPlatformProxyAdmin.UpgradeData) upgradeData
```


## Functions info

### constructor

```solidity
constructor()
```


### setDelayPeriod (0x3d572107)

```solidity
function setDelayPeriod(uint256 _delayPeriod) external onlyOwner
```

Sets the delay period for the PrimaryLendingPlatformProxyAdmin contract.


Parameters:

| Name         | Type    | Description                                                                                                                                                                    |
| :----------- | :------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _delayPeriod | uint256 | The new delay period to be set.  Requirements: - The caller must be the owner of the contract. - `_delayPeriod` must be greater than or equal to the minimum delay period. |

### changeProxyAdmin (0x7eff275e)

```solidity
function changeProxyAdmin(
    ITransparentUpgradeableProxy proxy,
    address newAdmin
) public override onlyOwner
```

Changes the admin of a transparent proxy.


Parameters:

| Name     | Type                                  | Description                                                                                                                                           |
| :------- | :------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| proxy    | contract ITransparentUpgradeableProxy | The address of the proxy to change the admin of.                                                                                                      |
| newAdmin | address                               | The address of the new admin.  Requirements: - The caller must be the owner of the contract. - This function is forbidden and will always revert. |

### appendUpgrade (0xb14faf17)

```solidity
function appendUpgrade(
    ITransparentUpgradeableProxy proxy,
    address newImplementation
) public onlyOwner
```

Appends an upgrade to the upgrade queue for the given proxy contract.


Parameters:

| Name              | Type                                  | Description                                                                                                                                                                                                                                                                                                                                                                            |
| :---------------- | :------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| proxy             | contract ITransparentUpgradeableProxy | The proxy contract to upgrade.                                                                                                                                                                                                                                                                                                                                                         |
| newImplementation | address                               | The address of the new implementation contract.  Requirements: - The caller must be the owner of the contract. - The upgrade queue for the given proxy contract must be empty.  Effects: - Sets the append timestamp for the upgrade. - Sets the delay period for the upgrade. - Sets the old implementation for the upgrade. - Sets the new implementation for the upgrade. |

### upgrade (0x99a88ec4)

```solidity
function upgrade(
    ITransparentUpgradeableProxy proxy,
    address implementation
) public override onlyOwner
```

Upgrades the implementation of a transparent proxy contract.


Parameters:

| Name           | Type                                  | Description                                                                                                                                                                                                                                                                                                                                                        |
| :------------- | :------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| proxy          | contract ITransparentUpgradeableProxy | The transparent proxy contract to upgrade.                                                                                                                                                                                                                                                                                                                         |
| implementation | address                               | The address of the new implementation contract.  Requirements: - The caller must be the owner of the contract. - The `appendUpgrade` function must have been called before. - The delay period must have passed since the `appendUpgrade` function was called. - The new implementation address must match the one provided in the `appendUpgrade` function. |

### upgradeAndCall (0x9623609d)

```solidity
function upgradeAndCall(
    ITransparentUpgradeableProxy proxy,
    address implementation,
    bytes memory data
) public payable override onlyOwner
```

This function is deprecated.
Upgrades the implementation of the transparent proxy to a new implementation and calls a function on the new implementation.
This function is only callable by the contract owner.


Parameters:

| Name           | Type                                  | Description                                                 |
| :------------- | :------------------------------------ | :---------------------------------------------------------- |
| proxy          | contract ITransparentUpgradeableProxy | The transparent proxy to be upgraded.                       |
| implementation | address                               | The address of the new implementation contract.             |
| data           | bytes                                 | The data to be passed to the new implementation contract.   |
