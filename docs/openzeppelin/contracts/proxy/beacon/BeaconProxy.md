# Solidity API

## BeaconProxy

_This contract implements a proxy that gets the implementation address for each call from a {UpgradeableBeacon}.

The beacon address is stored in storage slot &#x60;uint256(keccak256(&#x27;eip1967.proxy.beacon&#x27;)) - 1&#x60;, so that it doesn&#x27;t
conflict with the storage layout of the implementation behind the proxy.

_Available since v3.4.__

### constructor

```solidity
constructor(address beacon, bytes data) public payable
```

_Initializes the proxy with &#x60;beacon&#x60;.

If &#x60;data&#x60; is nonempty, it&#x27;s used as data in a delegate call to the implementation returned by the beacon. This
will typically be an encoded function call, and allows initializating the storage of the proxy like a Solidity
constructor.

Requirements:

- &#x60;beacon&#x60; must be a contract with the interface {IBeacon}._

### _beacon

```solidity
function _beacon() internal view virtual returns (address)
```

_Returns the current beacon address._

### _implementation

```solidity
function _implementation() internal view virtual returns (address)
```

_Returns the current implementation address of the associated beacon._

### _setBeacon

```solidity
function _setBeacon(address beacon, bytes data) internal virtual
```

_Changes the proxy to use a new beacon. Deprecated: see {_upgradeBeaconToAndCall}.

If &#x60;data&#x60; is nonempty, it&#x27;s used as data in a delegate call to the implementation returned by the beacon.

Requirements:

- &#x60;beacon&#x60; must be a contract.
- The implementation returned by &#x60;beacon&#x60; must be a contract._

