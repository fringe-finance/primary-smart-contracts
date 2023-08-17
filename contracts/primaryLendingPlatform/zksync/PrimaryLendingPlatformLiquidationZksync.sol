// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../PrimaryLendingPlatformLiquidationCore.sol";
import "../../interfaces/IPriceProviderAggregator.sol";

contract PrimaryLendingPlatformLiquidationZksync is PrimaryLendingPlatformLiquidationCore {
    /**
     * @notice Liquidates a portion of the borrower's debt using the lending token.
     * @param _account The address of the borrower
     * @param _projectToken The address of the project token
     * @param _lendingToken The address of the lending token
     * @param _lendingTokenAmount The amount of lending tokens to be used for liquidation
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
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
     * @notice Liquidates a portion of the borrower's debt using the lending token, called by a related contract.
     * @param _account The address of the borrower
     * @param _projectToken The address of the project token
     * @param _lendingToken The address of the lending token
     * @param _lendingTokenAmount The amount of lending tokens to be used for liquidation
     * @param liquidator The address of the liquidator
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return projectTokenLiquidatorReceived The amount of project tokens received by the liquidator
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

    /**
     * @notice Get the health factor of a specific account's position after update price.
     * @param _account The address of the account.
     * @param _projectToken The address of the project token.
     * @param _lendingToken The address of the lending token.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return healthFactorNumerator The numerator of the health factor.
     * @return healthFactorDenominator The denominator of the health factor.
     */
    function getHfWithUpdatePrices(
        address _account,
        address _projectToken,
        address _lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 healthFactorNumerator, uint256 healthFactorDenominator) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return getHf(_account, _projectToken, _lendingToken);
    }

    /**
     * @notice Get the current health factor of a specific account's position after update price.
     * @param _account The address of the account.
     * @param _projectToken The address of the project token.
     * @param _lendingToken The address of the lending token.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return healthFactorNumerator The numerator of the health factor.
     * @return healthFactorDenominator The denominator of the health factor.
     */
    function getCurrentHealthFactorWithUpdatePrices(
        address _account,
        address _projectToken,
        address _lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 healthFactorNumerator, uint256 healthFactorDenominator) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return getCurrentHealthFactor(_account, _projectToken, _lendingToken);
    }

    /**
     * @notice Get the price of a token in USD after update price.
     * @param token The address of the token.
     * @param amount The amount of the token.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return price The price of the token in USD.
     */
    function getTokenPriceWithUpdatePrices(
        address token,
        uint amount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint price) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return getTokenPrice(token, amount);
    }

    /**
     * @dev Calculates the liquidator reward factor (LRF) for a given position after update price.
     * @param _account The address of the borrower whose position is being considered.
     * @param _projectToken The address of the project token.
     * @param _lendingToken The address of the lending token.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return lrfNumerator The numerator of the liquidator reward factor.
     * @return lrfDenominator The denominator of the liquidator reward factor.
     */
    function liquidatorRewardFactorWithUpdatePrices(
        address _account,
        address _projectToken,
        address _lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 lrfNumerator, uint256 lrfDenominator) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return liquidatorRewardFactor(_account, _projectToken, _lendingToken);
    }

    /**
     * @dev Calculates the maximum liquidation amount (MaxLA) for a given position after update price.
     * MaxLA = (LVR * CVc - THF * LVc) / (LRF * LVR - THF)
     * @param _account The address of the borrower whose position is being considered.
     * @param _projectToken The address of the project token.
     * @param _lendingToken The address of the lending token.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return maxLA The maximum liquidator reward amount in the lending token.
     */
    function getMaxLiquidationAmountWithUpdatePrices(
        address _account,
        address _projectToken,
        address _lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 maxLA) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return getMaxLiquidationAmount(_account, _projectToken, _lendingToken);
    }

    /**
     * @dev Computes the minimum and maximum liquidation amount for a given account, project token, and lending token after update price.
     * MinLA = min(MaxLA, MPA)
     * @param _account The account for which to compute the minimum liquidator reward amount.
     * @param _projectToken The project token for which to compute the minimum liquidator reward amount.
     * @param _lendingToken The lending token for which to compute the minimum liquidator reward amount.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return maxLA The maximum liquidation amount.
     * @return minLA The minimum liquidation amount.
     */
    function getLiquidationAmountWithUpdatePrices(
        address _account,
        address _projectToken,
        address _lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 maxLA, uint256 minLA) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return getLiquidationAmount(_account, _projectToken, _lendingToken);
    }
}
