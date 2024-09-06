// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IPrimaryLendingPlatformV3 {
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
        Ratio loanToValueRatio;
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
    function setPrimaryLendingPlatformModerator(address newModeratorContract) external;

    //************* MODERATOR CONTRACT FUNCTIONS ********************************

    /**
     * @dev Sets the address of the new primary index token leverage contract by the moderator contract.
     * @param newPrimaryLendingPlatformLeverage The address of the new primary index token leverage contract.
     */
    function setPrimaryLendingPlatformLeverage(address newPrimaryLendingPlatformLeverage) external;

    /**
     * @dev Sets the address of the new price oracle by the moderator contract.
     * @param newPriceOracle The address of the new price oracle contract.
     */
    function setPriceOracle(address newPriceOracle) external;

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
     * @dev Sets the borrow limit per lending asset by the moderator contract.
     * @param lendingToken The address of the lending token.
     * @param newBorrowLimit The new borrow limit.
     */
    function setBorrowLimitPerLendingAsset(address lendingToken, uint256 newBorrowLimit) external;

    /**
     * @dev Sets the borrow limit per project asset by the moderator contract.
     * @param projectToken The address of the project token.
     * @param depositLimit The new deposit limit.
     */
    function setDepositLimitPerProjectAsset(address projectToken, uint256 depositLimit) external;

    /**
     * @dev Sets whether an address is a related contract or not by the moderator contract.
     * @param relatedContract The address of the contract to be set as related.
     * @param isRelated Boolean to indicate whether the contract is related or not.
     */
    function setRelatedContract(address relatedContract, bool isRelated) external;

    /**
     * @dev Sets the parameters for a project token.
     * @param projectToken The address of the project token.
     * @param isDepositPaused The new pause status for deposit.
     * @param isWithdrawPaused The new pause status for withdrawal.
     * @param loanToValueRatioNumerator The numerator of the loan-to-value ratio for the project token.
     * @param loanToValueRatioDenominator The denominator of the loan-to-value ratio for the project token.
     */
    function setProjectTokenInfo(
        address projectToken,
        bool isDepositPaused,
        bool isWithdrawPaused,
        uint8 loanToValueRatioNumerator,
        uint8 loanToValueRatioDenominator
    ) external;

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

    /**
     * @dev deposit project token to PrimaryIndexToken.
     * @param projectToken - address of project token.
     * @param projectTokenAmount - amount of project token to deposit.
     * @param updatePriceTokens - array of tokens to update price.
     * @param priceIds - array of price identifiers used to update the price oracle.
     * @param updateData - array of update data used to update the price oracle.
     */
    function deposit(
        address projectToken,
        uint256 projectTokenAmount,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable;

    /**
     * @dev withdraw project token from PrimaryIndexToken.
     * @param projectToken - address of project token.
     * @param projectTokenAmount - amount of project token to deposit.
     * @param updatePriceTokens - array of tokens to update price.
     * @param priceIds - array of price identifiers used to update the price oracle.
     * @param updateData - array of update data used to update the price oracle.
     */
    function withdraw(
        address projectToken,
        uint256 projectTokenAmount,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable;

    /**
     * @dev supply lending token.
     * @param lendingToken - address of lending token.
     * @param lendingTokenAmount - amount of lending token to supply.
     * @param updatePriceTokens - array of tokens to update price.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     */
    function supply(
        address lendingToken,
        uint256 lendingTokenAmount,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable;

    /**
     * @dev redeem lending token.
     * @param lendingToken - address of lending token.
     * @param bLendingTokenAmount - amount of fLending token to redeem.
     * @param updatePriceTokens - array of tokens to update price.
     * @param priceIds - array of price identifiers used to update the price oracle.
     * @param updateData - array of update data used to update the price oracle.
     */
    function redeem(
        address lendingToken,
        uint256 bLendingTokenAmount,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable;

    /**
     * @dev borrow lending token.
     * @param projectToken - address of project token.
     * @param lendingToken - address of lending token.
     * @param lendingTokenAmount - amount of lending token.
     * @param updatePriceTokens - array of tokens to update price.
     */
    function borrow(
        address projectToken,
        address lendingToken,
        uint256 lendingTokenAmount,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable;

    /**
     * @dev repay lending token.
     * @param projectToken - address of project token.
     * @param lendingToken - address of lending token.
     * @param lendingTokenAmount - amount of lending token.
     */
    function repay(address projectToken, address lendingToken, uint256 lendingTokenAmount) external returns (uint256);

    /**
     * @dev Deposits project tokens on behalf of a user from a related contract and calculates the deposit position.
     * @param projectToken The address of the project token to be deposited.
     * @param projectTokenAmount The amount of project tokens to be deposited.
     * @param user The address of the user who representative deposit.
     * @param beneficiary The address of the beneficiary whose deposit position will be updated.
     * @param updatePriceTokens An array of tokens to update the price for.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     */
    function depositFromRelatedContracts(
        address projectToken,
        uint256 projectTokenAmount,
        address user,
        address beneficiary,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable;

    /**
     * @dev Allows a related contract to initiate a withdrawal of a given amount of a project token from a user's deposit position.
     * @param projectToken The address of the project token being withdrawn.
     * @param projectTokenAmount The amount of project tokens being withdrawn.
     * @param user The address of the user whose deposit position is being withdrawn from.
     * @param beneficiary The address of the user receiving the withdrawn project tokens.
     * @param updatePriceTokens An array of tokens to update the price for.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return amount of project tokens withdrawn and transferred to the beneficiary.
     */
    function withdrawFromRelatedContracts(
        address projectToken,
        uint256 projectTokenAmount,
        address user,
        address beneficiary,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256);

    /**
     * @dev Supplies a certain amount of lending tokens to the platform from a specific user.
     *
     * Requirements:
     * - The lending token is listed.
     * - Called by a related contract.
     * - The lending token is not paused.
     * - The lending token amount is greater than 0.
     * - Minting the bLendingTokens is successful and the minted amount is greater than 0.
     *
     * Effects:
     * - Mints the corresponding bLendingTokens and credits them to the user.
     * @param lendingToken Address of the lending token.
     * @param lendingTokenAmount Amount of lending tokens to be supplied.
     * @param user Address of the user.
     * @param updatePriceTokens An array of tokens to update the price for.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     */
    function supplyFromRelatedContract(
        address lendingToken,
        uint256 lendingTokenAmount,
        address user,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable;

    /**
     * @dev Function that performs the redemption of bLendingToken on behalf of a user and returns the corresponding lending token to the user by related contract.
     *
     * Requirements:
     * - The lendingToken is listed.
     _ - Called by a related contract.
     * - The lending token should not be paused.
     * - The bLendingTokenAmount should be greater than zero.
     * - The redemption of bLendingToken should not result in a redemption error.
     *
     * Effects:
     * - Burns the bLendingTokens from the user.
     * - Transfers the corresponding lending tokens to the user.
     * @param lendingToken Address of the lending token.
     * @param bLendingTokenAmount Amount of bLending tokens to be redeemed.
     * @param user Address of the user.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     */
    function redeemFromRelatedContract(
        address lendingToken,
        uint256 bLendingTokenAmount,
        address user,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable;

    /**
     * @dev Function that performs the redemption of lending token on behalf of a user and returns the corresponding underlying token to the user by related contract.
     *
     * Requirements:
     * - The lending token is listed.
     * - Called by a related contract.
     * - The lending token should not be paused.
     * - The lendingTokenAmount should be greater than zero.
     * - The redemption of lendingToken should not result in a redemption error.
     *
     * Effects:
     * - Transfers the corresponding underlying tokens to the user.
     * @param lendingToken Address of the lending token.
     * @param lendingTokenAmount Amount of lending tokens to be redeemed.
     * @param user Address of the user.
     * @param updatePriceTokens An array of tokens to update the price for.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     */
    function redeemUnderlyingFromRelatedContract(
        address lendingToken,
        uint256 lendingTokenAmount,
        address user,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable;

    /**
     * @dev Allows a related contract to borrow lending tokens on behalf of a user by providing project tokens as collateral.
     * @param lendingToken The address of the lending token being borrowed.
     * @param lendingTokenAmount The amount of lending tokens to be borrowed.
     * @param user The address of the user on whose behalf the lending tokens are being borrowed.
     * @param updatePriceTokens An array of tokens to update the price for.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return amount of lending tokens borrowed.
     */
    function borrowFromRelatedContract(
        address lendingToken,
        uint256 lendingTokenAmount,
        address user,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256);

    /**
     * @dev Allows a related contract to repay the outstanding loan for a given borrower's project token and lending token.
     * @param lendingToken The lending token's address.
     * @param lendingTokenAmount The amount of lending tokens to repay.
     * @param repairer The address that initiated the repair transaction.
     * @param borrower The borrower's address.
     * @param positionId The position ID of the borrower.
     * @return amount of lending tokens actually repaid.
     */
    function repayFromRelatedContract(
        address lendingToken,
        uint256 lendingTokenAmount,
        address repairer,
        address borrower,
        bytes32 positionId
    ) external returns (uint256);

    /**
     * @dev update borrow position.
     * @param account - address of borrower.
     */
    function updateInterestInAllBorrowPositions(address account) external;

    /**
     * @dev Calculates the deposit position for a user's deposit of a given amount of a project token.
     * @param projectToken The address of the project token being deposited.
     * @param projectTokenAmount The amount of project tokens being deposited.
     * @param user The address of the user making the deposit.
     */
    function calcDepositPosition(address projectToken, uint256 projectTokenAmount, address user) external;

    /**
     * @dev Decreases the deposited project token amount of the user's deposit position by the given amount,
     * transfers the given amount of project tokens to the receiver, and returns the amount transferred.
     * @param projectToken The address of the project token being withdrawn.
     * @param projectTokenAmount The amount of project tokens being withdrawn.
     * @param user The address of the user whose deposit position is being updated.
     * @param receiver The address of the user receiving the withdrawn project tokens.
     * @return The amount of project tokens transferred to the receiver.
     */
    function calcAndTransferDepositPosition(
        address projectToken,
        uint256 projectTokenAmount,
        address user,
        address receiver
    ) external returns (uint256);

    /**
     * @dev Allows a related contract to calculate the new borrow position of a user.
     * @param borrower The address of the user for whom the borrow position is being calculated.
     * @param lendingToken The address of the lending token being borrowed.
     * @param lendingTokenAmount The amount of lending tokens being borrowed.
     */
    function calcBorrowPosition(address borrower, address lendingToken, uint256 lendingTokenAmount) external;

    /**
     * @dev Returns the evaluation of a specific token amount in USD after update price.
     * @param token The address of the token to evaluate.
     * @param tokenAmount The amount of the token to evaluate.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return The evaluated token amount in USD.
     */
    function getTokenEvaluationWithUpdatePrices(
        address token,
        uint256 tokenAmount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256);

    /**
     * @dev Returns the total PIT (primary lending platform) value for a given account and all project tokens.
     * @param account Address of the account.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return totalEvaluation total PIT value.
    */
    function totalPITWithUpdatePrices(address account, bytes32[] memory priceIds, bytes[] calldata updateData) external payable returns (uint256);

    /**
     * @dev Returns the total deposited amount in USD for a given account and all project tokens.
     * @param account Address of the account.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return totalEvaluation total deposited amount.
     */
    function totalDepositedAmountInUSDWithUpdatePrices(
        address account,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256);

    /**
     * @dev Returns the total remaining PIT (primary lending platform) of a given account and all project tokens.
     * @param account The address of the user's borrow position.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return remaining The remaining PIT of the user's borrow position.
     */
    function totalPITRemainingWithUpdatePrices(
        address account,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256);

    /**
     * @dev Returns the total weighted loan amount of user's all borrow positions to USD.
     * @param account The address of the user account.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return totalEvaluation total outstanding amount in USD.
     */
    function totalWeightedLoanInUSDWithUpdatePrices(
        address account,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 totalEvaluation);

    /**
     * @dev Returns the total outstanding amount of a user's borrow position for a specific lending token to USD.
     * @param account The address of the user's borrow position.
     * @param lendingToken The address of the lending token.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return loanBody The amount of the lending token borrowed by the user.
     * @return accrual The accrued interest of the borrow position.
     * @return estimatedOutstandingInUSD estimated outstanding amount in USD.
     */
    function getEstimatedOutstandingInUSDWithUpdatePrices(
        address account,
        address lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 loanBody, uint256 accrual, uint256 estimatedOutstandingInUSD);

    /**
     * @dev Converts the total estimated outstanding amount of all user's borrow positions to USD.
     * @param account The address of the user account.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return totalEvaluation total outstanding amount in USD.
     */
    function totalEstimatedOutstandingInUSDWithUpdatePrices(
        address account,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 totalEvaluation);

    /**
     * @dev Converts the total estimated weighted loan amount of all user's borrow positions to USD.
     * @param account The address of the user account.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return totalEvaluation total weighted loan amount in USD.
     */
    function totalEstimatedWeightedLoanInUSDWithUpdatePrices(
        address account,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 totalEvaluation);

    /**
     * @dev Returns the total estimated remaining PIT (primary lending platform) of a given account and all project tokens.
     * @param account The address of the user's borrow position.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return remaining The remaining PIT of the user's borrow position.
     */
    function totalEstimatedPITRemainingWithUpdatePrices(
        address account,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256);

    /**
     * @dev Returns the estimated health factor of a user account at current.
     * @param account The address of the user's borrow position.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return numerator The numerator of the health factor.
     * @return denominator The denominator of the health factor.
     */
    function healthFactorWithUpdatePrices(
        address account,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 numerator, uint256 denominator);

    /**
     * @dev Gets deposited amount in USD for a specific project token.
     * @param projectToken The address of the project token.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return The deposited amount in USD.
     */
    function getDepositedPerProjectTokenInUSDWithUpdatePrices(
        address projectToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256);

    /**
     * @dev Converts the total estimated remaining pit amount to the corresponding lending token amount.
     * @param account The address of the user account.
     * @param lendingToken The address of the lending token.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return The converted lending token amount.
     */
    function convertEstimatedPitRemainingWithUpdatePrices(
        address account,
        address lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256);

    /**
     * @dev Calculates the collateral available for withdrawal based on the loan-to-value ratio of a specific project token.
     * @param account Address of the user.
     * @param projectToken Address of the project token.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return collateralProjectToWithdraw The amount of collateral available for withdrawal in the project token.
     */
    function getCollateralAvailableToWithdrawWithUpdatePrices(
        address account,
        address projectToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 collateralProjectToWithdraw);

    /**
     * @dev Calculates the lending token available amount for borrowing after updating related token's prices.
     * @param user Address of the user.
     * @param lendingToken Address of the lending token.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return availableToBorrow The amount of lending token available to borrow.
     */
    function getLendingAvailableToBorrowWithUpdatePrices(
        address user,
        address lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 availableToBorrow);


    //************* VIEW FUNCTIONS ********************************
    /**
     * @dev Returns keccak("MODERATORROLE").
     */
    function MODERATORROLE() external view returns (bytes32);

    /**
     * @dev Returns address of price oracle with interface of PriceProviderAggregator.
     */
    function priceOracle() external view returns (address);

    /**
     * @dev Returns address project token in array `projectTokens`.
     * @param projectTokenId - index of project token in array `projectTokens`. Numetates from 0 to array length - 1.
     */
    function projectTokens(uint256 projectTokenId) external view returns (address);

    /**
     * @dev Returns info of project token, that declared in struct ProjectTokenInfo.
     * @param projectToken - address of project token in array `projectTokens`. Numetates from 0 to array length - 1.
     */
    function projectTokenInfo(address projectToken) external view returns (ProjectTokenInfo memory);

    /**
     * @dev Returns address lending token in array `lendingTokens`.
     * @param lendingTokenId - index of lending token in array `lendingTokens`. Numetates from 0 to array length - 1.
     */
    function lendingTokens(uint256 lendingTokenId) external view returns (address);

    /**
     * @dev Returns info of lending token, that declared in struct LendingTokenInfo.
     * @param lendingToken - address of lending token in array `lendingTokens`. Numetates from 0 to array length - 1.
     */
    function lendingTokenInfo(address lendingToken) external view returns (LendingTokenInfo memory);

    /**
     * @dev Returns total amount of deposited project token.
     * @param projectToken - address of project token in array `projectTokens`. Numetates from 0 to array length - 1.
     */
    function totalDepositedPerProjectToken(address projectToken) external view returns (uint256);

    /**
     * @dev Returns deposit position struct.
     * @param account - address of depositor.
     * @param projectToken - address of project token.
     */
    function depositedAmount(address account, address projectToken) external view returns (uint256);

    /**
     * @dev Returns the total PIT (primary index token) value for a given account and all project tokens.
     * @param account Address of the account.
     * @return totalEvaluation total PIT value.
     * Formula: pit = $ * LVR
     * total PIT = sum of PIT for all project tokens
     */
    function totalPIT(address account) external view returns (uint256);

    /**
     * @dev Returns pit remaining amount of borrow position.
     * @param account - address of borrower.
     */
    function totalPITRemaining(address account) external view returns (uint256);

    /**
     * @dev Returns the total estimated remaining PIT (primary index token) of a given account and all project tokens.
     * @param account The address of the user's borrow position.
     */
    function totalEstimatedPITRemaining(address account) external view returns (uint256);

    /**
     * @dev Returns the estimated outstanding amount of a user's borrow position for a specific lending token.
     * @param account The address of the user's borrow position.
     * @param lendingToken The address of the lending token.
     * @return loanBody The amount of the lending token borrowed by the user.
     * @return accrual The accrued interest of the borrow position.
     */
    function getEstimatedOutstanding(address account, address lendingToken) external view returns (uint256 loanBody, uint256 accrual);

    /**
     * @dev Returns length of array `lendingTokens`.
     */
    function lendingTokensLength() external view returns (uint256);

    /**
     * @dev Returns length of array `projectTokens`.
     */
    function projectTokensLength() external view returns (uint256);

    /**
     * @dev Returns decimals of PrimaryIndexToken.
     */
    function decimals() external view returns (uint8);

    /**
     * @dev Gets the loan to value ratio of a position taken by a project token and a lending token.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @return lvrNumerator The numerator of the loan to value ratio.
     * @return lvrDenominator The denominator of the loan to value ratio.
     */
    function getLoanToValueRatio(address projectToken, address lendingToken) external view returns (uint256 lvrNumerator, uint256 lvrDenominator);

    /**
     * @dev Returns the estimated health factor of a user account at current.
     * @param account The address of the user's borrow position.
     * @return numerator The numerator of the health factor.
     * @return denominator The denominator of the health factor.
     */
    function healthFactor(address account) external view returns (uint256 numerator, uint256 denominator);

    /**
     * @dev Returns the total deposited amount in USD for a given account and all project tokens.
     * @param account Address of the account.
     * @return totalEvaluation total deposited amount.
     */
    function totalDepositedAmountInUSD(address account) external view returns (uint256);

    /**
     * @dev Returns the total estimated outstanding amount of all user's borrow positions to USD.
     * @param account The address of the user account.
     * @return totalEvaluation total outstanding amount in USD.
     */
    function totalEstimatedOutstandingInUSD(address account) external view returns (uint256 totalEvaluation);

    /**
     * @dev Converts the total estimated weighted loan amount of all user's borrow positions to USD.
     * @param account The address of the user account.
     * @return totalEvaluation total weighted loan amount in USD.
     */
    function totalEstimatedWeightedLoanInUSD(address account) external view returns (uint256 totalEvaluation);

    /**
     * @dev Returns the total outstanding amount of a user's borrow position for a specific lending token to USD.
     * @param account The address of the user's borrow position.
     * @param lendingToken The address of the lending token.
     * @return loanBody The amount of the lending token borrowed by the user.
     * @return accrual The accrued interest of the borrow position.
     * @return estimatedOutstandingInUSD estimated outstanding amount in USD.
     */
    function getEstimatedOutstandingInUSD(
        address account,
        address lendingToken
    ) external view returns (uint256 loanBody, uint256 accrual, uint256 estimatedOutstandingInUSD);

    /**
     * @dev Returns the total outstanding amount of a user's borrow position for a specific lending token.
     * @param account The address of the user's borrow position.
     * @param lendingToken The address of the lending token.
     * @return total outstanding amount of the user's borrow position.
     */
    function outstanding(address account, address lendingToken) external view returns (uint256);

    /**
     * @dev Gets deposited amount in USD for a specific project token.
     * @param projectToken The address of the project token.
     * @return The deposited amount in USD.
     */
    function getDepositedPerProjectTokenInUSD(address projectToken) external view returns (uint256);

    /**
     * @dev Gets the deposit limit amount in USD for a specific project token.
     * @param projectToken The address of the project token.
     * @return The total deposited amount in USD.
     */
    function depositLimitPerProjectToken(address projectToken) external view returns (uint256);

    /**
     * @dev Checks if the given `relatedContract` address is a related contract.
     * @param relatedContract The address of the contract to check.
     * @return A boolean value indicating whether the contract is related or not.
     */
    function isRelatedContract(address relatedContract) external view returns (bool);

    /**
     * @dev Converts the total outstanding amount of a user's borrow position to USD.
     * @param account The address of the user account.
     * @return The total outstanding amount in USD.
     */
    function totalOutstandingInUSD(address account) external view returns (uint256);

    /**
     * @dev Returns the evaluation of a specific token amount in USD.
     * @param token The address of the token to evaluate.
     * @param tokenAmount The amount of the token to evaluate.
     * @return collateralEvaluation the USD evaluation of token by its `tokenAmount` in collateral price.
     * @return capitalEvaluation the USD evaluation of token by its `tokenAmount` in capital price.
     */
    function getTokenEvaluation(address token, uint256 tokenAmount) external view returns (uint256 collateralEvaluation, uint256 capitalEvaluation);

    /**
     * @dev Returns the total borrow per lending token in USD.
     * @param lendingToken The address of the lending token.
     * @return The total borrow by lending token in USD.
     */
    function getBorrowedPerLendingTokenInUSD(address lendingToken) external view returns (uint256);

    /**
     * @dev Returns the borrow limit per lending token.
     * @return The borrow limit per lending token.
     */
    function borrowLimitPerLendingToken(address) external view returns (uint256);

    /**
     * @dev Returns the total borrow per lending token.
     * @return The total borrow by lending token.
     */
    function totalBorrowedPerLendingToken(address) external view returns (uint256);
}
