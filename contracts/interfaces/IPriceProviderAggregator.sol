//SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IPriceProviderAggregator {

    /****************** Moderator functions ****************** */

    /**
     * @dev Sets price provider to `token` and its corresponding price provider.
     * @param token the address of token.
     * @param priceProvider the address of price provider. Should implement the interface of `PriceProvider`.
     * @param hasFunctionWithSign true - if price provider has function with signatures.
     *                            false - if price provider does not have function with signatures.
     */
    function setTokenAndPriceProvider(address token, address priceProvider, bool hasFunctionWithSign) external;

    /**
     * @dev Allows the moderator to change the active status of a price provider for a specific token.
     * @param priceProvider The address of the price provider to change the active status for.
     * @param token The address of the token to change the active status for.
     * @param active The new active status to set for the price provider.
     */
    function changeActive(address priceProvider, address token, bool active) external;

    /****************** main functions ****************** */

    /**
     * @dev returns tuple (priceMantissa, priceDecimals).
     * price = priceMantissa / (10 ** priceDecimals)
     * @param token the address of token wich price is to return
     */
    function getPrice(address token) external view returns (uint256 priceMantissa, uint8 priceDecimals);

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
     * @param token the address of token to evaluate.
     * @param tokenAmount the amount of token to evaluate.
     */
    function getEvaluation(address token, uint256 tokenAmount) external view returns (uint256 evaluation);

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

    /**
     * @dev Perform a price update if the price is no longer valid.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     */
    function updatePrices(bytes32[] memory priceIds, bytes[] calldata updateData) external payable;
}
