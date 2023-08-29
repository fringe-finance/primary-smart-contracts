// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import "../PrimaryLendingPlatformAtomicRepaymentCore.sol";

/**
 * @title PrimaryLendingPlatformAtomicRepayment.
 * @notice The PrimaryLendingPlatformAtomicRepayment contract is the contract that allows users to repay loans atomically.
 * @dev Contract that allows users to repay loans atomically using the Augustus Paraswap exchange aggregator. Inherit from PrimaryLendingPlatformAtomicRepaymentCore.
 */
contract PrimaryLendingPlatformAtomicRepayment is PrimaryLendingPlatformAtomicRepaymentCore {
    address public registryAggregator;

    /**
     * @dev Emitted when the Augustus Paraswap exchange aggregator and registry aggregator addresses are set.
     * @param exchangeAggregator The address of the Augustus Paraswap exchange aggregator.
     * @param registryAggregator The address of the Augustus Paraswap registry aggregator.
     */
    event SetAugustusParaswap(address indexed exchangeAggregator, address indexed registryAggregator);

    /**
     * @dev Updates the Exchange Aggregator contract and registry contract addresses.
     * #### Requirements:
     * - The caller must be the moderator.
     * - `exchangeAggregatorAddress` must not be the zero address.
     * - `registryAggregatorAddress` must not be the zero address.
     * - `registryAggregatorAddress` must be a valid Augustus contract.
     * @param exchangeAggregatorAddress The new address of the Exchange Aggregator contract.
     * @param registryAggregatorAddress The new address of the Aggregator registry contract.
     */
    function setExchangeAggregator(address exchangeAggregatorAddress, address registryAggregatorAddress) external onlyModerator {
        require(exchangeAggregatorAddress != address(0) && registryAggregatorAddress != address(0), "AtomicRepayment: Invalid address");
        require(IParaSwapAugustusRegistry(registryAggregatorAddress).isValidAugustus(exchangeAggregatorAddress), "AtomicRepayment: Invalid Augustus");
        exchangeAggregator = exchangeAggregatorAddress;
        registryAggregator = registryAggregatorAddress;
        emit SetAugustusParaswap(exchangeAggregatorAddress, registryAggregatorAddress);
    }

    /**
     * @notice Repays a loan atomically using the given project token as collateral.
     * @dev Repays the loan in a single atomic transaction.
     * #### Requirements:
     * - The project token is listed on the platform.
     * - The lending token is listed on the platform.
     * - Collateral amount must be greater than 0.
     * - The user must have a position for the given project token and lending token.
     * #### Effects:
     * - Transfers the collateral amount from the user to the contract.
     * - Approves the collateral amount to the primary lending platform contract.
     * - Calculates the total outstanding amount for the user, project token, and lending token.
     * - Buys the lending token from the exchange aggregator.
     * - Deposits the collateral amount back to the primary lending platform contract.
     * - Approves the lending token amount to the primary lending platform contract.
     * - Repays the lending token amount to the primary lending platform contract.
     * - Transfers the remaining lending token amount to the user.
     * - Defers the liquidity check for the user, project token, and lending token.
     * @param prjToken The address of the project token.
     * @param collateralAmount The amount of collateral to be repaid.
     * @param buyCalldata The calldata for buying the project token.
     * @param isRepayFully A boolean indicating whether to fully repay the loan or not.
     */
    function repayAtomic(address prjToken, uint256 collateralAmount, bytes memory buyCalldata, bool isRepayFully) external nonReentrant {
        _repayAtomic(prjToken, collateralAmount, buyCalldata, isRepayFully);
    }
}
