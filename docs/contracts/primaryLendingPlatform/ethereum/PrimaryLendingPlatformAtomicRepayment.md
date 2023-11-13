# PrimaryLendingPlatformAtomicRepayment

## Overview

#### License: MIT

## 

```solidity
contract PrimaryLendingPlatformAtomicRepayment is PrimaryLendingPlatformAtomicRepaymentCore
```

The PrimaryLendingPlatformAtomicRepayment contract is the contract that allows users to repay loans atomically.

Contract that allows users to repay loans atomically using the Augustus Paraswap exchange aggregator. Inherit from PrimaryLendingPlatformAtomicRepaymentCore.
## Functions info

### repayAtomic (0xfd13d38e)

```solidity
function repayAtomic(
    address prjToken,
    uint256 collateralAmount,
    bytes memory buyCalldata,
    bool isRepayFully
) external nonReentrant
```

Repays a loan atomically using the given project token as collateral.

Repays the loan in a single atomic transaction.

Requirements:
- The project token is listed on the platform.
- The lending token is listed on the platform.
- Collateral amount must be greater than 0.
- The user must have a position for the given project token and lending token.

Effects:
- Transfers the collateral amount from the user to the contract.
- Approves the collateral amount to the primary lending platform contract.
- Calculates the total outstanding amount for the user, project token, and lending token.
- Buys the lending token from the exchange aggregator.
- Deposits the collateral amount back to the primary lending platform contract.
- Approves the lending token amount to the primary lending platform contract.
- Repays the lending token amount to the primary lending platform contract.
- Transfers the remaining lending token amount to the user.
- Defers the liquidity check for the user, project token, and lending token.


Parameters:

| Name             | Type    | Description                                                  |
| :--------------- | :------ | :----------------------------------------------------------- |
| prjToken         | address | The address of the project token.                            |
| collateralAmount | uint256 | The amount of collateral to be repaid.                       |
| buyCalldata      | bytes   | The calldata for buying the project token.                   |
| isRepayFully     | bool    | A boolean indicating whether to fully repay the loan or not. |
