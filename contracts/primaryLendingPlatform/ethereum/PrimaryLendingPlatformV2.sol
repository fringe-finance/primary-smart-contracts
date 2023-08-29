// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../PrimaryLendingPlatformV2Core.sol";

/**
 * @title PrimaryLendingPlatformV2.
 * @notice The PrimaryLendingPlatformV2 contract is the contract that provides the functionality for lending platform system.
 * @dev Contract that provides the functionality for lending platform system. Inherit from PrimaryLendingPlatformV2Core.
 */
contract PrimaryLendingPlatformV2 is PrimaryLendingPlatformV2Core {
    //************* Withdraw FUNCTION ********************************

    /**
     * @notice Withdraws project tokens from the caller's deposit position.
     * @dev Allows a user to withdraw a given amount of a project token from their deposit position.
     * #### Requirements:
     * - The project token is listed on the platform.
     * - The project token is not paused for withdrawals.
     * - The project token amount and deposited project token amount in the user's deposit position is greater than 0.
     * #### Effects:
     * - The deposited amount for the user and the specified project token is decreased by the withdrawn amount.
     * - The total deposited project tokens for the specified token is decreased by the withdrawn amount.
     * - If the user has an outstanding loan for the project token, the interest in their borrow position may be updated.
     * - The specified beneficiary receives the withdrawn project tokens.
     * @param projectToken The address of the project token being withdrawn
     * @param projectTokenAmount The amount of project tokens being withdrawn
     */
    function withdraw(address projectToken, uint256 projectTokenAmount) external isProjectTokenListed(projectToken) nonReentrant {
        _withdraw(projectToken, projectTokenAmount, msg.sender, msg.sender);
    }

    /**
     * @dev Allows a related contract to initiate a withdrawal of a given amount of a project token from a user's deposit position.
     * #### Requirements:
     * - The project token is listed on the platform.
     * - Caller is a related contract.
     * - The project token is not paused for withdrawals.
     * - The project token amount and deposited project token amount in the user's deposit position is greater than 0.
     * #### Effects:
     * - The deposited amount for the user and the specified project token is decreased by the withdrawn amount.
     * - The total deposited project tokens for the specified token is decreased by the withdrawn amount.
     * - If the user has an outstanding loan for the project token, the interest in their borrow position may be updated.
     * - The specified beneficiary receives the withdrawn project tokens.
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
    ) external isProjectTokenListed(projectToken) onlyRelatedContracts nonReentrant returns (uint256) {
        return _withdraw(projectToken, projectTokenAmount, user, beneficiary);
    }

    //************* borrow FUNCTION ********************************

    /**
     * @notice Borrows lending tokens for the caller.
     * @dev Allows a user to borrow lending tokens by providing project tokens as collateral.
     * #### Requirements:
     * - The project token is listed on the platform.
     * - The lending token is listed on the platform.
     * - The user must not have a leverage position for the `projectToken`.
     * - The `lendingToken` address must not be address(0).
     * - The `lendingTokenAmount` must be greater than zero.
     * - If the user already has a lending token for the `projectToken`, it must match the `lendingToken` address.
     * #### Effects:
     * - Increases the borrower's borrow position in the given project and lending token.
     * - Increase the total borrow statistics.
     * - Updates the borrower's current lending token used for collateral if the current lending token is address(0).
     * - Transfers the lending tokens to the borrower.
     * @param projectToken The address of the project token being used as collateral.
     * @param lendingToken The address of the lending token being borrowed.
     * @param lendingTokenAmount The amount of lending tokens to be borrowed.
     */
    function borrow(
        address projectToken,
        address lendingToken,
        uint256 lendingTokenAmount
    ) external isProjectTokenListed(projectToken) isLendingTokenListed(lendingToken) nonReentrant {
        _borrow(projectToken, lendingToken, lendingTokenAmount, msg.sender);
    }

    /**
     * @dev Allows a related contract to borrow lending tokens on behalf of a user by providing project tokens as collateral.
     * #### Requirements:
     * - The project token is listed on the platform.
     * - Caller is a related contract.
     * - The lending token is listed on the platform.
     * - The user must not have a leverage position for the `projectToken`.
     * - The `lendingToken` address must not be address(0).
     * - The `lendingTokenAmount` must be greater than zero.
     * - If the user already has a lending token for the `projectToken`, it must match the `lendingToken` address.
     * #### Effects:
     * - Increases the borrower's borrow position in the given project and lending token.
     * - Increase the total borrow statistics.
     * - Updates the borrower's current lending token used for collateral if the current lending token is address(0).
     * - Transfers the lending tokens to the borrower.
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
        address user
    ) external isProjectTokenListed(projectToken) isLendingTokenListed(lendingToken) onlyRelatedContracts nonReentrant returns (uint256) {
        return _borrow(projectToken, lendingToken, lendingTokenAmount, user);
    }
}
