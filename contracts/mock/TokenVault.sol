//SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./ERC4626/tokens/ERC4626.sol";

contract TokenVault is ERC4626 {
    // a mapping that checks if a user has deposited the token
    mapping(address => uint256) public shareHolder;

    address public admin;

    uint16 public interestPercent; // decimals: 2. Ex: 100% is 10000 units

    constructor(
        ERC20 _asset,
        string memory _name,
        string memory _symbol,
        uint16 _interestPercent
    ) ERC4626(_asset, _name, _symbol) {
        admin = msg.sender;
        interestPercent = _interestPercent;
    }

    // constructor() {}

    modifier onlyAdmin() {
        require (msg.sender == admin, "Caller is not admin");
        _;
    }

    /**
     * @notice function to set interest percent
     * @param _value value of interest percent
     */
    function setInterestPercent(uint16 _value) external onlyAdmin {
        interestPercent = _value;
    }

    /**
     * @notice function to deposit assets and receive vault tokens in exchange
     * @param _assets amount of the asset token
     */
    function _deposit(uint256 _assets) public {
        // checks that the deposited amount is greater than zero.
        require(_assets > 0, "Deposit less than Zero");
        // calling the deposit function from the ERC-4626 library to perform all the necessary functionality
        deposit(_assets, msg.sender);
        // Increase the share of the user
        shareHolder[msg.sender] += _assets;
    }

    /**
     * @notice Function to allow msg.sender to withdraw their deposit plus accrued interest
     * @param _shares amount of shares the user wants to convert
     * @param _receiver address of the user who will receive the assets
     */
    function _withdraw(uint256 _shares, address _receiver) public {
        // checks that the deposited amount is greater than zero.
        require(_shares > 0, "withdraw must be greater than Zero");
        // Checks that the _receiver address is not zero.
        require(_receiver != address(0), "Zero Address");
        // checks that the caller is a shareholder
        require(shareHolder[msg.sender] > 0, "Not a share holder");
        // checks that the caller has more shares than they are trying to withdraw.
        require(shareHolder[msg.sender] >= _shares, "Not enough shares");
        // Calculate 10% yield on the withdrawal amount
        uint256 percent = ( interestPercent * _shares) / 10000;
        // Calculate the total asset amount as the sum of the share amount plus 10% of the share amount.
        uint256 assets = _shares + percent;
        // calling the redeem function from the ERC-4626 library to perform all the necessary functionality
        redeem(assets, _receiver, msg.sender);
        // Decrease the share of the user
        shareHolder[msg.sender] -= _shares;
    }

    /**
     * @notice Function to allow msg.sender to get withdraw their deposit plus accrued interest
     * @param _shares amount of shares the user wants to convert
     */
    function getWithdrawableAmount(uint256 _shares) public view returns (uint256) {
        return ( interestPercent * _shares) / 10000;
    }

    // returns total number of assets
    function totalAssets() public view override returns (uint256) {
        return asset.balanceOf(address(this));
    }

    // returns total balance of user
    function totalAssetsOfUser(address _user) public view returns (uint256) {
        return asset.balanceOf(_user);
    }
}
