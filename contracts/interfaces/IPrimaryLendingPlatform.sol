// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IPrimaryLendingPlatform {
    struct Ratio {
        uint8 numerator;
        uint8 denominator;
    }

    struct ProjectTokenInfo {
        bool isListed;
        bool isDepositPaused; // true - paused, false - not paused
        bool isWithdrawPaused; // true - paused, false - not paused
        Ratio loanToValueRatio;
    }

    struct LendingTokenInfo {
        bool isListed;
        bool isPaused;
        address bLendingToken;
    }

    struct DepositPosition {
        uint256 depositedProjectTokenAmount;
    }

    struct BorrowPosition {
        uint256 loanBody; // [loanBody] = lendingToken
        uint256 accrual; // [accrual] = lendingToken
    }

    //************* ADMIN CONTRACT FUNCTIONS ********************************

    /**
     * @dev Grants the role to a new account.
     * @param role The role to grant.
     * @param newModerator The address of the account receiving the role.
     */
    function grantRole(bytes32 role, address newModerator) external;

    /**
     * @dev Revokes the moderator role from an account.
     * @param role The role to revoke.
     * @param moderator The address of the account losing the role.
     */
    function revokeRole(bytes32 role, address moderator) external;

    /**
     * @dev Sets the address of the new moderator contract by the admin.
     * @param newModeratorContract The address of the new moderator contract.
     */
    function setPrimaryLendingPlatformModeratorModerator(address newModeratorContract) external;

    //************* MODERATOR CONTRACT FUNCTIONS ********************************

    /**
     * @dev Sets the address of the new price oracle by the moderator contract.
     * @param newPriceOracle The address of the new price oracle contract.
     */
    function setPriceOracle(address newPriceOracle) external;

    /**
     * @dev Sets the address of the new primary index token leverage contract by the moderator contract.
     * @param newPrimaryLendingPlatformLeverage The address of the new primary index token leverage contract.
     */
    function setPrimaryLendingPlatformLeverage(address newPrimaryLendingPlatformLeverage) external;

    /**
     * @dev Sets whether an address is a related contract or not by the moderator contract.
     * @param relatedContract The address of the contract to be set as related.
     * @param isRelated Boolean to indicate whether the contract is related or not.
     */
    function setRelatedContract(address relatedContract, bool isRelated) external;

    /**
     * @dev Removes a project token from the list by the moderator contract.
     * @param projectTokenId The ID of the project token to be removed.
     * @param projectToken The address of the project token to be removed.
     */
    function removeProjectToken(uint256 projectTokenId, address projectToken) external;

    /**
     * @dev Removes a lending token from the list by the moderator contract.
     * @param lendingTokenId The ID of the lending token to be removed.
     * @param lendingToken The address of the lending token to be removed.
     */
    function removeLendingToken(uint256 lendingTokenId, address lendingToken) external;

    /**
     * @dev Sets the borrow limit per collateral by the moderator contract.
     * @param projectToken The address of the project token.
     * @param newBorrowLimit The new borrow limit.
     */
    function setBorrowLimitPerCollateralAsset(address projectToken, uint256 newBorrowLimit) external;

    /**
     * @dev Sets the borrow limit per lending asset by the moderator contract.
     * @param lendingToken The address of the lending token.
     * @param newBorrowLimit The new borrow limit.
     */
    function setBorrowLimitPerLendingAsset(address lendingToken, uint256 newBorrowLimit) external;

    /**
     * @dev Sets the parameters for a project token
     * @param projectToken The address of the project token
     * @param isDepositPaused The new pause status for deposit
     * @param isWithdrawPaused The new pause status for withdrawal
     * @param loanToValueRatioNumerator The numerator of the loan-to-value ratio for the project token
     * @param loanToValueRatioDenominator The denominator of the loan-to-value ratio for the project token
     */
    function setProjectTokenInfo(
        address projectToken,
        bool isDepositPaused,
        bool isWithdrawPaused,
        uint8 loanToValueRatioNumerator,
        uint8 loanToValueRatioDenominator
    ) external;

    /**
     * @dev Pauses or unpauses deposits and withdrawals of a project token.
     * @param projectToken The address of the project token.
     * @param isDepositPaused Boolean indicating whether deposits are paused or unpaused.
     * @param isWithdrawPaused Boolean indicating whether withdrawals are paused or unpaused.
     */
    function setPausedProjectToken(address projectToken, bool isDepositPaused, bool isWithdrawPaused) external;

    /**
     * @dev Sets the bLendingToken and paused status of a lending token.
     * @param lendingToken The address of the lending token.
     * @param bLendingToken The address of the bLendingToken.
     * @param isPaused Boolean indicating whether the lending token is paused or unpaused.
     * @param loanToValueRatioNumerator The numerator of the loan-to-value ratio for the lending token.
     * @param loanToValueRatioDenominator The denominator of the loan-to-value ratio for the lending token.
     */
    function setLendingTokenInfo(
        address lendingToken,
        address bLendingToken,
        bool isPaused,
        uint8 loanToValueRatioNumerator,
        uint8 loanToValueRatioDenominator
    ) external;

    /**
     * @dev Pauses or unpauses a lending token.
     * @param lendingToken The address of the lending token.
     * @param isPaused Boolean indicating whether the lending token is paused or unpaused.
     */
    function setPausedLendingToken(address lendingToken, bool isPaused) external;

    //************* PUBLIC FUNCTIONS ********************************
    //************* Deposit FUNCTION ********************************

    /**
     * @dev Deposits project tokens and calculates the deposit position.
     * @param projectToken The address of the project token to be deposited.
     * @param projectTokenAmount The amount of project tokens to be deposited.
     */
    function deposit(address projectToken, uint256 projectTokenAmount) external;

    /**
     * @dev Deposits project tokens on behalf of a user from a related contract and calculates the deposit position.
     * @param projectToken The address of the project token to be deposited.
     * @param projectTokenAmount The amount of project tokens to be deposited.
     * @param user The address of the user who representative deposit.
     * @param beneficiary The address of the beneficiary whose deposit position will be updated.
     */
    function depositFromRelatedContracts(address projectToken, uint256 projectTokenAmount, address user, address beneficiary) external;

    /**
     * @dev Decreases the deposited project token amount of the user's deposit position by the given amount,
     * transfers the given amount of project tokens to the receiver, and returns the amount transferred.
     * @param projectToken The address of the project token being withdrawn
     * @param projectTokenAmount The amount of project tokens being withdrawn
     * @param user The address of the user whose deposit position is being updated
     * @param receiver The address of the user receiving the withdrawn project tokens
     * @return The amount of project tokens transferred to the receiver
     */
    function calcAndTransferDepositPosition(
        address projectToken,
        uint256 projectTokenAmount,
        address user,
        address receiver
    ) external returns (uint256);

    /**
     * @dev Calculates the deposit position for a user's deposit of a given amount of a project token.
     * @param projectToken The address of the project token being deposited
     * @param projectTokenAmount The amount of project tokens being deposited
     * @param user The address of the user making the deposit
     */
    function calcDepositPosition(address projectToken, uint256 projectTokenAmount, address user) external;

    //************* Withdraw FUNCTION ********************************

    /**
     * @dev Allows a user to withdraw a given amount of a project token from their deposit position.
     * @param projectToken The address of the project token being withdrawn
     * @param projectTokenAmount The amount of project tokens being withdrawn
     */
    function withdraw(address projectToken, uint256 projectTokenAmount) external;

    /**
     * @dev Allows a related contract to initiate a withdrawal of a given amount of a project token from a user's deposit position.
     * @param projectToken The address of the project token being withdrawn
     * @param projectTokenAmount The amount of project tokens being withdrawn
     * @param user The address of the user whose deposit position is being withdrawn from
     * @param beneficiary The address of the user receiving the withdrawn project tokens
     * @return amount of project tokens withdrawn and transferred to the beneficiary
     */
    function withdrawFromRelatedContracts(
        address projectToken,
        uint256 projectTokenAmount,
        address user,
        address beneficiary
    ) external returns (uint256);

    /**
     * @dev Allows a user to withdraw a given amount of a project token from their deposit position.
     * @param projectToken The address of the project token being withdrawn
     * @param projectTokenAmount The amount of project tokens being withdrawn
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     */
    function withdraw(address projectToken, uint256 projectTokenAmount, bytes32[] memory priceIds, bytes[] calldata updateData) external payable;

    /**
     * @dev Allows a related contract to initiate a withdrawal of a given amount of a project token from a user's deposit position.
     * @param projectToken The address of the project token being withdrawn
     * @param projectTokenAmount The amount of project tokens being withdrawn
     * @param user The address of the user whose deposit position is being withdrawn from
     * @param beneficiary The address of the user receiving the withdrawn project tokens
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return amount of project tokens withdrawn and transferred to the beneficiary
     */
    function withdrawFromRelatedContracts(
        address projectToken,
        uint256 projectTokenAmount,
        address user,
        address beneficiary,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256);

    //************* borrow FUNCTION ********************************

    /**
     * @dev Allows a user to borrow lending tokens by providing project tokens as collateral.
     * @param projectToken The address of the project token being used as collateral.
     * @param lendingToken The address of the lending token being borrowed.
     * @param lendingTokenAmount The amount of lending tokens to be borrowed.
     */
    function borrow(
        address projectToken,
        address lendingToken,
        uint256 lendingTokenAmount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable;

    /**
     * @dev Allows a related contract to borrow lending tokens on behalf of a user by providing project tokens as collateral.
     * @param projectToken The address of the project token being used as collateral.
     * @param lendingToken The address of the lending token being borrowed.
     * @param lendingTokenAmount The amount of lending tokens to be borrowed.
     * @param user The address of the user on whose behalf the lending tokens are being borrowed.
     * @return amount of lending tokens borrowed
     */
    function borrowFromRelatedContract(
        address projectToken,
        address lendingToken,
        uint256 lendingTokenAmount,
        address user,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 amount);

    /**
     * @dev Allows a user to borrow lending tokens by providing project tokens as collateral.
     * @param projectToken The address of the project token being used as collateral.
     * @param lendingToken The address of the lending token being borrowed.
     * @param lendingTokenAmount The amount of lending tokens to be borrowed.
     */
    function borrow(address projectToken, address lendingToken, uint256 lendingTokenAmount) external;

    /**
     * @dev Allows a related contract to borrow lending tokens on behalf of a user by providing project tokens as collateral.
     * @param projectToken The address of the project token being used as collateral.
     * @param lendingToken The address of the lending token being borrowed.
     * @param lendingTokenAmount The amount of lending tokens to be borrowed.
     * @param user The address of the user on whose behalf the lending tokens are being borrowed.
     * @return amount of lending tokens borrowed
     */
    function borrowFromRelatedContract(address projectToken, address lendingToken, uint256 lendingTokenAmount, address user) external returns (uint256 amount);

    //************* supply FUNCTION ********************************

    /**
     * @dev Supplies a certain amount of lending tokens to the platform.
     * @param lendingToken Address of the lending token.
     * @param lendingTokenAmount Amount of lending tokens to be supplied.
     */
    function supply(address lendingToken, uint256 lendingTokenAmount) external;

    /**
     * @dev Supplies a certain amount of lending tokens to the platform from a specific user.
     * @param lendingToken Address of the lending token.
     * @param lendingTokenAmount Amount of lending tokens to be supplied.
     * @param user Address of the user.
     */
    function supplyFromRelatedContract(address lendingToken, uint256 lendingTokenAmount, address user) external;

    /**
     * @dev Calculates the collateral available for withdrawal based on the loan-to-value ratio of a specific project token.
     * @param account Address of the user.
     * @param projectToken Address of the project token.
     * @param lendingToken Address of the lending token.
     * @return collateralProjectToWithdraw The amount of collateral available for withdrawal in the project token.
     */
    function getCollateralAvailableToWithdraw(
        address account,
        address projectToken,
        address lendingToken
    ) external returns (uint256 collateralProjectToWithdraw);

    //************* redeem FUNCTION ********************************

    /**
     * @dev Function that performs the redemption of bLendingToken and returns the corresponding lending token to the msg.sender.
     * @param lendingToken Address of the lending token.
     * @param bLendingTokenAmount Amount of bLending tokens to be redeemed.
     */
    function redeem(address lendingToken, uint256 bLendingTokenAmount) external;

    /**
     * @dev Function that performs the redemption of bLendingToken on behalf of a user and returns the corresponding lending token to the user by related contract.
     * @param lendingToken Address of the lending token.
     * @param bLendingTokenAmount Amount of bLending tokens to be redeemed.
     * @param user Address of the user.
     */
    function redeemFromRelatedContract(address lendingToken, uint256 bLendingTokenAmount, address user) external;

    //************* redeemUnderlying FUNCTION ********************************

    /**
     * @dev Function that performs the redemption of lending token and returns the corresponding underlying token to the msg.sender.
     * @param lendingToken Address of the lending token.
     * @param lendingTokenAmount Amount of lending tokens to be redeemed.
     */
    function redeemUnderlying(address lendingToken, uint256 lendingTokenAmount) external;

    /**
     * @dev Function that performs the redemption of lending token on behalf of a user and returns the corresponding underlying token to the user by related contract.
     * @param lendingToken Address of the lending token.
     * @param lendingTokenAmount Amount of lending tokens to be redeemed.
     * @param user Address of the user.
     */
    function redeemUnderlyingFromRelatedContract(address lendingToken, uint256 lendingTokenAmount, address user) external;

    //************* borrow FUNCTION ********************************

    /**
     * @dev Allows a related contract to calculate the new borrow position of a user.
     * @param borrower The address of the user for whom the borrow position is being calculated.
     * @param projectToken The address of the project token being used as collateral.
     * @param lendingToken The address of the lending token being borrowed.
     * @param lendingTokenAmount The amount of lending tokens being borrowed.
     * @param currentLendingToken The address of the current lending token being used as collateral.
     */
    function calcBorrowPosition(
        address borrower,
        address projectToken,
        address lendingToken,
        uint256 lendingTokenAmount,
        address currentLendingToken
    ) external;

    /**
     * @dev Calculates the lending token available amount for borrowing.
     * @param account Address of the user.
     * @param projectToken Address of the project token.
     * @param lendingToken Address of the lending token.
     * @return availableToBorrow The amount of lending token available amount for borrowing.
     */
    function getLendingAvailableToBorrow(address account, address projectToken, address lendingToken) external returns (uint256 availableToBorrow);

    //************* repay FUNCTION ********************************

    /**
     * @dev Allows a borrower to repay their outstanding loan for a given project token and lending token.
     * @param projectToken The project token's address
     * @param lendingToken The lending token's address
     * @param lendingTokenAmount The amount of lending tokens to repay
     * @return amount of lending tokens actually repaid
     */
    function repay(address projectToken, address lendingToken, uint256 lendingTokenAmount) external returns (uint256);

    /**
     * @dev Allows a related contract to repay the outstanding loan for a given borrower's project token and lending token.
     * @param projectToken The project token's address
     * @param lendingToken The lending token's address
     * @param lendingTokenAmount The amount of lending tokens to repay
     * @param repairer The address that initiated the repair transaction
     * @param borrower The borrower's address
     * @return amount of lending tokens actually repaid
     */
    function repayFromRelatedContract(
        address projectToken,
        address lendingToken,
        uint256 lendingTokenAmount,
        address repairer,
        address borrower
    ) external returns (uint256);

    /**
     * @dev This function is called to update the interest in a borrower's borrow position.
     * @param account Address of the borrower.
     * @param lendingToken Address of the lending token.
     */
    function updateInterestInBorrowPositions(address account, address lendingToken) external;

    //************* VIEW FUNCTIONS ********************************

    /**@dev This function is called when performing operations using token prices, to determine which tokens will need to update their final price.
     * @param projectToken Address of the project token.
     * @param actualLendingToken Address of the lending token.
     * @param isBorrow Whether getting the list of tokens for updateFinalPrices is related to the borrowing operation or not.
     * @return Array of tokens that need to update final price.
     */
    function getTokensUpdateFinalPrices(
        address projectToken, 
        address actualLendingToken, 
        bool isBorrow
    ) external view returns (address[] memory );
    /**
     * @dev return address of price oracle with interface of PriceProviderAggregator
     */
    function priceOracle() external view returns (address);

    /**
     * @dev return address project token in array `projectTokens`
     * @param projectTokenId - index of project token in array `projectTokens`. Numerates from 0 to array length - 1
     */
    function projectTokens(uint256 projectTokenId) external view returns (address);

    /**
     * @dev return address lending token in array `lendingTokens`
     * @param lendingTokenId - index of lending token in array `lendingTokens`. Numerates from 0 to array length - 1
     */
    function lendingTokens(uint256 lendingTokenId) external view returns (address);

    /**
     * @dev Returns the info of the project token.
     * @return The address of the project token
     */
    function projectTokenInfo(address projectToken) external view returns (ProjectTokenInfo memory);

    /**
     * @dev Returns the address of the lending token.
     * @return The address of the lending token.
     */
    function lendingTokenInfo(address lendingToken) external view returns (LendingTokenInfo memory);

    /**
     * @dev Returns whether an address is a related contract or not.
     * @param relatedContract The address of the contract to check.
     * @return isRelated Boolean indicating whether the contract is related or not.
     */
    function getRelatedContract(address relatedContract) external view returns (bool);

    /**
     * @dev Returns the borrow limit per lending token.
     * @return The address of the lending token.
     */
    function borrowLimitPerLendingToken(address lendingToken) external view returns (uint256);

    /**
     * @dev Returns the borrow limit per collateral token.
     * @return The address of the project token.
     */
    function borrowLimitPerCollateral(address projectToken) external view returns (uint256);

    /**
     * @dev return total amount of deposited project token
     * @param projectToken - address of project token in array `projectTokens`. Numerates from 0 to array length - 1
     */
    function totalDepositedProjectToken(address projectToken) external view returns (uint256);

    /**
     * @dev return total borrow amount of `lendingToken` by `projectToken`
     * @param projectToken - address of project token
     * @param lendingToken - address of lending token
     */
    function totalBorrow(address projectToken, address lendingToken) external view returns (uint256);

    /**
     * @dev Returns the PIT (primary index token) value for a given account and position after a position is opened
     * @param account Address of the account.
     * @param projectToken Address of the project token.
     * @param lendingToken Address of the lending token.
     * @return The PIT value.
     * Formula: pit = $ * LVR
     */
    function pit(address account, address projectToken, address lendingToken) external view returns (uint256);

    /**
     * @dev Returns the PIT (primary index token) value for a given account and collateral before a position is opened
     * @param account Address of the account.
     * @param projectToken Address of the project token.
     * @return The PIT value.
     * Formula: pit = $ * LVR
     */
    function pitCollateral(address account, address projectToken) external view returns (uint256);

    /**
     * @dev Returns the actual lending token of a user's borrow position for a specific project token
     * @param user The address of the user's borrow position
     * @param projectToken The address of the project token
     * @return actualLendingToken The address of the actual lending token
     */
    function getLendingToken(address user, address projectToken) external view returns (address actualLendingToken);

    /**
     * @dev Returns the remaining PIT (primary index token) of a user's borrow position
     * @param account The address of the user's borrow position
     * @param projectToken The address of the project token
     * @param lendingToken The address of the lending token
     * @return remaining The remaining PIT of the user's borrow position
     */
    function pitRemaining(address account, address projectToken, address lendingToken) external view returns (uint256 remaining);

    /**
     * @dev Returns the total outstanding amount of a user's borrow position for a specific project token and lending token
     * @param account The address of the user's borrow position
     * @param projectToken The address of the project token
     * @param lendingToken The address of the lending token
     * @return total outstanding amount of the user's borrow position
     */
    function totalOutstanding(address account, address projectToken, address lendingToken) external view returns (uint256);

    /**
     * @dev Returns the health factor of a user's borrow position for a specific project token and lending token
     * @param account The address of the user's borrow position
     * @param projectToken The address of the project token
     * @param lendingToken The address of the lending token
     * @return numerator The numerator of the health factor
     * @return denominator The denominator of the health factor
     */
    function healthFactor(address account, address projectToken, address lendingToken) external view returns (uint256 numerator, uint256 denominator);

    /**
     * @dev Returns the evaluation of a specific token amount in USD
     * @param token The address of the token to evaluate
     * @param tokenAmount The amount of the token to evaluate
     * @return collateralEvaluation the USD evaluation of token by its `tokenAmount` in collateral price
     * @return capitalEvaluation the USD evaluation of token by its `tokenAmount` in capital price
     */
    function getTokenEvaluation(address token, uint256 tokenAmount) external view returns (uint256 collateralEvaluation, uint256 capitalEvaluation);

    /**
     * @dev Returns the length of the lending tokens array
     * @return The length of the lending tokens array
     */
    function lendingTokensLength() external view returns (uint256);

    /**
     * @dev Returns the length of the project tokens array
     * @return The length of the project tokens array
     */
    function projectTokensLength() external view returns (uint256);

    /**
     * @dev Returns the details of a user's borrow position for a specific project token and lending token
     * @param account The address of the user's borrow position
     * @param projectToken The address of the project token
     * @param lendingToken The address of the lending token
     * @return depositedProjectTokenAmount The amount of project tokens deposited by the user
     * @return loanBody The amount of the lending token borrowed by the user
     * @return accrual The accrued interest of the borrow position
     * @return healthFactorNumerator The numerator of the health factor
     * @return healthFactorDenominator The denominator of the health factor
     */
    function getPosition(
        address account,
        address projectToken,
        address lendingToken
    )
        external
        view
        returns (
            uint256 depositedProjectTokenAmount,
            uint256 loanBody,
            uint256 accrual,
            uint256 healthFactorNumerator,
            uint256 healthFactorDenominator
        );

    /**
     * @dev Returns the amount of project tokens deposited by a user for a specific project token and collateral token
     * @param projectToken The address of the project token
     * @param user The address of the user
     * @return amount of project tokens deposited by the user
     */
    function getDepositedAmount(address projectToken, address user) external view returns (uint);

    /**
     * @dev Get total borrow amount in USD per collateral for a specific project token
     * @param projectToken The address of the project token
     * @return The total borrow amount in USD
     */
    function getTotalBorrowPerCollateral(address projectToken) external view returns (uint);

    /**
     * @dev Get total borrow amount in USD for a specific lending token
     * @param lendingToken The address of the lending token
     * @return The total borrow amount in USD
     */
    function getTotalBorrowPerLendingToken(address lendingToken) external view returns (uint);

    /**
     * @dev Convert the total outstanding amount of a user's borrow position to USD
     * @param account The address of the user account
     * @param projectToken The address of the project token
     * @param lendingToken The address of the lending token
     * @return The total outstanding amount in USD
     */
    function totalOutstandingInUSD(address account, address projectToken, address lendingToken) external view returns (uint256);

    /**
     * @dev Get the loan to value ratio of a position taken by a project token and a lending token
     * @param projectToken The address of the project token
     * @param lendingToken The address of the lending token
     * @return lvrNumerator The numerator of the loan to value ratio
     * @return lvrDenominator The denominator of the loan to value ratio
     */
    function getLoanToValueRatio(address projectToken, address lendingToken) external view returns (uint256 lvrNumerator, uint256 lvrDenominator);

    /**
     * @dev Returns the PIT (primary index token) value for a given account and position after a position is opened after update price.
     * @param account Address of the account.
     * @param projectToken Address of the project token.
     * @param lendingToken Address of the lending token.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return The PIT value.
     * Formula: pit = $ * LVR
     */
    function pitWithUpdatePrices(
        address account,
        address projectToken,
        address lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256);

    /**
     * @dev Returns the PIT (primary index token) value for a given account and collateral before a position is opened after update price.
     * @param account Address of the account.
     * @param projectToken Address of the project token.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return The PIT value.
     * Formula: pit = $ * LVR
     */
    function pitCollateralWithUpdatePrices(
        address account,
        address projectToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256);

    /**
     * @dev Returns the remaining PIT (primary index token) of a user's borrow position after update price.
     * @param account The address of the user's borrow position
     * @param projectToken The address of the project token
     * @param lendingToken The address of the lending token
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return remaining The remaining PIT of the user's borrow position
     */
    function pitRemainingWithUpdatePrices(
        address account,
        address projectToken,
        address lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256);

    /**
     * @dev Returns the estimated remaining PIT (primary index token) of a user's borrow position
     * @param account The address of the user's borrow position
     * @param projectToken The address of the project token
     * @param lendingToken The address of the lending token
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return remaining The estimated remaining PIT of the user's borrow position
     */
    function estimatedPitRemainingWithUpdatePrices(
        address account,
        address projectToken,
        address lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256);

    /**
     * @dev Returns the health factor of a user's borrow position for a specific project token and lending token after update price
     * @param account The address of the user's borrow position
     * @param projectToken The address of the project token
     * @param lendingToken The address of the lending token
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return numerator The numerator of the health factor
     * @return denominator The denominator of the health factor
     */
    function healthFactorWithUpdatePrices(
        address account,
        address projectToken,
        address lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 numerator, uint256 denominator);

    /**
     * @dev Returns the evaluation of a specific token amount in USD after update price.
     * @param token The address of the token to evaluate
     * @param tokenAmount The amount of the token to evaluate
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return The evaluated token amount in USD
     */
    function getTokenEvaluationWithUpdatePrices(
        address token,
        uint256 tokenAmount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256);

    /**
     * @dev Returns the details of a user's borrow position for a specific project token and lending token after update price
     * @param account The address of the user's borrow position
     * @param projectToken The address of the project token
     * @param lendingToken The address of the lending token
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return depositedProjectTokenAmount The amount of project tokens deposited by the user
     * @return loanBody The amount of the lending token borrowed by the user
     * @return accrual The accrued interest of the borrow position
     * @return healthFactorNumerator The numerator of the health factor
     * @return healthFactorDenominator The denominator of the health factor
     */
    function getPositionWithUpdatePrices(
        address account,
        address projectToken,
        address lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    )
        external
        payable
        returns (
            uint256 depositedProjectTokenAmount,
            uint256 loanBody,
            uint256 accrual,
            uint256 healthFactorNumerator,
            uint256 healthFactorDenominator
        );

    /**
     * @dev Get total borrow amount in USD for a specific lending token after update price
     * @param lendingToken The address of the lending token
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return The total borrow amount in USD
     */
    function getTotalBorrowPerLendingTokenWithUpdatePrices(
        address lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint);

    /**
     * @dev Get total borrow amount in USD per collateral for a specific project token after update price.
     * @param projectToken The address of the project token
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return The total borrow amount in USD
     */
    function getTotalBorrowPerCollateralWithUpdatePrices(
        address projectToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint);

    /**
     * @dev Convert the total outstanding amount of a user's borrow position to USD after update price.
     * @param account The address of the user account
     * @param projectToken The address of the project token
     * @param lendingToken The address of the lending token
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return The total outstanding amount in USD
     */
    function totalOutstandingInUSDWithUpdatePrices(
        address account,
        address projectToken,
        address lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256);

    /**
     * @dev Returns the total estimated outstanding amount of a user's borrow position to USD after update price.
     * @param account The address of the user account
     * @param projectToken The address of the project token
     * @param lendingToken The address of the lending token
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return The total estimated outstanding amount in USD
     */
    function totalEstimatedOutstandingInUSDWithUpdatePrices(
        address account,
        address projectToken,
        address lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256);

    /**
     * @dev Convert the remaining pit amount to the corresponding lending token amount after update price.
     * @param account The address of the user account
     * @param projectToken The address of the project token
     * @param lendingToken The address of the lending token
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return The converted lending token amount
     */
    function convertPitRemainingWithUpdatePrices(
        address account,
        address projectToken,
        address lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256);

    /**
     * @dev Convert the estimated remaining pit amount to the corresponding lending token amount after update price.
     * @param account The address of the user account
     * @param projectToken The address of the project token
     * @param lendingToken The address of the lending token
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return The estimated lending token amount
     */
    function convertEstimatedPitRemainingWithUpdatePrices(
        address account,
        address projectToken,
        address lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256);

    /**
     * @dev Calculates the collateral available for withdrawal based on the loan-to-value ratio of a specific project token after update price.
     * @param account Address of the user.
     * @param projectToken Address of the project token.
     * @param lendingToken Address of the lending token.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return collateralProjectToWithdraw The amount of collateral available for withdrawal in the project token.
     */
    function getCollateralAvailableToWithdrawWithUpdatePrices(
        address account,
        address projectToken,
        address lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 collateralProjectToWithdraw);

    /**
     * @dev Calculates the lending token available amount for borrowing after update price.
     * @param account Address of the user.
     * @param projectToken Address of the project token.
     * @param lendingToken Address of the lending token.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return availableToBorrow The amount of lending token available amount for borrowing.
     */
    function getLendingAvailableToBorrow(
        address account,
        address projectToken,
        address lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 availableToBorrow);
}
