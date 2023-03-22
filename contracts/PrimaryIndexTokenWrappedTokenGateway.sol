// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./openzeppelin/contracts/utils/math/Math.sol";
import "./interfaces/IPrimaryIndexToken.sol";
import "./interfaces/IWETH.sol";
import "./interfaces/IBLendingToken.sol";
import "./interfaces/IPrimaryIndexTokenLiquidation.sol";
import "./interfaces/IPrimaryIndexTokenLeverage.sol";

contract PrimaryIndexTokenWrappedTokenGateway is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for ERC20Upgradeable;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    IPrimaryIndexToken public primaryIndexToken;
    IWETH public WETH;
    IPrimaryIndexTokenLiquidation public pitLiquidation;

    IPrimaryIndexTokenLeverage public pitLeverage;

    function initialize(address pit, address weth, address _pitLiquidation, address _pitLeverage) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init_unchained();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        primaryIndexToken = IPrimaryIndexToken(pit);
        WETH = IWETH(weth);
        address fWETH = primaryIndexToken.lendingTokenInfo(weth).bLendingToken;
        IWETH(weth).approve(fWETH, type(uint256).max);
        pitLiquidation = IPrimaryIndexTokenLiquidation(_pitLiquidation);
        pitLeverage = IPrimaryIndexTokenLeverage(_pitLeverage);
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "WTG: Caller is not the Admin");
        _;
    }

    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "WTG: Caller is not the Moderator");
        _;
    }

    modifier isProjectTokenListed(address _projectToken) {
        require(primaryIndexToken.projectTokenInfo(_projectToken).isListed, "WTG: project token is not listed");
        _;
    }

    modifier isLendingTokenListed(address _lendingToken) {
        require(primaryIndexToken.lendingTokenInfo(_lendingToken).isListed, "WTG: lending token is not listed");
        _;
    }

    function setPrimaryIndexToken(address newPit) public onlyModerator {
        require(newPit != address(0), "WTG: Invalid address");
        primaryIndexToken = IPrimaryIndexToken(newPit);
    }

    function setPITLiquidation(address newLiquidation) public onlyModerator {
        require(newLiquidation != address(0), "WTG: invalid address");
        pitLiquidation = IPrimaryIndexTokenLiquidation(newLiquidation);
    }

    function setPITLeverage(address newLeverage) public onlyModerator { 
        require(newLeverage != address(0), "WTG: invalid address"); 
        pitLeverage = IPrimaryIndexTokenLeverage(newLeverage); 
    }

    function getTotalOutstanding(address user, address projectToken) public view returns(uint outstanding) {
        outstanding = primaryIndexToken.totalOutstanding(user, projectToken, address(WETH));       
    }

    function deposit() public payable {
        WETH.deposit{value: msg.value}();
        if(IWETH(WETH).allowance(address(this), address(primaryIndexToken)) < msg.value){
            IWETH(WETH).approve(address(primaryIndexToken), type(uint256).max);
        }
        primaryIndexToken.depositFromRelatedContracts(address(WETH), msg.value, address(this), msg.sender);
    }

    function withdraw(uint256 projectTokenAmount) public nonReentrant{
        uint256 receivedProjectTokenAmount = primaryIndexToken.withdrawFromRelatedContracts(address(WETH), projectTokenAmount, msg.sender, address(this));
        WETH.withdraw(receivedProjectTokenAmount);
        _safeTransferETH(msg.sender, receivedProjectTokenAmount);
    }

    function supply() public payable nonReentrant{
        WETH.deposit{value: msg.value}();
        WETH.transfer(msg.sender, msg.value);
        primaryIndexToken.supplyFromRelatedContract(address(WETH), msg.value, msg.sender);
    }

    function redeem(uint256 bLendingTokenAmount) public nonReentrant{
        address fWETH = primaryIndexToken.lendingTokenInfo(address(WETH)).bLendingToken;
        uint userBalance = IBLendingToken(fWETH).balanceOf(msg.sender);
        uint amountToWithdraw = bLendingTokenAmount;
        if (bLendingTokenAmount == type(uint256).max) {
            amountToWithdraw = userBalance;
        }
        primaryIndexToken.redeemFromRelatedContract(address(WETH), amountToWithdraw, msg.sender);
        uint256 exchangeRate = IBLendingToken(fWETH).exchangeRateStored();
        uint256 lengingAmountToWithdraw = amountToWithdraw * exchangeRate / 1e18;
        WETH.transferFrom(msg.sender, address(this), lengingAmountToWithdraw);
        WETH.withdraw(lengingAmountToWithdraw);
        _safeTransferETH(msg.sender, lengingAmountToWithdraw);
    }

    function redeemUnderlying(uint256 lendingTokenAmount) public nonReentrant{
        primaryIndexToken.redeemUnderlyingFromRelatedContract(address(WETH), lendingTokenAmount, msg.sender);
        WETH.transferFrom(msg.sender, address(this), lendingTokenAmount);
        WETH.withdraw(lendingTokenAmount);
        _safeTransferETH(msg.sender, lendingTokenAmount);
    }

    function repay(address projectToken, uint lendingTokenAmount) public payable nonReentrant{
        uint totalOutStanding = getTotalOutstanding(msg.sender, projectToken);
        uint paybackAmount = lendingTokenAmount >= totalOutStanding ? totalOutStanding : lendingTokenAmount;
        require(msg.value >= paybackAmount, "WTG: msg value is less than repayment amount");
        WETH.deposit{value: paybackAmount}();    
        primaryIndexToken.repayFromRelatedContract(projectToken, address(WETH), paybackAmount, address(this), msg.sender);

        // refund remaining dust eth
        if (msg.value > paybackAmount) _safeTransferETH(msg.sender, msg.value - paybackAmount);
    }

    function borrow(address projectToken, uint256 lendingTokenAmount) public nonReentrant{
        primaryIndexToken.borrowFromRelatedContract(projectToken, address(WETH), lendingTokenAmount, msg.sender);
        WETH.transferFrom(msg.sender, address(this), lendingTokenAmount);
        WETH.withdraw(lendingTokenAmount);
        _safeTransferETH(msg.sender, lendingTokenAmount);
    }

    function liquidateWithLendingETH(address _account, address _projectToken, uint256 _lendingTokenAmount) public payable nonReentrant {
        WETH.deposit{value: msg.value}();
        WETH.transfer(msg.sender, msg.value);
        require(msg.value == _lendingTokenAmount, "WTG: invalid value");
        pitLiquidation.liquidateFromModerator(_account, _projectToken, address(WETH), _lendingTokenAmount, msg.sender);
    }

    function liquidateWithProjectETH(address _account, address _lendingToken, uint256 _lendingTokenAmount) public nonReentrant {
        uint256 receivedWETH = pitLiquidation.liquidateFromModerator(_account, address(WETH), _lendingToken, _lendingTokenAmount, msg.sender);
        WETH.transferFrom(msg.sender, address(this), receivedWETH);
        WETH.withdraw(receivedWETH);
        _safeTransferETH(msg.sender, receivedWETH);
    }

    function leveragedBorrowWithProjectETH(address _lendingToken, uint _notionalExposure, uint _marginCollateralAmount, bytes memory buyCalldata, uint8 leverageType) public payable nonReentrant{
        uint256 addingAmount = pitLeverage.calculateAddingAmount(msg.sender, address(WETH), _marginCollateralAmount);
        require(msg.value == addingAmount, "WTG: invalid value");
        WETH.deposit{value: addingAmount}();
        WETH.transfer(msg.sender, addingAmount);
        pitLeverage.leveragedBorrowFromRelatedContract(address(WETH), _lendingToken, _notionalExposure, _marginCollateralAmount, buyCalldata, msg.sender, leverageType);
    }
    
    /**
    * @dev transfer ETH to an address, revert if it fails.
    * @param to recipient of the transfer
    * @param value the amount to send
    */
    function _safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, 'ETH_TRANSFER_FAILED');
    }

    /**
    * @dev Only WETH contract is allowed to transfer ETH here. Prevent other addresses to send Ether to this contract.
    */
    receive() external payable {
        require(msg.sender == address(WETH), "WTG: Receive not allowed");
    }

    /**
    * @dev Revert fallback calls
    */
    fallback() external payable {
        revert("WTG: Fallback not allowed");
    }
}