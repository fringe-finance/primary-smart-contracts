# Solidity API

## IERC777Recipient

_Interface of the ERC777TokensRecipient standard as defined in the EIP.

Accounts can be notified of {IERC777} tokens being sent to them by having a
contract implement this interface (contract holders can be their own
implementer) and registering it on the
https://eips.ethereum.org/EIPS/eip-1820[ERC1820 global registry].

See {IERC1820Registry} and {ERC1820Implementer}._

### tokensReceived

```solidity
function tokensReceived(address operator, address from, address to, uint256 amount, bytes userData, bytes operatorData) external
```

_Called by an {IERC777} token contract whenever tokens are being
moved or created into a registered account (&#x60;to&#x60;). The type of operation
is conveyed by &#x60;from&#x60; being the zero address or not.

This call occurs _after_ the token contract&#x27;s state is updated, so
{IERC777-balanceOf}, etc., can be used to query the post-operation state.

This function may revert to prevent the operation from being executed._

