// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../PrimaryLendingPlatformLiquidationCore.sol";
import "../../interfaces/IPriceProviderAggregator.sol";

/**
 * @title PrimaryLendingPlatformLiquidationZksync.
 * @notice The PrimaryLendingPlatformLiquidationZksync contract is the contract that allows users to liquidate positions for zksync network.
 * @dev Contract that allows users to liquidate positions. Inherit from PrimaryLendingPlatformLiquidationCore.
 */
contract PrimaryLendingPlatformLiquidationZksync is PrimaryLendingPlatformLiquidationCore {
    /**
     * @notice Liquidates a user's position based on the specified lending token amount and update related token's prices.
     * @dev The function to be called when a user wants to liquidate their position.
     *
     * Requirements:
     * - The project token is listed on the platform.
     * - The lending token is listed on the platform.
     * - The lending token amount must be greater than 0.
     * - The user must have a position for the given project token and lending token.
     * - The health factor must be less than 1.
     * - `_lendingTokenAmount` must be within the permissible range of liquidation amount.
     *
     * Effects:
     * - Update price of related tokens.
     * - Calculates the health factor of the position using `getCurrentHealthFactor` function.
     * - Validates the health factor and ensures it's less than 1.
     * - Calculates the permissible liquidation range using `getLiquidationAmount` function.
     * - Validates `lendingTokenAmount` against the permissible range.
     * - Determines the amount of project token to send to the liquidator.
     * - Distributes rewards to the liquidator.
     * @param _account The address of the borrower
     * @param _projectToken The address of the project token
     * @param _lendingToken The address of the lending token
     * @param _lendingTokenAmount The amount of lending tokens to be used for liquidation
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     */
    function liquidate(
        address _account,
        address _projectToken,
        address _lendingToken,
        uint256 _lendingTokenAmount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isProjectTokenListed(_projectToken) isLendingTokenListed(_lendingToken) nonReentrant {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        _liquidate(_account, _projectToken, _lendingToken, _lendingTokenAmount, msg.sender);
    }

    /**
     * @dev Liquidates a portion of the borrower's debt using the lending token, called by a related contract and update related token's prices.
     *
     * Requirements:
     * - The project token is listed on the platform.
     * - The lending token is listed on the platform.
     * - Called by a related contract.
     * - The lending token amount must be greater than 0.
     * - The user must have a position for the given project token and lending token.
     * - The health factor must be less than 1.
     * - `_lendingTokenAmount` must be within the permissible range of liquidation amount.
     *
     * Effects:
     * - Update price of related tokens.
     * - Calculates the health factor of the position using `getCurrentHealthFactor` function.
     * - Validates the health factor and ensures it's less than 1.
     * - Calculates the permissible liquidation range using `getLiquidationAmount` function.
     * - Validates `lendingTokenAmount` against the permissible range.
     * - Determines the amount of project token to send to the liquidator.
     * - Distributes rewards to the liquidator.
     * @param _account The address of the borrower
     * @param _projectToken The address of the project token
     * @param _lendingToken The address of the lending token
     * @param _lendingTokenAmount The amount of lending tokens to be used for liquidation
     * @param liquidator The address of the liquidator
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return The amount of project tokens sent to the liquidator as a result of the liquidation.
     */
    function liquidateFromModerator(
        address _account,
        address _projectToken,
        address _lendingToken,
        uint256 _lendingTokenAmount,
        address liquidator,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isProjectTokenListed(_projectToken) isLendingTokenListed(_lendingToken) onlyRelatedContracts nonReentrant returns (uint256) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return _liquidate(_account, _projectToken, _lendingToken, _lendingTokenAmount, liquidator);
    }
}
