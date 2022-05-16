# ChainlinkPriceProvider





Chainlink price provider



## Methods

### DEFAULT_ADMIN_ROLE

```solidity
function DEFAULT_ADMIN_ROLE() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### DESCRIPTION

```solidity
function DESCRIPTION() external view returns (string)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### MODERATOR_ROLE

```solidity
function MODERATOR_ROLE() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### chainlinkMetadata

```solidity
function chainlinkMetadata(address) external view returns (bool isActive)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| isActive | bool | undefined |

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

returns the equivalent amount in USD



#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | the address of token |
| tokenAmount | uint256 | the amount of token  |

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

Returns the latest asset price mantissa and price decimals[price] = USD/token

*First step is get priceMantissa with priceDecimals by this formula:      price = 1 * 10 ** tokenDecimals * (chainlinkPrice_1 / 10 ** priceDecimals_1) * ... * (chainlinkPrice_n / 10 ** priceDecimals_n) =             = 10 ** tokenDecimals (chainlinkPrice_1 * ... * chainlinkPrice_n) / 10 ** (priceDecimals_1 + ... + priceDecimals_n)      Second step is scale priceMantissa to usdDecimals*

#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | the token address |

#### Returns

| Name | Type | Description |
|---|---|---|
| priceMantissa | uint256 | undefined |
| priceDecimals | uint8 | undefined |

### getPriceDecimals

```solidity
function getPriceDecimals() external view returns (uint8)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint8 | undefined |

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

### setTokenAndAggregator

```solidity
function setTokenAndAggregator(address token, address[] aggregatorPath) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | undefined |
| aggregatorPath | address[] | undefined |

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
event ChangeActive(address indexed who, address indexed token, bool active)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| who `indexed` | address | undefined |
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

### SetTokenAndAggregator

```solidity
event SetTokenAndAggregator(address indexed who, address indexed token, address[] aggeregatorPath)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| who `indexed` | address | undefined |
| token `indexed` | address | undefined |
| aggeregatorPath  | address[] | undefined |



