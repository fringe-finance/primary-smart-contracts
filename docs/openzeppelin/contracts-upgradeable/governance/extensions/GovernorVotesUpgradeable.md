# GovernorVotesUpgradeable







*Extension of {Governor} for voting weight extraction from an {ERC20Votes} token. _Available since v4.3._*

## Methods

### BALLOT_TYPEHASH

```solidity
function BALLOT_TYPEHASH() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### COUNTING_MODE

```solidity
function COUNTING_MODE() external pure returns (string)
```

module:voting

*A description of the possible `support` values for {castVote} and the way these votes are counted, meant to be consumed by UIs to show correct vote options and interpret the results. The string is a URL-encoded sequence of key-value pairs that each describe one aspect, for example `support=bravo&amp;quorum=for,abstain`. There are 2 standard keys: `support` and `quorum`. - `support=bravo` refers to the vote options 0 = For, 1 = Against, 2 = Abstain, as in `GovernorBravo`. - `quorum=bravo` means that only For votes are counted towards quorum. - `quorum=for,abstain` means that both For and Abstain votes are counted towards quorum. NOTE: The string can be decoded by the standard https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams[`URLSearchParams`] JavaScript class.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### castVote

```solidity
function castVote(uint256 proposalId, uint8 support) external nonpayable returns (uint256)
```



*See {IGovernor-castVote}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| proposalId | uint256 | undefined |
| support | uint8 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### castVoteBySig

```solidity
function castVoteBySig(uint256 proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s) external nonpayable returns (uint256)
```



*See {IGovernor-castVoteBySig}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| proposalId | uint256 | undefined |
| support | uint8 | undefined |
| v | uint8 | undefined |
| r | bytes32 | undefined |
| s | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### castVoteWithReason

```solidity
function castVoteWithReason(uint256 proposalId, uint8 support, string reason) external nonpayable returns (uint256)
```



*See {IGovernor-castVoteWithReason}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| proposalId | uint256 | undefined |
| support | uint8 | undefined |
| reason | string | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### execute

```solidity
function execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) external payable returns (uint256)
```



*See {IGovernor-execute}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| targets | address[] | undefined |
| values | uint256[] | undefined |
| calldatas | bytes[] | undefined |
| descriptionHash | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getVotes

```solidity
function getVotes(address account, uint256 blockNumber) external view returns (uint256)
```

Read the voting weight from the token&#39;s built in snapshot mechanism (see {IGovernor-getVotes}).



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |
| blockNumber | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### hasVoted

```solidity
function hasVoted(uint256 proposalId, address account) external view returns (bool)
```

module:voting

*Returns weither `account` has cast a vote on `proposalId`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| proposalId | uint256 | undefined |
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### hashProposal

```solidity
function hashProposal(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) external pure returns (uint256)
```



*See {IGovernor-hashProposal}. The proposal id is produced by hashing the RLC encoded `targets` array, the `values` array, the `calldatas` array and the descriptionHash (bytes32 which itself is the keccak256 hash of the description string). This proposal id can be produced from the proposal data which is part of the {ProposalCreated} event. It can even be computed in advance, before the proposal is submitted. Note that the chainId and the governor address are not part of the proposal id computation. Consequently, the same proposal (with same operation and same description) will have the same id if submitted on multiple governors accross multiple networks. This also means that in order to execute the same operation twice (on the same governor) the proposer will have to change the description in order to avoid proposal id conflicts.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| targets | address[] | undefined |
| values | uint256[] | undefined |
| calldatas | bytes[] | undefined |
| descriptionHash | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### name

```solidity
function name() external view returns (string)
```



*See {IGovernor-name}.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### proposalDeadline

```solidity
function proposalDeadline(uint256 proposalId) external view returns (uint256)
```



*See {IGovernor-proposalDeadline}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| proposalId | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### proposalSnapshot

```solidity
function proposalSnapshot(uint256 proposalId) external view returns (uint256)
```



*See {IGovernor-proposalSnapshot}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| proposalId | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### propose

```solidity
function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) external nonpayable returns (uint256)
```



*See {IGovernor-propose}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| targets | address[] | undefined |
| values | uint256[] | undefined |
| calldatas | bytes[] | undefined |
| description | string | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### quorum

```solidity
function quorum(uint256 blockNumber) external view returns (uint256)
```

module:user-config

*Minimum number of cast voted required for a proposal to be successful. Note: The `blockNumber` parameter corresponds to the snaphot used for counting vote. This allows to scale the quroum depending on values such as the totalSupply of a token at this block (see {ERC20Votes}).*

#### Parameters

| Name | Type | Description |
|---|---|---|
| blockNumber | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### state

```solidity
function state(uint256 proposalId) external view returns (enum IGovernorUpgradeable.ProposalState)
```



*See {IGovernor-state}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| proposalId | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | enum IGovernorUpgradeable.ProposalState | undefined |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) external view returns (bool)
```



*See {IERC165-supportsInterface}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| interfaceId | bytes4 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### token

```solidity
function token() external view returns (contract ERC20VotesUpgradeable)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ERC20VotesUpgradeable | undefined |

### version

```solidity
function version() external view returns (string)
```



*See {IGovernor-version}.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### votingDelay

```solidity
function votingDelay() external view returns (uint256)
```

module:user-config

*delay, in number of block, between the proposal is created and the vote starts. This can be increassed to leave time for users to buy voting power, of delegate it, before the voting of a proposal starts.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### votingPeriod

```solidity
function votingPeriod() external view returns (uint256)
```

module:user-config

*delay, in number of blocks, between the vote start and vote ends. Note: the {votingDelay} can delay the start of the vote. This must be considered when setting the voting duration compared to the voting delay.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |



## Events

### ProposalCanceled

```solidity
event ProposalCanceled(uint256 proposalId)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| proposalId  | uint256 | undefined |

### ProposalCreated

```solidity
event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| proposalId  | uint256 | undefined |
| proposer  | address | undefined |
| targets  | address[] | undefined |
| values  | uint256[] | undefined |
| signatures  | string[] | undefined |
| calldatas  | bytes[] | undefined |
| startBlock  | uint256 | undefined |
| endBlock  | uint256 | undefined |
| description  | string | undefined |

### ProposalExecuted

```solidity
event ProposalExecuted(uint256 proposalId)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| proposalId  | uint256 | undefined |

### VoteCast

```solidity
event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| voter `indexed` | address | undefined |
| proposalId  | uint256 | undefined |
| support  | uint8 | undefined |
| weight  | uint256 | undefined |
| reason  | string | undefined |



