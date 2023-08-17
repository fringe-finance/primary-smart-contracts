// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/IPrimaryLendingPlatform.sol";
import "../interfaces/IWETH.sol";
import "../interfaces/IBLendingToken.sol";
import "../interfaces/IPrimaryLendingPlatformLiquidation.sol";
import "../interfaces/IPrimaryLendingPlatformLeverage.sol";

abstract contract PrimaryLendingPlatformWrappedTokenGatewayCore is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for ERC20Upgradeable;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    IPrimaryLendingPlatform public primaryLendingPlatform;
    IWETH public WETH;
    IPrimaryLendingPlatformLiquidation public pitLiquidation;

    IPrimaryLendingPlatformLeverage public pitLeverage;

    event SetPrimaryLendingPlatform(address newPrimaryLendingPlatform);
    event SetPITLiquidation(address newPITLiquidation);
    event SetPITLeverage(address newPITLeverage);

    /**
     * @notice Initializes the PrimaryLendingPlatformWrappedTokenGateway contract.
     * @param pit Address of the primary index token contract.
     * @param weth Address of the wrapped Ether (WETH) token contract.
     * @param pitLiquidationAddress Address of the primary index token liquidation contract.
     * @param pitLeverageAddress Address of the primary index token leverage contract.
     */
    function initialize(address pit, address weth, address pitLiquidationAddress, address pitLeverageAddress) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init_unchained();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        primaryLendingPlatform = IPrimaryLendingPlatform(pit);
        WETH = IWETH(weth);
        address fWETH = primaryLendingPlatform.lendingTokenInfo(weth).bLendingToken;
        IWETH(weth).approve(fWETH, type(uint256).max);
        pitLiquidation = IPrimaryLendingPlatformLiquidation(pitLiquidationAddress);
        pitLeverage = IPrimaryLendingPlatformLeverage(pitLeverageAddress);
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "WTG: Caller is not the Admin");
        _;
    }

    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "WTG: Caller is not the Moderator");
        _;
    }

    modifier isProjectTokenListed(address projectToken) {
        require(primaryLendingPlatform.projectTokenInfo(projectToken).isListed, "WTG: Project token is not listed");
        _;
    }

    modifier isLendingTokenListed(address lendingToken) {
        require(primaryLendingPlatform.lendingTokenInfo(lendingToken).isListed, "WTG: Lending token is not listed");
        _;
    }

    /**
     * @notice Sets the primary index token contract address.
     * @param newPit Address of the new primary index token contract.
     */
    function setPrimaryLendingPlatform(address newPit) external onlyModerator {
        require(newPit != address(0), "WTG: Invalid address");
        primaryLendingPlatform = IPrimaryLendingPlatform(newPit);
        emit SetPrimaryLendingPlatform(newPit);
    }

    /**
     * @notice Sets the primary index token liquidation contract address.
     * @param newLiquidation Address of the new primary index token liquidation contract.
     */
    function setPITLiquidation(address newLiquidation) external onlyModerator {
        require(newLiquidation != address(0), "WTG: Invalid address");
        pitLiquidation = IPrimaryLendingPlatformLiquidation(newLiquidation);
        emit SetPITLiquidation(newLiquidation);
    }

    /**
     * @notice Sets the primary index token leverage contract address.
     * @param newLeverage Address of the new primary index token leverage contract.
     */
    function setPITLeverage(address newLeverage) external onlyModerator {
        require(newLeverage != address(0), "WTG: Invalid address");
        pitLeverage = IPrimaryLendingPlatformLeverage(newLeverage);
        emit SetPITLeverage(newLeverage);
    }

    /**
     * @notice Gets the total outstanding amount for a user and a specific project token.
     * @param user Address of the user.
     * @param projectToken Address of the project token.
     * @return outstanding Total outstanding amount.
     */
    function getTotalOutstanding(address user, address projectToken) public view returns (uint256 outstanding) {
        outstanding = primaryLendingPlatform.totalOutstanding(user, projectToken, address(WETH));
    }

    /**
     * @notice Allows users to deposit Ether and receive WETH tokens.
     */
    function deposit() external payable nonReentrant {
        WETH.deposit{value: msg.value}();
        if (IWETH(WETH).allowance(address(this), address(primaryLendingPlatform)) < msg.value) {
            IWETH(WETH).approve(address(primaryLendingPlatform), type(uint256).max);
        }
        primaryLendingPlatform.depositFromRelatedContracts(address(WETH), msg.value, address(this), msg.sender);
    }

    /**
     * @notice Allows users to withdraw their WETH tokens and receive Ether.
     * @param receivedProjectTokenAmount Amount of project tokens to withdraw.
     */
    function _withdraw(uint256 receivedProjectTokenAmount) internal {
        WETH.withdraw(receivedProjectTokenAmount);
        _safeTransferETH(msg.sender, receivedProjectTokenAmount);
    }

    /**
     * @notice Supplies Ether and converts it to WETH, then supplies it to the primary index token contract.
     */
    function supply() external payable nonReentrant {
        WETH.deposit{value: msg.value}();
        WETH.transfer(msg.sender, msg.value);
        primaryLendingPlatform.supplyFromRelatedContract(address(WETH), msg.value, msg.sender);
    }

    /**
     * @notice Redeems bLending tokens to Ether and transfers it to the caller.
     * @param bLendingTokenAmount Amount of bLending tokens to redeem.
     */
    function redeem(uint256 bLendingTokenAmount) external nonReentrant {
        address fWETH = primaryLendingPlatform.lendingTokenInfo(address(WETH)).bLendingToken;
        uint256 userBalance = IBLendingToken(fWETH).balanceOf(msg.sender);
        uint256 amountToWithdraw = bLendingTokenAmount;
        if (bLendingTokenAmount == type(uint256).max) {
            amountToWithdraw = userBalance;
        }
        primaryLendingPlatform.redeemFromRelatedContract(address(WETH), amountToWithdraw, msg.sender);
        uint256 exchangeRate = IBLendingToken(fWETH).exchangeRateStored();
        uint256 lendingAmountToWithdraw = (amountToWithdraw * exchangeRate) / 1e18;
        WETH.transferFrom(msg.sender, address(this), lendingAmountToWithdraw);
        WETH.withdraw(lendingAmountToWithdraw);
        _safeTransferETH(msg.sender, lendingAmountToWithdraw);
    }

    /**
     * @notice Redeems underlying lending tokens to Ether and transfers it to the caller.
     * @param lendingTokenAmount Amount of lending tokens to redeem.
     */
    function redeemUnderlying(uint256 lendingTokenAmount) external nonReentrant {
        primaryLendingPlatform.redeemUnderlyingFromRelatedContract(address(WETH), lendingTokenAmount, msg.sender);
        WETH.transferFrom(msg.sender, address(this), lendingTokenAmount);
        WETH.withdraw(lendingTokenAmount);
        _safeTransferETH(msg.sender, lendingTokenAmount);
    }

    /**
     * @notice Repays a loan in Ether for the caller.
     * @param projectToken Address of the project token.
     * @param lendingTokenAmount Amount of lending tokens to repay.
     */
    function repay(address projectToken, uint256 lendingTokenAmount) external payable nonReentrant {
        uint256 totalOutStanding = getTotalOutstanding(msg.sender, projectToken);
        uint256 paybackAmount = lendingTokenAmount >= totalOutStanding ? totalOutStanding : lendingTokenAmount;
        require(msg.value >= paybackAmount, "WTG: Msg value is less than repayment amount");
        WETH.deposit{value: paybackAmount}();
        primaryLendingPlatform.repayFromRelatedContract(projectToken, address(WETH), paybackAmount, address(this), msg.sender);

        // refund remaining dust eth
        if (msg.value > paybackAmount) _safeTransferETH(msg.sender, msg.value - paybackAmount);
    }

    /**
     * @notice Borrows lending tokens for the caller and converts them to Ether Internal.
     * @param lendingTokenAmount Amount of lending tokens to borrow.
     */
    function _borrow(uint256 lendingTokenAmount) internal {
        WETH.transferFrom(msg.sender, address(this), lendingTokenAmount);
        WETH.withdraw(lendingTokenAmount);
        _safeTransferETH(msg.sender, lendingTokenAmount);
    }

    /**
     * @notice Liquidates a position by providing project tokens in Ether.
     * @param receivedWETH Amount of lending tokens to liquidate.
     */
    function _liquidateWithProjectETH(uint256 receivedWETH) internal {
        WETH.transferFrom(msg.sender, address(this), receivedWETH);
        WETH.withdraw(receivedWETH);
        _safeTransferETH(msg.sender, receivedWETH);
    }

    /**
     * @dev Safely transfers ETH to the specified address.
     * @param to Recipient of the transfer.
     * @param value Amount of ETH to transfer.
     */
    function _safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, "ETH_TRANSFER_FAILED");
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
