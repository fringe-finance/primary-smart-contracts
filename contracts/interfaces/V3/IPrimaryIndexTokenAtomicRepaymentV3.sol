// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IPrimaryIndexTokenAtomicRepaymentV3 {
    function repayAtomicFromRelatedContract(
        address user,
        address lendingToken,
        address prjToken,
        uint256 collateralAmount,
        bytes memory buyCalldata,
        bool isRepayFully
    ) external;
}
