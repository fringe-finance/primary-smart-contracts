// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../PrimaryLendingPlatformLeverageCore.sol";

contract PrimaryLendingPlatformLeverage is PrimaryLendingPlatformLeverageCore {
    address public registryAggregator;

    event SetAugustusParaswap(address indexed exchangeAggregator, address indexed registryAggregator);

    /**
     * @notice Updates the Exchange Aggregator contract and registry contract addresses.
     * @dev Only a moderator can call this function.
     * @param exchangeAggregatorAddress The new address of the Exchange Aggregator contract.
     * @param registryAggregatorAddress The new address of the Aggregator registry contract.
     */
    function setExchangeAggregator(address exchangeAggregatorAddress, address registryAggregatorAddress) external onlyModerator {
        require(exchangeAggregatorAddress != address(0) && registryAggregatorAddress != address(0), "PrimaryLendingPlatformLeverage: Invalid address");
        require(IParaSwapAugustusRegistry(registryAggregatorAddress).isValidAugustus(exchangeAggregatorAddress), "PrimaryLendingPlatformLeverage: Invalid Augustus");
        exchangeAggregator = exchangeAggregatorAddress;
        registryAggregator = registryAggregatorAddress;
        emit SetAugustusParaswap(exchangeAggregatorAddress, registryAggregatorAddress);
    }

    /**
     * @notice Executes a leveraged borrow operation for the specified project token, lending token, and notional exposure.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @param notionalExposure The notional exposure for the borrow operation.
     * @param marginCollateralAmount The amount of collateral to be deposited by the user.
     * @param buyCalldata The calldata used for buying the project token on the DEX.
     */
    function leveragedBorrow(
        address projectToken,
        address lendingToken,
        uint256 notionalExposure,
        uint256 marginCollateralAmount,
        bytes memory buyCalldata,
        uint8 leverageType
    ) public nonReentrant {
        _leveragedBorrow(projectToken, lendingToken, notionalExposure, marginCollateralAmount, buyCalldata, msg.sender, leverageType);
    }

    /**
     * @dev Allows a related contract to borrow funds on behalf of a user to enter a leveraged position.
     * @param projectToken The address of the project token the user wants to invest in.
     * @param lendingToken The address of the lending token used for collateral.
     * @param notionalExposure The notional exposure of the user's investment.
     * @param marginCollateralAmount The amount of collateral to be deposited by the user.
     * @param buyCalldata The calldata used for buying the project token on the DEX.
     * @param borrower The address of the user for whom the funds are being borrowed.
     */
    function leveragedBorrowFromRelatedContract(
        address projectToken,
        address lendingToken,
        uint256 notionalExposure,
        uint256 marginCollateralAmount,
        bytes memory buyCalldata,
        address borrower,
        uint8 leverageType
    ) public nonReentrant onlyRelatedContracts {
        _leveragedBorrow(projectToken, lendingToken, notionalExposure, marginCollateralAmount, buyCalldata, borrower, leverageType);
    }
}
