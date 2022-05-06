# Solidity API

## UUPSUpgradeable

_An upgradeability mechanism designed for UUPS proxies. The functions included here can perform an upgrade of an
{ERC1967Proxy}, when this contract is set as the implementation behind such a proxy.

A security mechanism ensures that an upgrade does not turn off upgradeability accidentally, although this risk is
reinstated if the upgrade retains upgradeability but removes the security mechanism, e.g. by replacing
&#x60;UUPSUpgradeable&#x60; with a custom implementation of upgrades.

The {_authorizeUpgrade} function must be overridden to include access restriction to the upgrade mechanism.

_Available since v4.1.__

### __UUPSUpgradeable_init

```solidity
function __UUPSUpgradeable_init() internal
```

### __UUPSUpgradeable_init_unchained

```solidity
function __UUPSUpgradeable_init_unchained() internal
```

### upgradeTo

```solidity
function upgradeTo(address newImplementation) external virtual
```

_Upgrade the implementation of the proxy to &#x60;newImplementation&#x60;.

Calls {_authorizeUpgrade}.

Emits an {Upgraded} event._

### upgradeToAndCall

```solidity
function upgradeToAndCall(address newImplementation, bytes data) external payable virtual
```

_Upgrade the implementation of the proxy to &#x60;newImplementation&#x60;, and subsequently execute the function call
encoded in &#x60;data&#x60;.

Calls {_authorizeUpgrade}.

Emits an {Upgraded} event._

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address newImplementation) internal virtual
```

_Function that should revert when &#x60;msg.sender&#x60; is not authorized to upgrade the contract. Called by
{upgradeTo} and {upgradeToAndCall}.

Normally, this function will use an xref:access.adoc[access control] modifier such as {Ownable-onlyOwner}.

&#x60;&#x60;&#x60;solidity
function _authorizeUpgrade(address) internal override onlyOwner {}
&#x60;&#x60;&#x60;_

### __gap

```solidity
uint256[50] __gap
```

