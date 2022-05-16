# RefundEscrowUpgradeable



> RefundEscrow



*Escrow that holds funds for a beneficiary, deposited from multiple parties.Intended usage: See {Escrow}. Same usage guidelines apply here.The owner account (that is, the contract that instantiates this contract) may deposit, close the deposit period, and allow for either withdrawal by the beneficiary, or refunds to the depositors. All interactions with `RefundEscrow` will be made through the owner contract.*

## Methods

### beneficiary

```solidity
function beneficiary() external view returns (address payable)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address payable | The beneficiary of the escrow. |

### beneficiaryWithdraw

```solidity
function beneficiaryWithdraw() external nonpayable
```



*Withdraws the beneficiary&#39;s funds.*


### close

```solidity
function close() external nonpayable
```



*Allows for the beneficiary to withdraw their funds, rejecting further deposits.*


### deposit

```solidity
function deposit(address refundee) external payable
```



*Stores funds that may later be refunded.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| refundee | address | The address funds will be sent to if a refund occurs. |

### depositsOf

```solidity
function depositsOf(address payee) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| payee | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### enableRefunds

```solidity
function enableRefunds() external nonpayable
```



*Allows for refunds to take place, rejecting further deposits.*


### initialize

```solidity
function initialize() external nonpayable
```






### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.*


### state

```solidity
function state() external view returns (enum RefundEscrowUpgradeable.State)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | enum RefundEscrowUpgradeable.State | The current state of the escrow. |

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined |

### withdraw

```solidity
function withdraw(address payable payee) external nonpayable
```



*Withdraw accumulated balance for a payee, forwarding all gas to the recipient. WARNING: Forwarding all gas opens the door to reentrancy vulnerabilities. Make sure you trust the recipient, or are either following the checks-effects-interactions pattern or using {ReentrancyGuard}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| payee | address payable | The address whose funds will be withdrawn and transferred to. |

### withdrawalAllowed

```solidity
function withdrawalAllowed(address) external view returns (bool)
```



*Returns whether refundees can withdraw their deposits (be refunded). The overridden function receives a &#39;payee&#39; argument, but we ignore it here since the condition is global, not per-payee.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |



## Events

### Deposited

```solidity
event Deposited(address indexed payee, uint256 weiAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| payee `indexed` | address | undefined |
| weiAmount  | uint256 | undefined |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

### RefundsClosed

```solidity
event RefundsClosed()
```






### RefundsEnabled

```solidity
event RefundsEnabled()
```






### Withdrawn

```solidity
event Withdrawn(address indexed payee, uint256 weiAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| payee `indexed` | address | undefined |
| weiAmount  | uint256 | undefined |



