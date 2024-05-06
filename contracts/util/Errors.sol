// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

library Errors {
    
    error CallerIsNotAdmin();
    error ProjectTokenIsNotListed();
    error LendingTokenIsNotListed();
    error CallerIsNotRelatedContract();
    error CallerIsNotModerator();
    error InvalidAddress();
    error TokenIsPaused();
    error InvalidAmount();
    error InvalidAmountOrDepositDoesNotExist();
    error WithdrawableAmountIsZero();
    error MintErrorIsNotZero();
    error MintedAmountIsZero();
    error BLendingTokenAmoutIsZero();
    error RedeemErrorIsNotZero();
    error RedeemUnderlyingErrorIsNotZero();
    error InvalidPosition();
    error InvalidLendingAmount();
    error InvalidLendingToken();
    error AvailableAmounToBorrowIsZero();
    error NoBorrowPosition();
    error TokensListIsEmpty();
}