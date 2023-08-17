//SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IWETH {
    function deposit() external payable;

    function withdraw(uint) external;

    function approve(address, uint) external;

    function transfer(address, uint) external;

    function transferFrom(address, address, uint) external;

    function allowance(address, address) external view returns (uint);
}
