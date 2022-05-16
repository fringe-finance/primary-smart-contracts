# IERC2981Upgradeable







*Interface for the NFT Royalty Standard*

## Methods

### royaltyInfo

```solidity
function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount)
```



*Called with the sale price to determine how much royalty is owed and to whom.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| tokenId | uint256 | - the NFT asset queried for royalty information |
| salePrice | uint256 | - the sale price of the NFT asset specified by `tokenId` |

#### Returns

| Name | Type | Description |
|---|---|---|
| receiver | address | - address of who should be sent the royalty payment |
| royaltyAmount | uint256 | - the royalty payment amount for `salePrice` |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) external view returns (bool)
```



*Returns true if this contract implements the interface defined by `interfaceId`. See the corresponding https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[EIP section] to learn more about how these ids are created. This function call must use less than 30 000 gas.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| interfaceId | bytes4 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |




