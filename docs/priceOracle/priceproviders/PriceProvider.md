# PriceProvider









## Methods

### changeActive

```solidity
function changeActive(address token, bool active) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | undefined |
| active | bool | undefined |

### getEvaluation

```solidity
function getEvaluation(address token, uint256 tokenAmount) external view returns (uint256 evaluation)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | undefined |
| tokenAmount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| evaluation | uint256 | undefined |

### getEvaluationSigned

```solidity
function getEvaluationSigned(address token, uint256 tokenAmount, uint256 priceMantissa, uint256 validTo, bytes signature) external view returns (uint256 evaluation)
```



*return the evaluation in $ of `tokenAmount` with signed price*

#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | the address of token to get evaluation in $ |
| tokenAmount | uint256 | the amount of token to get evaluation. Amount is scaled by 10 in power token decimals |
| priceMantissa | uint256 | the price multiplied by priceDecimals. The dimension of priceMantissa should be $/token |
| validTo | uint256 | the timestamp in seconds, when price is gonna be not valid. |
| signature | bytes | the ECDSA sign on eliptic curve secp256k1.         |

#### Returns

| Name | Type | Description |
|---|---|---|
| evaluation | uint256 | undefined |

### getPrice

```solidity
function getPrice(address token) external view returns (uint256 priceMantissa, uint8 priceDecimals)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| priceMantissa | uint256 | undefined |
| priceDecimals | uint8 | undefined |

### getPriceDecimals

```solidity
function getPriceDecimals() external view returns (uint8 priceDecimals)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| priceDecimals | uint8 | undefined |

### getPriceSigned

```solidity
function getPriceSigned(address token, uint256 priceMantissa, uint256 validTo, bytes signature) external view returns (uint256 _priceMantissa, uint8 _priceDecimals)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | undefined |
| priceMantissa | uint256 | undefined |
| validTo | uint256 | undefined |
| signature | bytes | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _priceMantissa | uint256 | undefined |
| _priceDecimals | uint8 | undefined |

### isActive

```solidity
function isActive(address token) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### isListed

```solidity
function isListed(address token) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |




