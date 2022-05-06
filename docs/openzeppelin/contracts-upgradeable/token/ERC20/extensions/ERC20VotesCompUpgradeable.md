# Solidity API

## ERC20VotesCompUpgradeable

_Extension of ERC20 to support Compound&#x27;s voting and delegation. This version exactly matches Compound&#x27;s
interface, with the drawback of only supporting supply up to (2^96^ - 1).

NOTE: You should use this contract if you need exact compatibility with COMP (for example in order to use your token
with Governor Alpha or Bravo) and if you are sure the supply cap of 2^96^ is enough for you. Otherwise, use the
{ERC20Votes} variant of this module.

This extension keeps a history (checkpoints) of each account&#x27;s vote power. Vote power can be delegated either
by calling the {delegate} function directly, or by providing a signature to be used with {delegateBySig}. Voting
power can be queried through the public accessors {getCurrentVotes} and {getPriorVotes}.

By default, token balance does not account for voting power. This makes transfers cheaper. The downside is that it
requires users to delegate to themselves in order to activate checkpoints and have their voting power tracked.
Enabling self-delegation can easily be done by overriding the {delegates} function. Keep in mind however that this
will significantly increase the base gas cost of transfers.

_Available since v4.2.__

### __ERC20VotesComp_init_unchained

```solidity
function __ERC20VotesComp_init_unchained() internal
```

### getCurrentVotes

```solidity
function getCurrentVotes(address account) external view returns (uint96)
```

_Comp version of the {getVotes} accessor, with &#x60;uint96&#x60; return type._

### getPriorVotes

```solidity
function getPriorVotes(address account, uint256 blockNumber) external view returns (uint96)
```

_Comp version of the {getPastVotes} accessor, with &#x60;uint96&#x60; return type._

### _maxSupply

```solidity
function _maxSupply() internal view virtual returns (uint224)
```

_Maximum token supply. Reduced to &#x60;type(uint96).max&#x60; (2^96^ - 1) to fit COMP interface._

### __gap

```solidity
uint256[50] __gap
```

