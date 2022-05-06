# Solidity API

## BackendPriceProvider

Backend price verifier.

### TRUSTED_BACKEND_ROLE

```solidity
bytes32 TRUSTED_BACKEND_ROLE
```

### DESCRIPTION

```solidity
string DESCRIPTION
```

### usdDecimals

```solidity
uint8 usdDecimals
```

### backendMetadata

```solidity
mapping(address &#x3D;&gt; struct BackendPriceProvider.BackendMetadata) backendMetadata
```

### BackendMetadata

```solidity
struct BackendMetadata {
  bool isListed;
  bool isActive;
}
```

### GrandTrustedBackendRole

```solidity
event GrandTrustedBackendRole(address who, address newTrustedBackend)
```

### RevokeTrustedBackendRole

```solidity
event RevokeTrustedBackendRole(address who, address trustedBackend)
```

### SetToken

```solidity
event SetToken(address who, address token)
```

### ChangeActive

```solidity
event ChangeActive(address who, address token, bool active)
```

### initialize

```solidity
function initialize() public
```

### onlyAdmin

```solidity
modifier onlyAdmin()
```

### onlyTrustedBackend

```solidity
modifier onlyTrustedBackend()
```

### grandTrustedBackendRole

```solidity
function grandTrustedBackendRole(address newTrustedBackend) public
```

### revokeTrustedBackendRole

```solidity
function revokeTrustedBackendRole(address trustedBackend) public
```

### setToken

```solidity
function setToken(address token) public
```

### changeActive

```solidity
function changeActive(address token, bool active) public
```

### getMessageHash

```solidity
function getMessageHash(address token, uint256 priceMantissa, uint256 validTo) public pure returns (bytes32)
```

1. step. Backend creates offchain data and get hash of this data. This data calls message.

_returns the keccak256 of concatenated input data_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of asset |
| priceMantissa | uint256 | the price of asset that include decimals |
| validTo | uint256 | the unix timestamp in seconds that define the validity of given price to &#x60;validTo&#x60; timestamp |

### getEthSignedMessageHash

```solidity
function getEthSignedMessageHash(bytes32 messageHash) public pure returns (bytes32)
```

2. step. Backend formatting the message and get hash of this message.

_returns the keccak256 of formatted message_

| Name | Type | Description |
| ---- | ---- | ----------- |
| messageHash | bytes32 | the keccak256 of message |

### verify

```solidity
function verify(address token, uint256 priceMantissa, uint256 validTo, bytes signature) public view returns (bool)
```

4. step. Smart contract verify the message (tuple)

_returns true if the message is signed by trusted backend. Else returns false._

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of asset |
| priceMantissa | uint256 | the price of asset that include decimals |
| validTo | uint256 | the unix timestamp in seconds that define the validity of given price to &#x60;validTo&#x60; timestamp |
| signature | bytes | the sign of message. |

### recoverSigner

```solidity
function recoverSigner(bytes32 ethSignedMessageHash, bytes signature) public pure returns (address)
```

_returns the signer of &#x60;ethSignedMessageHash&#x60;_

### isListed

```solidity
function isListed(address token) public view returns (bool)
```

### isActive

```solidity
function isActive(address token) public view returns (bool)
```

### getPrice

```solidity
function getPrice(address token) public pure returns (uint256 price, uint8 priceDecimals)
```

Returns the latest asset price and price decimals

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the token address |

### getPriceSigned

```solidity
function getPriceSigned(address token, uint256 priceMantissa, uint256 validTo, bytes signature) public view returns (uint256 _priceMantissa, uint8 priceDecimals)
```

### getEvaluation

```solidity
function getEvaluation(address token, uint256 tokenAmount) public pure returns (uint256 evaluation)
```

### getEvaluationSigned

```solidity
function getEvaluationSigned(address token, uint256 tokenAmount, uint256 priceMantissa, uint256 validTo, bytes signature) public view returns (uint256 evaluation)
```

_return the evaluation in $ of &#x60;tokenAmount&#x60; with signed price_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token to get evaluation in $ |
| tokenAmount | uint256 | the amount of token to get evaluation. Amount is scaled by 10 in power token decimals |
| priceMantissa | uint256 | the price multiplied by priceDecimals. The dimension of priceMantissa should be $/token |
| validTo | uint256 | the timestamp in seconds, when price is gonna be not valid. |
| signature | bytes | the ECDSA sign on eliptic curve secp256k1. |

### getPriceDecimals

```solidity
function getPriceDecimals() public view returns (uint8)
```

