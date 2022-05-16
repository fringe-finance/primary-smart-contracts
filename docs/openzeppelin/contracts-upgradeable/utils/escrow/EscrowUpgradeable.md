# EscrowUpgradeable



> Escrow



*Base escrow contract, holds funds designated for a payee until they withdraw them. Intended usage: This contract (and derived escrow contracts) should be a standalone contract, that only interacts with the contract that instantiated it. That way, it is guaranteed that all Ether will be handled according to the `Escrow` rules, and there is no need to check for payable functions or transfers in the inheritance tree. The contract that uses the escrow as its payment method should be its owner, and provide public methods redirecting to the escrow&#39;s deposit and withdraw.*

## Methods

### deposit

```solidity
function deposit(address payee) external payable
```



*Stores the sent amount as credit to be withdrawn.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| payee | address | The destination address of the funds. |

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

### Withdrawn

```solidity
event Withdrawn(address indexed payee, uint256 weiAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| payee `indexed` | address | undefined |
| weiAmount  | uint256 | undefined |



