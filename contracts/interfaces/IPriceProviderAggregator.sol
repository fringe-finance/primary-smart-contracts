//SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IPriceProviderAggregator {

    /****************** Moderator functions ****************** */

    struct PriceProviderInfo {
        address priceProvider;
        uint8 priceDecimals;
    }

    /**
     * @dev Sets price provider to `token` and its corresponding price provider.
     * @param token the address of token.
     * @param priceProvider the address of price provider. Should implement the interface of `PriceProvider`.
     * @param priceDecimals the decimals of token price.
     */
    function setTokenAndPriceProvider(address token, address priceProvider, uint8 priceDecimals) external;

    /**
     * @dev Allows the moderator to change the active status of a price provider for a specific token.
     * @param priceProvider The address of the price provider to change the active status for.
     * @param token The address of the token to change the active status for.
     * @param active The new active status to set for the price provider.
     */
    function changeActive(address priceProvider, address token, bool active) external;

    /****************** main functions ****************** */

    /**
    * @dev Calculates and update multiple the final TWAP prices of a token.
    * @param token The token array needs to update the price.
    */
    function updateMultiFinalPrices(address[] memory token) external;

    /**
     * @dev Perform a price update if the price is no longer valid.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     */
    function updatePrices(bytes32[] memory priceIds, bytes[] calldata updateData) external payable;

    /**
     * @dev Returns TWAP enabled state.
     * @param token The address of token which enabled state is to return.
     */
    function twapEnabledForAsset(address token) external returns (bool);
    
    /**
     * @dev Returns priceProvider address.
     * @param token The address of token which address of priceProvider is to return.
     */
    function tokenPriceProvider(address token) external view returns(PriceProviderInfo memory); 
    /**
     * @dev Returns the most recent TWAP price of a token.
     * @param token The address of the token.
     * @return priceDecimals The decimals of the price.
     * @return timestamp The last updated timestamp of the price.
     * @return collateralPrice The collateral price of the token.
     * @return capitalPrice The capital price of the token.
     */
    function getPrice(address token) external view returns (uint8 priceDecimals, uint32 timestamp, uint256 collateralPrice, uint256 capitalPrice);

    /**
     * @dev returns the most TWAP price in USD evaluation of token by its `tokenAmount`
     * @param token the address of token to evaluate
     * @param tokenAmount the amount of token to evaluate
     * @return collateralEvaluation the USD evaluation of token by its `tokenAmount` in collateral price
     * @return capitalEvaluation the USD evaluation of token by its `tokenAmount` in capital price
     */
    function getEvaluation(address token, uint256 tokenAmount) external view returns(uint256 collateralEvaluation, uint256 capitalEvaluation);

    /**
     * @dev returns the price of token multiplied by 10 ** priceDecimals given by price provider.
     * price can be calculated as  priceMantissa / (10 ** priceDecimals).
     * i.e. price = priceMantissa / (10 ** priceDecimals).
     * @param token the address of token.
     * @param _priceMantissa - the price of token (used in verifying the signature).
     * @param _priceDecimals - the price decimals (used in verifying the signature).
     * @param validTo - the timestamp in seconds (used in verifying the signature).
     * @param signature - the backend signature of secp256k1. length is 65 bytes.
     */
    function getPriceSigned(
        address token,
        uint256 _priceMantissa,
        uint8 _priceDecimals,
        uint256 validTo,
        bytes memory signature
    ) external view returns (uint256 priceMantissa, uint8 priceDecimals);

    /**
     * @dev Returns the USD evaluation of token by its `tokenAmount`.
     * @param token the address of token.
     * @param tokenAmount the amount of token including decimals.
     * @param priceMantissa - the price of token (used in verifying the signature).
     * @param priceDecimals - the price decimals (used in verifying the signature).
     * @param validTo - the timestamp in seconds (used in verifying the signature).
     * @param signature - the backend signature of secp256k1. length is 65 bytes.
     */
    function getEvaluationSigned(
        address token,
        uint256 tokenAmount,
        uint256 priceMantissa,
        uint8 priceDecimals,
        uint256 validTo,
        bytes memory signature
    ) external view returns (uint256 evaluation);
}
