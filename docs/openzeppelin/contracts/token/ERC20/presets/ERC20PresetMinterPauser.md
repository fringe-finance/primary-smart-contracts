# Solidity API

## ERC20PresetMinterPauser

_{ERC20} token, including:

 - ability for holders to burn (destroy) their tokens
 - a minter role that allows for token minting (creation)
 - a pauser role that allows to stop all token transfers

This contract uses {AccessControl} to lock permissioned functions using the
different roles - head to its documentation for details.

The account that deploys the contract will be granted the minter and pauser
roles, as well as the default admin role, which will let it grant both minter
and pauser roles to other accounts._

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

### PAUSER_ROLE

```solidity
bytes32 PAUSER_ROLE
```

### constructor

```solidity
constructor(string name, string symbol) public
```

_Grants &#x60;DEFAULT_ADMIN_ROLE&#x60;, &#x60;MINTER_ROLE&#x60; and &#x60;PAUSER_ROLE&#x60; to the
account that deploys the contract.

See {ERC20-constructor}._

### mint

```solidity
function mint(address to, uint256 amount) public virtual
```

_Creates &#x60;amount&#x60; new tokens for &#x60;to&#x60;.

See {ERC20-_mint}.

Requirements:

- the caller must have the &#x60;MINTER_ROLE&#x60;._

### pause

```solidity
function pause() public virtual
```

_Pauses all token transfers.

See {ERC20Pausable} and {Pausable-_pause}.

Requirements:

- the caller must have the &#x60;PAUSER_ROLE&#x60;._

### unpause

```solidity
function unpause() public virtual
```

_Unpauses all token transfers.

See {ERC20Pausable} and {Pausable-_unpause}.

Requirements:

- the caller must have the &#x60;PAUSER_ROLE&#x60;._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual
```

