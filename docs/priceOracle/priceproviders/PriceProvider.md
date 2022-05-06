# Solidity API

## PriceProvider

### changeActive

```solidity
function changeActive(address token, bool active) public virtual
```

### isActive

```solidity
function isActive(address token) public view virtual returns (bool)
```

### isListed

```solidity
function isListed(address token) public view virtual returns (bool)
```

### getPrice

```solidity
function getPrice(address token) public view virtual returns (uint256 priceMantissa, uint8 priceDecimals)
```

### getPriceSigned

```solidity
function getPriceSigned(address token, uint256 priceMantissa, uint256 validTo, bytes signature) public view virtual returns (uint256 _priceMantissa, uint8 _priceDecimals)
```

### getEvaluation

```solidity
function getEvaluation(address token, uint256 tokenAmount) public view virtual returns (uint256 evaluation)
```

### getEvaluationSigned

```solidity
function getEvaluationSigned(address token, uint256 tokenAmount, uint256 priceMantissa, uint256 validTo, bytes signature) public view virtual returns (uint256 evaluation)
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
function getPriceDecimals() public view virtual returns (uint8 priceDecimals)
```

