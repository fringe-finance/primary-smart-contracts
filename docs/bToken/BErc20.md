# Solidity API

## BErc20

CTokens which wrap an EIP-20 underlying

### initialize

```solidity
function initialize(address underlying_, contract Bondtroller comptroller_, contract InterestRateModel interestRateModel_, uint256 initialExchangeRateMantissa_, string name_, string symbol_, uint8 decimals_) public
```

Initialize the new money market

| Name | Type | Description |
| ---- | ---- | ----------- |
| underlying_ | address | The address of the underlying asset |
| comptroller_ | contract Bondtroller | The address of the Comptroller |
| interestRateModel_ | contract InterestRateModel | The address of the interest rate model |
| initialExchangeRateMantissa_ | uint256 | The initial exchange rate, scaled by 1e18 |
| name_ | string | ERC-20 name of this token |
| symbol_ | string | ERC-20 symbol of this token |
| decimals_ | uint8 | ERC-20 decimal precision of this token |

### sweepToken

```solidity
function sweepToken(contract EIP20NonStandardInterface token) external
```

A public function to sweep accidental ERC-20 transfers to this contract. Tokens are sent to admin (timelock)

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | contract EIP20NonStandardInterface | The address of the ERC-20 token to sweep |

### _addReserves

```solidity
function _addReserves(uint256 addAmount) external returns (uint256)
```

The sender adds to reserves.

| Name | Type | Description |
| ---- | ---- | ----------- |
| addAmount | uint256 | The amount fo underlying token to add as reserves |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0&#x3D;success, otherwise a failure (see ErrorReporter.sol for details) |

### getCashPrior

```solidity
function getCashPrior() internal view returns (uint256)
```

Gets balance of this contract in terms of the underlying

_This excludes the value of the current message, if any_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The quantity of underlying tokens owned by this contract |

### doTransferIn

```solidity
function doTransferIn(address from, uint256 amount) internal returns (uint256)
```

_Similar to EIP20 transfer, except it handles a False result from &#x60;transferFrom&#x60; and reverts in that case.
     This will revert due to insufficient balance or insufficient allowance.
     This function returns the actual amount received,
     which may be less than &#x60;amount&#x60; if there is a fee attached to the transfer.

     Note: This wrapper safely handles non-standard ERC-20 tokens that do not return a value.
           See here: https://medium.com/coinmonks/missing-return-value-bug-at-least-130-tokens-affected-d67bf08521ca_

### doTransferOut

```solidity
function doTransferOut(address payable to, uint256 amount) internal
```

_Similar to EIP20 transfer, except it handles a False success from &#x60;transfer&#x60; and returns an explanatory
     error code rather than reverting. If caller has not called checked protocol&#x27;s balance, this may revert due to
     insufficient cash held in this contract. If caller has checked protocol&#x27;s balance prior to this call, and verified
     it is &gt;&#x3D; amount, this should not revert in normal conditions.

     Note: This wrapper safely handles non-standard ERC-20 tokens that do not return a value.
           See here: https://medium.com/coinmonks/missing-return-value-bug-at-least-130-tokens-affected-d67bf08521ca_

