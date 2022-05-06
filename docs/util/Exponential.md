# Solidity API

## Exponential

Exp is a struct which stores decimals with a fixed precision of 18 decimal places.
        Thus, if we wanted to store the 5.1, mantissa would store 5.1e18. That is:
        &#x60;Exp({mantissa: 5100000000000000000})&#x60;.

_Legacy contract for compatibility reasons with existing contracts that still use MathError_

### getExp

```solidity
function getExp(uint256 num, uint256 denom) internal pure returns (enum CarefulMath.MathError, struct ExponentialNoError.Exp)
```

_Creates an exponential from numerator and denominator values.
     Note: Returns an error if (&#x60;num&#x60; * 10e18) &gt; MAX_INT,
           or if &#x60;denom&#x60; is zero._

### addExp

```solidity
function addExp(struct ExponentialNoError.Exp a, struct ExponentialNoError.Exp b) internal pure returns (enum CarefulMath.MathError, struct ExponentialNoError.Exp)
```

_Adds two exponentials, returning a new exponential._

### subExp

```solidity
function subExp(struct ExponentialNoError.Exp a, struct ExponentialNoError.Exp b) internal pure returns (enum CarefulMath.MathError, struct ExponentialNoError.Exp)
```

_Subtracts two exponentials, returning a new exponential._

### mulScalar

```solidity
function mulScalar(struct ExponentialNoError.Exp a, uint256 scalar) internal pure returns (enum CarefulMath.MathError, struct ExponentialNoError.Exp)
```

_Multiply an Exp by a scalar, returning a new Exp._

### mulScalarTruncate

```solidity
function mulScalarTruncate(struct ExponentialNoError.Exp a, uint256 scalar) internal pure returns (enum CarefulMath.MathError, uint256)
```

_Multiply an Exp by a scalar, then truncate to return an unsigned integer._

### mulScalarTruncateAddUInt

```solidity
function mulScalarTruncateAddUInt(struct ExponentialNoError.Exp a, uint256 scalar, uint256 addend) internal pure returns (enum CarefulMath.MathError, uint256)
```

_Multiply an Exp by a scalar, truncate, then add an to an unsigned integer, returning an unsigned integer._

### divScalar

```solidity
function divScalar(struct ExponentialNoError.Exp a, uint256 scalar) internal pure returns (enum CarefulMath.MathError, struct ExponentialNoError.Exp)
```

_Divide an Exp by a scalar, returning a new Exp._

### divScalarByExp

```solidity
function divScalarByExp(uint256 scalar, struct ExponentialNoError.Exp divisor) internal pure returns (enum CarefulMath.MathError, struct ExponentialNoError.Exp)
```

_Divide a scalar by an Exp, returning a new Exp._

### divScalarByExpTruncate

```solidity
function divScalarByExpTruncate(uint256 scalar, struct ExponentialNoError.Exp divisor) internal pure returns (enum CarefulMath.MathError, uint256)
```

_Divide a scalar by an Exp, then truncate to return an unsigned integer._

### mulExp

```solidity
function mulExp(struct ExponentialNoError.Exp a, struct ExponentialNoError.Exp b) internal pure returns (enum CarefulMath.MathError, struct ExponentialNoError.Exp)
```

_Multiplies two exponentials, returning a new exponential._

### mulExp

```solidity
function mulExp(uint256 a, uint256 b) internal pure returns (enum CarefulMath.MathError, struct ExponentialNoError.Exp)
```

_Multiplies two exponentials given their mantissas, returning a new exponential._

### mulExp3

```solidity
function mulExp3(struct ExponentialNoError.Exp a, struct ExponentialNoError.Exp b, struct ExponentialNoError.Exp c) internal pure returns (enum CarefulMath.MathError, struct ExponentialNoError.Exp)
```

_Multiplies three exponentials, returning a new exponential._

### divExp

```solidity
function divExp(struct ExponentialNoError.Exp a, struct ExponentialNoError.Exp b) internal pure returns (enum CarefulMath.MathError, struct ExponentialNoError.Exp)
```

_Divides two exponentials, returning a new exponential.
    (a/scale) / (b/scale) &#x3D; (a/scale) * (scale/b) &#x3D; a/b,
 which we can scale as an Exp by calling getExp(a.mantissa, b.mantissa)_

