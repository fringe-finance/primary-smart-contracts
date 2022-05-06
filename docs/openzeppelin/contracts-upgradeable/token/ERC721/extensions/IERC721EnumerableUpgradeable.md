# Solidity API

## IERC721EnumerableUpgradeable

_See https://eips.ethereum.org/EIPS/eip-721_

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

_Returns the total amount of tokens stored by the contract._

### tokenOfOwnerByIndex

```solidity
function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId)
```

_Returns a token ID owned by &#x60;owner&#x60; at a given &#x60;index&#x60; of its token list.
Use along with {balanceOf} to enumerate all of &#x60;&#x60;owner&#x60;&#x60;&#x27;s tokens._

### tokenByIndex

```solidity
function tokenByIndex(uint256 index) external view returns (uint256)
```

_Returns a token ID at a given &#x60;index&#x60; of all the tokens stored by the contract.
Use along with {totalSupply} to enumerate all tokens._

