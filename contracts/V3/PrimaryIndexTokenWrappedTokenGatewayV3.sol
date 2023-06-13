// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/V3/IPrimaryIndexTokenV3.sol";
import "../interfaces/IWETH.sol";
import "../interfaces/IBLendingToken.sol";
import "../interfaces/V3/IPrimaryIndexTokenLiquidationV3.sol";
import "../interfaces/V3/IPrimaryIndexTokenLeverageV3.sol";

contract PrimaryIndexTokenWrappedTokenGatewayV3 is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for ERC20Upgradeable;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    IPrimaryIndexTokenV3 public primaryIndexToken;
    IWETH public WETH;
    IPrimaryIndexTokenLiquidationV3 public pitLiquidation;

    IPrimaryIndexTokenLeverageV3 public pitLeverage;

    event SetPrimaryIndexToken(address indexed oldPrimaryIndexToken, address indexed newPrimaryIndexToken);
    event SetPITLiquidation(address indexed oldPITLiquidation, address indexed newPITLiquidation);
    event SetPITLeverage(address indexed oldPITLeverage, address indexed newPITLeverage);

    /**
     * @notice Initializes the PrimaryIndexTokenWrappedTokenGateway contract.
     * @param pit Address of the primary index token contract.
     * @param weth Address of the wrapped Ether (WETH) token contract.
     * @param _pitLiquidation Address of the primary index token liquidation contract.
     * @param _pitLeverage Address of the primary index token leverage contract.
     */
    function initialize(address pit, address weth, address _pitLiquidation, address _pitLeverage) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init_unchained();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        primaryIndexToken = IPrimaryIndexTokenV3(pit);
        WETH = IWETH(weth);
        address fWETH = primaryIndexToken.lendingTokenInfo(weth).bLendingToken;
        IWETH(weth).approve(fWETH, type(uint256).max);
        pitLiquidation = IPrimaryIndexTokenLiquidationV3(_pitLiquidation);
        pitLeverage = IPrimaryIndexTokenLeverageV3(_pitLeverage);
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

    /**
     * @notice Sets the primary index token contract address.
     * @param newPit Address of the new primary index token contract.
     */
    function setPrimaryIndexToken(address newPit) public onlyModerator {
        require(newPit != address(0), "WTG: Invalid address");
        emit SetPrimaryIndexToken(address(primaryIndexToken), newPit);
        primaryIndexToken = IPrimaryIndexTokenV3(newPit);
    }

    /**
     * @notice Sets the primary index token liquidation contract address.
     * @param newLiquidation Address of the new primary index token liquidation contract.
     */
    function setPITLiquidation(address newLiquidation) public onlyModerator {
        require(newLiquidation != address(0), "WTG: invalid address");
        emit SetPITLiquidation(address(pitLiquidation), newLiquidation);
        pitLiquidation = IPrimaryIndexTokenLiquidationV3(newLiquidation);
    }

    /**
     * @notice Sets the primary index token leverage contract address.
     * @param newLeverage Address of the new primary index token leverage contract.
     */
    function setPITLeverage(address newLeverage) public onlyModerator { 
        require(newLeverage != address(0), "WTG: invalid address"); 
        emit SetPITLeverage(address(pitLeverage), newLeverage);
        pitLeverage = IPrimaryIndexTokenLeverageV3(newLeverage); 
    }

    /**
     * @notice Gets the total outstanding amount for a user.
     * @param user Address of the user.
     * @return outstanding Total outstanding amount.
     */
    function getTotalOutstanding(address user) public view returns(uint outstanding) {
        outstanding = primaryIndexToken.outstanding(user, address(WETH));       
    }

    /**
     * @notice Allows users to deposit Ether and receive WETH tokens.
     */
    function deposit() public payable {
        WETH.deposit{value: msg.value}();
        if(IWETH(WETH).allowance(address(this), address(primaryIndexToken)) < msg.value){
            IWETH(WETH).approve(address(primaryIndexToken), type(uint256).max);
        }
        primaryIndexToken.depositFromRelatedContracts(address(WETH), msg.value, address(this), msg.sender);
    }

    /**
     * @notice Allows users to withdraw their WETH tokens and receive Ether.
     * @param projectTokenAmount Amount of project tokens to withdraw.
     */
    function withdraw(uint256 projectTokenAmount) public nonReentrant{
        uint256 receivedProjectTokenAmount = primaryIndexToken.withdrawFromRelatedContracts(address(WETH), projectTokenAmount, msg.sender, address(this));
        WETH.withdraw(receivedProjectTokenAmount);
        _safeTransferETH(msg.sender, receivedProjectTokenAmount);
    }

    /**
     * @notice Supplies Ether and converts it to WETH, then supplies it to the primary index token contract.
     */
    function supply() public payable nonReentrant{
        WETH.deposit{value: msg.value}();
        WETH.transfer(msg.sender, msg.value);
        primaryIndexToken.supplyFromRelatedContract(address(WETH), msg.value, msg.sender);
    }

    /**
     * @notice Redeems bLending tokens to Ether and transfers it to the caller.
     * @param bLendingTokenAmount Amount of bLending tokens to redeem.
     */
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

    /**
     * @notice Redeems underlying lending tokens to Ether and transfers it to the caller.
     * @param lendingTokenAmount Amount of lending tokens to redeem.
     */
    function redeemUnderlying(uint256 lendingTokenAmount) public nonReentrant{
        primaryIndexToken.redeemUnderlyingFromRelatedContract(address(WETH), lendingTokenAmount, msg.sender);
        WETH.transferFrom(msg.sender, address(this), lendingTokenAmount);
        WETH.withdraw(lendingTokenAmount);
        _safeTransferETH(msg.sender, lendingTokenAmount);
    }

    /**
     * @notice Repays a loan in Ether for the caller.
     * @param lendingTokenAmount Amount of lending tokens to repay.
     */
    function repay(uint lendingTokenAmount) public payable nonReentrant{
        uint totalOutStanding = getTotalOutstanding(msg.sender);
        uint paybackAmount = lendingTokenAmount >= totalOutStanding ? totalOutStanding : lendingTokenAmount;
        require(msg.value >= paybackAmount, "WTG: msg value is less than repayment amount");
        WETH.deposit{value: paybackAmount}();    
        primaryIndexToken.repayFromRelatedContract(address(WETH), paybackAmount, address(this), msg.sender);

        // refund remaining dust eth
        if (msg.value > paybackAmount) _safeTransferETH(msg.sender, msg.value - paybackAmount);
    }

    /**
     * @notice Borrows lending tokens for the caller and converts them to Ether.
     * @param projectToken Address of the project token.
     * @param lendingTokenAmount Amount of lending tokens to borrow.
     */
    function borrow(address projectToken, uint256 lendingTokenAmount) public nonReentrant{
        primaryIndexToken.borrowFromRelatedContract(projectToken, address(WETH), lendingTokenAmount, msg.sender);
        WETH.transferFrom(msg.sender, address(this), lendingTokenAmount);
        WETH.withdraw(lendingTokenAmount);
        _safeTransferETH(msg.sender, lendingTokenAmount);
    }

    /**
     * @notice Liquidates a position by providing lending tokens in Ether.
     * @param _account Address of the account to be liquidated.
     * @param _projectToken Address of the project token.
     * @param _lendingTokenAmount Amount of lending tokens in Ether to liquidate.
     */
    function liquidateWithLendingETH(address _account, address _projectToken, uint256 _lendingTokenAmount) public payable nonReentrant {
        WETH.deposit{value: msg.value}();
        WETH.transfer(msg.sender, msg.value);
        require(msg.value == _lendingTokenAmount, "WTG: invalid value");
        pitLiquidation.liquidateFromModerator(_account, _projectToken, address(WETH), _lendingTokenAmount, msg.sender);
    }

    /**
     * @notice Liquidates a position by providing project tokens in Ether.
     * @param _account Address of the account to be liquidated.
     * @param _lendingToken Address of the lending token.
     * @param _lendingTokenAmount Amount of lending tokens to liquidate.
     */
    function liquidateWithProjectETH(address _account, address _lendingToken, uint256 _lendingTokenAmount) public nonReentrant {
        uint256 receivedWETH = pitLiquidation.liquidateFromModerator(_account, address(WETH), _lendingToken, _lendingTokenAmount, msg.sender);
        WETH.transferFrom(msg.sender, address(this), receivedWETH);
        WETH.withdraw(receivedWETH);
        _safeTransferETH(msg.sender, receivedWETH);
    }

    /**
     * @notice Borrows lending tokens in a leveraged position using project tokens in Ether.
     * @param _lendingToken Address of the lending token.
     * @param _notionalExposure The notional exposure of the leveraged position.
     * @param _marginCollateralAmount Amount of collateral in margin.
     * @param buyCalldata Calldata for buying project tokens.
     */
    function leveragedBorrowWithProjectETH(address _lendingToken, uint _notionalExposure, uint _marginCollateralAmount, bytes memory buyCalldata, uint8 leverageType) public payable nonReentrant{
        uint256 addingAmount = pitLeverage.calculateAddingAmount(msg.sender, address(WETH), _marginCollateralAmount);
        require(msg.value == addingAmount, "WTG: invalid value");
        WETH.deposit{value: addingAmount}();
        WETH.transfer(msg.sender, addingAmount);
        pitLeverage.leveragedBorrowFromRelatedContract(address(WETH), _lendingToken, _notionalExposure, _marginCollateralAmount, buyCalldata, msg.sender, leverageType);
    }
    
    /**
     * @dev Safely transfers ETH to the specified address.
     * @param to Recipient of the transfer.
     * @param value Amount of ETH to transfer.
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
     * @dev Reverts any fallback calls to the contract.
     */
    fallback() external payable {
        revert("WTG: Fallback not allowed");
    }
}