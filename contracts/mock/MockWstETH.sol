// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "../openzeppelin/contracts/token/ERC20/ERC20.sol";
contract MockWstETH is ERC20{
    uint8 private _decimals;
    
    uint256 private wstETHToStETH;
    constructor(string memory name, string memory symbol, uint8 decimals_) ERC20(name, symbol) {
        _decimals = decimals_;
    }
    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }
    function decimals() public view override returns (uint8){
        return _decimals;
    }
    function setStETHPerToken(uint256 newValue) external {
        wstETHToStETH = newValue;
    }
    function stEthPerToken() external view returns (uint256) {
        return wstETHToStETH;
    }
}