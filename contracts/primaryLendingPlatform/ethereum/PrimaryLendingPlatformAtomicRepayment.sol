// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import "../PrimaryLendingPlatformAtomicRepaymentCore.sol";

contract PrimaryLendingPlatformAtomicRepayment is PrimaryLendingPlatformAtomicRepaymentCore {
    address public registryAggregator;

    event SetAugustusParaswap(address indexed exchangeAggregator, address indexed registryAggregator);

    /**
     * @notice Updates the Exchange Aggregator contract and registry contract addresses.
     * @dev Only a moderator can call this function.
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
     * @dev Repays a loan atomically using the given project token as collateral.
     * @param prjToken The project token to use as collateral.
     * @param collateralAmount The amount of collateral to use.
     * @param buyCalldata The calldata for the swap operation.
     * @param isRepayFully A boolean indicating whether the loan should be repaid fully or partially.
     */
    function repayAtomic(address prjToken, uint256 collateralAmount, bytes memory buyCalldata, bool isRepayFully) external nonReentrant {
        _repayAtomic(prjToken, collateralAmount, buyCalldata, isRepayFully);
    }
}
