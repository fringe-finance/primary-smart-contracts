# Solidity API

## PaymentSplitterUpgradeable

_This contract allows to split Ether payments among a group of accounts. The sender does not need to be aware
that the Ether will be split in this way, since it is handled transparently by the contract.

The split can be in equal parts or in any other arbitrary proportion. The way this is specified is by assigning each
account to a number of shares. Of all the Ether that this contract receives, each account will then be able to claim
an amount proportional to the percentage of total shares they were assigned.

&#x60;PaymentSplitter&#x60; follows a _pull payment_ model. This means that payments are not automatically forwarded to the
accounts but kept in this contract, and the actual transfer is triggered as a separate step by calling the {release}
function._

### PayeeAdded

```solidity
event PayeeAdded(address account, uint256 shares)
```

### PaymentReleased

```solidity
event PaymentReleased(address to, uint256 amount)
```

### PaymentReceived

```solidity
event PaymentReceived(address from, uint256 amount)
```

### _totalShares

```solidity
uint256 _totalShares
```

### _totalReleased

```solidity
uint256 _totalReleased
```

### _shares

```solidity
mapping(address &#x3D;&gt; uint256) _shares
```

### _released

```solidity
mapping(address &#x3D;&gt; uint256) _released
```

### _payees

```solidity
address[] _payees
```

### __PaymentSplitter_init

```solidity
function __PaymentSplitter_init(address[] payees, uint256[] shares_) internal
```

_Creates an instance of &#x60;PaymentSplitter&#x60; where each account in &#x60;payees&#x60; is assigned the number of shares at
the matching position in the &#x60;shares&#x60; array.

All addresses in &#x60;payees&#x60; must be non-zero. Both arrays must have the same non-zero length, and there must be no
duplicates in &#x60;payees&#x60;._

### __PaymentSplitter_init_unchained

```solidity
function __PaymentSplitter_init_unchained(address[] payees, uint256[] shares_) internal
```

### receive

```solidity
receive() external payable virtual
```

_The Ether received will be logged with {PaymentReceived} events. Note that these events are not fully
reliable: it&#x27;s possible for a contract to receive Ether without triggering this function. This only affects the
reliability of the events, and not the actual splitting of Ether.

To learn more about this see the Solidity documentation for
https://solidity.readthedocs.io/en/latest/contracts.html#fallback-function[fallback
functions]._

### totalShares

```solidity
function totalShares() public view returns (uint256)
```

_Getter for the total shares held by payees._

### totalReleased

```solidity
function totalReleased() public view returns (uint256)
```

_Getter for the total amount of Ether already released._

### shares

```solidity
function shares(address account) public view returns (uint256)
```

_Getter for the amount of shares held by an account._

### released

```solidity
function released(address account) public view returns (uint256)
```

_Getter for the amount of Ether already released to a payee._

### payee

```solidity
function payee(uint256 index) public view returns (address)
```

_Getter for the address of the payee number &#x60;index&#x60;._

### release

```solidity
function release(address payable account) public virtual
```

_Triggers a transfer to &#x60;account&#x60; of the amount of Ether they are owed, according to their percentage of the
total shares and their previous withdrawals._

### _addPayee

```solidity
function _addPayee(address account, uint256 shares_) private
```

_Add a new payee to the contract._

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the payee to add. |
| shares_ | uint256 | The number of shares owned by the payee. |

### __gap

```solidity
uint256[45] __gap
```

