// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IPrimaryLendingPlatformLeverage {

    /**
     * @dev Checks if a user has a leverage position for a project token.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     */
    function isLeveragePosition(address user, address projectToken) external view returns (bool);

    /**
     * @dev Deletes a leverage position for a user and project token.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     */
    function deleteLeveragePosition(address user, address projectToken) external;

    /**
     * @dev Allows a related contract to borrow funds on behalf of a user to enter a leveraged position.
     * @param projectToken The address of the project token the user wants to invest in.
     * @param lendingToken The address of the lending token used for collateral.
     * @param notionalExposure The notional exposure of the user's investment.
     * @param marginCollateralAmount The amount of collateral to be deposited by the user.
     * @param buyCalldata The calldata used for buying the project token on the DEX.
     * @param borrower The address of the user for whom the funds are being borrowed.
     */
    function leveragedBorrowFromRelatedContract(
        address projectToken,
        address lendingToken,
        uint256 notionalExposure,
        uint256 marginCollateralAmount,
        bytes memory buyCalldata,
        address borrower,
        uint8 leverageType
    ) external;

    /**
     * @dev Calculates the additional collateral amount needed for the specified user and project token.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     * @param marginCollateralCount The margin collateral amount.
     * @return addingAmount The additional collateral amount needed.
     */
    function calculateAddingAmount(address user, address projectToken, uint256 marginCollateralCount) external view returns (uint256 addingAmount);

    /** 
     * @dev Allows a related contract to borrow funds on behalf of a user to enter a leveraged position. 
     * @param projectToken The address of the project token the user wants to invest in. 
     * @param lendingToken The address of the lending token used for collateral. 
     * @param notionalExposure The notional exposure of the user's investment. 
     * @param marginCollateralAmount The amount of collateral to be deposited by the user. 
     * @param buyCalldata The calldata used for buying the project token on the DEX. 
     * @param borrower The address of the user for whom the funds are being borrowed. 
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     */
    function leveragedBorrowFromRelatedContract(address projectToken, address lendingToken, uint notionalExposure, uint marginCollateralAmount, bytes memory buyCalldata, address borrower, uint8 leverageType, bytes32[] memory priceIds, bytes[] calldata updateData) external payable;
}
