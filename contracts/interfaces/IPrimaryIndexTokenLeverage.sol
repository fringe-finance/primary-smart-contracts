// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IPrimaryIndexTokenLeverage 
{
    function isLeveragePosition(address user, address projectToken) external view returns(bool);

    function deleteLeveragePosition(address user, address projectToken) external;

    function leveragedBorrowFromRelatedContract(address projectToken, address lendingToken, uint notionalExposure, uint marginCollateralAmount, bytes memory buyCalldata, address borrower, uint8 leverageType) external;

    function calculateAddingAmount(address user, address projectToken, uint marginCollateralCount) external view returns(uint256 addingAmount);
}
