// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../paraswap/interfaces/IParaSwapAugustus.sol";
import "../paraswap/interfaces/IParaSwapAugustusRegistry.sol";
import "../interfaces/IPrimaryLendingPlatform.sol";
import "../interfaces/IPriceProviderAggregator.sol";
import "../util/Asset.sol";

/**
 * @title PrimaryLendingPlatformLeverageCore.
 * @notice The PrimaryLendingPlatformLeverageCore contract is the core contract for the leverage functionality of the primary lending platform.
 * @dev Contract that allows users to leverage their positions using the exchange aggregator.
 */
abstract contract PrimaryLendingPlatformLeverageCore is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for ERC20Upgradeable;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    mapping(address => mapping(address => bool)) public isLeveragePosition;
    IPrimaryLendingPlatform public primaryLendingPlatform;
    address public exchangeAggregator;
    address public registryAggregator;

    mapping(address => mapping(address => LeverageType)) public typeOfLeveragePosition;

    uint16 public constant BUFFER_PERCENTAGE = 500;

    struct Ratio {
        uint8 numerator;
        uint8 denominator;
    }

    enum LeverageType {
        AMPLIFY,
        MARGIN_TRADE
    }

    /**
     * @dev Emitted when the exchange aggregator and registry aggregator addresses are set.
     * @param exchangeAggregator The address of the exchange aggregator.
     * @param registryAggregator The address of the registry aggregator.
     */
    event SetExchangeAggregator(address indexed exchangeAggregator, address indexed registryAggregator);

    /**
     * @dev Emitted when a user leverages their borrowing position.
     * @param user The address of the user who leveraged their position.
     * @param projectToken The address of the project token being used for leverage.
     * @param lendingToken The address of the lending token being used for leverage.
     * @param notionalExposure The total notional exposure of the user's position.
     * @param lendingAmount The amount of the lending token being borrowed.
     * @param margin The margin required for the leverage.
     * @param addingAmount The amount of the project token being added to the position.
     * @param totalDepositedAmount The total amount of the project token deposited in the position.
     * @param amountReceive The amount of the lending token received by the user after the leverage.
     */
    event LeveragedBorrow(
        address user,
        address projectToken,
        address lendingToken,
        uint256 notionalExposure,
        uint256 lendingAmount,
        uint256 margin,
        uint256 addingAmount,
        uint256 totalDepositedAmount,
        uint256 amountReceive
    );

    /**
     * @dev Emitted when the primary lending platform address is set.
     * @param newPrimaryLendingPlatform The new primary lending platform address.
     */
    event SetPrimaryLendingPlatform(address indexed newPrimaryLendingPlatform);

    /**
     * @dev Initializes the contract with the given parameters.
     * This function is called only once when deploying the contract.
     * @param pit The address of the primary index token contract.
     */
    function initialize(address pit) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init_unchained();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        primaryLendingPlatform = IPrimaryLendingPlatform(pit);
    }

    /**
     * @dev Modifier to restrict access to only the contract moderator.
     */
    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "PITLeverage: Caller is not the Moderator");
        _;
    }

    /**
     * @dev Modifier to check if the given project token is listed on the primary lending platform.
     * @param projectToken The address of the project token to check.
     */
    modifier isProjectTokenListed(address projectToken) {
        require(primaryLendingPlatform.projectTokenInfo(projectToken).isListed, "PITLeverage: Project token is not listed");
        _;
    }

    /**
     * @dev Modifier to check if the given lending token is listed on the primary lending platform.
     * @param lendingToken The address of the lending token to check.
     */
    modifier isLendingTokenListed(address lendingToken) {
        require(primaryLendingPlatform.lendingTokenInfo(lendingToken).isListed, "PITLeverage: Lending token is not listed");
        _;
    }

    /**
     * @dev Modifier to check if the caller is the primary lending platform contract.
     */
    modifier isPrimaryLendingPlatform() {
        require(msg.sender == address(primaryLendingPlatform), "PITLeverage: Caller is not primaryLendingPlatform");
        _;
    }

    /**
     * @dev Modifier to check if the caller is a related contract of the primary lending platform.
     */
    modifier onlyRelatedContracts() {
        require(primaryLendingPlatform.getRelatedContract(msg.sender), "PITLeverage: Caller is not related Contract");
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
        require(exchangeAggregatorAddress != address(0), "PrimaryLendingPlatformLeverage: Invalid address");
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
     *
     * Requirements:
     * - Only the moderator can call this function.
     * - The new primary lending platform address cannot be the zero address.
     * @param newPrimaryLendingPlatform The address of the new primary lending platform contract.
     */
    function setPrimaryLendingPlatformAddress(address newPrimaryLendingPlatform) external onlyModerator {
        require(newPrimaryLendingPlatform != address(0), "PITLeverage: Invalid address");
        primaryLendingPlatform = IPrimaryLendingPlatform(newPrimaryLendingPlatform);
        emit SetPrimaryLendingPlatform(newPrimaryLendingPlatform);
    }

    /**
     * @dev Returns the price of a given token in USD.
     * @param token The address of the token to get the price of.
     * @return collateralPrice The price of the token in USD.
     * @return capitalPrice The price of the token in USD.
     */
    function getTokenPrice(address token) public view returns (uint256 collateralPrice, uint256 capitalPrice) {
        uint256 tokenMultiplier = 10 ** ERC20Upgradeable(token).decimals();
        return primaryLendingPlatform.getTokenEvaluation(token, tokenMultiplier);
    }

    /**
     * @notice Calculates the lending token count for a given notional value.
     * @param lendingToken The address of the lending token.
     * @param notionalValue The notional value for which the lending token count is to be calculated.
     * @return lendingTokenCount The calculated lending token count.
     */
    function calculateLendingTokenCount(address lendingToken, uint256 notionalValue) public view returns (uint256 lendingTokenCount) {
        (, uint256 lendingTokenPrice) = getTokenPrice(lendingToken);
        lendingTokenCount = (notionalValue * 10 ** ERC20Upgradeable(lendingToken).decimals()) / lendingTokenPrice;
    }

    /**
     * @dev Deletes a leverage position for a user and project token.
     * The caller must be the primary lending platform.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     */
    function deleteLeveragePosition(address user, address projectToken) external isPrimaryLendingPlatform {
        delete isLeveragePosition[user][projectToken];
    }

    /**
     * @dev Internal function to defer the liquidity check for a given user, project token, and lending token.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     *
     * Requirements:
     * - `totalOutstandingInUSD` must be less than or equal to `pit`.
     * - `newTotalBorrowPerCollateral` must be less than or equal to `borrowLimitPerCollateral`.
     * - `newTotalBorrowPerLendingToken` must be less than or equal to `borrowLimitPerLendingToken`.
     */
    function _deferLiquidityCheck(address user, address projectToken, address lendingToken) internal view {
        uint256 pit = primaryLendingPlatform.pit(user, projectToken, lendingToken);
        uint256 totalOutstandingInUSD = primaryLendingPlatform.totalOutstandingInUSD(user, projectToken, lendingToken);
        uint256 newTotalBorrowPerCollateral = primaryLendingPlatform.getTotalBorrowPerCollateral(projectToken);
        uint256 borrowLimitPerCollateral = primaryLendingPlatform.borrowLimitPerCollateral(projectToken);
        uint256 newTotalBorrowPerLendingToken = primaryLendingPlatform.getTotalBorrowPerLendingToken(lendingToken);
        uint256 borrowLimitPerLendingToken = primaryLendingPlatform.borrowLimitPerLendingToken(lendingToken);
        require(totalOutstandingInUSD <= pit, "PITLeverage: LendingTokenAmount exceeds pit remaining");
        require(newTotalBorrowPerCollateral <= borrowLimitPerCollateral, "PITLeverage: TotalBorrow exceeded borrowLimit per collateral asset");
        require(newTotalBorrowPerLendingToken <= borrowLimitPerLendingToken, "PITLeverage: TotalBorrow exceeded borrowLimit per lending asset");
    }

    /**
     * @dev Internal function to execute a naked borrow operation, updating the interest in borrow positions for the user and calculating the borrow position.
     * @param user The address of the user performing the borrow operation.
     * @param lendingToken The address of the token being borrowed.
     * @param lendingTokenAmount The amount of the token being borrowed.
     * @param projectToken The address of the project token.
     * @param currentLendingToken The address of the current lending token.
     */
    function _nakedBorrow(
        address user,
        address lendingToken,
        uint256 lendingTokenAmount,
        address projectToken,
        address currentLendingToken
    ) internal {
        primaryLendingPlatform.updateInterestInBorrowPositions(user, lendingToken);

        primaryLendingPlatform.calcBorrowPosition(user, projectToken, lendingToken, lendingTokenAmount, currentLendingToken);
        ERC20Upgradeable(lendingToken).safeTransferFrom(user, address(this), lendingTokenAmount);
    }

    function _buyOnExchangeAggregatorWithMultiAsset(
        address[] memory tokensFrom,
        Asset.Info memory tokenToInfo,
        bytes[] memory buyCalldata
    ) internal returns (uint256[] memory assetAmountRemainings, uint256 assetAmountReceive) {
        (address[] memory unwrapTokensTo, ) = Asset._unwrap(tokenToInfo, 0);

        for (uint8 i = 0; i < buyCalldata.length; i++) {
            _buyOnExchangeAggregator(buyCalldata[i]);
        }

        uint256[] memory assetAmountReceives = new uint256[](unwrapTokensTo.length);
        for (uint8 i = 0; i < unwrapTokensTo.length; i++) {
            assetAmountReceives[i] = ERC20Upgradeable(unwrapTokensTo[i]).balanceOf(address(this));
        }
        assetAmountReceive = Asset._wrap(unwrapTokensTo, assetAmountReceives, tokenToInfo);

        assetAmountRemainings = new uint256[](tokensFrom.length);
        for (uint8 i = 0; i < tokensFrom.length; i++) {
            if (tokensFrom[i] != tokenToInfo.addr) {
                assetAmountRemainings[i] = ERC20Upgradeable(tokensFrom[i]).balanceOf(address(this));
            }
        }
    }

    /**
     * @dev Internal function to execute a buy order on the exchange aggregator contract.
     * @param buyCalldata The calldata for the buy operation.
     */
    function _buyOnExchangeAggregator(bytes memory buyCalldata) internal {
        // solium-disable-next-line security/no-call-value
        (bool success, ) = exchangeAggregator.call(buyCalldata);
        if (!success) {
            // Copy revert reason from call
            assembly {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }
    }

    /**
     * @dev Internal function to approve a token transfer if the current allowance is less than the specified amount for the exchange aggregator.
     * @param token The address of the ERC20 token to be approved.
     * @param tokenAmount The amount of tokens to be approved for transfer.
     */
    function _approveTokenTransfer(address token, uint256 tokenAmount) internal {
        require(exchangeAggregator != address(0), "PrimaryLendingPlatformLeverage: Exchange aggregator not set");
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
        uint256 allowanceAmount = ERC20Upgradeable(token).allowance(address(this), exchangeAggregator);
        if (allowanceAmount < tokenAmount) {
            ERC20Upgradeable(token).safeIncreaseAllowance(exchangeAggregator, tokenAmount - allowanceAmount);
        }
    }

    /**
     * @dev Internal function to approve a token transfer if the current allowance is less than the specified amount for the ParaSwap exchange aggregator.
     * @param token The address of the ERC20 token to be approved.
     * @param tokenAmount The amount of tokens to be approved for transfer.
     */
    function _approveTokenTransferPara(address token, uint256 tokenAmount) internal {
        address tokenTransferProxy = IParaSwapAugustus(exchangeAggregator).getTokenTransferProxy();
        uint256 allowanceAmount = ERC20Upgradeable(token).allowance(address(this), tokenTransferProxy);
        if (allowanceAmount < tokenAmount) {
            ERC20Upgradeable(token).safeIncreaseAllowance(tokenTransferProxy, tokenAmount - allowanceAmount);
        }
    }

    /**
     * @notice Internal function to collateralize a loan with the specified parameters.
     * @param user The address of the user taking the loan.
     * @param projectToken The address of the project token to be collateralize.
     * @param collateralTokenCount The amount of collateral tokens being provided.
     * @param marginCollateralCount The amount of margin collateral being used.
     * @return totalCollateral The total amount of collateral tokens after adding the margin collateral.
     * @return addingAmount The amount of margin collateral being added to the collateral tokens.
     */
    function _collateralizeLoan(
        address user,
        address projectToken,
        uint256 collateralTokenCount,
        uint256 marginCollateralCount
    ) internal returns (uint256 totalCollateral, uint256 addingAmount) {
        addingAmount = calculateAddingAmount(user, projectToken, marginCollateralCount);
        totalCollateral = collateralTokenCount + addingAmount;
        primaryLendingPlatform.calcDepositPosition(projectToken, totalCollateral, user);
        ERC20Upgradeable(projectToken).safeTransfer(address(primaryLendingPlatform), collateralTokenCount);
        if (addingAmount > 0) {
            ERC20Upgradeable(projectToken).safeTransferFrom(user, address(primaryLendingPlatform), addingAmount);
        }
    }

    /**
     * @notice Calculates the additional collateral amount needed for the specified user and project token.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     * @param marginCollateralCount The margin collateral amount.
     * @return addingAmount The additional collateral amount needed.
     */
    function calculateAddingAmount(address user, address projectToken, uint256 marginCollateralCount) public view returns (uint256 addingAmount) {
        uint256 depositedAmount = primaryLendingPlatform.getDepositedAmount(projectToken, user);
        addingAmount = marginCollateralCount > depositedAmount ? marginCollateralCount - depositedAmount : 0;
    }

    /**
     * @notice Internal function to check if the specified user has a valid position for the given project and lending tokens.
     * @param user The address of the user.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @param marginCollateralAmount The margin collateral amount.
     */
    function _checkIsValidPosition(address user, address projectToken, address lendingToken, uint256 marginCollateralAmount) internal view {
        (uint256 depositedProjectTokenAmount, uint256 loanBody, uint256 accrual, , ) = primaryLendingPlatform.getPosition(
            user,
            projectToken,
            lendingToken
        );
        require(
            (!isLeveragePosition[user][projectToken] && loanBody == 0 && accrual == 0) || isLeveragePosition[user][projectToken],
            "PITLeverage: Invalid position"
        );
        require(marginCollateralAmount >= depositedProjectTokenAmount, "PITLeverage: Invalid amount");
    }

    /**
     * @notice Unwraps the given token, converting it into its underlying assets, and approves their transfer.
     * @param info Information about the token, including its address and type.
     * @param amount The amount of token to be unwrapped and approved for transfer.
     * @return assets An array containing the addresses of the underlying assets.
     * @return assetAmounts An array containing the amounts of the underlying assets corresponding to the unwrapped project token.
     */
    function _unwrapTokenAndApprove(
        Asset.Info memory info,
        uint256 amount
    ) internal returns (address[] memory assets, uint256[] memory assetAmounts) {
        (assets, assetAmounts) = Asset._unwrap(info, amount);

        for (uint8 i = 0; i < assets.length; i++) {
            uint256 approvalAmount = (assetAmounts[i] * (10000 + BUFFER_PERCENTAGE)) / 10000;
            _approveTokenTransfer(assets[i], approvalAmount);
        }
    }

    /**
     * @dev Internal function to be called when a user wants to leverage their position.
     * @param prjInfo Information about the project token, including its address and type.
     * @param lendingInfo Information about the lending token, including its address and type.
     * @param notionalExposure The desired notional exposure for the leverage position.
     * @param marginCollateralAmount The amount of collateral to be added to the position as margin.
     * @param buyCalldata The calldata for buying the project token on the exchange aggregator.
     * @param borrower The address of the borrower who's creating the leverage position.
     * @param leverageType The type of leverage position.
     */
    function _leveragedBorrow(
        Asset.Info memory prjInfo,
        Asset.Info memory lendingInfo,
        uint256 notionalExposure,
        uint256 marginCollateralAmount,
        bytes[] memory buyCalldata,
        address borrower,
        uint8 leverageType
    ) internal {
        require(notionalExposure > 0, "PITLeverage: Invalid amount");
        address currentLendingToken = primaryLendingPlatform.getLendingToken(borrower, prjInfo.addr);
        if (currentLendingToken != address(0)) {
            require(lendingInfo.addr == currentLendingToken, "PITLeverage: Invalid lending token");
        }
        {
            address[] memory tokensUpdateFinalPrice = primaryLendingPlatform.getTokensUpdateFinalPrices(prjInfo.addr, lendingInfo.addr, true);
            IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updateMultiFinalPrices(tokensUpdateFinalPrice);
        }

        _checkIsValidPosition(borrower, prjInfo.addr, lendingInfo.addr, marginCollateralAmount);

        uint256 lendingTokenCount = calculateLendingTokenCount(lendingInfo.addr, notionalExposure);

        _nakedBorrow(borrower, lendingInfo.addr, lendingTokenCount, prjInfo.addr, currentLendingToken);

        (address[] memory lendingAssets, ) = _unwrapTokenAndApprove(lendingInfo, lendingTokenCount);

        uint256 amountReceive;
        {
            uint256[] memory amountRemaining;
            (amountRemaining, amountReceive) = _buyOnExchangeAggregatorWithMultiAsset(lendingAssets, prjInfo, buyCalldata);
            for (uint8 i = 0; i < amountRemaining.length; i++) {
                ERC20Upgradeable(lendingAssets[i]).safeTransfer(borrower, amountRemaining[i]);
            }
        }

        (uint256 totalCollateral, uint256 addingAmount) = _collateralizeLoan(borrower, prjInfo.addr, amountReceive, marginCollateralAmount);

        _deferLiquidityCheck(borrower, prjInfo.addr, lendingInfo.addr);

        if (!isLeveragePosition[borrower][prjInfo.addr]) {
            isLeveragePosition[borrower][prjInfo.addr] = true;
        }
        typeOfLeveragePosition[borrower][prjInfo.addr] = LeverageType(leverageType);
        emit LeveragedBorrow(
            borrower,
            prjInfo.addr,
            lendingInfo.addr,
            notionalExposure,
            lendingTokenCount,
            marginCollateralAmount,
            addingAmount,
            totalCollateral,
            amountReceive
        );
    }

    /**
     * @dev Gets type of Leverage Position for given borrower and projectToken.
     * @param borrower The address of the borrower who's creating the leverage position
     * @param projectToken The address of the token being used as collateral.
     * @return type of leverage position or max of uint8 if leverage position is not exist.
     */
    function getLeverageType(address borrower, address projectToken) public view returns (uint8) {
        if (isLeveragePosition[borrower][projectToken]) return uint8(typeOfLeveragePosition[borrower][projectToken]);
        return type(uint8).max;
    }
}
