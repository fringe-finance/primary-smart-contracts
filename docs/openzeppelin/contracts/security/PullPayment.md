# Solidity API

## PullPayment

_Simple implementation of a
https://consensys.github.io/smart-contract-best-practices/recommendations/#favor-pull-over-push-for-external-calls[pull-payment]
strategy, where the paying contract doesn&#x27;t interact directly with the
receiver account, which must withdraw its payments itself.

Pull-payments are often considered the best practice when it comes to sending
Ether, security-wise. It prevents recipients from blocking execution, and
eliminates reentrancy concerns.

TIP: If you would like to learn more about reentrancy and alternative ways
to protect against it, check out our blog post
https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].

To use, derive from the &#x60;PullPayment&#x60; contract, and use {_asyncTransfer}
instead of Solidity&#x27;s &#x60;transfer&#x60; function. Payees can query their due
payments with {payments}, and retrieve them with {withdrawPayments}._

### _escrow

```solidity
contract Escrow _escrow
```

### constructor

```solidity
constructor() internal
```

### withdrawPayments

```solidity
function withdrawPayments(address payable payee) public virtual
```

_Withdraw accumulated payments, forwarding all gas to the recipient.

Note that _any_ account can call this function, not just the &#x60;payee&#x60;.
This means that contracts unaware of the &#x60;PullPayment&#x60; protocol can still
receive funds this way, by having a separate account call
{withdrawPayments}.

WARNING: Forwarding all gas opens the door to reentrancy vulnerabilities.
Make sure you trust the recipient, or are either following the
checks-effects-interactions pattern or using {ReentrancyGuard}._

| Name | Type | Description |
| ---- | ---- | ----------- |
| payee | address payable | Whose payments will be withdrawn. |

### payments

```solidity
function payments(address dest) public view returns (uint256)
```

_Returns the payments owed to an address._

| Name | Type | Description |
| ---- | ---- | ----------- |
| dest | address | The creditor&#x27;s address. |

### _asyncTransfer

```solidity
function _asyncTransfer(address dest, uint256 amount) internal virtual
```

_Called by the payer to store the sent amount as credit to be pulled.
Funds sent in this way are stored in an intermediate {Escrow} contract, so
there is no danger of them being spent before withdrawal._

| Name | Type | Description |
| ---- | ---- | ----------- |
| dest | address | The destination address of the funds. |
| amount | uint256 | The amount to transfer. |

