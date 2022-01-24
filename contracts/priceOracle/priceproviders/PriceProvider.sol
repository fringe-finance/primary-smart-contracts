// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

abstract contract PriceProvider {

    function changeActive(address token, bool active) public virtual {}

    /****************** view functions ****************** */

    function isActive(address token) public virtual view returns(bool) {}

    function isListed(address token) public virtual view returns(bool) {}

    function getPrice(address token) public virtual view returns(uint256 priceMantissa, uint8 priceDecimals) {}

    function getPriceSigned(address token, uint256 priceMantissa, uint8 priceDecimals, uint256 validTo, bytes memory signature) public virtual view returns(uint256 _priceMantissa, uint8 _priceDecimals) {}

    function getEvaluation(address token, uint256 tokenAmount) public virtual view returns(uint256 evaluation) {}

    function getEvaluationSigned(address token, uint256 tokenAmount, uint256 priceMantissa, uint8 priceDecimals, uint256 validTo, bytes memory signature) public virtual view returns(uint256 evaluation) {}

}