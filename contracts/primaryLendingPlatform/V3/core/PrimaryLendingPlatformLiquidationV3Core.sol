// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../../../interfaces/V3/IPrimaryLendingPlatformV3.sol";
import "../../../interfaces/IPriceProviderAggregator.sol";
import "../../../paraswap/interfaces/IParaSwapAugustusRegistry.sol";
import "../../../util/ExchangeAggregator.sol";

/**
 * @title PrimaryLendingPlatformLiquidationCore.
 * @notice Core contract for liquidating loans on the PrimaryLendingPlatform.
 * @dev Abstract contract that allows users to liquidate loans.
 */
abstract contract PrimaryLendingPlatformLiquidationV3Core is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for ERC20Upgradeable;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    uint256 public constant LIQUIDATOR_REWARD_FACTOR_DECIMAL = 18;
    uint256 public minPartialLiquidationAmount;
    Ratio public targetHealthFactor;
    Ratio public liquidatorRewardCalcFactor;
    Ratio public maxLRF;

    IPrimaryLendingPlatformV3 public primaryLendingPlatform;

    address public exchangeAggregator;
    address public registryAggregator;

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
    event SetMaxLRF(uint8 numeratorLRF, uint8 denominatorLRF);

    /**
     * @dev Emitted when the liquidator reward calculation factor is set.
     * @param numeratorLRF The numerator of the liquidator reward calculation factor.
     * @param denominatorLRF The denominator of the liquidator reward calculation factor.
     */
    event SetLiquidatorRewardCalculationFactor(uint8 numeratorLRF, uint8 denominatorLRF);

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
        primaryLendingPlatform = IPrimaryLendingPlatformV3(pit);
    }

    /**
     * @dev Modifier that only allows access to accounts with the DEFAULT_ADMIN_ROLE.
     */
    modifier onlyAdmin() {
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert Errors.CallerIsNotAdmin();
        }
        _;
    }

    /**
     * @dev Modifier that only allows access to accounts with the MODERATOR_ROLE.
     */
    modifier onlyModerator() {
        if (!hasRole(MODERATOR_ROLE, msg.sender)) {
            revert Errors.CallerIsNotModerator();
        }
        _;
    }

    /**
     * @dev Modifier that only allows access to project tokens that are listed on the PrimaryLendingPlatform.
     * @param projectToken The address of the project token.
     */
    modifier isProjectTokenListed(address projectToken) {
        if (!primaryLendingPlatform.projectTokenInfo(projectToken).isListed) {
            revert Errors.ProjectTokenIsNotListed();
        }
        _;
    }

    /**
     * @dev Modifier that only allows access to lending tokens that are listed on the PrimaryLendingPlatform.
     * @param lendingToken The address of the lending token.
     */
    modifier isLendingTokenListed(address lendingToken) {
        if (!primaryLendingPlatform.lendingTokenInfo(lendingToken).isListed) {
            revert Errors.LendingTokenIsNotListed();
        }
        _;
    }

    /**
     * @dev Modifier that only allows access to related contracts of the PrimaryLendingPlatform.
     */
    modifier onlyRelatedContracts() {
        if (!primaryLendingPlatform.isRelatedContract(msg.sender)) {
            revert Errors.CallerIsNotRelatedContract();
        }
        _;
    }

    //************* MODERATOR FUNCTIONS ********************************

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
        if (denominatorLRF == 0) revert Errors.InvalidDenominator();
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
        if (denominatorLRF == 0) revert Errors.InvalidDenominator();
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
        if (newPrimaryLendingPlatform == address(0)) revert Errors.InvalidAddress();
        primaryLendingPlatform = IPrimaryLendingPlatformV3(newPrimaryLendingPlatform);
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
        if (denominatorHF == 0) revert Errors.InvalidDenominator();
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
        if (exchangeAggregatorAddress == address(0)) {
            revert Errors.InvalidAddress();
        }
        if (registryAggregatorAddress != address(0)) {
            if (!IParaSwapAugustusRegistry(registryAggregatorAddress).isValidAugustus(exchangeAggregatorAddress)) {
                revert Errors.InvalidAugustusAddress();
            }
        }
        registryAggregator = registryAggregatorAddress;
        exchangeAggregator = exchangeAggregatorAddress;
        emit SetExchangeAggregator(exchangeAggregatorAddress, registryAggregatorAddress);
    }

    //************* PUBLIC VIEW FUNCTIONS ********************************

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
     * @dev Returns the estimated reward amount for a given parameters.
     * @param account The address of the account.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @param lendingTokenAmount The amount of lending token.
     * @return The lending token amount.
     * @return The project token amount to send to the liquidator.
     */
    function getEstimatedRewardAmount(
        address account,
        address projectToken,
        address lendingToken,
        uint256 lendingTokenAmount
    ) external view returns (uint256, uint256) {
        uint256 projectTokenToSendToLiquidator = _getProjectTokenToSendToLiquidator(account, projectToken, lendingToken, lendingTokenAmount);

        uint256 depositedProjectTokenAmount = primaryLendingPlatform.depositedAmount(account, projectToken);
        (uint256 estimatedOutstanding, ) = getEstimatedOutstandingInUSD(account, lendingToken);
        if (lendingTokenAmount > estimatedOutstanding) {
            lendingTokenAmount = estimatedOutstanding;
        }
        if (depositedProjectTokenAmount == 0) {
            projectTokenToSendToLiquidator = 0;
        } else if (projectTokenToSendToLiquidator > depositedProjectTokenAmount) {
            projectTokenToSendToLiquidator = depositedProjectTokenAmount;
        }
        return (lendingTokenAmount, projectTokenToSendToLiquidator);
    }

    /**
     * @dev Calculates the liquidator reward factor (LRF) for a given position.
     * @param account The address of the borrower whose position is being considered.
     * @return lrfNumerator The numerator of the liquidator reward factor.
     * @return lrfDenominator The denominator of the liquidator reward factor.
     */
    function liquidatorRewardFactor(address account) public view returns (uint256 lrfNumerator, uint256 lrfDenominator) {
        (uint256 hfNumerator, uint256 hfDenominator) = primaryLendingPlatform.healthFactor(account);
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
     * @dev Computes the estimated outstanding amount (i.e., loanBody + accrual) for a given user and lending token.
     * @param user The user for which to compute the outstanding amount.
     * @param lendingToken The lending token for which to compute the outstanding amount.
     * @return outstanding The outstanding amount for the user and lending token.
     * @return outstandingInUSD The outstanding amount for the user and lending token in USD.
     */
    function getEstimatedOutstandingInUSD(address user, address lendingToken) public view returns (uint256 outstanding, uint256 outstandingInUSD) {
        (uint256 loanBody, uint256 accrual, uint256 estimatedOutstandingInUSD) = primaryLendingPlatform.getEstimatedOutstandingInUSD(
            user,
            lendingToken
        );
        outstanding = loanBody + accrual;
        outstandingInUSD = estimatedOutstandingInUSD;
    }

    /**
     * @dev Calculates the maximum liquidation amount (MaxLA) for a given position.
     * MaxLA = (LVR * CVc - THF * LVc) / (LRF * LVR - THF)
     * @param account The address of the borrower whose position is being considered.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @return maxLA The maximum liquidation amount in the lending token.
     */
    function getMaxLiquidationAmount(address account, address projectToken, address lendingToken) public view returns (uint256 maxLA) {
        MaxLAParams memory maxLAParams;
        (uint256 estimatedOutstanding, uint256 estimatedOutstandingInUSD) = getEstimatedOutstandingInUSD(account, lendingToken);
        if (estimatedOutstanding == 0) return 0;

        (uint256 calNumeratorMaxLA, uint256 calDenominatorMaxLA) = _calMaxLA(account, projectToken, lendingToken);
        maxLAParams.numeratorMaxLA = calNumeratorMaxLA;
        maxLAParams.denominatorMaxLA = calDenominatorMaxLA;
        maxLAParams.calculatedMaxLA = maxLAParams.denominatorMaxLA > 0 && maxLAParams.numeratorMaxLA > 0
            ? (maxLAParams.numeratorMaxLA * 10 ** LIQUIDATOR_REWARD_FACTOR_DECIMAL) / maxLAParams.denominatorMaxLA
            : 0;

        if (maxLAParams.calculatedMaxLA >= estimatedOutstandingInUSD * 10 ** LIQUIDATOR_REWARD_FACTOR_DECIMAL) {
            maxLA = estimatedOutstanding;
        } else {
            uint256 lendingTokenMultiplier = 10 ** ERC20Upgradeable(lendingToken).decimals();
            (, uint256 lendingPrice) = getTokenPrice(lendingToken, lendingTokenMultiplier);
            maxLA = (maxLAParams.calculatedMaxLA * lendingTokenMultiplier) / (10 ** LIQUIDATOR_REWARD_FACTOR_DECIMAL) / lendingPrice;
        }
    }

    /**
     * @dev Computes the maximum and minimum liquidation amount for a given account, project token, and lending token.
     * MinLA = min(MaxLA, MPA)
     * @param account The account for which to compute the minimum liquidator reward amount.
     * @param projectToken The project token for which to compute the minimum liquidator reward amount.
     * @param lendingToken The lending token for which to compute the minimum liquidator reward amount.
     * @return maxLA The minimum liquidation amount.
     * @return minLA The maximum liquidation amount.
     */
    function getLimitLiquidationAmount(
        address account,
        address projectToken,
        address lendingToken
    ) public view returns (uint256 maxLA, uint256 minLA) {
        uint256 projectTokenMultiplier = 10 ** ERC20Upgradeable(lendingToken).decimals();
        (, uint256 lendingPrice) = getTokenPrice(lendingToken, projectTokenMultiplier);
        maxLA = getMaxLiquidationAmount(account, projectToken, lendingToken);
        minLA = Math.min(maxLA, (minPartialLiquidationAmount * projectTokenMultiplier) / lendingPrice);
    }

    //************* INTERNAL FUNCTIONS ********************************
    /**
     * @notice Calculates the amount of project tokens to send to the liquidator based on the lending token amount used for liquidation.
     * @param account The user's address to liquidate.
     * @param projectToken The project token address associated with the user's position.
     * @param lendingToken The lending token address used for the liquidation.
     * @param repaidAmount The amount of lending tokens was used for the liquidation.
     * @return projectTokenToSendToLiquidator The amount of project tokens to send to the liquidator.
     */
    function _getProjectTokenToSendToLiquidator(
        address account,
        address projectToken,
        address lendingToken,
        uint256 repaidAmount
    ) internal view returns (uint256 projectTokenToSendToLiquidator) {
        uint256 projectTokenMultiplier = 10 ** ERC20Upgradeable(projectToken).decimals();
        (uint256 lrfNumerator, uint256 lrfDenominator) = liquidatorRewardFactor(account);

        (, uint256 capitalEvaluation) = getTokenPrice(lendingToken, repaidAmount);
        (uint256 collateralPrice, ) = getTokenPrice(projectToken, projectTokenMultiplier);
        uint256 projectTokenEvaluation = (capitalEvaluation * projectTokenMultiplier) / collateralPrice;

        projectTokenToSendToLiquidator = (projectTokenEvaluation * lrfNumerator) / lrfDenominator;
    }

    /**
     * @dev Distributes the liquidation reward to the liquidator.
     * @param account The address of the borrower whose position is being liquidated.
     * @param projectToken The address of the project token.
     * @param projectTokenToSendToLiquidator The amount of project tokens to be sent to the liquidator.
     * @param liquidator The address of the liquidator.
     * @return The amount of project tokens sent to the liquidator.
     */
    function _distributeReward(
        address account,
        address projectToken,
        uint256 projectTokenToSendToLiquidator,
        address liquidator
    ) internal returns (uint256) {
        uint256 depositedProjectTokenAmount = primaryLendingPlatform.depositedAmount(account, projectToken);
        if (depositedProjectTokenAmount == 0 || projectTokenToSendToLiquidator == 0) {
            return 0;
        } else if (projectTokenToSendToLiquidator > depositedProjectTokenAmount) {
            projectTokenToSendToLiquidator = depositedProjectTokenAmount;
        }
        return primaryLendingPlatform.calcAndTransferDepositPosition(projectToken, projectTokenToSendToLiquidator, account, liquidator);
    }

    //************* INTERNAL VIEW AND PURE FUNCTIONS ********************************

    /**
     * @dev Calculates the maximum liquidation amount (MaxLA) for a given position.
     * MaxLA = (LVR * CVc - THF * LVc) / (LRF * LVR - THF)
     * @param account The address of the borrower whose position is being considered.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @return numeratorMaxLA The numerator of the MaxLA fraction.
     * @return denominatorMaxLA The denominator of the MaxLA fraction.
     */
    function _calMaxLA(
        address account,
        address projectToken,
        address lendingToken
    ) internal view returns (uint256 numeratorMaxLA, uint256 denominatorMaxLA) {
        (uint256 lrfNumerator, uint256 lrfDenominator) = liquidatorRewardFactor(account);
        Ratio memory targetHf = targetHealthFactor;

        uint256 totalPIT = primaryLendingPlatform.totalPIT(account);
        uint256 totalEstimatedWeightedLoanInUSD = primaryLendingPlatform.totalEstimatedWeightedLoanInUSD(account);

        IPrimaryLendingPlatformV3.Ratio memory lvrProjectToken = primaryLendingPlatform.projectTokenInfo(projectToken).loanToValueRatio;
        IPrimaryLendingPlatformV3.Ratio memory lvrLendingToken = primaryLendingPlatform.lendingTokenInfo(lendingToken).loanToValueRatio;

        uint256 calculatedNumerator;
        uint256 calculatedDenominator;
        bool isNegativeNumerator = false;
        bool isNegativeDenominator = false;

        (calculatedNumerator, isNegativeNumerator) = _checkNegativeNumber(
            totalPIT * targetHf.denominator,
            targetHf.numerator * totalEstimatedWeightedLoanInUSD
        );
        (calculatedDenominator, isNegativeDenominator) = _checkNegativeNumber(
            lrfNumerator * lvrProjectToken.numerator * targetHf.denominator * lvrLendingToken.numerator,
            lrfDenominator * lvrProjectToken.denominator * targetHf.numerator * lvrLendingToken.denominator
        );

        if (isNegativeNumerator != isNegativeDenominator) {
            return (0, 1);
        }
        numeratorMaxLA = calculatedNumerator * lrfDenominator * targetHf.denominator * lvrProjectToken.denominator * lvrLendingToken.numerator;
        denominatorMaxLA = calculatedDenominator * targetHf.denominator;
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
        bytes[] memory _buyCalldata,
        address[] memory updatePriceTokens
    ) internal returns (address[] memory assets, uint256[] memory assetAmounts) {
        IPriceProviderAggregator(address(primaryLendingPlatform.priceOracle())).updateMultiFinalPrices(updatePriceTokens);
        uint256 liquidationAmount = _validateLiquidationAmount(_account, _prjInfo.addr, _lendingInfo.addr, _lendingTokenAmount);
        if (_buyCalldata.length > 0) {
            (assets, assetAmounts) = _liquidateWithBorrow(_account, _prjInfo, _lendingInfo, liquidationAmount, _liquidator, _buyCalldata);
        } else {
            assets = new address[](1);
            assetAmounts = new uint256[](1);
            assets[0] = _prjInfo.addr;
            assetAmounts[0] = _liquidateNoBorrow(_account, _prjInfo.addr, _lendingInfo.addr, liquidationAmount, _liquidator);
        }

        emit Liquidate(_liquidator, _account, _lendingInfo.addr, _prjInfo.addr, assetAmounts[0]);
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
        if (_lendingTokenAmount == 0) {
            revert Errors.InvalidLendingAmount();
        }
        (uint256 healthFactorNumerator, uint256 healthFactorDenominator) = primaryLendingPlatform.healthFactor(_account);
        if (healthFactorNumerator >= healthFactorDenominator) {
            revert Errors.InvalidHealthFactor();
        }

        (uint256 maxLA, uint256 minLA) = getLimitLiquidationAmount(_account, _projectToken, _lendingToken);
        if (minLA != maxLA) {
            if (_lendingTokenAmount < minLA || _lendingTokenAmount > maxLA) {
                revert Errors.NotIncludedAmount();
            }
            return _lendingTokenAmount;
        } else {
            if (_lendingTokenAmount < minLA) {
                revert Errors.InvalidEqualAmount();
            }
            return maxLA;
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
        uint256 projectTokenSendToLiquidator = _getProjectTokenToSendToLiquidator(_account, _projectToken, _lendingToken, _lendingTokenAmount);
        primaryLendingPlatform.repayFromRelatedContract(_lendingToken, _lendingTokenAmount, liquidator, _account, bytes32(0));

        uint256 projectTokenLiquidatorReceived = _distributeReward(_account, _projectToken, projectTokenSendToLiquidator, liquidator);
        _transferExcessToken(_lendingToken, liquidator);
        return projectTokenLiquidatorReceived;
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
        //User need to approve lending token berfore call this function
        _nakedBorrow(_liquidator, _lendingInfo.addr, _lendingTokenAmount);
        uint256 projectTokenSendToLiquidator = _getProjectTokenToSendToLiquidator(_account, _prjInfo.addr, _lendingInfo.addr, _lendingTokenAmount);

        primaryLendingPlatform.repayFromRelatedContract(_lendingInfo.addr, _lendingTokenAmount, _liquidator, _account, bytes32(0));
        uint256 projectTokenReward = _distributeReward(_account, _prjInfo.addr, projectTokenSendToLiquidator, address(this));

        _swapAndRepayNakedBorrow(_prjInfo, _lendingInfo, projectTokenReward, _lendingTokenAmount, _liquidator, _buyCalldata);

        (assets, assetAmounts) = _redeemExcessToken(_prjInfo, _lendingInfo, _liquidator);
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
     * @notice Performs a naked borrow operation for a user with the given lending token and amount.
     * @param user The address of the user.
     * @param lendingToken The address of the lending token.
     * @param lendingTokenAmount The amount of lending token to be borrowed.
     */
    function _nakedBorrow(address user, address lendingToken, uint256 lendingTokenAmount) internal {
        primaryLendingPlatform.updateInterestInAllBorrowPositions(user);
        primaryLendingPlatform.calcBorrowPosition(user, lendingToken, lendingTokenAmount);
    }

    /**
     * @dev Internal function to swap the project tokens for the lending tokens and repay the naked borrow.
     * @param _prjInfo Information about the project token, including its address and type.
     * @param _lendingInfo Information about the lending token, including its address and type.
     * @param _projectTokenReward The amount of project tokens to be swapped.
     * @param _lendingTokenAmount The amount of lending tokens to be repaid.
     * @param _liquidator The address of the liquidator (usually the msg.sender).
     * @param _buyCalldata The calldata for buying the lending token from the exchange aggregator.
     */
    function _swapAndRepayNakedBorrow(
        Asset.Info memory _prjInfo,
        Asset.Info memory _lendingInfo,
        uint256 _projectTokenReward,
        uint256 _lendingTokenAmount,
        address _liquidator,
        bytes[] memory _buyCalldata
    ) internal {
        (address[] memory prjTokens, ) = ExchangeAggregator._unwrapTokenAndApprove(
            _prjInfo,
            _projectTokenReward,
            exchangeAggregator,
            registryAggregator
        );

        (, uint256 amountReceive) = ExchangeAggregator._buyOnExchangeAggregatorWithMultiAsset(
            prjTokens,
            _lendingInfo,
            _buyCalldata,
            exchangeAggregator
        );
        if (amountReceive < _lendingTokenAmount) {
            revert Errors.InvalidReceiveAmount();
        }
        Asset._safeIncreaseAllowance(primaryLendingPlatform.lendingTokenInfo(_lendingInfo.addr).bLendingToken, _lendingInfo.addr, amountReceive);
        primaryLendingPlatform.repayFromRelatedContract(_lendingInfo.addr, _lendingTokenAmount, address(this), _liquidator, bytes32(0));
    }
}
