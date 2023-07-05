// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

abstract contract PriceProviderV2 {

    function changeActive(address token, bool active) public virtual {}

    /****************** view functions ****************** */

    function isActive(address token) public virtual view returns(bool) {}

    function isListed(address token) public virtual view returns(bool) {}

    function getPrice(address token) public virtual view returns(uint256 priceMantissa, uint8 priceDecimals) {}

    function getPriceDecimals() public virtual view returns (uint8 priceDecimals) {}
}