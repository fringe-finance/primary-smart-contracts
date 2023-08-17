// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IBLendingToken {
    /**
     * @notice Sender supplies assets into the market and receives cTokens in exchange
     * @dev Accrues interest whether or not the operation succeeds, unless reverted
     * @param minter the address of account which earn liquidity
     * @param mintAmount The amount of the underlying asset to supply to minter
     * return uint256 0=success, otherwise a failure (see ErrorReporter.sol for details)
     * return uint256 minted amount
     */
    function mintTo(address minter, uint256 mintAmount) external returns (uint256 err, uint256 mintedAmount);

    /**
     * @notice Sender redeems cTokens in exchange for the underlying asset
     * @dev Accrues interest whether or not the operation succeeds, unless reverted
     * @param redeemTokens The number of cTokens to redeem into underlying
     * @return uint256 0=success, otherwise a failure (see ErrorReporter.sol for details)
     */
    function redeemTo(address redeemer, uint256 redeemTokens) external returns (uint);

    /**
     * @notice Sender redeems cTokens in exchange for a specified amount of underlying asset
     * @dev Accrues interest whether or not the operation succeeds, unless reverted
     * @param redeemAmount The amount of underlying to redeem
     * @return uint256 0=success, otherwise a failure (see ErrorReporter.sol for details)
     */
    function redeemUnderlyingTo(address redeemer, uint256 redeemAmount) external returns (uint);

    function borrowTo(address borrower, uint256 borrowAmount) external returns (uint256 borrowError);

    function repayTo(address payer, address borrower, uint256 repayAmount) external returns (uint256 repayBorrowError, uint256 amountRepayed);

    function repayBorrowToBorrower(
        address projectToken,
        address payer,
        address borrower,
        uint256 repayAmount
    ) external returns (uint256 repayBorrowError, uint256 amountRepayed);

    /**
     * @notice Get the token balance of the `owner`
     * @param owner The address of the account to query
     * @return The number of tokens owned by `owner`
     */
    function balanceOf(address owner) external view returns (uint256);

    function borrowBalanceCurrent(address account) external returns (uint);

    function borrowBalanceStored(address account) external view returns (uint);

    function totalSupply() external view returns (uint256);

    function totalBorrows() external view returns (uint256);

    function exchangeRateStored() external view returns (uint256);

    function underlying() external view returns (address);

    function getEstimatedBorrowBalanceStored(address account) external view returns (uint256 accrual);
}
