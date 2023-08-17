// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../PrimaryLendingPlatformV2Core.sol";

contract PrimaryLendingPlatformV2Zksync is PrimaryLendingPlatformV2Core {
    //************* Withdraw FUNCTION ********************************

    /**
     * @dev Allows a user to withdraw a given amount of a project token from their deposit position.
     * @param projectToken The address of the project token being withdrawn
     * @param projectTokenAmount The amount of project tokens being withdrawn
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
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
    ) external payable isProjectTokenListed(projectToken) nonReentrant returns (uint256) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
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
        uint256 lendingTokenAmount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isProjectTokenListed(projectToken) isLendingTokenListed(lendingToken) nonReentrant {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
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
        address user,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable isProjectTokenListed(projectToken) isLendingTokenListed(lendingToken) nonReentrant onlyRelatedContracts {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        _borrow(projectToken, lendingToken, lendingTokenAmount, user);
    }

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
    ) external payable returns (uint256) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return pit(account, projectToken, lendingToken);
    }

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
    ) external payable returns (uint256) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return pitCollateral(account, projectToken);
    }

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
    ) external payable returns (uint256) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return pitRemaining(account, projectToken, lendingToken);
    }

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
    ) external payable returns (uint256 numerator, uint256 denominator) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return healthFactor(account, projectToken, lendingToken);
    }

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
    ) external payable returns (uint256) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return getTokenEvaluation(token, tokenAmount);
    }

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
        )
    {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return getPosition(account, projectToken, lendingToken);
    }

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
    ) external payable returns (uint) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return getTotalBorrowPerLendingToken(lendingToken);
    }

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
    ) external payable returns (uint) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return getTotalBorrowPerCollateral(projectToken);
    }

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
    ) external payable returns (uint256) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return totalOutstandingInUSD(account, projectToken, lendingToken);
    }

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
    ) external payable returns (uint256 collateralProjectToWithdraw) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return getCollateralAvailableToWithdraw(account, projectToken, lendingToken);
    }

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
    ) external payable returns (uint256 availableToBorrow) {
        priceOracle.updatePrices{value: msg.value}(priceIds, updateData);
        return getLendingAvailableToBorrow(account, projectToken, lendingToken);
    }
}
