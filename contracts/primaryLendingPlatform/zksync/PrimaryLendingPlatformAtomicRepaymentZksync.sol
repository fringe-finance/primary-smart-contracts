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
     * @dev Calculates the outstanding amount (i.e., loanBody + accrual) for a given user, project token, and lending token after updating related token's prices.
     * @param user The user for which to compute the outstanding amount.
     * @param projectToken The project token for which to compute the outstanding amount.
     * @param lendingAsset The lending token for which to compute the outstanding amount.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return outstanding The outstanding amount for the user, project token, and lending token.
     */
    function getTotalOutstandingWithUpdatePrices(
        address user,
        address projectToken,
        address lendingAsset,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint outstanding) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return getTotalOutstanding(user, projectToken, lendingAsset);
    }

    /**
     * @dev Returns the available repaid amount for a user in a specific project token and lending token after updating related token's prices.
     * @param user The user for which to compute the available lending token amount.
     * @param projectToken The project token for which to compute the available lending token amount.
     * @param lendingToken The lending token for which to compute the available lending token amount.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return availableLendingAmount The available lending token amount that the user can repay.
     */
    function getAvailableRepaidAmountWithUpdatePrices(
        address user,
        address projectToken,
        address lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 availableLendingAmount) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return getAvailableRepaidAmount(user, projectToken, lendingToken);
    }

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
     * @param prjInfo Information about the project token, including its address and type.
     * @param collateralAmount The amount of collateral to use for repayment.
     * @param buyCalldata The calldata for the swap operation.
     * @param isRepayFully A boolean indicating whether the loan should be repaid fully or partially.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @param lendingTokenType The type of the lending token, indicating whether it's an ERC20 token, ERC4626 token, or LP token.
     */
    function repayAtomic(
        Asset.Info memory prjInfo,
        uint256 collateralAmount,
        bytes[] memory buyCalldata,
        bool isRepayFully,
        bytes32[] memory priceIds,
        bytes[] calldata updateData,
        Asset.Type lendingTokenType
    ) external payable nonReentrant {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        _repayAtomic(prjInfo, collateralAmount, buyCalldata, isRepayFully, lendingTokenType);
    }
}
