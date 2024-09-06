// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../../util/V3/Asset.sol";

interface IPrimaryLendingPlatformLeverageV3 {
    /**
     * @dev Allows a related contract to borrow funds on behalf of a user to enter a leveraged position.
     * @param prjInfo Information about the project token, including its address and type.
     * @param lendingInfo Information about the lending token, including its address and type.
     * @param notionalExposure The notional exposure of the user's investment.
     * @param marginCollateralAmount The amount of collateral to be deposited by the user.
     * @param buyCalldata The calldata used for buying the project token on the DEX.
     * @param borrower The address of the user for whom the funds are being borrowed.
     * @param leverageType The type of leverage borrow.
     * @param updatePriceTokens An array of addresses of the tokens to update the price for.
     */
    function leveragedBorrowFromRelatedContract(
        Asset.Info memory prjInfo,
        Asset.Info memory lendingInfo,
        uint256 notionalExposure,
        uint256 marginCollateralAmount,
        bytes[] memory buyCalldata,
        address borrower,
        uint8 leverageType,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable;

    /**
     * @dev Calculates the additional collateral amount needed for the specified user and project token.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     * @param marginCollateralCount The margin collateral amount.
     * @return addingAmount The additional collateral amount needed.
     */
    function calculateAddingAmount(address user, address projectToken, uint256 marginCollateralCount) external view returns (uint256 addingAmount);

    /**
     * @notice Allows a related contract to close the specific leverage position by short asset.
     * @param user The address of the repairer.
     * @param positionId The id of leverage position.
     * @param lendingToken The address of short asset.
     * @param lendingTokenAmount The amount of short asset for closing.
     * @param borrower The address of the borrower.
     * @return The remaining amount of short asset.
     */
    function closePositionByShortAssetFromRelatedContract(
        address user,
        bytes32 positionId,
        address lendingToken,
        uint256 lendingTokenAmount,
        address borrower
    ) external returns (uint256);
}
