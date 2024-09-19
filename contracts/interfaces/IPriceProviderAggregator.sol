//SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IPriceProviderAggregator {

    /****************** Moderator functions ****************** */

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

    /**@dev This function is called when performing operations using token prices, to determine which tokens will need to update their final price.
     * @param projectToken Address of the project token.
     * @param actualLendingToken Address of the lending token.
     * @param isBorrow Whether getting the list of tokens for updateFinalPrices is related to the borrowing operation or not.
     * @return tokens Array of tokens that need to update final price.
     */
    function getTokensUpdateFinalPrices(
        address projectToken,
        address actualLendingToken,
        bool isBorrow
    ) external view returns (address[] memory tokens);

    /**
     * @dev Returns priceProvider address.
     * @param token The address of token which address of priceProvider is to return.
     */
    function tokenPriceProvider(address token) external view returns(address priceProvider); 
    
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
}
