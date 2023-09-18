// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title PriceProvider
 * @dev Abstract contract for a price provider that can be used by the PriceOracle contract.
 */
abstract contract PriceProvider {
    /**
     * @dev Changes the active status of a token.
     * @param token The address of the token to change the active status for.
     * @param active The new active status of the token.
     */
    function changeActive(address token, bool active) public virtual {}

    function updatePrices(bytes32[] memory priceIds, bytes[] calldata updateData) external virtual payable {
        priceIds; updateData;
        revert("PriceProvider: UpdatePrices is forbidden");
    }

    /****************** view functions ****************** */

    /**
     * @dev Returns whether a token is active or not.
     * @param token The address of the token to check.
     * @return A boolean indicating whether the token is active or not.
     */
    function isActive(address token) public virtual view returns(bool) {}

    /**
     * @dev Returns a boolean indicating whether the given token address is listed in the price provider.
     * @param token The address of the token to check.
     * @return A boolean indicating whether the token is listed or not.
     */
    function isListed(address token) public virtual view returns(bool) {}

    /**
     * @dev Returns the price of the specified token.
     * @param token The address of the token to get the price for.
     * @return priceMantissa The price of the token, represented as a mantissa.
     * @return priceDecimals The number of decimal places in the token's price.
     */
    function getPrice(address token) public virtual view returns(uint256 priceMantissa, uint8 priceDecimals) {}

    /**
     * @dev Returns the price of a token as a signed integer, along with the number of decimals for the price.
     * @param token The address of the token to get the price for.
     * @param priceMantissa The mantissa of the price to be returned.
     * @param validTo The timestamp until which the price is valid.
     * @param signature The signature of the price oracle.
     * @return _priceMantissa The price of the token as a mantissa.
     * @return _priceDecimals The number of decimals for the price.
     */
    function getPriceSigned(address token, uint256 priceMantissa, uint256 validTo, bytes memory signature) public virtual view returns(uint256 _priceMantissa, uint8 _priceDecimals) {}

    /**
     * @dev Returns the evaluation of a given token amount based on the current price.
     * @param token The address of the token to evaluate.
     * @param tokenAmount The amount of tokens to evaluate.
     * @return evaluation The evaluation of the token amount.
     */
    function getEvaluation(address token, uint256 tokenAmount) public virtual view returns(uint256 evaluation) {}
    
    /**
     * @dev Returns the evaluation of a given token amount based on the last updated price.
     * @param token The address of the token to evaluate.
     * @param tokenAmount The amount of tokens to evaluate.
     * @return evaluation The evaluation of the token amount.
     */
    function getEvaluationUnsafe(address token, uint256 tokenAmount) public virtual view returns(uint256 evaluation) {
        token; tokenAmount; evaluation;
        revert("PriceProvider: getEvaluationUnsafe is forbidden");
    }

    /**
     * @dev return the evaluation in $ of `tokenAmount` with signed price.
     * @param token the address of token to get evaluation in $.
     * @param tokenAmount the amount of token to get evaluation. Amount is scaled by 10 in power token decimals.
     * @param priceMantissa the price multiplied by priceDecimals. The dimension of priceMantissa should be $/token.
     * @param validTo the timestamp in seconds, when price is gonna be not valid.
     * @param signature the ECDSA sign on eliptic curve secp256k1.        
     */
    function getEvaluationSigned(address token, uint256 tokenAmount, uint256 priceMantissa, uint256 validTo, bytes memory signature) public virtual view returns(uint256 evaluation) {}

    /**
     * @dev Returns the number of decimal places for the price returned by the price provider.
     * @return priceDecimals The number of decimal places for the price.
     */
    function getPriceDecimals() public virtual view returns (uint8 priceDecimals) {}

    /**
     * @dev Returns the expired price feeds for the given tokens and time before expiration.
     * @param token An array of token addresses to get the expired price feeds for.
     * @param timeBeforeExpiration The time in seconds before the price feed expires.
     * @return priceIds An array of bytes32 representing the expired price feed IDs.
     * @return updateFee The fee required to update the expired price feeds.
     */
    function getExpiredPriceFeeds(address[] memory token, uint256 timeBeforeExpiration) external virtual view returns(bytes32[] memory priceIds, uint256 updateFee) {}
}