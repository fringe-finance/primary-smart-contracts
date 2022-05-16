# IPriceProviderAggregator









## Methods

### MODERATOR_ROLE

```solidity
function MODERATOR_ROLE() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### changeActive

```solidity
function changeActive(address priceProvider, address token, bool active) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| priceProvider | address | undefined |
| token | address | undefined |
| active | bool | undefined |

### getEvaluation

```solidity
function getEvaluation(address token, uint256 tokenAmount) external view returns (uint256 evaluation)
```



*returns the USD evaluation of token by its `tokenAmount`*

#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | the address of token to evaluate |
| tokenAmount | uint256 | the amount of token to evaluate |

#### Returns

| Name | Type | Description |
|---|---|---|
| evaluation | uint256 | undefined |

### getEvaluationSigned

```solidity
function getEvaluationSigned(address token, uint256 tokenAmount, uint256 priceMantissa, uint8 priceDecimals, uint256 validTo, bytes signature) external view returns (uint256 evaluation)
```



*returns the USD evaluation of token by its `tokenAmount`*

#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | the address of token |
| tokenAmount | uint256 | the amount of token including decimals |
| priceMantissa | uint256 | - the price of token (used in verifying the signature) |
| priceDecimals | uint8 | - the price decimals (used in verifying the signature) |
| validTo | uint256 | - the timestamp in seconds (used in verifying the signature) |
| signature | bytes | - the backend signature of secp256k1. length is 65 bytes |

#### Returns

| Name | Type | Description |
|---|---|---|
| evaluation | uint256 | undefined |

### getPrice

```solidity
function getPrice(address token) external view returns (uint256 priceMantissa, uint8 priceDecimals)
```

price = priceMantissa / (10 ** priceDecimals)

*returns tuple (priceMantissa, priceDecimals)*

#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | the address of token wich price is to return |

#### Returns

| Name | Type | Description |
|---|---|---|
| priceMantissa | uint256 | undefined |
| priceDecimals | uint8 | undefined |

### getPriceSigned

```solidity
function getPriceSigned(address token, uint256 _priceMantissa, uint8 _priceDecimals, uint256 validTo, bytes signature) external view returns (uint256 priceMantissa, uint8 priceDecimals)
```



*returns the price of token multiplied by 10 ** priceDecimals given by price provider. price can be calculated as  priceMantissa / (10 ** priceDecimals) i.e. price = priceMantissa / (10 ** priceDecimals)*

#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | the address of token |
| _priceMantissa | uint256 | - the price of token (used in verifying the signature) |
| _priceDecimals | uint8 | - the price decimals (used in verifying the signature) |
| validTo | uint256 | - the timestamp in seconds (used in verifying the signature) |
| signature | bytes | - the backend signature of secp256k1. length is 65 bytes |

#### Returns

| Name | Type | Description |
|---|---|---|
| priceMantissa | uint256 | undefined |
| priceDecimals | uint8 | undefined |

### grandModerator

```solidity
function grandModerator(address newModerator) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| newModerator | address | undefined |

### initialize

```solidity
function initialize() external nonpayable
```






### revokeModerator

```solidity
function revokeModerator(address moderator) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| moderator | address | undefined |

### setTokenAndPriceProvider

```solidity
function setTokenAndPriceProvider(address token, address priceProvider, bool hasFunctionWithSign) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | undefined |
| priceProvider | address | undefined |
| hasFunctionWithSign | bool | undefined |

### tokenPriceProvider

```solidity
function tokenPriceProvider(address projectToken) external view returns (address priceProvider, bool hasSignedFunction)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| projectToken | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| priceProvider | address | undefined |
| hasSignedFunction | bool | undefined |

### usdDecimals

```solidity
function usdDecimals() external view returns (uint8)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint8 | undefined |



## Events

### ChangeActive

```solidity
event ChangeActive(address indexed who, address indexed priceProvider, address indexed token, bool active)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| who `indexed` | address | undefined |
| priceProvider `indexed` | address | undefined |
| token `indexed` | address | undefined |
| active  | bool | undefined |

### GrandModeratorRole

```solidity
event GrandModeratorRole(address indexed who, address indexed newModerator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| who `indexed` | address | undefined |
| newModerator `indexed` | address | undefined |

### RevokeModeratorRole

```solidity
event RevokeModeratorRole(address indexed who, address indexed moderator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| who `indexed` | address | undefined |
| moderator `indexed` | address | undefined |

### SetTokenAndPriceProvider

```solidity
event SetTokenAndPriceProvider(address indexed who, address indexed token, address indexed priceProvider)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| who `indexed` | address | undefined |
| token `indexed` | address | undefined |
| priceProvider `indexed` | address | undefined |



