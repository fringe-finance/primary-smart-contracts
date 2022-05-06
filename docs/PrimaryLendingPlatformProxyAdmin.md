# Solidity API

## PrimaryLendingPlatformProxyAdmin

### minimumDelayPeriod

```solidity
uint256 minimumDelayPeriod
```

### delayPeriod

```solidity
uint256 delayPeriod
```

### UpgradeData

```solidity
struct UpgradeData {
  uint256 appendTimestamp;
  uint256 delayPeriod;
  address oldImplementation;
  address newImplementation;
}
```

### upgradeData

```solidity
mapping(address &#x3D;&gt; struct PrimaryLendingPlatformProxyAdmin.UpgradeData) upgradeData
```

### SetDelayPeriod

```solidity
event SetDelayPeriod(uint256 oldDelayPeriod, uint256 newDelayPeriod)
```

### AppendUpgrade

```solidity
event AppendUpgrade(address proxy, uint256 appendTimestamp, uint256 delayPeriod, address oldImplementation, address newImplementation)
```

### Upgrade

```solidity
event Upgrade(address proxy, uint256 upgradeTimestamp, address oldImplementation, address newImplementation)
```

### constructor

```solidity
constructor() public
```

### setDelayPeriod

```solidity
function setDelayPeriod(uint256 _delayPeriod) public
```

### changeProxyAdmin

```solidity
function changeProxyAdmin(contract TransparentUpgradeableProxy proxy, address newAdmin) public
```

_Changes the admin of &#x60;proxy&#x60; to &#x60;newAdmin&#x60;.

Requirements:

- This contract must be the current admin of &#x60;proxy&#x60;._

### appendUpgrade

```solidity
function appendUpgrade(contract TransparentUpgradeableProxy proxy, address newImplementation) public
```

### upgrade

```solidity
function upgrade(contract TransparentUpgradeableProxy proxy, address implementation) public
```

_Upgrades &#x60;proxy&#x60; to &#x60;implementation&#x60;. See {TransparentUpgradeableProxy-upgradeTo}.

Requirements:

- This contract must be the admin of &#x60;proxy&#x60;._

### upgradeAndCall

```solidity
function upgradeAndCall(contract TransparentUpgradeableProxy proxy, address implementation, bytes data) public payable
```

_Upgrades &#x60;proxy&#x60; to &#x60;implementation&#x60; and calls a function on the new implementation. See
{TransparentUpgradeableProxy-upgradeToAndCall}.

Requirements:

- This contract must be the admin of &#x60;proxy&#x60;._

