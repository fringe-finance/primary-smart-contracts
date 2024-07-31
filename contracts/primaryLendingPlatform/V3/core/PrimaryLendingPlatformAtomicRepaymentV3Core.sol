// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../../../interfaces/V3/IPrimaryLendingPlatformV3.sol";
import "../../../paraswap/interfaces/IParaSwapAugustusRegistry.sol";
import "../../../util/V3/Asset.sol";
import "../../../util/ExchangeAggregator.sol";

/**
 * @title PrimaryLendingPlatformAtomicRepaymentCore.
 * @notice Core contract for the atomic repayment functionality for the PrimaryLendingPlatform contract.
 * @dev Abstract contract that implements the atomic repayment core functionality for the PrimaryLendingPlatform contract.
 */
abstract contract PrimaryLendingPlatformAtomicRepaymentV3Core is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for ERC20Upgradeable;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    IPrimaryLendingPlatformV3 public primaryLendingPlatform;
    address public exchangeAggregator;
    address public registryAggregator;

    /**
     * @dev Emitted when the primary lending platform address is set.
     * @param newPrimaryLendingPlatform The new address of the primary lending platform.
     */
    event SetPrimaryLendingPlatform(address indexed newPrimaryLendingPlatform);

    /**
     * @dev Emitted when the exchange aggregator and registry aggregator addresses are set.
     * @param exchangeAggregator The address of the exchange aggregator.
     * @param registryAggregator The address of the registry aggregator.
     */
    event SetExchangeAggregator(address indexed exchangeAggregator, address indexed registryAggregator);

    /**
     * @dev Emitted when an atomic repayment is executed, where a user sells collateral to repay a loan.
     * @param user The address of the user who executed the atomic repayment.
     * @param collateral The address of the collateral asset sold by the user.
     * @param lendingAsset The address of the lending asset that was repaid.
     * @param amountSold The amount of collateral sold by the user.
     * @param amountReceive The amount of lending asset received by the user after the repayment.
     */
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
        primaryLendingPlatform = IPrimaryLendingPlatformV3(pit);
    }

    /**
     * @dev Throws if the caller is not the admin.
     */
    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "AtomicRepayment: Caller is not the Admin");
        _;
    }

    /**
     * @dev Throws if the caller is not the moderator.
     */
    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "AtomicRepayment: Caller is not the Moderator");
        _;
    }

    /**
     * @dev Throws if the project token is not listed.
     * @param projectToken The project token address.
     */
    modifier isProjectTokenListed(address projectToken) {
        require(primaryLendingPlatform.projectTokenInfo(projectToken).isListed, "AtomicRepayment: Project token is not listed");
        _;
    }

    /**
     * @dev Throws if the project token is not listed.
     * @param lendingToken The project token address.
     */
    modifier isLendingTokenListed(address lendingToken) {
        require(primaryLendingPlatform.lendingTokenInfo(lendingToken).isListed, "AtomicRepayment: Lending token is not listed");
        _;
    }

    /**
     * @dev Modifier that only allows access to related contracts of the PrimaryLendingPlatform.
     */
    modifier onlyRelatedContracts() {
        require(primaryLendingPlatform.isRelatedContract(msg.sender), "AtomicRepayment: Caller is not a related contract");
        _;
    }

    /**
     * @dev Updates the Exchange Aggregator contract and registry contract addresses.
     *
     * Requirements:
     * - The caller must be the moderator.
     * - `exchangeAggregatorAddress` must not be the zero address.
     * - `registryAggregatorAddress` must be a valid Augustus contract if it is not the zero address.
     * @param exchangeAggregatorAddress The new address of the Exchange Aggregator contract.
     * @param registryAggregatorAddress The new address of the Aggregator registry contract.
     */
    function setExchangeAggregator(address exchangeAggregatorAddress, address registryAggregatorAddress) external onlyModerator {
        require(exchangeAggregatorAddress != address(0), "AtomicRepayment: Invalid address");
        if (registryAggregatorAddress != address(0)) {
            require(
                IParaSwapAugustusRegistry(registryAggregatorAddress).isValidAugustus(exchangeAggregatorAddress),
                "AtomicRepayment: Invalid Augustus"
            );
        }
        registryAggregator = registryAggregatorAddress;
        exchangeAggregator = exchangeAggregatorAddress;
        emit SetExchangeAggregator(exchangeAggregatorAddress, registryAggregatorAddress);
    }

    //************* MODERATOR FUNCTIONS ********************************

    /**
     * @dev Sets the address of the primary lending platform contract.
     * @param pit The address of the primary lending platform contract.
     *
     * Requirements:
     * - `pit` cannot be the zero address.
     */
    function setPrimaryLendingPlatform(address pit) external onlyModerator {
        require(pit != address(0), "AtomicRepayment: Invalid address");
        primaryLendingPlatform = IPrimaryLendingPlatformV3(pit);
        emit SetPrimaryLendingPlatform(pit);
    }

    //************* PUBLIC VIEW FUNCTIONS ********************************

    /**
     * @dev Computes the outstanding amount (i.e., loanBody + accrual) for a given user and lending token.
     * @param user The user for which to compute the outstanding amount.
     * @param lendingToken The lending token for which to compute the outstanding amount.
     * @return outstanding The outstanding amount for the user and lending token.
     */
    function getTotalOutstanding(address user, address lendingToken) public view returns (uint256 outstanding) {
        (uint256 loanBody, uint256 accrual) = primaryLendingPlatform.getEstimatedOutstanding(user, lendingToken);
        outstanding = loanBody + accrual;
    }

    /**
     * @dev Computes the deposited remaining amount of PIT that a user has after taking into account their outstanding loan amount.
     * @param account The user for which to compute the remaining PIT amount.
     * @return depositedRemaining The deposited remaining amount for the user.
     */
    function getCurrentDepositedRemaining(address account) public view returns (uint256 depositedRemaining) {
        uint256 depositedAmount = primaryLendingPlatform.totalDepositedAmountInUSD(account);
        uint256 outstandingInUSD = primaryLendingPlatform.totalEstimatedOutstandingInUSD(account);
        depositedRemaining = depositedAmount > outstandingInUSD ? depositedAmount - outstandingInUSD : 0;
    }

    /**
     * @dev Computes the remaining deposit that a user can withdraw for a given project token.
     * @param user The user for which to compute the remaining deposit.
     * @param projectToken The project token for which to compute the remaining deposit.
     * @return remainingDeposit The remaining deposit that the user can withdraw.
     */
    function getRemainingDeposit(address user, address projectToken) public view returns (uint256 remainingDeposit) {
        remainingDeposit = primaryLendingPlatform.depositedAmount(user, projectToken);
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
        (uint256 collateralEvaluation, ) = primaryLendingPlatform.getTokenEvaluation(projectToken, remainingDeposit);
        (, uint256 capitalPrice) = primaryLendingPlatform.getTokenEvaluation(lendingToken, lendingTokenMultiplier);
        availableLendingAmount = (collateralEvaluation * lendingTokenMultiplier) / capitalPrice;
    }

    //************* INTERNAL FUNCTIONS ********************************

    /**
     * @dev Internal function to repay a loan atomically using the given project token as collateral internal.
     * @param user The address of the user.
     * @param prjInfo Information about the project token, including its address and type.
     * @param lendingInfo Information about the lending token, including its address and type.
     * @param collateralAmount The amount of collateral to use for repayment.
     * @param buyCalldata The calldata for buying the lending token from the exchange aggregator.
     * @param isRepayFully A boolean indicating whether the loan should be repaid fully or partially.
     * @param positionId The position ID of the borrower.
     * @param updatePriceTokens An array of addresses representing the tokens to update the price for.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return amountReceive The total amount of the lending token received after executing the buy transactions.
     */
    function _repayAtomic(
        address user,
        Asset.Info memory lendingInfo,
        Asset.Info memory prjInfo,
        uint256 collateralAmount,
        bytes[] memory buyCalldata,
        bool isRepayFully,
        bytes32 positionId,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) internal returns (uint256 amountReceive) {
        uint256 tokenAmountRemaining;
        (tokenAmountRemaining, amountReceive) = _beforeRepay(
            user,
            prjInfo,
            lendingInfo,
            collateralAmount,
            buyCalldata,
            updatePriceTokens,
            priceIds,
            updateData
        );
        _repayInternal(user, lendingInfo, amountReceive, isRepayFully, positionId);
        _afterRepay(user, prjInfo, lendingInfo);

        emit AtomicRepayment(user, prjInfo.addr, lendingInfo.addr, collateralAmount - tokenAmountRemaining, amountReceive);
    }

    /**
     * @notice Executes necessary steps before repaying a loan atomically, including collateral deposit, asset unwrapping, buying lending tokens, and handling remaining collateral.
     * @param user The address of the user.
     * @param prjInfo Information about the project token, including its address and type.
     * @param lendingInfo Information about the lending token, including its address and type.
     * @param collateralAmount The amount of collateral to use for repayment.
     * @param buyCalldata The calldata for buying the lending token from the exchange aggregator.
     * @param updatePriceTokens An array of addresses representing the tokens to update the price for.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @return tokenAmountRemaining The remaining collateral amount after the repayment process.
     * @return amountReceive The total amount of the lending token received after executing the buy transactions.
     * @dev This function handles collateral deposit, unwrapping project token, buying lending tokens, and managing remaining collateral.
     * @dev It ensures collateralAmount is valid, calculates and transfers the deposit position, unwraps project token, buys lending tokens, wraps the received amount, and handles the remaining collateral.
     */
    function _beforeRepay(
        address user,
        Asset.Info memory prjInfo,
        Asset.Info memory lendingInfo,
        uint256 collateralAmount,
        bytes[] memory buyCalldata,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) internal returns (uint256 tokenAmountRemaining, uint256 amountReceive) {
        _transferDepositPosition(user, prjInfo, collateralAmount);

        (address[] memory prjTokens, ) = ExchangeAggregator._unwrapTokenAndApprove(prjInfo, collateralAmount, exchangeAggregator, registryAggregator);

        uint256[] memory amountRemaining;
        (amountRemaining, amountReceive) = ExchangeAggregator._buyOnExchangeAggregatorWithMultiAsset(
            prjTokens,
            lendingInfo,
            buyCalldata,
            exchangeAggregator
        );

        //deposit collateral back in the pool, if left after the swap(buy)
        tokenAmountRemaining = _depositCollateralRemainingAfterSell(
            user,
            prjTokens,
            amountRemaining,
            prjInfo,
            updatePriceTokens,
            priceIds,
            updateData
        );
    }

    /**
     * @notice Executes the necessary steps to repay a loan atomically
     * @param user The address of the user.
     * @param lendingInfo Information about the lending token, including its address and type.
     * @param amountReceive The total amount of the lending token received after the repayment process.
     * @param isRepayFully A boolean indicating whether the loan should be repaid fully or partially.
     * @param positionId The position ID of the borrower.
     * @dev This function handles the actual repayment, lending token balances, transfers remaining balances to the sender, and defers liquidity checks if the received amount is less than the total outstanding.
     */
    function _repayInternal(address user, Asset.Info memory lendingInfo, uint256 amountReceive, bool isRepayFully, bytes32 positionId) internal {
        uint256 totalOutStanding = getTotalOutstanding(user, lendingInfo.addr);
        if (isRepayFully) require(amountReceive >= totalOutStanding, "AtomicRepayment: Amount receive not enough to repay fully");

        Asset._safeIncreaseAllowance(primaryLendingPlatform.lendingTokenInfo(lendingInfo.addr).bLendingToken, lendingInfo.addr, amountReceive);
        primaryLendingPlatform.repayFromRelatedContract(lendingInfo.addr, amountReceive, address(this), user, positionId);
    }

    /**
     * @notice Executes necessary steps after repaying a loan atomically, including checking balance of any remaining tokens in this contract, then transferring to the user and deferring liquidity checks if needed.
     * @param user The address of the user.
     * @param prjInfo Information about the project token, including its address and type.
     * @param lendingInfo Information about the lending token, including its address and type.
     * @dev This function handles lending token balances, transfers remaining balances to the sender, and defers liquidity checks if the received amount is less than the total outstanding.
     */
    function _afterRepay(address user, Asset.Info memory prjInfo, Asset.Info memory lendingInfo) internal {
        Asset._redeem(prjInfo, user);
        Asset._redeem(lendingInfo, user);

        _deferLiquidityCheck(user);
    }

    /**
     * @notice Defers the liquidity check for a given user, project token, and lending token.
     * @param user The address of the user.
     */
    function _deferLiquidityCheck(address user) internal view {
        (uint256 totalPit, uint256 totalWeightedLoanInUSD) = primaryLendingPlatform.healthFactor(user);
        require(totalWeightedLoanInUSD <= totalPit, "AtomicRepayment: lendingTokenAmount exceeds pit remaining");
    }

    /**
     * @notice Transfers the deposit position from the user to this contract.
     * @param user The address of the user.
     * @param prjInfo Information about the project token, including its address and type.
     * @param collateralAmount The amount of collateral to transfer.
     */
    function _transferDepositPosition(address user, Asset.Info memory prjInfo, uint256 collateralAmount) internal {
        require(collateralAmount > 0, "AtomicRepayment: CollateralAmount must be greater than 0");
        uint256 remainingDeposit = getRemainingDeposit(user, prjInfo.addr);
        if (collateralAmount > remainingDeposit) {
            collateralAmount = remainingDeposit;
        }
        primaryLendingPlatform.calcAndTransferDepositPosition(prjInfo.addr, collateralAmount, user, address(this));
    }

    /**
     * @notice Handles the remaining collateral after selling assets, converting it into the appropriate format and depositing it into the primary lending platform.
     * @param assets An array of addresses representing the assets involved in the operation.
     * @param assetAmountRemaining An array of amounts representing the remaining amounts of each asset.
     * @param prjInfo Information about the project token, including its address and type.
     * @return tokenAmountRemaining The remaining collateral amount converted and deposited into the primary lending platform.
     * @dev The function calculates the remaining amount for each asset after selling, then converts and deposits the remaining collateral into the primary lending platform.
     * @dev If the remaining collateral amount is greater than 0, it increases the allowance and calls the depositFromRelatedContracts function on the primary lending platform.
     */
    function _depositCollateralRemainingAfterSell(
        address user,
        address[] memory assets,
        uint256[] memory assetAmountRemaining,
        Asset.Info memory prjInfo,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) internal returns (uint256 tokenAmountRemaining) {
        tokenAmountRemaining = Asset._wrap(assets, assetAmountRemaining, prjInfo);

        if (tokenAmountRemaining > 0) {
            Asset._safeIncreaseAllowance(address(primaryLendingPlatform), prjInfo.addr, tokenAmountRemaining);
            primaryLendingPlatform.depositFromRelatedContracts{value: msg.value}(
                prjInfo.addr,
                tokenAmountRemaining,
                address(this),
                user,
                updatePriceTokens,
                priceIds,
                updateData
            );
        }
    }
}
