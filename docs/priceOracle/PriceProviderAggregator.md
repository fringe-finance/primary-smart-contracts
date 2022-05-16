# PriceProviderAggregator









## Methods

### DEFAULT_ADMIN_ROLE

```solidity
function DEFAULT_ADMIN_ROLE() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

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
function getEvaluationSigned(address token, uint256 tokenAmount, uint256 priceMantissa, uint256 validTo, bytes signature) external view returns (uint256 evaluation)
```



*returns the USD evaluation of token by its `tokenAmount`*

#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | the address of token |
| tokenAmount | uint256 | the amount of token including decimals |
| priceMantissa | uint256 | - the price of token (used in verifying the signature) |
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
function getPriceSigned(address token, uint256 priceMantissa, uint256 validTo, bytes signature) external view returns (uint256 priceMantissa_, uint8 priceDecimals)
```



*returns the tupple (priceMantissa, priceDecimals) of token multiplied by 10 ** priceDecimals given by price provider. price can be calculated as  priceMantissa / (10 ** priceDecimals) i.e. price = priceMantissa / (10 ** priceDecimals)*

#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | the address of token |
| priceMantissa | uint256 | - the price of token (used in verifying the signature) |
| validTo | uint256 | - the timestamp in seconds (used in verifying the signature) |
| signature | bytes | - the backend signature of secp256k1. length is 65 bytes |

#### Returns

| Name | Type | Description |
|---|---|---|
| priceMantissa_ | uint256 | undefined |
| priceDecimals | uint8 | undefined |

### getRoleAdmin

```solidity
function getRoleAdmin(bytes32 role) external view returns (bytes32)
```



*Returns the admin role that controls `role`. See {grantRole} and {revokeRole}. To change a role&#39;s admin, use {_setRoleAdmin}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### grandModerator

```solidity
function grandModerator(address newModerator) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| newModerator | address | undefined |

### grantRole

```solidity
function grantRole(bytes32 role, address account) external nonpayable
```



*Grants `role` to `account`. If `account` had not been already granted `role`, emits a {RoleGranted} event. Requirements: - the caller must have ``role``&#39;s admin role.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### hasRole

```solidity
function hasRole(bytes32 role, address account) external view returns (bool)
```



*Returns `true` if `account` has been granted `role`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### initialize

```solidity
function initialize() external nonpayable
```






### renounceRole

```solidity
function renounceRole(bytes32 role, address account) external nonpayable
```



*Revokes `role` from the calling account. Roles are often managed via {grantRole} and {revokeRole}: this function&#39;s purpose is to provide a mechanism for accounts to lose their privileges if they are compromised (such as when a trusted device is misplaced). If the calling account had been granted `role`, emits a {RoleRevoked} event. Requirements: - the caller must be `account`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### revokeModerator

```solidity
function revokeModerator(address moderator) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| moderator | address | undefined |

### revokeRole

```solidity
function revokeRole(bytes32 role, address account) external nonpayable
```



*Revokes `role` from `account`. If `account` had been granted `role`, emits a {RoleRevoked} event. Requirements: - the caller must have ``role``&#39;s admin role.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### setTokenAndPriceProvider

```solidity
function setTokenAndPriceProvider(address token, address priceProvider, bool hasFunctionWithSign) external nonpayable
```



*sets price provider to `token`*

#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | the address of token |
| priceProvider | address | the address of price provider. Should implememnt the interface of `PriceProvider` |
| hasFunctionWithSign | bool | true - if price provider has function with signatures                            false - if price provider does not have function with signatures |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) external view returns (bool)
```



*See {IERC165-supportsInterface}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| interfaceId | bytes4 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### tokenPriceProvider

```solidity
function tokenPriceProvider(address) external view returns (address priceProvider, bool hasSignedFunction)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

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

### RoleAdminChanged

```solidity
event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| previousAdminRole `indexed` | bytes32 | undefined |
| newAdminRole `indexed` | bytes32 | undefined |

### RoleGranted

```solidity
event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| account `indexed` | address | undefined |
| sender `indexed` | address | undefined |

### RoleRevoked

```solidity
event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| account `indexed` | address | undefined |
| sender `indexed` | address | undefined |

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



