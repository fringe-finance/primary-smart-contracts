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

    /**
     * @dev The function to be called when a user wants to liquidate their position.
     * @param _account The address of the borrower
     * @param _projectToken The address of the project token
     * @param _lendingToken The address of the lending token
     * @param _lendingTokenAmount The amount of lending tokens to be used for liquidation
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     */
    function liquidate(
        address _account,
        address _projectToken,
        address _lendingToken,
        uint256 _lendingTokenAmount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable;

    /**
     * @dev Returns the minimum and maximum liquidation amount for a given account, project token, and lending token after updating related token's prices.
     * @param _account The account for which to calculate the liquidation amount.
     * @param _projectToken The project token address.
     * @param _lendingToken The lending token address.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return maxLA The maximum liquidation amount.
     * @return minLA The minimum liquidation amount.
     */
    function getLiquidationAmountWithUpdatePrices(
        address _account,
        address _projectToken,
        address _lendingToken,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable returns (uint256 maxLA, uint256 minLA);
}
