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

/**
 * @title PrimaryLendingPlatformWrappedTokenGatewayCore.
 * @notice Core contract for the Primary Lending Platform Wrapped Token Gateway Core
 * @dev Abstract contract that defines the core functionality of the primary lending platform wrapped token gateway.
 */
abstract contract PrimaryLendingPlatformWrappedTokenGatewayCore is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for ERC20Upgradeable;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    IPrimaryLendingPlatform public primaryLendingPlatform;
    IWETH public WETH;
    IPrimaryLendingPlatformLiquidation public pitLiquidation;

    IPrimaryLendingPlatformLeverage public pitLeverage;

    /**
     * @dev Emitted when the PrimaryLendingPlatform contract address is updated.
     * @param newPrimaryLendingPlatform The new address of the PrimaryLendingPlatform contract.
     */
    event SetPrimaryLendingPlatform(address newPrimaryLendingPlatform);

    /**
     * @dev Emitted when the PIT liquidation address is set.
     */
    event SetPITLiquidation(address newPITLiquidation);
    
    /**
     * @dev Emitted when the PIT (Pool Interest Token) leverage is set to a new address.
     * @param newPITLeverage The address of the new PIT leverage contract.
     */
    event SetPITLeverage(address newPITLeverage);

    /**
     * @dev Initializes the PrimaryLendingPlatformWrappedTokenGateway contract.
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

    /**
     * @dev Modifier that allows only the admin to execute the function.
     */
    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "WTG: Caller is not the Admin");
        _;
    }

    /**
     * @dev Modifier that allows only the moderator to execute the function.
     */
    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "WTG: Caller is not the Moderator");
        _;
    }

    /**
     * @dev Modifier that checks if the project token is listed.
     * @param projectToken Address of the project token.
     */
    modifier isProjectTokenListed(address projectToken) {
        require(primaryLendingPlatform.projectTokenInfo(projectToken).isListed, "WTG: Project token is not listed");
        _;
    }

    /**
     * @dev Modifier that checks if the lending token is listed.
     * @param lendingToken Address of the lending token.
     */
    modifier isLendingTokenListed(address lendingToken) {
        require(primaryLendingPlatform.lendingTokenInfo(lendingToken).isListed, "WTG: Lending token is not listed");
        _;
    }

    /**
     * @dev Sets the address of the primary lending platform contract.
     * #### Requirements:
     * - `newPit` cannot be the zero address.
     * - Caller must be a moderator.
     * @param newPit The address of the new primary lending platform contract.
     */
    function setPrimaryLendingPlatform(address newPit) external onlyModerator {
        require(newPit != address(0), "WTG: Invalid address");
        primaryLendingPlatform = IPrimaryLendingPlatform(newPit);
        emit SetPrimaryLendingPlatform(newPit);
    }

    /**
     * @dev Sets the address of the PrimaryLendingPlatformLiquidation contract for PIT liquidation.
     * #### Requirements:
     * - `newLiquidation` cannot be the zero address.
     * - Caller must be a moderator.
     * @param newLiquidation The address of the new PrimaryLendingPlatformLiquidation contract.
     * @notice Only the moderator can call this function.
     * @notice The new address must not be the zero address.
     * @notice Emits a SetPITLiquidation event.
     */
    function setPITLiquidation(address newLiquidation) external onlyModerator {
        require(newLiquidation != address(0), "WTG: Invalid address");
        pitLiquidation = IPrimaryLendingPlatformLiquidation(newLiquidation);
        emit SetPITLiquidation(newLiquidation);
    }

    /**
     * @dev Sets the Primary Lending Platform Leverage contract address.
     * #### Requirements:
     * - `newLeverage` cannot be the zero address.
     * - Caller must be a moderator.
     * @param newLeverage The address of the new Primary Lending Platform Leverage contract.
     */
    function setPITLeverage(address newLeverage) external onlyModerator {
        require(newLeverage != address(0), "WTG: Invalid address");
        pitLeverage = IPrimaryLendingPlatformLeverage(newLeverage);
        emit SetPITLeverage(newLeverage);
    }

    /**
     * @dev Returns the total outstanding balance of a user for a specific project token.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     * @return outstanding The total outstanding balance of the user.
     */
    function getTotalOutstanding(address user, address projectToken) public view returns (uint256 outstanding) {
        outstanding = primaryLendingPlatform.totalOutstanding(user, projectToken, address(WETH));
    }

    /**
     * @dev Deposits Ether into the PrimaryLendingPlatformWrappedTokenGatewayCore contract and wraps it into WETH.
     */
    function deposit() external payable nonReentrant {
        WETH.deposit{value: msg.value}();
        if (IWETH(WETH).allowance(address(this), address(primaryLendingPlatform)) < msg.value) {
            IWETH(WETH).approve(address(primaryLendingPlatform), type(uint256).max);
        }
        primaryLendingPlatform.depositFromRelatedContracts(address(WETH), msg.value, address(this), msg.sender);
    }

    /**
     * @dev Internal function to withdraw received project token amount and transfer it to the caller.
     * @param receivedProjectTokenAmount The amount of project token received.
     */
    function _withdraw(uint256 receivedProjectTokenAmount) internal {
        WETH.withdraw(receivedProjectTokenAmount);
        _safeTransferETH(msg.sender, receivedProjectTokenAmount);
    }

    /**
     * @dev Allows users to supply ETH to the PrimaryLendingPlatformWrappedTokenGatewayCore contract.
     * The ETH is converted to WETH and then transferred to the user's address.
     * The supplyFromRelatedContract function of the PrimaryLendingPlatform contract is called to supply the WETH to the user.
     */
    function supply() external payable nonReentrant {
        WETH.deposit{value: msg.value}();
        WETH.transfer(msg.sender, msg.value);
        primaryLendingPlatform.supplyFromRelatedContract(address(WETH), msg.value, msg.sender);
    }

    /**
     * @dev Redeems the specified amount of bLendingToken for the underlying asset (WETH) and transfers it to the caller.
     * @param bLendingTokenAmount The amount of bLendingToken to redeem. If set to `type(uint256).max`, redeems all the bLendingToken balance of the caller.
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
     * @dev Redeems the underlying asset from the Primary Lending Platform and transfers it to the caller.
     * @param lendingTokenAmount The amount of the lending token to redeem.
     */
    function redeemUnderlying(uint256 lendingTokenAmount) external nonReentrant {
        primaryLendingPlatform.redeemUnderlyingFromRelatedContract(address(WETH), lendingTokenAmount, msg.sender);
        WETH.transferFrom(msg.sender, address(this), lendingTokenAmount);
        WETH.withdraw(lendingTokenAmount);
        _safeTransferETH(msg.sender, lendingTokenAmount);
    }

    /**
     * @dev Repays the specified amount of the project token's Ether outstanding debt using the lending token.
     * @param projectToken The address of the project token.
     * @param lendingTokenAmount The amount of the lending token to be used for repayment.
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
     * @dev Internal function to borrow WETH from the Primary Lending Platform.
     * @param lendingTokenAmount The amount of WETH to be borrowed.
     */
    function _borrow(uint256 lendingTokenAmount) internal {
        WETH.transferFrom(msg.sender, address(this), lendingTokenAmount);
        WETH.withdraw(lendingTokenAmount);
        _safeTransferETH(msg.sender, lendingTokenAmount);
    }

    /**
     * @dev Internal function to liquidate a position by providing project tokens in Ether.
     * @param receivedWETH Amount of lending tokens to liquidate.
     */
    function _liquidateWithProjectETH(uint256 receivedWETH) internal {
        WETH.transferFrom(msg.sender, address(this), receivedWETH);
        WETH.withdraw(receivedWETH);
        _safeTransferETH(msg.sender, receivedWETH);
    }

    /**
     * @dev Internal function to safely transfer ETH to the specified address.
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
