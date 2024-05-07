// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/IPrimaryLendingPlatform.sol";
import "../interfaces/IPriceProviderAggregator.sol";
import "../paraswap/interfaces/IParaSwapAugustus.sol";
import "../paraswap/interfaces/IParaSwapAugustusRegistry.sol";
import "../util/Asset.sol";

/**
 * @title PrimaryLendingPlatformLiquidationCore.
 * @notice Core contract for liquidating loans on the PrimaryLendingPlatform.
 * @dev Abstract contract that allows users to liquidate loans.
 */
abstract contract PrimaryLendingPlatformLiquidationCore is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for ERC20Upgradeable;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    uint256 public constant LIQUIDATOR_REWARD_FACTOR_DECIMAL = 18;
    uint256 public minPartialLiquidationAmount;
    Ratio public targetHealthFactor;
    Ratio public liquidatorRewardCalcFactor;
    Ratio public maxLRF;

    IPrimaryLendingPlatform public primaryLendingPlatform;

    address public exchangeAggregator;
    address public registryAggregator;

    uint16 public constant BUFFER_PERCENTAGE = 500;

    struct Ratio {
        uint8 numerator;
        uint8 denominator;
    }

    struct MaxLAParams {
        uint256 numeratorMaxLA;
        uint256 denominatorMaxLA;
        uint256 calculatedMaxLA;
        uint256 maxLACompare;
    }

    /**
     * @dev Emitted when a liquidation occurs.
     * @param liquidator The address of the account that initiates the liquidation.
     * @param borrower The address of the borrower whose position is being liquidated.
     * @param lendingToken The address of the token being used for lending.
     * @param prjAddress The address of the project being liquidated.
     * @param amountPrjLiquidated The amount of the project's tokens being liquidated.
     */
    event Liquidate(
        address indexed liquidator,
        address indexed borrower,
        address lendingToken,
        address indexed prjAddress,
        uint256 amountPrjLiquidated
    );

    /**
     * @dev Emitted when the primary lending platform address is set.
     * @param newPrimaryLendingPlatform The new primary lending platform address.
     */
    event SetPrimaryLendingPlatform(address indexed newPrimaryLendingPlatform);

    /**
     * @dev Emitted when the minimum amount for partial liquidation is set.
     * @param newAmount The new minimum amount for partial liquidation.
     */
    event SetMinPartialLiquidationAmount(uint256 indexed newAmount);

    /**
     * @dev Emitted when the maximum Liquidation Reserve Factor (LRF) is set.
     * @param numeratorLRF The numerator of the LRF fraction.
     * @param denominatorLRF The denominator of the LRF fraction.
     */
    event SetMaxLRF(uint8 indexed numeratorLRF, uint8 indexed denominatorLRF);

    /**
     * @dev Emitted when the liquidator reward calculation factor is set.
     * @param numeratorLRF The numerator of the liquidator reward calculation factor.
     * @param denominatorLRF The denominator of the liquidator reward calculation factor.
     */
    event SetLiquidatorRewardCalculationFactor(uint8 indexed numeratorLRF, uint8 indexed denominatorLRF);

    /**
     * @dev Emitted when the target health factor is set.
     * @param numeratorHF The numerator of the target health factor.
     * @param denominatorHF The denominator of the target health factor.
     */
    event SetTargetHealthFactor(uint8 numeratorHF, uint8 denominatorHF);

    /**
     * @dev Emitted when the exchange aggregator and registry aggregator addresses are set.
     * @param exchangeAggregator The address of the exchange aggregator.
     * @param registryAggregator The address of the registry aggregator.
     */
    event SetExchangeAggregator(address indexed exchangeAggregator, address indexed registryAggregator);

    /**
     * @notice Initializes the contract with the provided PIT address.
     * @dev Sets up initial roles, initializes AccessControl, and sets the provided PIT address.
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
     * @dev Modifier that only allows access to accounts with the DEFAULT_ADMIN_ROLE.
     */
    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not the Admin");
        _;
    }

    /**
     * @dev Modifier that only allows access to accounts with the MODERATOR_ROLE.
     */
    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "Caller is not the Moderator");
        _;
    }

    /**
     * @dev Modifier that only allows access to project tokens that are listed on the PrimaryLendingPlatform.
     * @param _projectToken The address of the project token.
     */
    modifier isProjectTokenListed(address _projectToken) {
        require(primaryLendingPlatform.projectTokenInfo(_projectToken).isListed, "PITLiquidation: Project token is not listed");
        _;
    }

    /**
     * @dev Modifier that only allows access to lending tokens that are listed on the PrimaryLendingPlatform.
     * @param _lendingToken The address of the lending token.
     */
    modifier isLendingTokenListed(address _lendingToken) {
        require(primaryLendingPlatform.lendingTokenInfo(_lendingToken).isListed, "PITLiquidation: Lending token is not listed");
        _;
    }

    /**
     * @dev Modifier that only allows access to related contracts of the PrimaryLendingPlatform.
     */
    modifier onlyRelatedContracts() {
        require(primaryLendingPlatform.getRelatedContract(msg.sender), "PITLiquidation: Caller is not related Contract");
        _;
    }

    /**
     * @dev Sets the minimum partial liquidation amount.
     * Can only be called by accounts with the MODERATOR_ROLE.
     * @param newAmount The minimum partial liquidation amount.
     */
    function setMinPartialLiquidationAmount(uint256 newAmount) external onlyModerator {
        minPartialLiquidationAmount = newAmount;
        emit SetMinPartialLiquidationAmount(newAmount);
    }

    /**
     * @dev Sets the maximum Liquidation Reserve Factor (LRF) that can be used for liquidation.
     *
     * Requirements:
     * - The denominator must not be zero.
     * - Only the moderator can call this function.
     * @param numeratorLRF The numerator of the LRF ratio.
     * @param denominatorLRF The denominator of the LRF ratio.
     */
    function setMaxLRF(uint8 numeratorLRF, uint8 denominatorLRF) external onlyModerator {
        require(denominatorLRF != 0, "PITLiquidation: Invalid denominator");
        maxLRF = Ratio(numeratorLRF, denominatorLRF);
        emit SetMaxLRF(numeratorLRF, denominatorLRF);
    }

    /**
     * @dev Sets the liquidator reward calculation factor.
     *
     * Requirements:
     * - The caller must have the `MODERATOR_ROLE` role.
     * - The denominatorLRF cannot be zero.
     * @param numeratorLRF The numerator of the liquidator reward calculation factor.
     * @param denominatorLRF The denominator of the liquidator reward calculation factor.
     */
    function setLiquidatorRewardCalculationFactor(uint8 numeratorLRF, uint8 denominatorLRF) external onlyModerator {
        require(denominatorLRF != 0, "PITLiquidation: Invalid denominator");
        liquidatorRewardCalcFactor = Ratio(numeratorLRF, denominatorLRF);
        emit SetLiquidatorRewardCalculationFactor(numeratorLRF, denominatorLRF);
    }

    /**
     * @dev Sets the address of the primary lending platform contract.
     *
     * Requirements:
     * - Only the moderator can call this function.
     * - The new primary lending platform address must not be the zero address.
     * @param newPrimaryLendingPlatform The address of the new primary lending platform contract.
     */
    function setPrimaryLendingPlatformAddress(address newPrimaryLendingPlatform) external onlyModerator {
        require(newPrimaryLendingPlatform != address(0), "PITLiquidation: Invalid address");
        primaryLendingPlatform = IPrimaryLendingPlatform(newPrimaryLendingPlatform);
        emit SetPrimaryLendingPlatform(newPrimaryLendingPlatform);
    }

    /**
     * @dev Sets the target health factor.
     *
     * Requirements:
     * - Only the moderator can call this function.
     * - The denominatorHF cannot be zero.
     * @param numeratorHF The numerator for the target health factor.
     * @param denominatorHF The denominator for the target health factor.
     */
    function setTargetHealthFactor(uint8 numeratorHF, uint8 denominatorHF) external onlyModerator {
        require(denominatorHF != 0, "PITLiquidation: Invalid denominator");
        targetHealthFactor = Ratio(numeratorHF, denominatorHF);
        emit SetTargetHealthFactor(numeratorHF, denominatorHF);
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
                "PITLiquidation: Invalid Augustus"
            );
        }
        registryAggregator = registryAggregatorAddress;
        exchangeAggregator = exchangeAggregatorAddress;
        emit SetExchangeAggregator(exchangeAggregatorAddress, registryAggregatorAddress);
    }

    /**
     * @dev Gets the current health factor of a specific account's position.
     * @param _account The address of the account.
     * @param _projectToken The address of the project token.
     * @param _lendingToken The address of the lending token.
     * @return healthFactorNumerator The numerator of the health factor.
     * @return healthFactorDenominator The denominator of the health factor.
     */
    function getCurrentHealthFactor(
        address _account,
        address _projectToken,
        address _lendingToken
    ) public view returns (uint256 healthFactorNumerator, uint256 healthFactorDenominator) {
        (, , , healthFactorNumerator, healthFactorDenominator) = primaryLendingPlatform.getPosition(_account, _projectToken, _lendingToken);
    }

    /**
     * @dev Gets the current outstanding amount of a specific account's position.
     * @param _account The address of the account.
     * @param _projectToken The address of the project token.
     * @param _lendingToken The address of the lending token.
     * @return currentOutstanding The current outstanding amount of the account's position.
     */
    function getCurrentOutstanding(address _account, address _projectToken, address _lendingToken) public view returns (uint256) {
        (, uint256 loanBody, uint256 accural, , ) = primaryLendingPlatform.getPosition(_account, _projectToken, _lendingToken);
        return loanBody + accural;
    }

    /**
     * @dev Gets the price of a token in USD.
     * @param token The address of the token.
     * @param amount The amount of the token.
     * @return collateralPrice The price of the token in USD.
     * @return capitalPrice The price of the token in USD.
     */
    function getTokenPrice(address token, uint256 amount) public view returns (uint256 collateralPrice, uint256 capitalPrice) {
        return primaryLendingPlatform.getTokenEvaluation(token, amount);
    }

    /**
     * @dev Internal function that allow a user to liquidate their position. Support liquidation with hot borrowing or not.
     * @param _account The user's address to liquidate.
     * @param _prjInfo Information about the project token, including its address and type.
     * @param _lendingInfo Information about the lending token, including its address and type.
     * @param _lendingTokenAmount The amount of lending tokens used for the liquidation.
     * @param _liquidator The address of the liquidator (usually the msg.sender).
     * @param _buyCalldata The calldata for buying the lending token from the exchange aggregator. If the calldata is empty, the liquidation will execute liquidation without hot borrowing.
     */
    function _liquidate(
        address _account,
        Asset.Info memory _prjInfo,
        Asset.Info memory _lendingInfo,
        uint256 _lendingTokenAmount,
        address _liquidator,
        bytes[] memory _buyCalldata
    ) internal returns (address[] memory assets, uint256[] memory assetAmounts) {
        address[] memory tokensUpdateFinalPrice = primaryLendingPlatform.getTokensUpdateFinalPrices(_prjInfo.addr, _lendingInfo.addr, true);
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updateMultiFinalPrices(tokensUpdateFinalPrice);

        uint256 liquidationAmount = _validateLiquidationAmount(_account, _prjInfo.addr, _lendingInfo.addr, _lendingTokenAmount);
        if (_buyCalldata.length > 0) {
            (assets, assetAmounts) = _liquidateWithBorrow(_account, _prjInfo, _lendingInfo, liquidationAmount, _liquidator, _buyCalldata);
        } else {
            assets = new address[](1);
            assetAmounts = new uint256[](1);
            assets[0] = _prjInfo.addr;
            assetAmounts[0] = _liquidateNoBorrow(_account, _prjInfo.addr, _lendingInfo.addr, liquidationAmount, _liquidator);
        }
    }

    /**
     * @dev Internal function that allows a user to liquidate their position with a borrow operation.
     * @param _account The user's address to liquidate.
     * @param _prjInfo Information about the project token, including its address and type.
     * @param _lendingInfo Information about the lending token, including its address and type.
     * @param _lendingTokenAmount The amount of lending tokens used for the liquidation.
     * @param _liquidator The address of the liquidator (usually the msg.sender).
     * @param _buyCalldata The calldata for buying the lending token from the exchange aggregator.
     */
    function _liquidateWithBorrow(
        address _account,
        Asset.Info memory _prjInfo,
        Asset.Info memory _lendingInfo,
        uint256 _lendingTokenAmount,
        address _liquidator,
        bytes[] memory _buyCalldata
    ) internal returns (address[] memory assets, uint256[] memory assetAmounts) {
        _nakedBorrow(_liquidator, _lendingInfo.addr, _lendingTokenAmount, _prjInfo.addr);

        uint256 repaidAmount = primaryLendingPlatform.repayFromRelatedContract(
            _prjInfo.addr,
            _lendingInfo.addr,
            _lendingTokenAmount,
            _liquidator,
            _account
        );
        uint256 projectTokenSendToLiquidator = _getProjectTokenSendToLiquidator(_account, _prjInfo.addr, _lendingInfo.addr, repaidAmount);
        uint256 projectTokenReward = _distributeReward(_account, _prjInfo.addr, projectTokenSendToLiquidator, address(this));

        _swapAndRepayNakedBorrow(_prjInfo, _lendingInfo, projectTokenReward, _lendingTokenAmount, _liquidator, _buyCalldata);
        (assets, assetAmounts) = _redeemExcessToken(_prjInfo, _lendingInfo, _liquidator);

        emit Liquidate(_liquidator, _account, _lendingInfo.addr, _prjInfo.addr, projectTokenSendToLiquidator);
    }

    /**
     * @dev Internal function that redeems the excess tokens after liquidation.
     * @param _prjInfo Information about the project token, including its address and type.
     * @param _lendingInfo Information about the lending token, including its address and type.
     * @param _liquidator The address of the liquidator (usually the msg.sender).
     * @return assets The addresses of the tokens to redeem.
     * @return assetAmounts The amounts of the tokens to redeem.
     */
    function _redeemExcessToken(
        Asset.Info memory _prjInfo,
        Asset.Info memory _lendingInfo,
        address _liquidator
    ) internal returns (address[] memory assets, uint256[] memory assetAmounts) {
        (address[] memory prjAssets, uint256[] memory prjAssetAmounts) = Asset._redeem(_prjInfo, _liquidator);
        (address[] memory lendingAssets, uint256[] memory lendingAssetAmounts) = Asset._redeem(_lendingInfo, _liquidator);

        uint256 assetsCount = prjAssets.length + lendingAssets.length;
        assets = new address[](assetsCount);
        assetAmounts = new uint256[](assetsCount);

        for (uint256 i = 0; i < prjAssets.length; i++) {
            assets[i] = prjAssets[i];
            assetAmounts[i] = prjAssetAmounts[i];
        }
        for (uint256 j = 0; j < lendingAssets.length; j++) {
            assets[j + prjAssets.length] = lendingAssets[j];
            assetAmounts[j + prjAssets.length] = lendingAssetAmounts[j];
        }
    }

    /**
     * @dev Internal function that allows a user to liquidate their position without a borrow operation.
     * @param _account The user's address to liquidate.
     * @param _projectToken The project token address associated with the user's position.
     * @param _lendingToken The lending token address used for the liquidation.
     * @param _lendingTokenAmount The amount of lending tokens used for the liquidation.
     * @param liquidator The address of the liquidator (usually the msg.sender).
     * @return The amount of project tokens sent to the liquidator as a result of the liquidation.
     */
    function _liquidateNoBorrow(
        address _account,
        address _projectToken,
        address _lendingToken,
        uint256 _lendingTokenAmount,
        address liquidator
    ) internal returns (uint256) {
        uint256 repaidAmount = primaryLendingPlatform.repayFromRelatedContract(
            _projectToken,
            _lendingToken,
            _lendingTokenAmount,
            liquidator,
            _account
        );

        uint256 projectTokenSendToLiquidator = _getProjectTokenSendToLiquidator(_account, _projectToken, _lendingToken, repaidAmount);
        uint256 projectTokenLiquidatorReceived = _distributeReward(_account, _projectToken, projectTokenSendToLiquidator, liquidator);
        _transferExcessToken(_lendingToken, liquidator);

        emit Liquidate(liquidator, _account, _lendingToken, _projectToken, projectTokenSendToLiquidator);
        return projectTokenLiquidatorReceived;
    }

    function _swapAndRepayNakedBorrow(
        Asset.Info memory _prjInfo,
        Asset.Info memory _lendingInfo,
        uint256 _projectTokenReward,
        uint256 _lendingTokenAmount,
        address _liquidator,
        bytes[] memory _buyCalldata
    ) internal {
        (address[] memory prjTokens, ) = _unwrapTokenAndApprove(_prjInfo, _projectTokenReward);

        (, uint256 amountReceive) = _buyOnExchangeAggregatorWithMultiAsset(prjTokens, _lendingInfo, _buyCalldata);

        require(
            amountReceive >= _lendingTokenAmount,
            "PITLiquidation: Received amount is less than the borrowed amount from the exchange aggregator"
        );

        Asset._safeIncreaseAllowance(primaryLendingPlatform.lendingTokenInfo(_lendingInfo.addr).bLendingToken, _lendingInfo.addr, amountReceive);
        primaryLendingPlatform.repayFromRelatedContract(_prjInfo.addr, _lendingInfo.addr, _lendingTokenAmount, _liquidator, _liquidator);
    }

    /**
     * @dev Internal function to validate the liquidation amount.
     * @param _account The user's address to liquidate.
     * @param _projectToken The project token address associated with the user's position.
     * @param _lendingToken The lending token address used for the liquidation.
     * @param _lendingTokenAmount The amount of lending tokens used for the liquidation.
     * @return The validated liquidation amount.
     */
    function _validateLiquidationAmount(
        address _account,
        address _projectToken,
        address _lendingToken,
        uint256 _lendingTokenAmount
    ) internal view returns (uint256) {
        require(_lendingTokenAmount > 0, "PITLiquidation: LendingTokenAmount must be greater than 0");
        (uint256 healthFactorNumerator, uint256 healthFactorDenominator) = getCurrentHealthFactor(_account, _projectToken, _lendingToken);
        require(healthFactorNumerator < healthFactorDenominator, "PITLiquidation: HealthFactor>=1");

        (uint256 maxLA, uint256 minLA) = getLiquidationAmount(_account, _projectToken, _lendingToken);
        if (minLA != maxLA) {
            require(_lendingTokenAmount >= minLA && _lendingTokenAmount <= maxLA, "PITLiquidation: Invalid amount when minLA != maxLA");
            return _lendingTokenAmount;
        } else {
            require(_lendingTokenAmount >= minLA, "PITLiquidation: Invalid amount when minLA == maxLA");
            return maxLA;
        }
    }

    /**
     * @dev Internal function to execute a naked borrow operation, updating the interest in borrow positions for the user and calculating the borrow position.
     * @param user The address of the user performing the borrow operation.
     * @param lendingToken The address of the token being borrowed.
     * @param lendingTokenAmount The amount of the token being borrowed.
     * @param projectToken The address of the project token.
     */
    function _nakedBorrow(address user, address lendingToken, uint256 lendingTokenAmount, address projectToken) internal {
        address currentLendingToken = primaryLendingPlatform.getLendingToken(user, projectToken);
        if (currentLendingToken != address(0)) {
            require(lendingToken == currentLendingToken, "PITLiquidation: Invalid lending token");
        }
        primaryLendingPlatform.updateInterestInBorrowPositions(user, lendingToken);
        primaryLendingPlatform.calcBorrowPosition(user, projectToken, lendingToken, lendingTokenAmount, currentLendingToken);
    }

    /**
     * @notice Calculates the amount of project tokens to send to the liquidator based on the lending token amount used for liquidation.
     * @param _account The user's address to liquidate.
     * @param _projectToken The project token address associated with the user's position.
     * @param _lendingToken The lending token address used for the liquidation.
     * @param _repaidAmount The lending token amount is used to repay the loan of the user's position.
     * @return projectTokenRewardSendToLiquidator The amount of project tokens to send to the liquidator.
     */
    function _getProjectTokenSendToLiquidator(
        address _account,
        address _projectToken,
        address _lendingToken,
        uint256 _repaidAmount
    ) internal view returns (uint256 projectTokenRewardSendToLiquidator) {
        (uint256 lrfNumerator, uint256 lrfDenominator) = liquidatorRewardFactor(_account, _projectToken, _lendingToken);
        uint256 projectTokenMultiplier = 10 ** ERC20Upgradeable(_projectToken).decimals();
        (uint256 projectTokenPrice, ) = getTokenPrice(_projectToken, projectTokenMultiplier);
        (, uint256 repaidInUSD) = getTokenPrice(_lendingToken, _repaidAmount);

        uint256 projectTokenEvaluation = (repaidInUSD * projectTokenMultiplier) / projectTokenPrice;
        projectTokenRewardSendToLiquidator = (projectTokenEvaluation * lrfNumerator) / lrfDenominator;
    }

    /**
     * @dev Internal function to distribute the liquidation reward to the liquidator.
     * @param _account The address of the borrower whose position is being liquidated.
     * @param _projectToken The address of the project token.
     * @param projectTokenReward The amount of project tokens reward.
     * @param receiver The address of the receiver.
     * @return The amount of project token transferred to the liquidator.
     */
    function _distributeReward(address _account, address _projectToken, uint256 projectTokenReward, address receiver) internal returns (uint256) {
        uint256 depositedProjectTokenAmount = primaryLendingPlatform.getDepositedAmount(_projectToken, _account);
        if (projectTokenReward > depositedProjectTokenAmount) {
            projectTokenReward = depositedProjectTokenAmount;
        }
        if (projectTokenReward == 0) {
            return 0;
        }
        return primaryLendingPlatform.calcAndTransferDepositPosition(_projectToken, projectTokenReward, _account, receiver);
    }

    /**
     * @dev Internal function to transfer excess tokens to the receiver.
     * @param token The address of the token to transfer.
     * @param receiver The address of the receiver.
     */
    function _transferExcessToken(address token, address receiver) internal {
        uint256 excessBalance = ERC20Upgradeable(token).balanceOf(address(this));
        if (excessBalance > 0) {
            ERC20Upgradeable(token).safeTransfer(receiver, excessBalance);
        }
    }

    /**
     * @dev Calculates the liquidator reward factor (LRF) for a given position.
     *
     * Formula: LRF = (1 + (1 - HF) * k)
     * @param _account The address of the borrower whose position is being considered.
     * @param _projectToken The address of the project token.
     * @param _lendingToken The address of the lending token.
     * @return lrfNumerator The numerator of the liquidator reward factor.
     * @return lrfDenominator The denominator of the liquidator reward factor.
     */
    function liquidatorRewardFactor(
        address _account,
        address _projectToken,
        address _lendingToken
    ) public view returns (uint256 lrfNumerator, uint256 lrfDenominator) {
        (uint256 hfNumerator, uint256 hfDenominator) = getCurrentHealthFactor(_account, _projectToken, _lendingToken);
        if (hfDenominator == 0) {
            lrfNumerator = 0;
            lrfDenominator = 1;
        } else {
            Ratio memory kf = liquidatorRewardCalcFactor;
            bool isNegativeNumerator = false;
            (lrfNumerator, isNegativeNumerator) = _checkNegativeNumber(
                kf.numerator * hfDenominator + kf.denominator * hfDenominator,
                kf.numerator * hfNumerator
            );
            if (isNegativeNumerator) {
                lrfNumerator = 0;
            }
            lrfDenominator = kf.denominator * hfDenominator;
            uint256 lrfNumeratorMul = lrfNumerator * maxLRF.denominator;
            uint256 maxLRFNumerator = maxLRF.numerator * lrfDenominator;
            if (lrfNumeratorMul > maxLRFNumerator) {
                (lrfNumerator, lrfDenominator) = (maxLRF.numerator, maxLRF.denominator);
            }
        }
    }

    /**
     * @dev Calculates the maximum liquidation amount (MaxLA) for a given position.
     *
     * Formula: MaxLA = (LVR * CVc - THF * LVc) / (LRF * LVR - THF)
     * @param account The address of the borrower whose position is being considered.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @return maxLA The maximum liquidation amount in the lending token.
     */
    function getMaxLiquidationAmount(address account, address projectToken, address lendingToken) public view returns (uint256 maxLA) {
        uint256 totalOutstandingInUSD = primaryLendingPlatform.totalOutstandingInUSD(account, projectToken, lendingToken);
        if (totalOutstandingInUSD == 0) return 0;

        (uint256 depositedProjectTokenAmountInUSD, ) = getTokenPrice(projectToken, primaryLendingPlatform.getDepositedAmount(projectToken, account));
        (uint256 lrfNumerator, uint256 lrfDenominator) = liquidatorRewardFactor(account, projectToken, lendingToken);
        (uint256 lvrNumerator, uint256 lvrDenominator) = primaryLendingPlatform.getLoanToValueRatio(projectToken, lendingToken);
        Ratio memory targetHf = targetHealthFactor;
        MaxLAParams memory maxLAParams;

        bool isNegativeNumerator = false;
        (maxLAParams.numeratorMaxLA, isNegativeNumerator) = _checkNegativeNumber(
            lvrNumerator * depositedProjectTokenAmountInUSD * targetHf.denominator,
            lvrDenominator * targetHf.numerator * totalOutstandingInUSD
        );
        maxLAParams.numeratorMaxLA = maxLAParams.numeratorMaxLA * lrfDenominator;
        bool isNegativeDenominator = false;
        (maxLAParams.denominatorMaxLA, isNegativeDenominator) = _checkNegativeNumber(
            lrfNumerator * lvrNumerator * targetHf.denominator,
            targetHf.numerator * lvrDenominator * lrfDenominator
        );
        if (isNegativeNumerator != isNegativeDenominator) {
            maxLAParams.numeratorMaxLA = 0;
            maxLAParams.denominatorMaxLA = 1;
        }

        maxLAParams.calculatedMaxLA = maxLAParams.denominatorMaxLA > 0 && maxLAParams.numeratorMaxLA > 0
            ? (maxLAParams.numeratorMaxLA * 10 ** LIQUIDATOR_REWARD_FACTOR_DECIMAL) / maxLAParams.denominatorMaxLA
            : 0;

        if (maxLAParams.calculatedMaxLA >= totalOutstandingInUSD * 10 ** LIQUIDATOR_REWARD_FACTOR_DECIMAL) {
            maxLA = getCurrentOutstanding(account, projectToken, lendingToken);
        } else {
            uint256 lendingTokenMultiplier = 10 ** ERC20Upgradeable(lendingToken).decimals();
            (, uint256 lendingTokenPrice) = getTokenPrice(lendingToken, lendingTokenMultiplier);
            maxLA = (maxLAParams.calculatedMaxLA * lendingTokenMultiplier) / (10 ** LIQUIDATOR_REWARD_FACTOR_DECIMAL) / lendingTokenPrice;
        }
    }

    /**
     * @dev Returns the minimum and maximum liquidation amount for a given account, project token, and lending token.
     *
     * Formula:
     * - MinLA = min(MaxLA, MPA)
     * - MaxLA = (LVR * CVc - THF * LVc) / (LRF * LVR - THF)
     * @param _account The account for which to calculate the liquidation amount.
     * @param _projectToken The project token address.
     * @param _lendingToken The lending token address.
     * @return maxLA The maximum liquidation amount.
     * @return minLA The minimum liquidation amount.
     */
    function getLiquidationAmount(address _account, address _projectToken, address _lendingToken) public view returns (uint256 maxLA, uint256 minLA) {
        uint256 lendingTokenMultiplier = 10 ** ERC20Upgradeable(_lendingToken).decimals();
        (, uint256 lendingTokenPrice) = getTokenPrice(_lendingToken, lendingTokenMultiplier);
        maxLA = getMaxLiquidationAmount(_account, _projectToken, _lendingToken);
        minLA = Math.min(maxLA, (minPartialLiquidationAmount * lendingTokenMultiplier) / lendingTokenPrice);
    }

    /**
     * @notice Calculates the amount of project tokens to send to the liquidator based on the lending token amount used for liquidation.
     * @param _account The user's address to liquidate.
     * @param _projectToken The project token address associated with the user's position.
     * @param _lendingToken The lending token address used for the liquidation.
     * @param _repayAmount The amount of lending tokens used for the liquidation.
     * @return projectTokenReward The amount of project tokens to send to the liquidator.
     */
    function getEstimatedProjectTokenReward(
        address _account,
        address _projectToken,
        address _lendingToken,
        uint256 _repayAmount
    ) public view returns (uint256 projectTokenReward) {
        (uint256 lrfNumerator, uint256 lrfDenominator) = liquidatorRewardFactor(_account, _projectToken, _lendingToken);
        uint256 projectTokenMultiplier = 10 ** ERC20Upgradeable(_projectToken).decimals();
        (uint256 projectTokenPrice, ) = getTokenPrice(_projectToken, projectTokenMultiplier);
        (, uint256 repaidInUSD) = getTokenPrice(_lendingToken, _repayAmount);

        uint256 projectTokenEvaluation = (repaidInUSD * projectTokenMultiplier) / projectTokenPrice;
        projectTokenReward = (projectTokenEvaluation * lrfNumerator) / lrfDenominator;
        uint256 depositedProjectTokenAmount = primaryLendingPlatform.getDepositedAmount(_projectToken, _account);
        if (projectTokenReward > depositedProjectTokenAmount) {
            projectTokenReward = depositedProjectTokenAmount;
        }
        if (projectTokenReward == 0) {
            return 0;
        }
    }

    /**
     * @dev Internal function to check if the difference between two numbers is negative and calculates the absolute difference.
     * @param firstNumber The first number to compare.
     * @param secondNumber The second number to compare.
     * @return result The absolute difference between the two numbers.
     * @return isNegative A boolean indicating if the difference is negative.
     */
    function _checkNegativeNumber(uint256 firstNumber, uint256 secondNumber) internal pure returns (uint256 result, bool isNegative) {
        if (firstNumber > secondNumber) {
            result = firstNumber - secondNumber;
        } else {
            result = secondNumber - firstNumber;
            isNegative = true;
        }
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
     * @notice Executes a buy order on the exchange aggregators contract for multiple assets.
     * @param tokensFrom An array of addresses representing the assets to sell on the exchange aggregator.
     * @param tokenToInfo Information about the token to buy on the exchange aggregator, including its address and type.
     * @param buyCalldata An array of calldata for the buy operations.
     * @return assetAmountRemainings An array of amounts representing the remaining amounts of each asset after executing.
     * @dev This function handles the buy operations for multiple assets, including selling tokens, buying the target token, and wrapping the received amount.
     */
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
            assetAmountRemainings[i] = ERC20Upgradeable(tokensFrom[i]).balanceOf(address(this));
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
}
