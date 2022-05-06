# Solidity API

## PriceProviderAggregator

### MODERATOR_ROLE

```solidity
bytes32 MODERATOR_ROLE
```

### usdDecimals

```solidity
uint8 usdDecimals
```

### tokenPriceProvider

```solidity
mapping(address &#x3D;&gt; struct PriceProviderAggregator.PriceProviderInfo) tokenPriceProvider
```

### PriceProviderInfo

```solidity
struct PriceProviderInfo {
  address priceProvider;
  bool hasSignedFunction;
}
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
function initialize() public
```

### onlyAdmin

```solidity
modifier onlyAdmin()
```

### onlyModerator

```solidity
modifier onlyModerator()
```

### grandModerator

```solidity
function grandModerator(address newModerator) public
```

### revokeModerator

```solidity
function revokeModerator(address moderator) public
```

### setTokenAndPriceProvider

```solidity
function setTokenAndPriceProvider(address token, address priceProvider, bool hasFunctionWithSign) public
```

_sets price provider to &#x60;token&#x60;_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token |
| priceProvider | address | the address of price provider. Should implememnt the interface of &#x60;PriceProvider&#x60; |
| hasFunctionWithSign | bool | true - if price provider has function with signatures                            false - if price provider does not have function with signatures |

### changeActive

```solidity
function changeActive(address priceProvider, address token, bool active) public
```

### getPrice

```solidity
function getPrice(address token) public view returns (uint256 priceMantissa, uint8 priceDecimals)
```

price &#x3D; priceMantissa / (10 ** priceDecimals)

_returns tuple (priceMantissa, priceDecimals)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token wich price is to return |

### getPriceSigned

```solidity
function getPriceSigned(address token, uint256 priceMantissa, uint256 validTo, bytes signature) public view returns (uint256 priceMantissa_, uint8 priceDecimals)
```

_returns the tupple (priceMantissa, priceDecimals) of token multiplied by 10 ** priceDecimals given by price provider.
price can be calculated as  priceMantissa / (10 ** priceDecimals)
i.e. price &#x3D; priceMantissa / (10 ** priceDecimals)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token |
| priceMantissa | uint256 | - the price of token (used in verifying the signature) |
| validTo | uint256 | - the timestamp in seconds (used in verifying the signature) |
| signature | bytes | - the backend signature of secp256k1. length is 65 bytes |

### getEvaluation

```solidity
function getEvaluation(address token, uint256 tokenAmount) public view returns (uint256 evaluation)
```

_returns the USD evaluation of token by its &#x60;tokenAmount&#x60;_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token to evaluate |
| tokenAmount | uint256 | the amount of token to evaluate |

### getEvaluationSigned

```solidity
function getEvaluationSigned(address token, uint256 tokenAmount, uint256 priceMantissa, uint256 validTo, bytes signature) public view returns (uint256 evaluation)
```

_returns the USD evaluation of token by its &#x60;tokenAmount&#x60;_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token |
| tokenAmount | uint256 | the amount of token including decimals |
| priceMantissa | uint256 | - the price of token (used in verifying the signature) |
| validTo | uint256 | - the timestamp in seconds (used in verifying the signature) |
| signature | bytes | - the backend signature of secp256k1. length is 65 bytes |

