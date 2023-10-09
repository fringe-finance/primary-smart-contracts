// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract PRJ is Initializable, ERC20Upgradeable{

    function init(string memory name, string memory symbol) public initializer {
        __ERC20_init(name, symbol);
    }

    function mint(uint256 amount) public {
        mintTo(msg.sender, amount);
    }

    function mintTo(address to, uint256 amount) public {
        _mint(to,amount);
    }

}

