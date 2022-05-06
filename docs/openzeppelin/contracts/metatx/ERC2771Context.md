# Solidity API

## ERC2771Context

_Context variant with ERC2771 support._

### _trustedForwarder

```solidity
address _trustedForwarder
```

### constructor

```solidity
constructor(address trustedForwarder) internal
```

### isTrustedForwarder

```solidity
function isTrustedForwarder(address forwarder) public view virtual returns (bool)
```

### _msgSender

```solidity
function _msgSender() internal view virtual returns (address sender)
```

### _msgData

```solidity
function _msgData() internal view virtual returns (bytes)
```

