// SPDX-License-Identifier: AGPL-3.0
pragma solidity >=0.8.0;

interface IParaSwapAugustus {
  function getTokenTransferProxy() external view returns (address);
  function approveToken(address, address, uint) external;
}