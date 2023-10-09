// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IPrimaryLendingPlatformLiquidation {
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
    ) external returns (uint256 projectTokenLiquidatorReceived);

    /**
     * @notice Liquidates a portion of the borrower's debt using the lending token, called by a related contract.
     * @param _account The address of the borrower
     * @param _projectToken The address of the project token
     * @param _lendingToken The address of the lending token
     * @param _lendingTokenAmount The amount of lending tokens to be used for liquidation
     * @param liquidator The address of the liquidator
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     * @return projectTokenLiquidatorReceived The amount of project tokens received by the liquidator
     */
    function liquidateFromModerator(
        address _account,
        address _projectToken,
        address _lendingToken,
        uint256 _lendingTokenAmount,
        address liquidator,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256);
}
