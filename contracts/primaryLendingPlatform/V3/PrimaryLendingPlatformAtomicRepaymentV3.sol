// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import "./core/PrimaryLendingPlatformAtomicRepaymentV3Core.sol";
import "../../interfaces/IPriceProviderAggregator.sol";

/**
 * @title PrimaryLendingPlatformAtomicRepaymentZksync.
 * @notice The PrimaryLendingPlatformAtomicRepaymentZksync contract is the contract that allows users to repay loans atomically for zksync network.
 * @dev Contract that allows users to repay loans atomically using the OpenOcean exchange aggregator. Inherit from PrimaryLendingPlatformAtomicRepaymentCore.
 */
contract PrimaryLendingPlatformAtomicRepaymentV3 is PrimaryLendingPlatformAtomicRepaymentV3Core {
    using SafeERC20Upgradeable for ERC20Upgradeable;

    //************* EXTERNAL FUNCTION ********************************

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
     * @param lendingToken The lending token to be repaid.
     * @param prjToken The project token to use as collateral.
     * @param collateralAmount The amount of collateral to use.
     * @param buyCalldata The calldata for the swap operation.
     * @param isRepayFully A boolean indicating whether the loan should be repaid fully or partially.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     */
    function repayAtomic(
        Asset.Info memory lendingToken,
        Asset.Info memory prjToken,
        uint256 collateralAmount,
        bytes[] memory buyCalldata,
        bool isRepayFully,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable nonReentrant isProjectTokenListed(prjToken.addr) isLendingTokenListed(lendingToken.addr) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        _repayAtomic(msg.sender, lendingToken, prjToken, collateralAmount, buyCalldata, isRepayFully, updatePriceTokens, priceIds, updateData);
    }

    /**
     * @dev Repays a loan atomically using the given project token as collateral.
     * 
     * Requirements:
     * - The project token is listed on the platform.
     * - The lending token is listed on the platform.
     * - Collateral amount must be greater than 0.
     * - The user must have a position for the given project token and lending token.
     * - The caller must be a related contract.
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
     * @param user The borrower's address.
     * @param lendingToken The lending token to be repaid.
     * @param prjToken The project token to use as collateral.
     * @param collateralAmount The amount of collateral to use.
     * @param buyCalldata The calldata for the swap operation.
     * @param isRepayFully A boolean indicating whether the loan should be repaid fully or partially.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return amountReceivedLendingToken The amount of lending tokens received by the user.
     */
    function repayAtomicFromRelatedContract(
        address user,
        Asset.Info memory lendingToken,
        Asset.Info memory prjToken,
        uint256 collateralAmount,
        bytes[] memory buyCalldata,
        bool isRepayFully,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    )
        external
        payable
        nonReentrant
        isProjectTokenListed(prjToken.addr)
        isLendingTokenListed(lendingToken.addr)
        onlyRelatedContracts
        returns (uint256 amountReceivedLendingToken)
    {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        amountReceivedLendingToken = _repayAtomic(user, lendingToken, prjToken, collateralAmount, buyCalldata, isRepayFully, updatePriceTokens, priceIds, updateData);
    }

    /**
     * @dev Computes the deposited remaining amount of PIT that a user has after taking into account their outstanding loan amount.
     * @param account The user for which to compute the remaining PIT amount.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return depositedRemaining The deposited remaining amount for the user.
     */
    function getCurrentDepositedRemainingWithUpdatePrices(
        address account,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 depositedRemaining) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return getCurrentDepositedRemaining(account);
    }

    /**
     * @dev Computes the remaining deposit that a user can withdraw for a given project token.
     * @param user The user for which to compute the remaining deposit.
     * @param projectToken The project token for which to compute the remaining deposit.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return remainingDeposit The remaining deposit that the user can withdraw.
     */
    function getRemainingDepositWithUpdatePrices(
        address user,
        address projectToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 remainingDeposit) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updatePrices{value: msg.value}(priceIds, updateData);
        return getRemainingDeposit(user, projectToken);
    }

    /**
     * @dev Computes the available lending token amount that a user can repay for a given project token.
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
}
