// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import '../../../interfaces/IBaseOracle.sol';

contract UsingBaseOracle {
  IBaseOracle public immutable base; // Base oracle source

  constructor(IBaseOracle _base) {
    base = _base;
  }
}