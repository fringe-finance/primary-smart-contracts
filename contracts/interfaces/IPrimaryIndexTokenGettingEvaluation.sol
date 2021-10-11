// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IPrimaryIndexTokenGettingEvaluation {
    
    function getPrjEvaluationInBasicToken(address projectToken, uint256 amount) external view returns(uint256);

}