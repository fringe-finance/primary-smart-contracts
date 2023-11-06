# BondtrollerV5Storage

## Overview

#### License: MIT

## 

```solidity
contract BondtrollerV5Storage is BondtrollerV4Storage
```


## State variables info

### compContributorSpeeds (0x986ab838)

```solidity
mapping(address => uint256) compContributorSpeeds
```

The portion of COMP that each contributor receives per block
### lastContributorBlock (0xbea6b8b8)

```solidity
mapping(address => uint256) lastContributorBlock
```

Last block at which a contributor's COMP rewards have been allocated