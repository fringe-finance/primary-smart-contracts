# Solidity API

## BEther

CToken which wraps Ether

### constructor

```solidity
constructor(contract Bondtroller bondtroller_, contract InterestRateModel interestRateModel_, uint256 initialExchangeRateMantissa_, string name_, string symbol_, uint8 decimals_, address payable admin_) public
```

Construct a new CEther money market

| Name | Type | Description |
| ---- | ---- | ----------- |
| bondtroller_ | contract Bondtroller | The address of the Comptroller |
| interestRateModel_ | contract InterestRateModel | The address of the interest rate model |
| initialExchangeRateMantissa_ | uint256 | The initial exchange rate, scaled by 1e18 |
| name_ | string | ERC-20 name of this token |
| symbol_ | string | ERC-20 symbol of this token |
| decimals_ | uint8 | ERC-20 decimal precision of this token |
| admin_ | address payable | Address of the administrator of this token |

### mint

```solidity
function mint() external payable
```

Sender supplies assets into the market and receives cTokens in exchange

_Reverts upon any failure_

### redeem

```solidity
function redeem(uint256 redeemTokens) external returns (uint256)
```

Sender redeems cTokens in exchange for the underlying asset

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| redeemTokens | uint256 | The number of cTokens to redeem into underlying |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### redeemUnderlying

```solidity
function redeemUnderlying(uint256 redeemAmount) external returns (uint256)
```

Sender redeems cTokens in exchange for a specified amount of underlying asset

_Accrues interest whether or not the operation succeeds, unless reverted_

| Name | Type | Description |
| ---- | ---- | ----------- |
| redeemAmount | uint256 | The amount of underlying to redeem |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### borrow

```solidity
function borrow(uint256 borrowAmount) external returns (uint256)
```

Sender borrows assets from the protocol to their own address

| Name | Type | Description |
| ---- | ---- | ----------- |
| borrowAmount | uint256 | The amount of the underlying asset to borrow |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### repayBorrow

```solidity
function repayBorrow() external payable
```

Sender repays their own borrow

_Reverts upon any failure_

### repayBorrowBehalf

```solidity
function repayBorrowBehalf(address borrower) external payable
```

Sender repays a borrow belonging to borrower

_Reverts upon any failure_

| Name | Type | Description |
| ---- | ---- | ----------- |
| borrower | address | the account with the debt being payed off |

### _addReserves

```solidity
function _addReserves() external payable returns (uint256)
```

The sender adds to reserves.

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### fallback

```solidity
fallback() external payable
```

Send Ether to CEther to mint

### receive

```solidity
receive() external payable
```

### getCashPrior

```solidity
function getCashPrior() internal view returns (uint256)
```

Gets balance of this contract in terms of Ether, before this message

_This excludes the value of the current message, if any_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The quantity of Ether owned by this contract |

### doTransferIn

```solidity
function doTransferIn(address from, uint256 amount) internal returns (uint256)
```

Perform the actual transfer in, which is a no-op

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | Address sending the Ether |
| amount | uint256 | Amount of Ether being sent |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The actual amount of Ether transferred |

### doTransferOut

```solidity
function doTransferOut(address payable to, uint256 amount) internal
```

_Performs a transfer out, ideally returning an explanatory error code upon failure tather than reverting.
 If caller has not called checked protocol&#x27;s balance, may revert due to insufficient cash held in the contract.
 If caller has checked protocol&#x27;s balance, and verified it is &gt;&#x3D; amount, this should not revert in normal conditions.
/
    f_

### requireNoError

```solidity
function requireNoError(uint256 errCode, string message) internal pure
```

