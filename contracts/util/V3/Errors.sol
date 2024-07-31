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
    error InvalidDenominator();
    error InvalidAmountOrDepositDoesNotExist();
    error WithdrawableAmountIsZero();
    error MintErrorIsNotZero();
    error MintedAmountIsZero();
    error BLendingTokenAmountIsZero();
    error RedeemErrorIsNotZero();
    error RedeemUnderlyingErrorIsNotZero();
    error InvalidLendingAmount();
    error NoBorrowPosition();
    error InvalidEqualAmount();
    error InvalidHealthFactor();
    error InvalidAugustusAddress();
    error InvalidReceiveAmount();
    error NotIncludedAmount();
    error TotalBorrowExceededLimit();
    error TotalDepositExceededLimit();
    error PitRemainingIsZero();
    error AvailableAmountToBorrowIsZero();
}