# Solidity API

## UniswapV2PriceProvider

UniswapV2 price provider
This implementation can be affected by price manipulation due to not using TWAP
For development purposes only

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

### uniswapV2Metadata

```solidity
mapping(address &#x3D;&gt; struct UniswapV2PriceProvider.UniswapV2Metadata) uniswapV2Metadata
```

### UniswapV2Metadata

```solidity
struct UniswapV2Metadata {
  bool isActive;
  address pair;
  address pairAsset;
  uint8 tokenDecimals;
  uint8 pairAssetDecimals;
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

### SetTokenAndPair

```solidity
event SetTokenAndPair(address who, address token, address pair)
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

### setTokenAndPair

```solidity
function setTokenAndPair(address token, address pair) public
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
function getPrice(address token) public view returns (uint256 price, uint8 priceDecimals)
```

### getEvaluation

```solidity
function getEvaluation(address token, uint256 tokenAmount) public view returns (uint256 evaluation)
```

### getReserves

```solidity
function getReserves(address uniswapPair, address tokenA, address tokenB) public view returns (uint256 reserveA, uint256 reserveB)
```

### getPriceDecimals

```solidity
function getPriceDecimals() public view returns (uint8)
```

