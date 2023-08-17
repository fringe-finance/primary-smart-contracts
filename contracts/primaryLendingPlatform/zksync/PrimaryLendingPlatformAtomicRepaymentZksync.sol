// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import "../PrimaryLendingPlatformAtomicRepaymentCore.sol";
import "../../interfaces/IPriceProviderAggregator.sol";

contract PrimaryLendingPlatformAtomicRepaymentZksync is PrimaryLendingPlatformAtomicRepaymentCore {
    event SetOpenOceanExchangeProxy(address indexed newOpenOceanExchangeProxy);

    /**
     * @notice Updates the Exchange Aggregator contract and registry contract addresses.
     * @dev Only a moderator can call this function.
     * @param exchangeAggregatorAddress The new address of the Exchange Aggregator contract.
     */
    function setExchangeAggregator(address exchangeAggregatorAddress) external onlyModerator {
        require(exchangeAggregatorAddress != address(0), "AtomicRepayment: Invalid address");
        exchangeAggregator = exchangeAggregatorAddress;
        emit SetOpenOceanExchangeProxy(exchangeAggregatorAddress);
    }

    /**
     * @dev Computes the outstanding amount (i.e., loanBody + accrual) for a given user, project token, and lending token after update price.
     * @param user The user for which to compute the outstanding amount.
     * @param projectToken The project token for which to compute the outstanding amount.
     * @param lendingAsset The lending token for which to compute the outstanding amount.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by Pyth Network. 
     * @return outstanding The outstanding amount for the user, project token, and lending token.
     */
    function getTotalOutstandingWithUpdatePrices(
        address user, 
        address projectToken, 
        address lendingAsset,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
        ) external payable returns(uint outstanding) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{ value: msg.value }(priceIds, updateData);
        return getTotalOutstanding(user, projectToken, lendingAsset);
    }

    /**
     * @dev Computes the available lending token amount that a user can repay for a given project token after update price.
     * @param user The user for which to compute the available lending token amount.
     * @param projectToken The project token for which to compute the available lending token amount.
     * @param lendingToken The lending token for which to compute the available lending token amount.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by Pyth Network. 
     * @return availableLendingAmount The available lending token amount that the user can repay.
     */
    function getAvailableRepaidAmountWithUpdatePrices(
        address user, 
        address projectToken, 
        address lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
        ) external payable returns(uint256 availableLendingAmount) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{ value: msg.value }(priceIds, updateData);
        return getAvailableRepaidAmount(user, projectToken, lendingToken);
    }

    /**
     * @dev Repays a loan atomically using the given project token as collateral.
     * @param prjToken The project token to use as collateral.
     * @param collateralAmount The amount of collateral to use.
     * @param buyCalldata The calldata for the swap operation.
     * @param isRepayFully A boolean indicating whether the loan should be repaid fully or partially.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     */
    function repayAtomic(address prjToken, uint collateralAmount, bytes memory buyCalldata, bool isRepayFully, bytes32[] memory priceIds, bytes[] calldata updateData) external payable nonReentrant {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{ value: msg.value }(priceIds, updateData);
        _repayAtomic(prjToken, collateralAmount, buyCalldata, isRepayFully);
    }

}
