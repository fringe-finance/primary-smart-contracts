// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;


interface IPrimaryIndexTokenLiquidationV3
{
    function liquidateFromModerator(address _account, address _projectToken, address _lendingToken, uint256 _lendingTokenAmount, address liquidator) external returns(uint256);
}