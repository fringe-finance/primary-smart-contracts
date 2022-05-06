# Solidity API

## ERC721URIStorage

_ERC721 token with storage based token URI management._

### _tokenURIs

```solidity
mapping(uint256 &#x3D;&gt; string) _tokenURIs
```

### tokenURI

```solidity
function tokenURI(uint256 tokenId) public view virtual returns (string)
```

_See {IERC721Metadata-tokenURI}._

### _setTokenURI

```solidity
function _setTokenURI(uint256 tokenId, string _tokenURI) internal virtual
```

_Sets &#x60;_tokenURI&#x60; as the tokenURI of &#x60;tokenId&#x60;.

Requirements:

- &#x60;tokenId&#x60; must exist._

### _burn

```solidity
function _burn(uint256 tokenId) internal virtual
```

_Destroys &#x60;tokenId&#x60;.
The approval is cleared when the token is burned.

Requirements:

- &#x60;tokenId&#x60; must exist.

Emits a {Transfer} event._

