# Solidity API

## IPriceProviderAggregator

### MODERATOR_ROLE

```solidity
function MODERATOR_ROLE() external view returns (bytes32)
```

### usdDecimals

```solidity
function usdDecimals() external view returns (uint8)
```

### tokenPriceProvider

```solidity
function tokenPriceProvider(address projectToken) external view returns (address priceProvider, bool hasSignedFunction)
```

### GrandModeratorRole

```solidity
event GrandModeratorRole(address who, address newModerator)
```

### RevokeModeratorRole

```solidity
event RevokeModeratorRole(address who, address moderator)
```

### SetTokenAndPriceProvider

```solidity
event SetTokenAndPriceProvider(address who, address token, address priceProvider)
```

### ChangeActive

```solidity
event ChangeActive(address who, address priceProvider, address token, bool active)
```

### initialize

```solidity
function initialize() external
```

### grandModerator

```solidity
function grandModerator(address newModerator) external
```

### revokeModerator

```solidity
function revokeModerator(address moderator) external
```

### setTokenAndPriceProvider

```solidity
function setTokenAndPriceProvider(address token, address priceProvider, bool hasFunctionWithSign) external
```

### changeActive

```solidity
function changeActive(address priceProvider, address token, bool active) external
```

### getPrice

```solidity
function getPrice(address token) external view returns (uint256 priceMantissa, uint8 priceDecimals)
```

price &#x3D; priceMantissa / (10 ** priceDecimals)

_returns tuple (priceMantissa, priceDecimals)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token wich price is to return |

### getPriceSigned

```solidity
function getPriceSigned(address token, uint256 _priceMantissa, uint8 _priceDecimals, uint256 validTo, bytes signature) external view returns (uint256 priceMantissa, uint8 priceDecimals)
```

_returns the price of token multiplied by 10 ** priceDecimals given by price provider.
price can be calculated as  priceMantissa / (10 ** priceDecimals)
i.e. price &#x3D; priceMantissa / (10 ** priceDecimals)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token |
| _priceMantissa | uint256 | - the price of token (used in verifying the signature) |
| _priceDecimals | uint8 | - the price decimals (used in verifying the signature) |
| validTo | uint256 | - the timestamp in seconds (used in verifying the signature) |
| signature | bytes | - the backend signature of secp256k1. length is 65 bytes |

### getEvaluation

```solidity
function getEvaluation(address token, uint256 tokenAmount) external view returns (uint256 evaluation)
```

_returns the USD evaluation of token by its &#x60;tokenAmount&#x60;_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token to evaluate |
| tokenAmount | uint256 | the amount of token to evaluate |

### getEvaluationSigned

```solidity
function getEvaluationSigned(address token, uint256 tokenAmount, uint256 priceMantissa, uint8 priceDecimals, uint256 validTo, bytes signature) external view returns (uint256 evaluation)
```

_returns the USD evaluation of token by its &#x60;tokenAmount&#x60;_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token |
| tokenAmount | uint256 | the amount of token including decimals |
| priceMantissa | uint256 | - the price of token (used in verifying the signature) |
| priceDecimals | uint8 | - the price decimals (used in verifying the signature) |
| validTo | uint256 | - the timestamp in seconds (used in verifying the signature) |
| signature | bytes | - the backend signature of secp256k1. length is 65 bytes |

