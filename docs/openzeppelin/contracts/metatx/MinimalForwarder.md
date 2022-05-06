# Solidity API

## MinimalForwarder

_Simple minimal forwarder to be used together with an ERC2771 compatible contract. See {ERC2771Context}._

### ForwardRequest

```solidity
struct ForwardRequest {
  address from;
  address to;
  uint256 value;
  uint256 gas;
  uint256 nonce;
  bytes data;
}
```

### _TYPEHASH

```solidity
bytes32 _TYPEHASH
```

### _nonces

```solidity
mapping(address &#x3D;&gt; uint256) _nonces
```

### constructor

```solidity
constructor() public
```

### getNonce

```solidity
function getNonce(address from) public view returns (uint256)
```

### verify

```solidity
function verify(struct MinimalForwarder.ForwardRequest req, bytes signature) public view returns (bool)
```

### execute

```solidity
function execute(struct MinimalForwarder.ForwardRequest req, bytes signature) public payable returns (bool, bytes)
```

