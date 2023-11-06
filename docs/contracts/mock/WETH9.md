# WETH9

## Overview

#### License: MIT

## 

```solidity
contract WETH9
```


## Events info

### Approval

```solidity
event Approval(address indexed src, address indexed guy, uint256 wad)
```


### Transfer

```solidity
event Transfer(address indexed src, address indexed dst, uint256 wad)
```


### Deposit

```solidity
event Deposit(address indexed dst, uint256 wad)
```


### Withdrawal

```solidity
event Withdrawal(address indexed src, uint256 wad)
```


## State variables info

### name (0x06fdde03)

```solidity
string name = "Wrapped Ether"
```


### symbol (0x95d89b41)

```solidity
string symbol = "WETH"
```


### decimals (0x313ce567)

```solidity
uint8 decimals = 18
```


### balanceOf (0x70a08231)

```solidity
mapping(address => uint256) balanceOf
```


### allowance (0xdd62ed3e)

```solidity
mapping(address => mapping(address => uint256)) allowance
```


## Functions info

### deposit (0xd0e30db0)

```solidity
function deposit() public payable
```


### withdraw (0x2e1a7d4d)

```solidity
function withdraw(uint256 wad) public
```


### totalSupply (0x18160ddd)

```solidity
function totalSupply() public view returns (uint256)
```


### approve (0x095ea7b3)

```solidity
function approve(address guy, uint256 wad) public returns (bool)
```


### transfer (0xa9059cbb)

```solidity
function transfer(address dst, uint256 wad) public returns (bool)
```


### transferFrom (0x23b872dd)

```solidity
function transferFrom(
    address src,
    address dst,
    uint256 wad
) public returns (bool)
```

