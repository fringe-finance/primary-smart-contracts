// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./PriceProviderAggregatorV3.sol";

/**
 * @title PriceProviderAggregatorPyth
 * @notice The PriceProviderAggregatorPyth contract is the contract that provides the functionality of getting the latest price from PythNetwork.
 * @dev Contract that provides the functionality of getting the latest price from PythNetwork. Inherit from PriceProviderAggregator.
 */
contract PriceProviderAggregatorPythV3 is PriceProviderAggregatorV3 {
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
     * @dev Calculates and update multiple the final TWAP prices of a token after update price.
     * @param token The token array needs to update the price.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     */
    function updateMultiFinalPricesWithUpdatePrice(address[] memory token, bytes32[] memory priceIds, bytes[] calldata updateData) external payable {
        _updatePrices(priceIds, updateData);
        _updateMultiFinalPrices(token);
    }

    /**
     * @dev Performs a price update if the price is no longer valid.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     */
    function updatePrices(bytes32[] memory priceIds, bytes[] calldata updateData) external payable {
        _updatePrices(priceIds, updateData);
    }

    /**
     * @dev Returns the latest price of a given token in USD after update price if price provider is pythPriceProvider.
     * @param token The address of the token to get the price of.
     * @param priceIds The priceIds need to update price.
     * @param updateData The updateData provided by PythNetwork.
     * @return priceDecimals The number of decimal places in the price of the token.
     * @return timestamp The timestamp of the price.
     * @return collateralPrice The price of the token in USD, represented as a mantissa.
     * @return capitalPrice The price of the token in USD, represented as a mantissa.
     */
    function getUpdatedPrice(
        address token,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint8 priceDecimals, uint64 timestamp, uint256 collateralPrice, uint256 capitalPrice) {
        if (tokenPriceProvider[token] == pythPriceProvider) {
            PriceProvider(pythPriceProvider).updatePrices{value: msg.value}(priceIds, updateData);
        }
        return getPrice(token);
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
        if (token.length != 0 && pythPriceProvider != address(0)) {
            (priceIds, updateFee) = PriceProvider(pythPriceProvider).getExpiredPriceFeeds(token, timeBeforeExpiration);
        }
    }

    /**
     * @dev Internal function to performs a price update if the price is no longer valid.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     */
    function _updatePrices(bytes32[] memory priceIds, bytes[] calldata updateData) internal {
        if (priceIds.length > 0 && pythPriceProvider != address(0)) {
            PriceProvider(pythPriceProvider).updatePrices{value: msg.value}(priceIds, updateData);
        } else {
            require(msg.value == 0, "PriceProviderAggregatorPyth: Msg.value!=0!");
        }
    }
}
