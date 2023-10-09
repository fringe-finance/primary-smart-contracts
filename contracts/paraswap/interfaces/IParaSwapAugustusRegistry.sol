// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.19;

interface IParaSwapAugustusRegistry {
    /**
     * @dev Checks if a given address is a valid Augustus contract.
     */
    function isValidAugustus(address augustus) external view returns (bool);
}
