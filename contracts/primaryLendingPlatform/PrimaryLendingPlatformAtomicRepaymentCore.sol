// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../interfaces/IPrimaryLendingPlatform.sol";
import "../paraswap/interfaces/IParaSwapAugustus.sol";
import "../paraswap/interfaces/IParaSwapAugustusRegistry.sol";

abstract contract PrimaryLendingPlatformAtomicRepaymentCore is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for ERC20Upgradeable;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    IPrimaryLendingPlatform public primaryLendingPlatform;
    address public exchangeAggregator;

    event SetPrimaryLendingPlatform(address indexed newPrimaryLendingPlatform);
    event AtomicRepayment(address indexed user, address indexed collateral, address indexed lendingAsset, uint256 amountSold, uint256 amountReceive);

    /**
     * @dev Sets up initial roles, initializes AccessControl, and sets the provided PIT address
     * @param pit The address of the PrimaryLendingPlatform contract.
     */
    function initialize(address pit) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init_unchained();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        primaryLendingPlatform = IPrimaryLendingPlatform(pit);
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "AtomicRepayment: Caller is not the Admin");
        _;
    }

    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "AtomicRepayment: Caller is not the Moderator");
        _;
    }

    modifier isProjectTokenListed(address projectToken) {
        require(primaryLendingPlatform.projectTokenInfo(projectToken).isListed, "AtomicRepayment: Project token is not listed");
        _;
    }

    /**
     * @dev Sets the primary index token to a new value.
     * @param pit The new primary index token address.
     */
    function setPrimaryLendingPlatform(address pit) external onlyModerator {
        require(pit != address(0), "AtomicRepayment: Invalid address");
        primaryLendingPlatform = IPrimaryLendingPlatform(pit);
        emit SetPrimaryLendingPlatform(pit);
    }

    /**
     * @dev Computes the outstanding amount (i.e., loanBody + accrual) for a given user, project token, and lending token.
     * @param user The user for which to compute the outstanding amount.
     * @param projectToken The project token for which to compute the outstanding amount.
     * @param lendingAsset The lending token for which to compute the outstanding amount.
     * @return outstanding The outstanding amount for the user, project token, and lending token.
     */
    function getTotalOutstanding(address user, address projectToken, address lendingAsset) public view returns (uint256 outstanding) {
        (, uint256 loanBody, uint256 accrual, , ) = primaryLendingPlatform.getPosition(user, projectToken, lendingAsset);
        outstanding = loanBody + accrual;
    }

    /**
     * @dev Computes the lending token for a given user and project token.
     * @param user The user for which to compute the lending token.
     * @param projectToken The project token for which to compute the lending token.
     * @return actualLendingToken The lending token for the user and project token.
     */
    function getLendingToken(address user, address projectToken) public view returns (address actualLendingToken) {
        actualLendingToken = primaryLendingPlatform.getLendingToken(user, projectToken);
    }

    /**
     * @dev Get the remaining deposit that a user can withdraw for a given project token.
     * @param user The user for which to compute the remaining deposit.
     * @param projectToken The project token for which to compute the remaining deposit.
     * @return remainingDeposit The remaining deposit that the user can withdraw.
     */
    function getRemainingDeposit(address user, address projectToken) public view returns (uint256 remainingDeposit) {
        remainingDeposit = primaryLendingPlatform.getDepositedAmount(projectToken, user);
    }

    /**
     * @dev Computes the available lending token amount that a user can repay for a given project token.
     * @param user The user for which to compute the available lending token amount.
     * @param projectToken The project token for which to compute the available lending token amount.
     * @param lendingToken The lending token for which to compute the available lending token amount.
     * @return availableLendingAmount The available lending token amount that the user can repay.
     */
    function getAvailableRepaidAmount(address user, address projectToken, address lendingToken) public view returns (uint256 availableLendingAmount) {
        uint256 remainingDeposit = getRemainingDeposit(user, projectToken);
        // convert remainingDeposit to lending token
        uint256 lendingTokenMultiplier = 10 ** ERC20Upgradeable(lendingToken).decimals();
        availableLendingAmount =
            (primaryLendingPlatform.getTokenEvaluation(projectToken, remainingDeposit) * lendingTokenMultiplier) /
            primaryLendingPlatform.getTokenEvaluation(lendingToken, lendingTokenMultiplier);
    }

    /**
     * @notice Defers the liquidity check for a given user, project token, and lending token.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     */
    function _deferLiquidityCheck(address user, address projectToken, address lendingToken) internal view {
        (uint256 healthFactorNumerator, uint256 healthFactorDenominator) = primaryLendingPlatform.healthFactor(user, projectToken, lendingToken);
        require(healthFactorNumerator >= healthFactorDenominator, "AtomicRepayment: Repayable amount makes healthFactor<1");
    }

    /**
     * @dev Repays a loan atomically using the given project token as collateral internal.
     * @param prjToken The project token to use as collateral.
     * @param collateralAmount The amount of collateral to use.
     * @param buyCalldata The calldata for the swap operation.
     * @param isRepayFully A boolean indicating whether the loan should be repaid fully or partially.
     */
    function _repayAtomic(address prjToken, uint256 collateralAmount, bytes memory buyCalldata, bool isRepayFully) internal {
        require(collateralAmount > 0, "AtomicRepayment: CollateralAmount must be greater than 0");
        address lendingToken = getLendingToken(msg.sender, prjToken);
        uint256 depositedProjectTokenAmount = primaryLendingPlatform.getDepositedAmount(prjToken, msg.sender);
        if (collateralAmount > depositedProjectTokenAmount) {
            collateralAmount = depositedProjectTokenAmount;
        }
        primaryLendingPlatform.calcAndTransferDepositPosition(prjToken, collateralAmount, msg.sender, address(this));
        
        _approveTokenTransfer(prjToken, collateralAmount);

        uint256 totalOutStanding = getTotalOutstanding(msg.sender, prjToken, lendingToken);
        (uint256 amountSold, uint256 amountReceive) = _buyOnExchangeAggregator(prjToken, lendingToken, buyCalldata);
        if (isRepayFully) require(amountReceive >= totalOutStanding, "AtomicRepayment: Amount receive not enough to repay fully");

        //deposit collateral back in the pool, if left after the swap(buy)
        if (collateralAmount > amountSold) {
            uint256 collateralBalanceLeft = collateralAmount - amountSold;
            ERC20Upgradeable(prjToken).approve(address(primaryLendingPlatform), collateralBalanceLeft);
            primaryLendingPlatform.depositFromRelatedContracts(prjToken, collateralBalanceLeft, address(this), msg.sender);
        }

        address bLendingToken = primaryLendingPlatform.lendingTokenInfo(lendingToken).bLendingToken;
        ERC20Upgradeable(lendingToken).approve(bLendingToken, amountReceive);

        primaryLendingPlatform.repayFromRelatedContract(prjToken, lendingToken, amountReceive, address(this), msg.sender);

        uint256 afterLendingBalance = ERC20Upgradeable(lendingToken).balanceOf(address(this));
        if (afterLendingBalance > 0) {
            ERC20Upgradeable(lendingToken).transfer(msg.sender, afterLendingBalance);
        }

        if (amountReceive < totalOutStanding) {
            _deferLiquidityCheck(msg.sender, prjToken, lendingToken);
        }

        emit AtomicRepayment(msg.sender, prjToken, lendingToken, amountSold, amountReceive);
    }

    /**
     * @notice Approves a specified amount of tokens to be transferred by the token transfer proxy.
     * @param token The address of the ERC20 token to be approved.
     * @param tokenAmount The amount of tokens to be approved for transfer.
     */
    function _approveTokenTransfer(address token, uint256 tokenAmount) internal virtual {
        address tokenTransferProxy = IParaSwapAugustus(exchangeAggregator).getTokenTransferProxy();
        if (ERC20Upgradeable(token).allowance(address(this), tokenTransferProxy) <= tokenAmount) {
            ERC20Upgradeable(token).safeApprove(tokenTransferProxy, type(uint256).max);
        }
    }

    /**
     * @dev Buys tokens on exchange aggregator using the given project token and lending token.
     * @param tokenFrom The token to sell on exchange aggregator.
     * @param tokenTo The token to buy on exchange aggregator.
     * @param buyCalldata The calldata for the buy operation.
     * @return amountSold The amount of tokens sold on exchange aggregator.
     * @return amountReceive The amount of tokens received from exchange aggregator.
     */
    function _buyOnExchangeAggregator(
        address tokenFrom,
        address tokenTo,
        bytes memory buyCalldata
    ) internal returns (uint256 amountSold, uint256 amountReceive) {
        uint256 beforeBalanceFrom = ERC20Upgradeable(tokenFrom).balanceOf(address(this));
        uint256 beforeBalanceTo = ERC20Upgradeable(tokenTo).balanceOf(address(this));
        // solium-disable-next-line security/no-call-value
        (bool success, ) = exchangeAggregator.call(buyCalldata);
        if (!success) {
            // Copy revert reason from call
            assembly {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }
        uint256 afterBalanceFrom = ERC20Upgradeable(tokenFrom).balanceOf(address(this));
        uint256 afterBalanceTo = ERC20Upgradeable(tokenTo).balanceOf(address(this));
        amountSold = beforeBalanceFrom - afterBalanceFrom;
        amountReceive = afterBalanceTo - beforeBalanceTo;
    }
}
