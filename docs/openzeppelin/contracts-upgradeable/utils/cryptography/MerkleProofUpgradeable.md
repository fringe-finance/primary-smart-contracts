# Solidity API

## MerkleProofUpgradeable

_These functions deal with verification of Merkle Trees proofs.

The proofs can be generated using the JavaScript library
https://github.com/miguelmota/merkletreejs[merkletreejs].
Note: the hashing algorithm should be keccak256 and pair sorting should be enabled.

See &#x60;test/utils/cryptography/MerkleProof.test.js&#x60; for some examples._

### verify

```solidity
function verify(bytes32[] proof, bytes32 root, bytes32 leaf) internal pure returns (bool)
```

_Returns true if a &#x60;leaf&#x60; can be proved to be a part of a Merkle tree
defined by &#x60;root&#x60;. For this, a &#x60;proof&#x60; must be provided, containing
sibling hashes on the branch from the leaf to the root of the tree. Each
pair of leaves and each pair of pre-images are assumed to be sorted._

