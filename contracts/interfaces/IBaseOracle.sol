// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

interface IBaseOracle {
  /// @dev Return the value of the given input as USD per unit, multiplied by 2**112.
  /// @param token The ERC-20 token to check the value.
  function getUSDPx(address token) external view returns (uint);
}