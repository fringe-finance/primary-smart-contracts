# Solidity API

## SignedSafeMathUpgradeable

_Wrappers over Solidity&#x27;s arithmetic operations.

NOTE: &#x60;SignedSafeMath&#x60; is no longer needed starting with Solidity 0.8. The compiler
now has built in overflow checking._

### mul

```solidity
function mul(int256 a, int256 b) internal pure returns (int256)
```

_Returns the multiplication of two signed integers, reverting on
overflow.

Counterpart to Solidity&#x27;s &#x60;*&#x60; operator.

Requirements:

- Multiplication cannot overflow._

### div

```solidity
function div(int256 a, int256 b) internal pure returns (int256)
```

_Returns the integer division of two signed integers. Reverts on
division by zero. The result is rounded towards zero.

Counterpart to Solidity&#x27;s &#x60;/&#x60; operator.

Requirements:

- The divisor cannot be zero._

### sub

```solidity
function sub(int256 a, int256 b) internal pure returns (int256)
```

_Returns the subtraction of two signed integers, reverting on
overflow.

Counterpart to Solidity&#x27;s &#x60;-&#x60; operator.

Requirements:

- Subtraction cannot overflow._

### add

```solidity
function add(int256 a, int256 b) internal pure returns (int256)
```

_Returns the addition of two signed integers, reverting on
overflow.

Counterpart to Solidity&#x27;s &#x60;+&#x60; operator.

Requirements:

- Addition cannot overflow._

