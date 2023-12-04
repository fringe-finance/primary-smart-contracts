// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import "../PrimaryLendingPlatformAtomicRepaymentCore.sol";
import "../../interfaces/IPriceProviderAggregator.sol";

/**
 * @title PrimaryLendingPlatformAtomicRepaymentZksync.
 * @notice The PrimaryLendingPlatformAtomicRepaymentZksync contract is the contract that allows users to repay loans atomically for zksync network.
 * @dev Contract that allows users to repay loans atomically using the OpenOcean exchange aggregator. Inherit from PrimaryLendingPlatformAtomicRepaymentCore.
 */
contract PrimaryLendingPlatformAtomicRepaymentZksync is PrimaryLendingPlatformAtomicRepaymentCore {
    using SafeERC20Upgradeable for ERC20Upgradeable;

    /**
     * @notice Repays a loan atomically using the given project token as collateral.
     * @dev Repays the loan in a single atomic transaction and update related token's prices.
     *
     * Requirements:
     * - The project token is listed on the platform.
     * - The lending token is listed on the platform.
     * - Collateral amount must be greater than 0.
     * - The user must have a position for the given project token and lending token.
     *
     * Effects:
     * - Update price of related tokens.
     * - Transfers the collateral amount from the user to the contract.
     * - Approves the collateral amount to the primary lending platform contract.
     * - Calculates the total outstanding amount for the user, project token, and lending token.
     * - Buys the lending token from the exchange aggregator.
     * - Deposits the collateral amount back to the primary lending platform contract.
     * - Approves the lending token amount to the primary lending platform contract.
     * - Repays the lending token amount to the primary lending platform contract.
     * - Transfers the remaining lending token amount to the user.
     * - Defers the liquidity check for the user, project token, and lending token.
     * @param prjToken The project token to use as collateral.
     * @param collateralAmount The amount of collateral to use.
     * @param buyCalldata The calldata for the swap operation.
     * @param isRepayFully A boolean indicating whether the loan should be repaid fully or partially.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     */
    function repayAtomic(
        address prjToken,
        uint collateralAmount,
        bytes memory buyCalldata,
        bool isRepayFully,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable nonReentrant {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        _repayAtomic(prjToken, collateralAmount, buyCalldata, isRepayFully);
    }
}
