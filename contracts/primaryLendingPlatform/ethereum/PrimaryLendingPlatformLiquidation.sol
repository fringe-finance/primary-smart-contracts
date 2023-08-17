// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../PrimaryLendingPlatformLiquidationCore.sol";

contract PrimaryLendingPlatformLiquidation is PrimaryLendingPlatformLiquidationCore {

    /**
     * @notice Liquidates a portion of the borrower's debt using the lending token.
     * @param _account The address of the borrower
     * @param _projectToken The address of the project token
     * @param _lendingToken The address of the lending token
     * @param _lendingTokenAmount The amount of lending tokens to be used for liquidation
     */
    function liquidate(
        address _account,
        address _projectToken,
        address _lendingToken,
        uint256 _lendingTokenAmount
    ) external isProjectTokenListed(_projectToken) isLendingTokenListed(_lendingToken) nonReentrant {
        _liquidate(_account, _projectToken, _lendingToken, _lendingTokenAmount, msg.sender);
    }

    /**
     * @notice Liquidates a portion of the borrower's debt using the lending token, called by a related contract.
     * @param _account The address of the borrower
     * @param _projectToken The address of the project token
     * @param _lendingToken The address of the lending token
     * @param _lendingTokenAmount The amount of lending tokens to be used for liquidation
     * @param liquidator The address of the liquidator
     * @return projectTokenLiquidatorReceived The amount of project tokens received by the liquidator
     */
    function liquidateFromModerator(
        address _account,
        address _projectToken,
        address _lendingToken,
        uint256 _lendingTokenAmount,
        address liquidator
    ) external isProjectTokenListed(_projectToken) isLendingTokenListed(_lendingToken) onlyRelatedContracts nonReentrant returns (uint256) {
        return _liquidate(_account, _projectToken, _lendingToken, _lendingTokenAmount, liquidator);
    }
}
