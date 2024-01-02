// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import "../PrimaryLendingPlatformAtomicRepaymentCore.sol";

/**
 * @title PrimaryLendingPlatformAtomicRepayment.
 * @notice The PrimaryLendingPlatformAtomicRepayment contract is the contract that allows users to repay loans atomically.
 * @dev Contract that allows users to repay loans atomically using the Augustus Paraswap exchange aggregator. Inherit from PrimaryLendingPlatformAtomicRepaymentCore.
 */
contract PrimaryLendingPlatformAtomicRepayment is PrimaryLendingPlatformAtomicRepaymentCore {

    /**
     * @notice Repays a loan atomically using the given project token as collateral.
     * @dev Repays the loan in a single atomic transaction.
     *
     * Requirements:
     * - The project token is listed on the platform.
     * - The lending token is listed on the platform.
     * - Collateral amount must be greater than 0.
     * - The user must have a position for the given project token and lending token.
     *
     * Effects:
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
     * @param buyCalldata The calldata for buying the project token.
     * @param isRepayFully A boolean indicating whether to fully repay the loan or not.
     * @param lendingTokenType The type of the lending token, indicating whether it's an ERC20 token, ERC4626 token, or LP token.
     */
    function repayAtomic(
        Asset.Info memory prjInfo, 
        uint256 collateralAmount,
        bytes[] memory buyCalldata, 
        bool isRepayFully,
        Asset.Type lendingTokenType    
    ) external nonReentrant {
        _repayAtomic(prjInfo, collateralAmount, buyCalldata, isRepayFully, lendingTokenType);
    }
}
