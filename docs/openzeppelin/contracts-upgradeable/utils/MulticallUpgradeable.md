# Solidity API

## MulticallUpgradeable

_Provides a function to batch together multiple calls in a single external call.

_Available since v4.1.__

### __Multicall_init

```solidity
function __Multicall_init() internal
```

### __Multicall_init_unchained

```solidity
function __Multicall_init_unchained() internal
```

### multicall

```solidity
function multicall(bytes[] data) external returns (bytes[] results)
```

_Receives and executes a batch of function calls on this contract._

### _functionDelegateCall

```solidity
function _functionDelegateCall(address target, bytes data) private returns (bytes)
```

_Same as {xref-Address-functionCall-address-bytes-string-}[&#x60;functionCall&#x60;],
but performing a delegate call.

_Available since v3.4.__

### __gap

```solidity
uint256[50] __gap
```

