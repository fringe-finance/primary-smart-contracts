//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IPriceProviderAggregatorV2 {
    
    function MODERATOR_ROLE() external view returns(bytes32);
    
    function tokenPriceProvider(address token) external view returns(address priceProvider);

    function twapEnabledForAsset(address token) external view returns(bool);

    /****************** Admin functions ****************** */

    function grandModerator(address newModerator) external;

    function revokeModerator(address moderator) external;

    /****************** end Admin functions ****************** */

    /****************** Moderator functions ****************** */

    /**
     * @dev sets price provider to `token`
     * @param token the address of token
     * @param priceProvider the address of price provider. Should implememnt the interface of `PriceProvider`
     */
    function setTokenAndPriceProvider(address token, address priceProvider) external;

    /**
     * @dev changes the active state of `token` in `priceProvider`
     * @param priceProvider the address of price provider. Should implememnt the interface of `PriceProvider`
     * @param token the address of token
     * @param active the new active state
     */
    function changeActive(address priceProvider, address token, bool active) external;

    /**
     * @dev sets TWAP enabled state for `token`
     * @param token the address of token
     * @param enabled the new TWAP enabled state
     */
    function setTwapEnabledForAsset(address token, bool enabled) external;

    /****************** main functions ****************** */

    /**
     * @dev updates the most recent TWAP price of a token.
     * @param token The address of the token.
     */
    function updatePrice(address token) external;

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