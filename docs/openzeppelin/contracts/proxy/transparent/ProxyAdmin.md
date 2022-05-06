# Solidity API

## ProxyAdmin

_This is an auxiliary contract meant to be assigned as the admin of a {TransparentUpgradeableProxy}. For an
explanation of why you would want to use this see the documentation for {TransparentUpgradeableProxy}._

### getProxyImplementation

```solidity
function getProxyImplementation(contract TransparentUpgradeableProxy proxy) public view virtual returns (address)
```

_Returns the current implementation of &#x60;proxy&#x60;.

Requirements:

- This contract must be the admin of &#x60;proxy&#x60;._

### getProxyAdmin

```solidity
function getProxyAdmin(contract TransparentUpgradeableProxy proxy) public view virtual returns (address)
```

_Returns the current admin of &#x60;proxy&#x60;.

Requirements:

- This contract must be the admin of &#x60;proxy&#x60;._

### changeProxyAdmin

```solidity
function changeProxyAdmin(contract TransparentUpgradeableProxy proxy, address newAdmin) public virtual
```

_Changes the admin of &#x60;proxy&#x60; to &#x60;newAdmin&#x60;.

Requirements:

- This contract must be the current admin of &#x60;proxy&#x60;._

### upgrade

```solidity
function upgrade(contract TransparentUpgradeableProxy proxy, address implementation) public virtual
```

_Upgrades &#x60;proxy&#x60; to &#x60;implementation&#x60;. See {TransparentUpgradeableProxy-upgradeTo}.

Requirements:

- This contract must be the admin of &#x60;proxy&#x60;._

### upgradeAndCall

```solidity
function upgradeAndCall(contract TransparentUpgradeableProxy proxy, address implementation, bytes data) public payable virtual
```

_Upgrades &#x60;proxy&#x60; to &#x60;implementation&#x60; and calls a function on the new implementation. See
{TransparentUpgradeableProxy-upgradeToAndCall}.

Requirements:

- This contract must be the admin of &#x60;proxy&#x60;._

