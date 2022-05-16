# PullPaymentUpgradeable







*Simple implementation of a https://consensys.github.io/smart-contract-best-practices/recommendations/#favor-pull-over-push-for-external-calls[pull-payment] strategy, where the paying contract doesn&#39;t interact directly with the receiver account, which must withdraw its payments itself. Pull-payments are often considered the best practice when it comes to sending Ether, security-wise. It prevents recipients from blocking execution, and eliminates reentrancy concerns. TIP: If you would like to learn more about reentrancy and alternative ways to protect against it, check out our blog post https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul]. To use, derive from the `PullPayment` contract, and use {_asyncTransfer} instead of Solidity&#39;s `transfer` function. Payees can query their due payments with {payments}, and retrieve them with {withdrawPayments}.*

## Methods

### payments

```solidity
function payments(address dest) external view returns (uint256)
```



*Returns the payments owed to an address.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| dest | address | The creditor&#39;s address. |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### withdrawPayments

```solidity
function withdrawPayments(address payable payee) external nonpayable
```



*Withdraw accumulated payments, forwarding all gas to the recipient. Note that _any_ account can call this function, not just the `payee`. This means that contracts unaware of the `PullPayment` protocol can still receive funds this way, by having a separate account call {withdrawPayments}. WARNING: Forwarding all gas opens the door to reentrancy vulnerabilities. Make sure you trust the recipient, or are either following the checks-effects-interactions pattern or using {ReentrancyGuard}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| payee | address payable | Whose payments will be withdrawn. |




