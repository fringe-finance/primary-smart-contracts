// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../../../interfaces/V3/IPrimaryLendingPlatformV3.sol";
import "../../../interfaces/V3/IPrimaryLendingPlatformLiquidationV3.sol";
import "../../../interfaces/V3/IPrimaryLendingPlatformLeverageV3.sol";
import "../../../interfaces/IWETH.sol";
import "../../../interfaces/IBLendingToken.sol";

/**
 * @title PrimaryLendingPlatformWrappedTokenGatewayCore.
 * @notice Core contract for the Primary Lending Platform Wrapped Token Gateway Core
 * @dev Abstract contract that defines the core functionality of the primary lending platform wrapped token gateway.
 */
abstract contract PrimaryLendingPlatformWrappedTokenGatewayV3Core is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for ERC20Upgradeable;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    IPrimaryLendingPlatformV3 public primaryLendingPlatform;
    IWETH public WETH;
    IPrimaryLendingPlatformLiquidationV3 public primaryLendingPlatformLiquidation;

    IPrimaryLendingPlatformLeverageV3 public primaryLendingPlatformLeverage;

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
        primaryLendingPlatform = IPrimaryLendingPlatformV3(pit);
        WETH = IWETH(weth);
        address fWETH = primaryLendingPlatform.lendingTokenInfo(weth).bLendingToken;
        IWETH(weth).approve(fWETH, type(uint256).max);
        primaryLendingPlatformLiquidation = IPrimaryLendingPlatformLiquidationV3(pitLiquidationAddress);
        primaryLendingPlatformLeverage = IPrimaryLendingPlatformLeverageV3(pitLeverageAddress);
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

    //************* MODERATOR FUNCTIONS ********************************

    /**
     * @dev Sets the address of the primary lending platform contract.
     *
     *  Requirements:
     * - `newPit` cannot be the zero address.
     * - Caller must be a moderator.
     * @param newPit The address of the new primary lending platform contract.
     */
    function setPrimaryLendingPlatform(address newPit) external onlyModerator {
        require(newPit != address(0), "WTG: Invalid address");
        primaryLendingPlatform = IPrimaryLendingPlatformV3(newPit);
        emit SetPrimaryLendingPlatform(newPit);
    }

    /**
     * @dev Sets the address of the PrimaryLendingPlatformLiquidation contract for PIT liquidation.
     *
     *  Requirements:
     * - `newLiquidation` cannot be the zero address.
     * - Caller must be a moderator.
     * @param newLiquidation The address of the new PrimaryLendingPlatformLiquidation contract.
     * @notice Only the moderator can call this function.
     * @notice The new address must not be the zero address.
     * @notice Emits a SetPITLiquidation event.
     */
    function setPITLiquidation(address newLiquidation) external onlyModerator {
        require(newLiquidation != address(0), "WTG: Invalid address");
        primaryLendingPlatformLiquidation = IPrimaryLendingPlatformLiquidationV3(newLiquidation);
        emit SetPITLiquidation(newLiquidation);
    }

    /**
     * @dev Sets the Primary Lending Platform Leverage contract address.
     *
     *  Requirements:
     * - `newLeverage` cannot be the zero address.
     * - Caller must be a moderator.
     * @param newLeverage The address of the new Primary Lending Platform Leverage contract.
     */
    function setPITLeverage(address newLeverage) external onlyModerator {
        require(newLeverage != address(0), "WTG: Invalid address");
        primaryLendingPlatformLeverage = IPrimaryLendingPlatformLeverageV3(newLeverage);
        emit SetPITLeverage(newLeverage);
    }

    //************* EXTERNAL FUNCTIONS ********************************

    /**
     * @notice Deposits Ether into the PrimaryLendingPlatformWrappedTokenGatewayCore contract and wraps it into WETH.
     */
    function deposit(
        uint256 depositAmount,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData,
        uint256 updateFee
    ) external payable nonReentrant {
        uint256 actualDepositAmount = msg.value - updateFee;
        require(depositAmount == actualDepositAmount, "WTG: invalid value");
        WETH.deposit{value: depositAmount}();
        if (IWETH(WETH).allowance(address(this), address(primaryLendingPlatform)) < depositAmount) {
            IWETH(WETH).approve(address(primaryLendingPlatform), type(uint256).max);
        }
        primaryLendingPlatform.depositFromRelatedContracts{value: updateFee}(
            address(WETH),
            depositAmount,
            address(this),
            msg.sender,
            updatePriceTokens,
            priceIds,
            updateData
        );
    }

    /**
     * @dev Allows users to supply ETH to the PrimaryLendingPlatformWrappedTokenGatewayCore contract.
     * The ETH is converted to WETH and then transferred to the user's address.
     * The supplyFromRelatedContract function of the PrimaryLendingPlatform contract is called to supply the WETH to the user.
     * @param supplyAmount The amount of ETH to supply.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     * @param updatePriceTokens An array of tokens to update the price oracle.
     * @param updateFee Update fee pays for updating price.
     */
    function supply(
        uint256 supplyAmount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData,
        address[] memory updatePriceTokens,
        uint256 updateFee
    ) external payable nonReentrant {
        uint256 actualSupplyAmount = msg.value - updateFee;
        require(supplyAmount == actualSupplyAmount, "WTG: invalid value");
        WETH.deposit{value: supplyAmount}();
        WETH.transfer(msg.sender, supplyAmount);
        primaryLendingPlatform.supplyFromRelatedContract{value: updateFee}(
            address(WETH),
            supplyAmount,
            msg.sender,
            updatePriceTokens,
            priceIds,
            updateData
        );
    }

    /**
     * @notice Redeems bLending tokens to Ether and transfers it to the caller.
     * @param bLendingTokenAmount Amount of bLending tokens to redeem.
     * @param updatePriceTokens An array of tokens to update the price oracle.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     */
    function redeem(
        uint256 bLendingTokenAmount,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable nonReentrant {
        address fWETH = primaryLendingPlatform.lendingTokenInfo(address(WETH)).bLendingToken;
        uint256 userBalance = IBLendingToken(fWETH).balanceOf(msg.sender);
        uint256 amountToWithdraw = bLendingTokenAmount;
        if (bLendingTokenAmount == type(uint256).max) {
            amountToWithdraw = userBalance;
        }
        primaryLendingPlatform.redeemFromRelatedContract{value: msg.value}(
            address(WETH),
            amountToWithdraw,
            msg.sender,
            updatePriceTokens,
            priceIds,
            updateData
        );
        uint256 exchangeRate = IBLendingToken(fWETH).exchangeRateStored();
        uint256 lendingAmountToWithdraw = (amountToWithdraw * exchangeRate) / 1e18;
        WETH.transferFrom(msg.sender, address(this), lendingAmountToWithdraw);
        WETH.withdraw(lendingAmountToWithdraw);
        _safeTransferETH(msg.sender, lendingAmountToWithdraw);
    }

    /**
     * @notice Redeems underlying lending tokens to Ether and transfers it to the caller.
     * @param lendingTokenAmount Amount of lending tokens to redeem.
     * @param updatePriceTokens An array of tokens to update the price oracle.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     */
    function redeemUnderlying(
        uint256 lendingTokenAmount,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable nonReentrant {
        primaryLendingPlatform.redeemUnderlyingFromRelatedContract{value: msg.value}(
            address(WETH),
            lendingTokenAmount,
            msg.sender,
            updatePriceTokens,
            priceIds,
            updateData
        );
        WETH.transferFrom(msg.sender, address(this), lendingTokenAmount);
        WETH.withdraw(lendingTokenAmount);
        _safeTransferETH(msg.sender, lendingTokenAmount);
    }

    /**
     * @notice Repays a loan in Ether for the caller.
     * @param lendingTokenAmount Amount of lending tokens to repay.
     */
    function repay(uint256 lendingTokenAmount) external payable nonReentrant {
        uint256 totalOutStanding = getTotalOutstanding(msg.sender);
        uint256 paybackAmount = lendingTokenAmount >= totalOutStanding ? totalOutStanding : lendingTokenAmount;
        require(msg.value >= paybackAmount, "WTG: msg value is less than repayment amount");
        WETH.deposit{value: paybackAmount}();
        primaryLendingPlatform.repayFromRelatedContract(address(WETH), paybackAmount, address(this), msg.sender);

        // refund remaining dust eth
        if (msg.value > paybackAmount) _safeTransferETH(msg.sender, msg.value - paybackAmount);
    }

    //************* PUBLIC VIEW FUNCTIONS ********************************

    /**
     * @notice Gets the total outstanding amount for a user.
     * @param user Address of the user.
     * @return outstanding Total outstanding amount.
     */
    function getTotalOutstanding(address user) public view returns (uint256 outstanding) {
        outstanding = primaryLendingPlatform.outstanding(user, address(WETH));
    }

    //************* INTERNAL FUNCTIONS ********************************

    /**
     * @dev Internal function to withdraw received project token amount and transfer it to the caller.
     * @param receivedProjectTokenAmount The amount of project token received.
     */
    function _withdrawETH(uint256 receivedProjectTokenAmount) internal {
        WETH.withdraw(receivedProjectTokenAmount);
        _safeTransferETH(msg.sender, receivedProjectTokenAmount);
    }

    /**
     * @dev Internal function to borrow WETH from the Primary Lending Platform with transferFrom.
     * @param lendingTokenAmount The amount of WETH to be borrowed.
     */
    function _withdrawETHTransferFrom(uint256 lendingTokenAmount) internal {
        WETH.transferFrom(msg.sender, address(this), lendingTokenAmount);
        WETH.withdraw(lendingTokenAmount);
        _safeTransferETH(msg.sender, lendingTokenAmount);
    }

    /**
     * @dev Safely transfers ETH to the specified address.
     * @param to Recipient of the transfer.
     * @param value_ Amount of ETH to transfer.
     */
    function _safeTransferETH(address to, uint256 value_) internal {
        (bool success, ) = to.call{value: value_}(new bytes(0));
        require(success, "ETH_TRANSFER_FAILED");
    }
}
