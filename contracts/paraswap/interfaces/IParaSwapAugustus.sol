// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.19;

interface IParaSwapAugustus {
    /**
     * @dev Returns the address of the token transfer proxy contract used by Augustus.
     */
    function getTokenTransferProxy() external view returns (address);
}
