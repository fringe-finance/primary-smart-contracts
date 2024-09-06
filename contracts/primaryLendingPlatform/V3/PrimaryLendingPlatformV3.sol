// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./core/PrimaryLendingPlatformV3Core.sol";

/**
 * @title PrimaryLendingPlatformV3.
 * @notice The PrimaryLendingPlatformV3 contract is the contract that provides the functionality for lending platform system.
 * @dev Contract that provides the functionality for lending platform system. Inherit from PrimaryLendingPlatformV3Core.
 */
contract PrimaryLendingPlatformV3 is PrimaryLendingPlatformV3Core {
    //************* EXTERNAL FUNCTION ********************************
    /**
     * @dev Deposits project tokens and calculates the deposit position.
     *
     * Requirements:
     * - The project token must be listed.
     * - The project token must not be paused for deposits.
     * - The project token amount must be greater than 0.
     *
     * Effects:
     * - Transfers the project tokens from the user to the contract.
     * - Updates the deposit position of the user.
     * @param projectToken The address of the project token to be deposited.
     * @param projectTokenAmount The amount of project tokens to be deposited.
     * @param updatePriceTokens Array of addresses of the tokens to update the price.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes price data to update.
     */
    function deposit(
        address projectToken,
        uint256 projectTokenAmount,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isProjectTokenListed(projectToken) nonReentrant {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        _deposit(projectToken, projectTokenAmount, msg.sender, msg.sender, updatePriceTokens);
    }

    /**
     * @dev Deposits project tokens from related contracts into the platform.
     *
     * Requirements:
     * - The project token must be listed.
     * - Caller must be a related contract.
     * - The project token amount must be greater than 0.
     * - The project token must not be paused for deposits.
     *
     * Effects:
     * - Transfers the project tokens from the user to the contract.
     * - Updates the deposit position of the user.
     * @param projectToken The address of the project token to be deposited.
     * @param projectTokenAmount The amount of project tokens to be deposited.
     * @param user The address of the user who representative deposited.
     * @param beneficiary The address of the beneficiary whose deposit position will be updated.
     * @param updatePriceTokens Array of addresses of the tokens to update the price.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes price data to update.
     */
    function depositFromRelatedContracts(
        address projectToken,
        uint256 projectTokenAmount,
        address user,
        address beneficiary,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isProjectTokenListed(projectToken) nonReentrant onlyRelatedContracts {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        _deposit(projectToken, projectTokenAmount, user, beneficiary, updatePriceTokens);
    }

    //************* Supply FUNCTION ********************************

    /**
     * @notice Supplies a specified amount of a lending token to the platform.
     * @dev Allows a user to supply a specified amount of a lending token to the platform.
     * @param lendingToken The address of the lending token being supplied.
     * @param lendingTokenAmount The amount of the lending token being supplied.
     * @param updatePriceTokens An array of addresses of the tokens to update the price for.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     *
     * Requirements:
     * - The lending token is listed.
     * - The lending token is not paused.
     * - The lending token amount is greater than 0.
     * - Minting the bLendingTokens is successful and the minted amount is greater than 0.
     *
     * Effects:
     * - Mints the corresponding bLendingTokens and credits them to the user.
     */
    function supply(
        address lendingToken,
        uint256 lendingTokenAmount,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isLendingTokenListed(lendingToken) nonReentrant {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        _supply(lendingToken, lendingTokenAmount, msg.sender, updatePriceTokens);
    }

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
     * @param updatePriceTokens An array of addresses of the tokens to update the price for.
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
    ) external payable isLendingTokenListed(lendingToken) onlyRelatedContracts nonReentrant {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        _supply(lendingToken, lendingTokenAmount, user, updatePriceTokens);
    }

    //************* Redeem FUNCTION ********************************

    /**
     * @notice Redeems a specified amount of bLendingToken from the platform.
     * @dev Function that performs the redemption of bLendingToken and returns the corresponding lending token to user.
     *
     * Requirements:
     * - The lendingToken is listed.
     * - The lendingToken should not be paused.
     * - The bLendingTokenAmount should be greater than zero.
     * - The redemption of bLendingToken should not result in a redemption error.
     *
     * Effects:
     * - Burns the bLendingTokens from the user.
     * - Transfers the corresponding lending tokens to the user.
     * @param lendingToken Address of the lending token.
     * @param bLendingTokenAmount Amount of bLending tokens to be redeemed.
     * @param updatePriceTokens An array of addresses of the tokens to update the price for.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     */
    function redeem(
        address lendingToken,
        uint256 bLendingTokenAmount,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isLendingTokenListed(lendingToken) nonReentrant {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        _redeem(lendingToken, bLendingTokenAmount, msg.sender, updatePriceTokens);
    }

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
	 * @param updatePriceTokens An array of addresses of the tokens to update the price for.
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
    ) external payable isLendingTokenListed(lendingToken) onlyRelatedContracts nonReentrant {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        _redeem(lendingToken, bLendingTokenAmount, user, updatePriceTokens);
    }

    //************* RedeemUnderlying FUNCTION ********************************

    /**
     * @notice Redeems a specified amount of lendingToken from the platform.
     * @dev Function that performs the redemption of lending token and returns the corresponding underlying token to user.
     *
     * Requirements:
     * - The lending token is listed.
     * - The lending token should not be paused.
     * - The lendingTokenAmount should be greater than zero.
     * - The redemption of lendingToken should not result in a redemption error.
     *
     * Effects:
     * - Transfers the corresponding underlying tokens to the user.
     * @param lendingToken Address of the lending token.
     * @param lendingTokenAmount Amount of lending tokens to be redeemed.
     * @param updatePriceTokens An array of addresses of the tokens to update the price for.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     */
    function redeemUnderlying(
        address lendingToken,
        uint256 lendingTokenAmount,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isLendingTokenListed(lendingToken) nonReentrant {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        _redeemUnderlying(lendingToken, lendingTokenAmount, msg.sender, updatePriceTokens);
    }

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
     * @param updatePriceTokens An array of addresses of the tokens to update the price for.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     */
    function redeemUnderlyingFromRelatedContract(
        address lendingToken,
        uint256 lendingTokenAmount,
        address user,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isLendingTokenListed(lendingToken) onlyRelatedContracts nonReentrant {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        _redeemUnderlying(lendingToken, lendingTokenAmount, user, updatePriceTokens);
    }

    //************* Withdraw FUNCTION ********************************

    /**
     * @notice Withdraws project tokens from the caller's deposit position.
     * @dev Allows a user to withdraw project tokens and update related token's prices.
     *
     * Requirements:
     * - The project token is listed on the platform.
     * - The project token is not paused for withdrawals.
     * - The project token amount and deposited project token amount in the user's deposit position is greater than 0.
     *
     * Effects:
     * - Update price of related tokens.
     * - The deposited amount for the user and the specified project token is decreased by the withdrawn amount.
     * - The total deposited project tokens for the specified token is decreased by the withdrawn amount.
     * - If the user has an outstanding loan for the project token, the interest in their borrow position may be updated.
     * - The specified beneficiary receives the withdrawn project tokens.
     * @param projectToken The address of the project token being withdrawn.
     * @param projectTokenAmount The amount of project tokens being withdrawn.
     * @param updatePriceTokens An array of addresses of the tokens to update the price for.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     */
    function withdraw(
        address projectToken,
        uint256 projectTokenAmount,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isProjectTokenListed(projectToken) nonReentrant {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        _withdraw(projectToken, projectTokenAmount, msg.sender, msg.sender, updatePriceTokens);
    }

    /**
     * @dev Withdraws project tokens from related contracts and update related token's prices.
     *
     * Requirements:
     * - The project token is listed on the platform.
     * - The project token is not paused for withdrawals.
     * - The project token amount and deposited project token amount in the user's deposit position is greater than 0.
     *
     * Effects:
     * - Update price of related tokens.
     * - The deposited amount for the user and the specified project token is decreased by the withdrawn amount.
     * - The total deposited project tokens for the specified token is decreased by the withdrawn amount.
     * - If the user has an outstanding loan for the project token, the interest in their borrow position may be updated.
     * @param projectToken The address of the project token being withdrawn.
     * @param projectTokenAmount The amount of project tokens being withdrawn.
     * @param user The address of the user whose deposit position is being withdrawn from.
     * @param beneficiary The address of the user receiving the withdrawn project tokens.
     * @param updatePriceTokens An array of addresses of the tokens to update the price for.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
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
    ) external payable isProjectTokenListed(projectToken) onlyRelatedContracts nonReentrant returns (uint256) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return _withdraw(projectToken, projectTokenAmount, user, beneficiary, updatePriceTokens);
    }

    //************* borrow FUNCTION ********************************

    /**
     * @notice Borrows lending tokens for the caller.
     * @dev Allows a user to borrow lending tokens by providing pooled collateral.
     *
     * Requirements:
     * - The lending token is listed on the platform.
     * - The `lendingToken` address must not be address(0).
     * - The `lendingTokenAmount` must be greater than 0.
     * - Total borrow must not be exceeded the borrow limit.
     *
     * Effects:
     * - Update price of related tokens.
     * - Increases the borrower's borrow position.
     * - Increase the total borrow statistics.
     * - Transfers the lending tokens to the borrower.
     * @param lendingToken The address of the lending token being borrowed.
     * @param lendingTokenAmount The amount of lending tokens to be borrowed.
     * @param updatePriceTokens An array of addresses of the tokens to update the price for.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     */
    function borrow(
        address lendingToken,
        uint256 lendingTokenAmount,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isLendingTokenListed(lendingToken) nonReentrant {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        _borrow(lendingToken, lendingTokenAmount, msg.sender, updatePriceTokens);
    }

    /**
     * @dev Allows a related contract to borrow lending tokens by providing pooled collateral.
     *
     * Requirements:
     * - The lending token is listed on the platform.
     * - The `lendingToken` address must not be address(0).
     * - The `lendingTokenAmount` must be greater than 0.
     * - Total borrow must not be exceeded the borrow limit.
     *
     * Effects:
     * - Update price of related tokens.
     * - Increases the borrower's borrow position.
     * - Increase the total borrow statistics.
     * - Transfers the lending tokens to the borrower.
     * @param lendingToken The address of the lending token being borrowed.
     * @param lendingTokenAmount The amount of lending tokens to be borrowed.
     * @param user The address of the user on whose behalf the lending tokens are being borrowed.
     * @param updatePriceTokens An array of addresses of the tokens to update the price for.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     */
    function borrowFromRelatedContract(
        address lendingToken,
        uint256 lendingTokenAmount,
        address user,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isLendingTokenListed(lendingToken) onlyRelatedContracts nonReentrant returns (uint256) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return _borrow(lendingToken, lendingTokenAmount, user, updatePriceTokens);
    }

    /**
     * @dev Returns the total PIT (primary lending platform) value for a given account and all project tokens.
     * @param account Address of the account.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return totalEvaluation total PIT value.
     * Formula: pit = $ * LVR
     * total PIT = sum of PIT for all project tokens
     */
    function totalPITWithUpdatePrices(address account, bytes32[] memory priceIds, bytes[] calldata updateData) external payable returns (uint256) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return totalPIT(account);
    }

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
    ) external payable returns (uint256) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return totalDepositedAmountInUSD(account);
    }

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
    ) external payable returns (uint256 loanBody, uint256 accrual, uint256 estimatedOutstandingInUSD) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return getEstimatedOutstandingInUSD(account, lendingToken);
    }

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
    ) external payable returns (uint256 totalEvaluation) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return totalEstimatedOutstandingInUSD(account);
    }

    /**
     * @dev Converts the total estimated weighted loan amount of all user's borrow positions to USD
     * @param account The address of the user account
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return totalEvaluation total weighted loan amount in USD
     */
    function totalEstimatedWeightedLoanInUSDWithUpdatePrices(
        address account,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 totalEvaluation) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return totalEstimatedWeightedLoanInUSD(account);
    }

    /**
     * @dev Returns the total estimated remaining PIT (primary lending platform) of a given account and all project tokens.
     * @param account The address of the user's borrow position
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return remaining The remaining PIT of the user's borrow position
     */
    function totalEstimatedPITRemainingWithUpdatePrices(
        address account,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return totalEstimatedPITRemaining(account);
    }

    /**
     * @dev Returns the estimated health factor of a user account at current
     * @param account The address of the user's borrow position
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return numerator The numerator of the health factor
     * @return denominator The denominator of the health factor
     */
    function healthFactorWithUpdatePrices(
        address account,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 numerator, uint256 denominator) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return healthFactor(account);
    }

    /**
     * @dev Returns the evaluation of a specific token amount in USD
     * @param token The address of the token to evaluate
     * @param tokenAmount The amount of the token to evaluate
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return The evaluated token amount in USD
     */
    function getTokenEvaluationWithUpdatePrices(
        address token,
        uint256 tokenAmount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256, uint256) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return getTokenEvaluation(token, tokenAmount);
    }

    /**
     * @dev Gets deposited amount in USD for a specific project token
     * @param projectToken The address of the project token
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return The deposited amount in USD
     */
    function getDepositedPerProjectTokenInUSDWithUpdatePrices(
        address projectToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return getDepositedPerProjectTokenInUSD(projectToken);
    }

    /**
     * @dev Converts the total estimated remaining pit amount to the corresponding lending token amount
     * @param account The address of the user account
     * @param lendingToken The address of the lending token
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return The converted lending token amount
     */
    function convertEstimatedPitRemainingWithUpdatePrices(
        address account,
        address lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return convertEstimatedPitRemaining(account, lendingToken);
    }

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
    ) external payable returns (uint256 collateralProjectToWithdraw) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return getCollateralAvailableToWithdraw(account, projectToken);
    }

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
    ) external payable returns (uint256 availableToBorrow) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return getLendingAvailableToBorrow(user, lendingToken);
    }
}
