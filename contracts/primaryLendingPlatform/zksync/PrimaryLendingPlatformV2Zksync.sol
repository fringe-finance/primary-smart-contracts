// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../PrimaryLendingPlatformV2Core.sol";

/**
 * @title PrimaryLendingPlatformV2Zksync.
 * @notice The PrimaryLendingPlatformV2Zksync contract is the contract that provides the functionality for lending platform system.
 * @dev Contract that provides the functionality for lending platform system. Inherit from PrimaryLendingPlatformV2Core.
 */
contract PrimaryLendingPlatformV2Zksync is PrimaryLendingPlatformV2Core {
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
     * @param projectToken The address of the project token to withdraw.
     * @param projectTokenAmount The amount of project tokens to withdraw.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     */
    function withdraw(
        address projectToken,
        uint256 projectTokenAmount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isProjectTokenListed(projectToken) nonReentrant {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        _withdraw(projectToken, projectTokenAmount, msg.sender, msg.sender);
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
     * @param projectToken The address of the project token to withdraw.
     * @param projectTokenAmount The amount of project tokens to withdraw.
     * @param user The address of the user withdrawing the tokens.
     * @param beneficiary The address of the beneficiary receiving the tokens.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return The amount of project tokens withdrawn and transferred to the beneficiary.
     */
    function withdrawFromRelatedContracts(
        address projectToken,
        uint256 projectTokenAmount,
        address user,
        address beneficiary,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isProjectTokenListed(projectToken) onlyRelatedContracts nonReentrant returns (uint256) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return _withdraw(projectToken, projectTokenAmount, user, beneficiary);
    }

    //************* Borrow FUNCTION ********************************

    /**
     * @notice Borrows lending tokens for the caller.
     * @dev Allows a user to borrow lending tokens by providing project tokens as collateral and update related token's prices.
     *
     * Requirements:
     * - The project token is listed on the platform.
     * - The lending token is listed on the platform.
     * - The user must not have a leverage position for the `projectToken`.
     * - The `lendingToken` address must not be address(0).
     * - The `lendingTokenAmount` must be greater than zero.
     * - If the user already has a lending token for the `projectToken`, it must match the `lendingToken` address.
     *
     * Effects:
     * - Update price of related tokens.
     * - Increases the borrower's borrow position in the given project and lending token.
     * - Increase the total borrow statistics.
     * - Updates the borrower's current lending token used for collateral if the current lending token is address(0).
     * - Transfers the lending tokens to the borrower..
     * @param projectToken The address of the project token used as collateral.
     * @param lendingToken The address of the lending token being borrowed.
     * @param lendingTokenAmount The amount of lending token being borrowed.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     */
    function borrow(
        address projectToken,
        address lendingToken,
        uint256 lendingTokenAmount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isProjectTokenListed(projectToken) isLendingTokenListed(lendingToken) nonReentrant {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        _borrow(projectToken, lendingToken, lendingTokenAmount, msg.sender);
    }

    /**
     * @dev Allows a related contract to borrow lending tokens on behalf of a user by providing project tokens as collateral and update related token's prices.
     *
     * Requirements:
     * - The project token is listed on the platform.
     * - Caller is a related contract.
     * - The lending token is listed on the platform.
     * - The user must not have a leverage position for the `projectToken`.
     * - The `lendingToken` address must not be address(0).
     * - The `lendingTokenAmount` must be greater than zero.
     * - If the user already has a lending token for the `projectToken`, it must match the `lendingToken` address.
     *
     * Effects:
     * - Update price of related tokens.
     * - Increases the borrower's borrow position in the given project and lending token.
     * - Increase the total borrow statistics.
     * - Updates the borrower's current lending token used for collateral if the current lending token is address(0).
     * - Transfers the lending tokens to the borrower.
     * @param projectToken The address of the project token being used as collateral.
     * @param lendingToken The address of the lending token being borrowed.
     * @param lendingTokenAmount The amount of lending tokens to be borrowed.
     * @param user The address of the user on whose behalf the lending tokens are being borrowed.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     * @return amount of lending tokens borrowed
     */
    function borrowFromRelatedContract(
        address projectToken,
        address lendingToken,
        uint256 lendingTokenAmount,
        address user,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isProjectTokenListed(projectToken) isLendingTokenListed(lendingToken) nonReentrant onlyRelatedContracts returns (uint256) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return _borrow(projectToken, lendingToken, lendingTokenAmount, user);
    }

    //************* Supply FUNCTION ********************************

    /**
     * @notice Supplies a specified amount of a lending token to the platform.
     * @dev Allows a user to supply a specified amount of a lending token to the platform.
     * @param lendingToken The address of the lending token being supplied.
     * @param lendingTokenAmount The amount of the lending token being supplied.
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
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isLendingTokenListed(lendingToken) nonReentrant {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        _supply(lendingToken, lendingTokenAmount, msg.sender);
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
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     */
    function supplyFromRelatedContract(
        address lendingToken,
        uint256 lendingTokenAmount,
        address user,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isLendingTokenListed(lendingToken) onlyRelatedContracts nonReentrant {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        _supply(lendingToken, lendingTokenAmount, user);
    }

    //************* Redeem FUNCTION ********************************

    /**
     * @notice Redeems a specified amount of bLendingToken from the platform.
     * @dev Function that performs the redemption of bLendingToken and returns the corresponding lending token to user.
     *
     * Requirements:
     * - The lendingToken is listed.
     * - The lending token should not be paused.
     * - The bLendingTokenAmount should be greater than zero.
     * - The redemption of bLendingToken should not result in a redemption error.
     *
     * Effects:
     * - Burns the bLendingTokens from the user.
     * - Transfers the corresponding lending tokens to the user.
     * @param lendingToken Address of the lending token.
     * @param bLendingTokenAmount Amount of bLending tokens to be redeemed.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     */
    function redeem(
        address lendingToken,
        uint256 bLendingTokenAmount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isLendingTokenListed(lendingToken) nonReentrant {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        _redeem(lendingToken, bLendingTokenAmount, msg.sender);
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
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     */
    function redeemFromRelatedContract(
        address lendingToken,
        uint256 bLendingTokenAmount,
        address user,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isLendingTokenListed(lendingToken) onlyRelatedContracts nonReentrant {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        _redeem(lendingToken, bLendingTokenAmount, user);
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
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     */
    function redeemUnderlying(
        address lendingToken,
        uint256 lendingTokenAmount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isLendingTokenListed(lendingToken) nonReentrant {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        _redeemUnderlying(lendingToken, lendingTokenAmount, msg.sender);
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
     */
    function redeemUnderlyingFromRelatedContract(
        address lendingToken,
        uint256 lendingTokenAmount,
        address user,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isLendingTokenListed(lendingToken) onlyRelatedContracts nonReentrant {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        _redeemUnderlying(lendingToken, lendingTokenAmount, user);
    }

    /**
     * @dev Returns the remaining PIT (primary index token) of a user's borrow position for a specific project token and lending token after updating related token's prices.
     * @param account The address of the user's borrow position.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     * @return The remaining PIT of the user's borrow position.
     */
    function pitRemainingWithUpdatePrices(
        address account,
        address projectToken,
        address lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return pitRemaining(account, projectToken, lendingToken);
    }

    /**
     * @dev Returns the evaluation of a specific token amount in USD after updating related token's prices.
     * @param token The address of the token to evaluate.
     * @param tokenAmount The amount of the token to evaluate.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     * @return collateralEvaluation the USD evaluation of token by its `tokenAmount` in collateral price
     * @return capitalEvaluation the USD evaluation of token by its `tokenAmount` in capital price
     */
    function getTokenEvaluationWithUpdatePrices(
        address token,
        uint256 tokenAmount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 collateralEvaluation, uint256 capitalEvaluation) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return getTokenEvaluation(token, tokenAmount);
    }

    /**
     * @dev Returns the details of a user's borrow position for a specific project token and lending token after updating related token's prices.
     * @param account The address of the user's borrow position.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     * @return depositedProjectTokenAmount The amount of project tokens deposited by the user.
     * @return loanBody The amount of the lending token borrowed by the user.
     * @return accrual The accrued interest of the borrow position.
     * @return healthFactorNumerator The numerator of the health factor.
     * @return healthFactorDenominator The denominator of the health factor.
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
        )
    {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return getPosition(account, projectToken, lendingToken);
    }

    /**
     * @dev Calculates the collateral available for withdrawal based on the loan-to-value ratio of a specific project token after updating related token's prices.
     * @param account Address of the user.
     * @param projectToken Address of the project token.
     * @param lendingToken Address of the lending token.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     * @return collateralProjectToWithdraw The amount of collateral available for withdrawal in the project token.
     */
    function getCollateralAvailableToWithdrawWithUpdatePrices(
        address account,
        address projectToken,
        address lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 collateralProjectToWithdraw) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return getCollateralAvailableToWithdraw(account, projectToken, lendingToken);
    }

    /**
     * @dev Calculates the lending token available amount for borrowing after updating related token's prices.
     * @param account Address of the user.
     * @param projectToken Address of the project token.
     * @param lendingToken Address of the lending token.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     * @return availableToBorrow The amount of lending token available amount for borrowing.
     */
    function getLendingAvailableToBorrowWithUpdatePrices(
        address account,
        address projectToken,
        address lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 availableToBorrow) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return getLendingAvailableToBorrow(account, projectToken, lendingToken);
    }
}
