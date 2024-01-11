// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../PrimaryLendingPlatformLeverageCore.sol";

/**
 * @title PrimaryLendingPlatformAtomicRepayment.
 * @notice The PrimaryLendingPlatformAtomicRepayment contract is the contract that allows users to open leveraged positions.
 * @dev Contract that allows users to open leveraged positions using the Augustus Paraswap exchange aggregator. Inherit from PrimaryLendingPlatformLeverageCore.
 */
contract PrimaryLendingPlatformLeverage is PrimaryLendingPlatformLeverageCore {
    
    /**
     * @notice Executes a leveraged borrow for the borrower on the specified projectToken using the given lendingToken.
     * @dev The function to be called when a user wants to leverage their position.
     *
     * Requirements:
     * - The project token is listed on the platform.
     * - The lending token is listed on the platform.
     * - Notional exposure must be greater than 0.
     * - The lending token must be the same as the current lending token or the current lending token must be address(0).
     * - The user must have a valid position for the given project token and lending token.
     *
     * Effects:
     * - Calculates the required `lendingTokenCount` based on `notionalExposure`.
     * - Performs a naked borrow using `_nakedBorrow` function.
     * - Approves the transfer of `lendingToken` to the system.
     * - Buys tokens on an exchange aggregator using `_buyOnExchangeAggregator` function.
     * - Collateralizes the loan with the received tokens using `_collateralizeLoan` function.
     * - Defers liquidity check using `_deferLiquidityCheck` function.
     * - Sets the leveraged position flag and type for the borrower.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @param notionalExposure The desired notional exposure for the leverage position.
     * @param marginCollateralAmount The amount of collateral to be added to the position as margin.
     * @param buyCalldata The calldata for buying the project token on the exchange aggregator.
     * @param leverageType The type of leverage position.
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
     *
     * Requirements:
     * - Caller must be a related contract.
     * - The project token is listed on the platform.
     * - The lending token is listed on the platform.
     * - Notional exposure must be greater than 0.
     * - The lending token must be the same as the current lending token or the current lending token must be address(0).
     * - The user must have a valid position for the given project token and lending token.
     *
     * Effects:
     * - Calculates the required `lendingTokenCount` based on `notionalExposure`.
     * - Performs a naked borrow using `_nakedBorrow` function.
     * - Approves the transfer of `lendingToken` to the system.
     * - Buys tokens on an exchange aggregator using `_buyOnExchangeAggregator` function.
     * - Collateralizes the loan with the received tokens using `_collateralizeLoan` function.
     * - Defers liquidity check using `_deferLiquidityCheck` function.
     * - Sets the leveraged position flag and type for the borrower.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @param notionalExposure The desired notional exposure for the leverage position.
     * @param marginCollateralAmount The amount of collateral to be added to the position as margin.
     * @param buyCalldata The calldata for buying the project token on the exchange aggregator.
     * @param borrower The address of the user for whom the funds are being borrowed.
     * @param leverageType The type of leverage position.
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
