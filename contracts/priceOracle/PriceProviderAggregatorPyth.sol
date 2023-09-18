// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./PriceProviderAggregator.sol";

/**
 * @title PriceProviderAggregatorPyth
 * @notice The PriceProviderAggregatorPyth contract is the contract that provides the functionality of getting the latest price from PythNetwork.
 * @dev Contract that provides the functionality of getting the latest price from PythNetwork. Inherit from PriceProviderAggregator.
 */
contract PriceProviderAggregatorPyth is PriceProviderAggregator {
    address public pythPriceProvider;

    /**
     * @dev Emitted when a new Pyth price provider is set.
     */
    event SetPythPriceProvider(address indexed newPythPriceProvider);

    /**
     * @dev Sets PythPriceProvider contract.
     *
     * Requirements:
     * - The caller must be the moderator.
     * - `newPythPriceProvider` must not be the zero address.
     * @param newPythPriceProvider The address of PythPriceProvider contract.
     */
    function setPythPriceProvider(address newPythPriceProvider) external onlyModerator {
        require(newPythPriceProvider != address(0), "PriceProviderAggregatorPyth: Invalid pythPriceProvider");
        pythPriceProvider = newPythPriceProvider;
        emit SetPythPriceProvider(newPythPriceProvider);
    }

    /**
     * @dev Performs a price update if the price is no longer valid.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     */
    function updatePrices(bytes32[] memory priceIds, bytes[] calldata updateData) external payable {
        if (priceIds.length > 0) {
            PriceProvider(pythPriceProvider).updatePrices{value: msg.value}(priceIds, updateData);
        } else {
            require(msg.value == 0, "PriceProviderAggregatorPyth: Msg.value!=0!");
        }
    }

    /**
     * @dev Returns the priceId array to update the price before expiration and the update fee.
     * @param token The address array of tokens needs to check if the price is about to expire.
     * @param timeBeforeExpiration Time before expiration.
     * @return priceIds The priceId array needs to update the price.
     * @return updateFee The update fee.
     */
    function getExpiredPriceFeeds(
        address[] memory token,
        uint256 timeBeforeExpiration
    ) external view returns (bytes32[] memory priceIds, uint256 updateFee) {
        (priceIds, updateFee) = PriceProvider(pythPriceProvider).getExpiredPriceFeeds(token, timeBeforeExpiration);
    }

    /**
     * @dev Returns the evaluation of a given token amount based on the last updated price.
     * @param token The address of the token to evaluate.
     * @param tokenAmount The amount of tokens to evaluate.
     * @return evaluation The evaluation of the token amount.
     */
    function getEvaluationUnsafe(address token, uint256 tokenAmount) public view returns (uint256 evaluation) {
        PriceProviderInfo memory priceProviderInfo = tokenPriceProvider[token];
        require(priceProviderInfo.hasSignedFunction == false, "PriceProviderAggregator: Call getEvaluationWithSign()");
        return PriceProvider(priceProviderInfo.priceProvider).getEvaluationUnsafe(token, tokenAmount);
    }
}
