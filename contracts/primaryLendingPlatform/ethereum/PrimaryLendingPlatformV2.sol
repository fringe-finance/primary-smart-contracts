// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../PrimaryLendingPlatformV2Core.sol";

contract PrimaryLendingPlatformV2 is PrimaryLendingPlatformV2Core {
    //************* Withdraw FUNCTION ********************************

    /**
     * @dev Allows a user to withdraw a given amount of a project token from their deposit position.
     * @param projectToken The address of the project token being withdrawn
     * @param projectTokenAmount The amount of project tokens being withdrawn
     */
    function withdraw(address projectToken, uint256 projectTokenAmount) external isProjectTokenListed(projectToken) nonReentrant {
        _withdraw(projectToken, projectTokenAmount, msg.sender, msg.sender);
    }

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
    ) external isProjectTokenListed(projectToken) nonReentrant returns (uint256) {
        return _withdraw(projectToken, projectTokenAmount, user, beneficiary);
    }

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
        uint256 lendingTokenAmount
    ) external isProjectTokenListed(projectToken) isLendingTokenListed(lendingToken) nonReentrant {
        _borrow(projectToken, lendingToken, lendingTokenAmount, msg.sender);
    }

    /**
     * @dev Allows a related contract to borrow lending tokens on behalf of a user by providing project tokens as collateral.
     * @param projectToken The address of the project token being used as collateral.
     * @param lendingToken The address of the lending token being borrowed.
     * @param lendingTokenAmount The amount of lending tokens to be borrowed.
     * @param user The address of the user on whose behalf the lending tokens are being borrowed.
     */
    function borrowFromRelatedContract(
        address projectToken,
        address lendingToken,
        uint256 lendingTokenAmount,
        address user
    ) external isProjectTokenListed(projectToken) isLendingTokenListed(lendingToken) nonReentrant onlyRelatedContracts {
        _borrow(projectToken, lendingToken, lendingTokenAmount, user);
    }
}
