# Solidity API

## ChainlinkPriceProvider

Chainlink price provider

### MODERATOR_ROLE

```solidity
bytes32 MODERATOR_ROLE
```

### DESCRIPTION

```solidity
string DESCRIPTION
```

### usdDecimals

```solidity
uint8 usdDecimals
```

### chainlinkMetadata

```solidity
mapping(address &#x3D;&gt; struct ChainlinkPriceProvider.ChainlinkMetadata) chainlinkMetadata
```

### ChainlinkMetadata

```solidity
struct ChainlinkMetadata {
  bool isActive;
  address[] aggregatorPath;
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

### SetTokenAndAggregator

```solidity
event SetTokenAndAggregator(address who, address token, address[] aggeregatorPath)
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

### setTokenAndAggregator

```solidity
function setTokenAndAggregator(address token, address[] aggregatorPath) public
```

### changeActive

```solidity
function changeActive(address token, bool active) public
```

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
function getPrice(address token) public view returns (uint256 priceMantissa, uint8 priceDecimals)
```

Returns the latest asset price mantissa and price decimals
[price] &#x3D; USD/token

_First step is get priceMantissa with priceDecimals by this formula:
     price &#x3D; 1 * 10 ** tokenDecimals * (chainlinkPrice_1 / 10 ** priceDecimals_1) * ... * (chainlinkPrice_n / 10 ** priceDecimals_n) &#x3D; 
           &#x3D; 10 ** tokenDecimals (chainlinkPrice_1 * ... * chainlinkPrice_n) / 10 ** (priceDecimals_1 + ... + priceDecimals_n)
     Second step is scale priceMantissa to usdDecimals_

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the token address |

### getEvaluation

```solidity
function getEvaluation(address token, uint256 tokenAmount) public view returns (uint256 evaluation)
```

returns the equivalent amount in USD

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of token |
| tokenAmount | uint256 | the amount of token |

### getPriceDecimals

```solidity
function getPriceDecimals() public view returns (uint8)
```

