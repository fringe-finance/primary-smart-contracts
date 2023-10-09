// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title Compound's InterestRateModel Interface
 * @author Compound
 */
abstract contract InterestRateModel {
    /// @notice Indicator that this is an InterestRateModel contract (for inspection)
    bool public constant isInterestRateModel = true;

    /**
     * @dev Calculates the current borrow interest rate per block.
     * @param cash The total amount of cash the market has.
     * @param borrows The total amount of borrows the market has outstanding.
     * @param reserves The total amount of reserves the market has.
     * @param blendingToken The address of the blending token used for interest calculation.
     * @return The borrow rate per block (as a percentage, and scaled by 1e18).
     */
    function getBorrowRate(uint256 cash, uint256 borrows, uint256 reserves, address blendingToken) external view virtual returns (uint);

    /**
     * @dev Calculates the current supply interest rate per block.
     * @param cash The total amount of cash the market has.
     * @param borrows The total amount of borrows the market has outstanding.
     * @param reserves The total amount of reserves the market has.
     * @param reserveFactorMantissa The current reserve factor the market has.
     * @param blendingToken The address of the blending token used for interest calculation.
     * @return The supply rate per block (as a percentage, and scaled by 1e18).
     */
    function getSupplyRate(
        uint256 cash,
        uint256 borrows,
        uint256 reserves,
        uint256 reserveFactorMantissa,
        address blendingToken
    ) external view virtual returns (uint);

    /**
     * @dev Calculates and stores the current borrow interest rate per block for the specified blending token.
     * @param cash The total amount of cash the market has.
     * @param borrows The total amount of borrows the market has outstanding.
     * @param reserves The total amount of reserves the market has.
     * @return The calculated borrow rate per block, represented as a percentage and scaled by 1e18.
     */
    function storeBorrowRate(uint256 cash, uint256 borrows, uint256 reserves) external virtual returns (uint);
}
