// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC4626Upgradeable.sol";
import "../priceOracle/priceproviders/uniswapV2/IUniswapV2Router02.sol";
import "../priceOracle/priceproviders/uniswapV2/IUniswapV2Pair.sol";
import "../interfaces/IPrimaryLendingPlatform.sol";
import "../paraswap/interfaces/IParaSwapAugustus.sol";
import "../paraswap/interfaces/IParaSwapAugustusRegistry.sol";
import "../util/Asset.sol";

/**
 * @title PrimaryLendingPlatformAtomicRepaymentCore.
 * @notice Core contract for the atomic repayment functionality for the PrimaryLendingPlatform contract.
 * @dev Abstract contract that implements the atomic repayment core functionality for the PrimaryLendingPlatform contract.
 */
abstract contract PrimaryLendingPlatformAtomicRepaymentCore is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for ERC20Upgradeable;
    using Asset for *;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    IPrimaryLendingPlatform public primaryLendingPlatform;
    address public exchangeAggregator;
    address public registryAggregator;

    /**
     * @dev Emitted when the exchange aggregator and registry aggregator addresses are set.
     * @param exchangeAggregator The address of the exchange aggregator.
     * @param registryAggregator The address of the registry aggregator.
     */
    event SetExchangeAggregator(address indexed exchangeAggregator, address indexed registryAggregator);

    /**
     * @dev Emitted when the primary lending platform address is set.
     * @param newPrimaryLendingPlatform The new address of the primary lending platform.
     */
    event SetPrimaryLendingPlatform(address indexed newPrimaryLendingPlatform);

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
        primaryLendingPlatform = IPrimaryLendingPlatform(pit);
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

    /**
     * @dev Sets the address of the primary lending platform contract.
     * @param pit The address of the primary lending platform contract.
     *
     * Requirements:
     * - `pit` cannot be the zero address.
     */
    function setPrimaryLendingPlatform(address pit) external onlyModerator {
        require(pit != address(0), "AtomicRepayment: Invalid address");
        primaryLendingPlatform = IPrimaryLendingPlatform(pit);
        emit SetPrimaryLendingPlatform(pit);
    }

    /**
     * @dev Calculates the outstanding amount (i.e., loanBody + accrual) for a given user, project token, and lending token.
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
     * @dev Returns the actual lending token address for a user and project token.
     * @param user The user address.
     * @param projectToken The project token address.
     * @return actualLendingToken The actual lending token address.
     */
    function getLendingToken(address user, address projectToken) public view returns (address actualLendingToken) {
        actualLendingToken = primaryLendingPlatform.getLendingToken(user, projectToken);
    }

    /**
     * @dev Returns the remaining deposit of a user for a specific project token.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     * @return remainingDeposit The remaining deposit of the user for the project token.
     */
    function getRemainingDeposit(address user, address projectToken) public view returns (uint256 remainingDeposit) {
        remainingDeposit = primaryLendingPlatform.getDepositedAmount(projectToken, user);
    }

    /**
     * @dev Returns the available repaid amount for a user in a specific project token and lending token.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @return availableLendingAmount The available repaid amount in the lending token.
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
     * @dev Internal function to defer the liquidity check for a given user, project token, and lending token.
     * The user's position must have a health factor greater than or equal to 1.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     */
    function _deferLiquidityCheck(address user, address projectToken, address lendingToken) internal view {
        (uint256 healthFactorNumerator, uint256 healthFactorDenominator) = primaryLendingPlatform.healthFactor(user, projectToken, lendingToken);
        require(healthFactorNumerator >= healthFactorDenominator, "AtomicRepayment: Repayable amount makes healthFactor<1");
    }

    /**
     * @dev Internal function to repay a loan atomically using the given project token as collateral internal.
     * @param prjInfo Information about the project token, including its address and type.
     * @param collateralAmount The amount of collateral to use for repayment.
     * @param buyCalldata The calldata for buying the lending token from the exchange aggregator.
     * @param isRepayFully A boolean indicating whether the loan should be repaid fully or partially.
     * @param lendingTokenType The type of the lending token, indicating whether it's an ERC20 token, ERC4626 token, or LP token.
     */
    function _repayAtomic(
        Asset.Info memory prjInfo,
        uint256 collateralAmount,
        bytes[] memory buyCalldata,
        bool isRepayFully,
        Asset.Type lendingTokenType
    ) internal {
        (address lendingToken, uint256 tokenAmountRemaining, uint256 amountReceive) = _beforeRepay(
            prjInfo,
            collateralAmount,
            buyCalldata,
            lendingTokenType
        );

        uint256 totalOutStanding = getTotalOutstanding(msg.sender, prjInfo.addr, lendingToken);
        if (isRepayFully) require(amountReceive >= totalOutStanding, "AtomicRepayment: Amount receive not enough to repay fully");
        primaryLendingPlatform.repayFromRelatedContract(prjInfo.addr, lendingToken, amountReceive, address(this), msg.sender);

        _afterRepay(prjInfo.addr, lendingToken, amountReceive, totalOutStanding);

        emit AtomicRepayment(msg.sender, prjInfo.addr, lendingToken, collateralAmount - tokenAmountRemaining, amountReceive);
    }

    /**
     * @dev Internal function to approve a token transfer if the current allowance is less than the specified amount for the exchange aggregator.
     * @param token The address of the ERC20 token to be approved.
     * @param tokenAmount The amount of tokens to be approved for transfer.
     */
    function _approveTokenTransfer(address token, uint256 tokenAmount) internal {
        require(exchangeAggregator != address(0), "AtomicRepayment: Exchange aggregator not set");
        if (registryAggregator != address(0)) {
            _approveTokenTransferPara(token, tokenAmount);
        } else {
            _approveTokenTransferOO(token, tokenAmount);
        }
    }

    /**
     * @dev Internal function to approve a token transfer if the current allowance is less than the specified amount for the Open Ocean exchange aggregator.
     * @param token The address of the ERC20 token to be approved.
     * @param tokenAmount The amount of tokens to be approved for transfer.
     */
    function _approveTokenTransferOO(address token, uint256 tokenAmount) internal {
        Asset._safeIncreaseAllowance(exchangeAggregator, token, tokenAmount);
    }

    /**
     * @dev Internal function to approve a token transfer if the current allowance is less than the specified amount for the ParaSwap exchange aggregator.
     * @param token The address of the ERC20 token to be approved.
     * @param tokenAmount The amount of tokens to be approved for transfer.
     */
    function _approveTokenTransferPara(address token, uint256 tokenAmount) internal {
        address tokenTransferProxy = IParaSwapAugustus(exchangeAggregator).getTokenTransferProxy();
        Asset._safeIncreaseAllowance(tokenTransferProxy, token, tokenAmount);
    }

    /**
     * @dev Internal function to execute a buy order on the exchange aggregator contract.
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

    /**
     * @notice Executes necessary steps before repaying a loan atomically, including collateral deposit, asset unwrapping, buying lending tokens, and handling remaining collateral.
     * @param prjInfo Information about the project token, including its address and type.
     * @param collateralAmount The amount of collateral to use for repayment.
     * @param buyCalldata The calldata for buying the lending token from the exchange aggregator.
     * @param lendingTokenType The type of lending token involved in the repayment (ERC20, ERC4626, LP).
     * @return lendingToken The address of the lending token used for the repayment.
     * @return tokenAmountRemaining The remaining collateral amount after the repayment process.
     * @return amountReceive The total amount of the lending token received after executing the buy transactions.
     * @dev This function handles collateral deposit, unwrapping project token, buying lending tokens, and managing remaining collateral.
     * @dev It ensures collateralAmount is valid, calculates and transfers the deposit position, unwraps project token, buys lending tokens, wraps the received amount, and handles the remaining collateral.
     */
    function _beforeRepay(
        Asset.Info memory prjInfo,
        uint256 collateralAmount,
        bytes[] memory buyCalldata,
        Asset.Type lendingTokenType
    ) internal returns (address lendingToken, uint256 tokenAmountRemaining, uint256 amountReceive) {
        require(collateralAmount > 0, "AtomicRepayment: CollateralAmount must be greater than 0");
        lendingToken = getLendingToken(msg.sender, prjInfo.addr);

        uint256 depositedProjectTokenAmount = primaryLendingPlatform.getDepositedAmount(prjInfo.addr, msg.sender);
        if (collateralAmount > depositedProjectTokenAmount) {
            collateralAmount = depositedProjectTokenAmount;
        }
        primaryLendingPlatform.calcAndTransferDepositPosition(prjInfo.addr, collateralAmount, msg.sender, address(this));

        (address[] memory assets, uint256[] memory assetAmounts) = _unwrapProjectTokenAndApprove(prjInfo, collateralAmount);

        uint256[] memory assetAmountSolds;
        (assetAmountSolds, amountReceive) = _buyOnExchangeAggregatorWithMultiAsset(assets, lendingToken, buyCalldata, lendingTokenType);

        //deposit collateral back in the pool, if left after the swap(buy)
        tokenAmountRemaining = _depositCollateralRemainingAfterSell(assets, assetAmounts, assetAmountSolds, prjInfo);

        Asset._safeIncreaseAllowance(primaryLendingPlatform.lendingTokenInfo(lendingToken).bLendingToken, lendingToken, amountReceive);
    }

    /**
     * @notice Executes necessary steps after repaying a loan atomically, including handling lending token balances and deferring liquidity checks if needed.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token used for the repayment.
     * @param amountReceive The total amount of the lending token received after the repayment process.
     * @param totalOutStanding The total outstanding amount of the loan after repayment.
     * @dev This function handles lending token balances, transfers remaining balances to the sender, and defers liquidity checks if the received amount is less than the total outstanding.
     */
    function _afterRepay(address projectToken, address lendingToken, uint256 amountReceive, uint256 totalOutStanding) internal {
        uint256 afterLendingBalance = ERC20Upgradeable(lendingToken).balanceOf(address(this));
        if (afterLendingBalance > 0) {
            ERC20Upgradeable(lendingToken).safeTransfer(msg.sender, afterLendingBalance);
        }
        if (amountReceive < totalOutStanding) {
            _deferLiquidityCheck(msg.sender, projectToken, lendingToken);
        }
    }

    /**
     * @notice Unwraps the given project token, converting it into its underlying assets, and approves their transfer.
     * @param prjInfo Information about the project token, including its address and type.
     * @param collateralAmount The amount of project token to be unwrapped and approved for transfer.
     * @return assets An array containing the addresses of the underlying assets.
     * @return assetAmounts An array containing the amounts of the underlying assets corresponding to the unwrapped project token.
     */
    function _unwrapProjectTokenAndApprove(
        Asset.Info memory prjInfo,
        uint256 collateralAmount
    ) internal returns (address[] memory assets, uint256[] memory assetAmounts) {
        (assets, assetAmounts) = Asset._unwrap(prjInfo, collateralAmount);

        for (uint8 i = 0; i < assets.length; i++) {
            _approveTokenTransfer(assets[i], assetAmounts[i]);
        }
    }

    function _buyOnExchangeAggregatorWithMultiAsset(
        address[] memory tokenFrom,
        address tokenTo,
        bytes[] memory buyCalldata,
        Asset.Type lendingTokenType
    ) internal returns (uint256[] memory assetAmountSolds, uint256 assetAmountReceive) {
        (address[] memory assets, ) = Asset._unwrap(Asset.Info({addr: tokenTo, tokenType: lendingTokenType}), 0);

        uint256 lenTokenFrom = tokenFrom.length;
        uint256 lenTokenTo = assets.length;

        assetAmountSolds = new uint256[](lenTokenFrom);
        uint256[] memory assetAmountReceives = new uint256[](lenTokenTo);

        if (lenTokenFrom == 1 && lenTokenTo > lenTokenFrom) {
            for (uint8 i = 0; i < lenTokenTo; i++) {
                uint256 amountSold;
                (amountSold, assetAmountReceives[i]) = _buyOnExchangeAggregator(tokenFrom[0], assets[i], buyCalldata[i]);
                assetAmountSolds[0] += amountSold;
            }
        } else if (lenTokenTo == 1 && lenTokenTo < lenTokenFrom) {
            for (uint8 i = 0; i < lenTokenFrom; i++) {
                uint256 amountReceive;
                (assetAmountSolds[i], amountReceive) = _buyOnExchangeAggregator(tokenFrom[i], assets[0], buyCalldata[i]);
                assetAmountReceives[0] += amountReceive;
            }
        } else if (lenTokenFrom == lenTokenTo) {
            for (uint8 i = 0; i < lenTokenFrom; i++) {
                (assetAmountSolds[i], assetAmountReceives[i]) = _buyOnExchangeAggregator(tokenFrom[i], assets[i], buyCalldata[i]);
            }
        }

        assetAmountReceive = Asset._wrap(assets, assetAmountReceives, Asset.Info({addr: tokenTo, tokenType: lendingTokenType}));
    }

    /**
     * @notice Handles the remaining collateral after selling assets, converting it into the appropriate format and depositing it into the primary lending platform.
     * @param assets An array of addresses representing the assets involved in the operation.
     * @param assetsAmount An array of amounts representing the original amounts of each asset.
     * @param assetAmountSolds An array of amounts representing the amounts of each asset sold during the operation.
     * @param prjInfo Information about the project token, including its address and type.
     * @return tokenAmountRemaining The remaining collateral amount converted and deposited into the primary lending platform.
     * @dev The function calculates the remaining amount for each asset after selling, then converts and deposits the remaining collateral into the primary lending platform.
     * @dev If the remaining collateral amount is greater than 0, it increases the allowance and calls the depositFromRelatedContracts function on the primary lending platform.
     */
    function _depositCollateralRemainingAfterSell(
        address[] memory assets,
        uint256[] memory assetsAmount,
        uint256[] memory assetAmountSolds,
        Asset.Info memory prjInfo
    ) internal returns (uint256 tokenAmountRemaining) {
        uint256[] memory assetAmountRemaining = new uint256[](assets.length);
        for (uint8 i = 0; i < assets.length; i++) {
            assetAmountRemaining[i] = assetsAmount[i] - assetAmountSolds[i];
        }

        tokenAmountRemaining = Asset._wrap(assets, assetAmountRemaining, prjInfo);

        if (tokenAmountRemaining > 0) {
            Asset._safeIncreaseAllowance(address(primaryLendingPlatform), prjInfo.addr, tokenAmountRemaining);
            primaryLendingPlatform.depositFromRelatedContracts(prjInfo.addr, tokenAmountRemaining, address(this), msg.sender);
        }
    }
}
