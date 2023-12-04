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
        (, , , healthFactorNumerator, healthFactorDenominator) = primaryLendingPlatform.getPosition(_account, _projectToken, _lendingToken, true);
    }

    /**
     * @dev Gets the price of a token in USD.
     * @param token The address of the token.
     * @param amount The amount of the token.
     * @return collateralPrice The price of the token in USD.
	 * @return capitalPrice The price of the token in USD.
     */
    function getTokenPrice(address token, uint256 amount) public view returns (uint256 collateralPrice, uint256 capitalPrice) {
        return primaryLendingPlatform.getTokenEvaluation(token, amount, true);
    }

    /**
     * @dev Internal function that allow a user to liquidate their position.
     * @param _account The user's address to liquidate.
     * @param _projectToken The project token address associated with the user's position.
     * @param _lendingToken The lending token address used for the liquidation.
     * @param _lendingTokenAmount The amount of lending tokens used for the liquidation.
     * @param liquidator The address of the liquidator (usually the msg.sender).
     * @return The amount of project tokens sent to the liquidator as a result of the liquidation.
     */
    function _liquidate(
        address _account,
        address _projectToken,
        address _lendingToken,
        uint256 _lendingTokenAmount,
        address liquidator
    ) internal returns (uint256) {
        
        require(_lendingTokenAmount > 0, "PITLiquidation: LendingTokenAmount must be greater than 0");

        (uint256 healthFactorNumerator, uint256 healthFactorDenominator) = getCurrentHealthFactor(_account, _projectToken, _lendingToken);
        require(healthFactorNumerator < healthFactorDenominator, "PITLiquidation: HealthFactor>=1");

        // under normal conditions: liquidator == msg.sender
        (uint256 maxLA, uint256 minLA) = getLiquidationAmount(_account, _projectToken, _lendingToken);
        uint256 excessAmount = 0;
        if (minLA != maxLA) {
            require(_lendingTokenAmount >= minLA && _lendingTokenAmount <= maxLA, "PITLiquidation: Invalid amount when minLA != maxLA");
        } else {
            require(_lendingTokenAmount >= minLA, "PITLiquidation: Invalid amount when minLA == maxLA");
            excessAmount = _lendingTokenAmount - maxLA;
            _lendingTokenAmount = maxLA;
        }

        uint256 projectTokenToSendToLiquidator = _getProjectTokenToSendToLiquidator(
            _account,
            _projectToken,
            _lendingToken,
            _lendingTokenAmount,
            liquidator
        );

        uint256 projectTokenLiquidatorReceived = _distributeReward(_account, _projectToken, projectTokenToSendToLiquidator, liquidator);

        if (excessAmount > 0) {
            ERC20Upgradeable(_lendingToken).safeTransfer(liquidator, excessAmount);
        }
        emit Liquidate(liquidator, _account, _lendingToken, _projectToken, projectTokenToSendToLiquidator);
        return projectTokenLiquidatorReceived;
    }

    /**
     * @notice Calculates the amount of project tokens to send to the liquidator based on the lending token amount used for liquidation.
     * @param _account The user's address to liquidate.
     * @param _projectToken The project token address associated with the user's position.
     * @param _lendingToken The lending token address used for the liquidation.
     * @param _lendingTokenAmount The amount of lending tokens used for the liquidation.
     * @param liquidator The address of the liquidator.
     * @return projectTokenToSendToLiquidator The amount of project tokens to send to the liquidator.
     */
    function _getProjectTokenToSendToLiquidator(
        address _account,
        address _projectToken,
        address _lendingToken,
        uint256 _lendingTokenAmount,
        address liquidator
    ) internal returns (uint256 projectTokenToSendToLiquidator) {
        (uint256 lrfNumerator, uint256 lrfDenominator) = liquidatorRewardFactor(_account, _projectToken, _lendingToken);
        uint256 repaid = primaryLendingPlatform.repayFromRelatedContract(_projectToken, _lendingToken, _lendingTokenAmount, liquidator, _account);

        uint256 projectTokenMultiplier = 10 ** ERC20Upgradeable(_projectToken).decimals();
        
        (uint256 projectTokenPrice, ) = getTokenPrice(_projectToken, projectTokenMultiplier);
        
        (, uint256 repaidInUSD) =  getTokenPrice(_lendingToken, repaid);

        uint256 projectTokenEvaluation = (repaidInUSD * projectTokenMultiplier) / projectTokenPrice;

        projectTokenToSendToLiquidator = (projectTokenEvaluation * lrfNumerator) / lrfDenominator;
    }

    /**
     * @dev Internal function to distribute the liquidation reward to the liquidator.
     * @param _account The address of the borrower whose position is being liquidated.
     * @param _projectToken The address of the project token.
     * @param projectTokenToSendToLiquidator The amount of project tokens to be sent to the liquidator.
     * @param liquidator The address of the liquidator.
     * @return The amount of project token transferred to the liquidator.
     */
    function _distributeReward(
        address _account,
        address _projectToken,
        uint256 projectTokenToSendToLiquidator,
        address liquidator
    ) internal returns (uint256) {
        uint256 depositedProjectTokenAmount = primaryLendingPlatform.getDepositedAmount(_projectToken, _account);
        if (projectTokenToSendToLiquidator > depositedProjectTokenAmount) {
            projectTokenToSendToLiquidator = depositedProjectTokenAmount;
        }
        if (projectTokenToSendToLiquidator == 0) {
            return 0;
        }
        return primaryLendingPlatform.calcAndTransferDepositPosition(_projectToken, projectTokenToSendToLiquidator, _account, liquidator);
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
        uint256 totalOutstandingInUSD = primaryLendingPlatform.totalOutstandingInUSD(account, projectToken, lendingToken, true);
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

        uint256 totalOutstandingInUSDMul = totalOutstandingInUSD * 10 ** LIQUIDATOR_REWARD_FACTOR_DECIMAL;

        maxLAParams.maxLACompare = maxLAParams.calculatedMaxLA > totalOutstandingInUSDMul
            ? totalOutstandingInUSD
            : maxLAParams.calculatedMaxLA / 10 ** LIQUIDATOR_REWARD_FACTOR_DECIMAL;

        uint256 lendingTokenMultiplier = 10 ** ERC20Upgradeable(lendingToken).decimals();
        (, uint256 lendingTokenPrice) = getTokenPrice(lendingToken, lendingTokenMultiplier);
        maxLA = (maxLAParams.maxLACompare * lendingTokenMultiplier) / lendingTokenPrice;
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
}
