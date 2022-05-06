# Solidity API

## ReentrancyGuardUpgradeable

_Contract module that helps prevent reentrant calls to a function.

Inheriting from &#x60;ReentrancyGuard&#x60; will make the {nonReentrant} modifier
available, which can be applied to functions to make sure there are no nested
(reentrant) calls to them.

Note that because there is a single &#x60;nonReentrant&#x60; guard, functions marked as
&#x60;nonReentrant&#x60; may not call one another. This can be worked around by making
those functions &#x60;private&#x60;, and then adding &#x60;external&#x60; &#x60;nonReentrant&#x60; entry
points to them.

TIP: If you would like to learn more about reentrancy and alternative ways
to protect against it, check out our blog post
https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul]._

### _NOT_ENTERED

```solidity
uint256 _NOT_ENTERED
```

### _ENTERED

```solidity
uint256 _ENTERED
```

### _status

```solidity
uint256 _status
```

### __ReentrancyGuard_init

```solidity
function __ReentrancyGuard_init() internal
```

### __ReentrancyGuard_init_unchained

```solidity
function __ReentrancyGuard_init_unchained() internal
```

### nonReentrant

```solidity
modifier nonReentrant()
```

_Prevents a contract from calling itself, directly or indirectly.
Calling a &#x60;nonReentrant&#x60; function from another &#x60;nonReentrant&#x60;
function is not supported. It is possible to prevent this from happening
by making the &#x60;nonReentrant&#x60; function external, and make it call a
&#x60;private&#x60; function that does the actual work._

### __gap

```solidity
uint256[49] __gap
```

