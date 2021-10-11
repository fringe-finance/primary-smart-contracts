// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;


import "./PriceOracle.sol";
import "../bToken/BErc20.sol";
import "../../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";


contract SimplePriceOracle is Initializable, OwnableUpgradeable, PriceOracle {
    mapping(address => uint) prices;
    event PricePosted(address asset, uint previousPriceMantissa, uint requestedPriceMantissa, uint newPriceMantissa);

    function init() public initializer{
        __Ownable_init();
    }

    function getUnderlyingPrice(BToken bToken) public override view returns (uint) {
        if (compareStrings(bToken.symbol(), "bETH")) {
            return 1e18;
        } else {
            return prices[address(BErc20(address(bToken)).underlying())];
        }
    }

    function setUnderlyingPrice(BToken bToken, uint underlyingPriceMantissa) public onlyOwner {
        address asset = address(BErc20(address(bToken)).underlying());
        emit PricePosted(asset, prices[asset], underlyingPriceMantissa, underlyingPriceMantissa);
        prices[asset] = underlyingPriceMantissa;
    }

    function setDirectPrice(address asset, uint price) public onlyOwner {
        emit PricePosted(asset, prices[asset], price, price);
        prices[asset] = price;
    }

    // v1 price oracle interface for use as backing of proxy
    function assetPrices(address asset) external view returns (uint) {
        return prices[asset];
    }

    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }
}
