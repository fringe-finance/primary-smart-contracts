# Solidity API

## IERC2981Upgradeable

_Interface for the NFT Royalty Standard_

### royaltyInfo

```solidity
function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount)
```

_Called with the sale price to determine how much royalty is owed and to whom._

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | - the NFT asset queried for royalty information |
| salePrice | uint256 | - the sale price of the NFT asset specified by &#x60;tokenId&#x60; |

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiver | address | - address of who should be sent the royalty payment |
| royaltyAmount | uint256 | - the royalty payment amount for &#x60;salePrice&#x60; |

