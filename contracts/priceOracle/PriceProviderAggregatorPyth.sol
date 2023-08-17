// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./PriceProviderAggregator.sol";

contract PriceProviderAggregatorPyth is PriceProviderAggregator {
    address public pythPriceProvider;

    event SetPythPriceProvider(address indexed newPythPriceProvider);

    /**
     * @notice Set PythPriceProvider contract.
     * @param newPythPriceProvider The address of PythPriceProvider contract.
     */
    function setPythPriceProvider(address newPythPriceProvider) external onlyModerator {
        require(newPythPriceProvider != address(0), "PriceProviderAggregatorPyth: Invalid pythPriceProvider");
        pythPriceProvider = newPythPriceProvider;
        emit SetPythPriceProvider(newPythPriceProvider);
    }

    /**
     * @notice Perform a price update if the price is no longer valid.
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
     * @notice Returns the priceId array to update the price before expiration and the update fee.
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
}
