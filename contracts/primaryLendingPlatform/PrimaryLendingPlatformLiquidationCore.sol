// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/IPrimaryLendingPlatform.sol";

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

    event Liquidate(
        address indexed liquidator,
        address indexed borrower,
        address lendingToken,
        address indexed prjAddress,
        uint256 amountPrjLiquidated
    );
    event SetPrimaryLendingPlatform(address indexed newPrimaryLendingPlatform);
    event SetMinPartialLiquidationAmount(uint256 indexed newAmount);
    event SetMaxLRF(uint8 numeratorLRF, uint8 denominatorLRF);
    event SetLiquidatorRewardCalculationFactor(uint8 numeratorLRF, uint8 denominatorLRF);
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

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not the Admin");
        _;
    }

    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "Caller is not the Moderator");
        _;
    }

    modifier isProjectTokenListed(address _projectToken) {
        require(primaryLendingPlatform.projectTokenInfo(_projectToken).isListed, "PITLiquidation: Project token is not listed");
        _;
    }

    modifier isLendingTokenListed(address _lendingToken) {
        require(primaryLendingPlatform.lendingTokenInfo(_lendingToken).isListed, "PITLiquidation: Lending token is not listed");
        _;
    }

    modifier onlyRelatedContracts() {
        require(primaryLendingPlatform.getRelatedContract(msg.sender), "PITLiquidation: Caller is not related Contract");
        _;
    }

    /**
     * @notice Sets the minimum partial liquidation amount.
     * @dev Can only be called by accounts with the MODERATOR_ROLE.
     * @param newAmount The minimum partial liquidation amount.
     */
    function setMinPartialLiquidationAmount(uint256 newAmount) external onlyModerator {
        minPartialLiquidationAmount = newAmount;
        emit SetMinPartialLiquidationAmount(newAmount);
    }

    /**
     * @notice Sets the maximum Liquidator Reward Factor (LRF).
     * @dev Can only be called by accounts with the MODERATOR_ROLE.
     * @param numeratorLRF The numerator for the maximum LRF.
     * @param denominatorLRF The denominator for the maximum LRF.
     */
    function setMaxLRF(uint8 numeratorLRF, uint8 denominatorLRF) external onlyModerator {
        require(denominatorLRF != 0, "PITLiquidation: Invalid denominator");
        maxLRF = Ratio(numeratorLRF, denominatorLRF);
        emit SetMaxLRF(numeratorLRF, denominatorLRF);
    }

    /**
     * @notice Sets the liquidator reward calculation factor.
     * @dev This function can only be called by an account with the MODERATOR_ROLE.
     * @param numeratorLRF The numerator for the liquidator reward calculation factor.
     * @param denominatorLRF The denominator for the liquidator reward calculation factor.
     */
    function setLiquidatorRewardCalculationFactor(uint8 numeratorLRF, uint8 denominatorLRF) external onlyModerator {
        require(denominatorLRF != 0, "PITLiquidation: Invalid denominator");
        liquidatorRewardCalcFactor = Ratio(numeratorLRF, denominatorLRF);
        emit SetLiquidatorRewardCalculationFactor(numeratorLRF, denominatorLRF);
    }

    /**
     * @notice Sets the PrimaryLendingPlatform address.
     * @dev This function can only be called by an account with the MODERATOR_ROLE.
     * @param newPrimaryLendingPlatform The new PrimaryLendingPlatform address.
     */
    function setPrimaryLendingPlatformAddress(address newPrimaryLendingPlatform) external onlyModerator {
        require(newPrimaryLendingPlatform != address(0), "PITLiquidation: Invalid address");
        primaryLendingPlatform = IPrimaryLendingPlatform(newPrimaryLendingPlatform);
        emit SetPrimaryLendingPlatform(newPrimaryLendingPlatform);
    }

    /**
     * @notice Sets the target health factor.
     * @dev This function can only be called by an account with the MODERATOR_ROLE.
     * @param numeratorHF The numerator for the target health factor.
     * @param denominatorHF The denominator for the target health factor.
     */
    function setTargetHealthFactor(uint8 numeratorHF, uint8 denominatorHF) external onlyModerator {
        require(denominatorHF != 0, "PITLiquidation: Invalid denominator");
        targetHealthFactor = Ratio(numeratorHF, denominatorHF);
        emit SetTargetHealthFactor(numeratorHF, denominatorHF);
    }

    /**
     * @notice Get the health factor of a specific account's position.
     * @param _account The address of the account.
     * @param _projectToken The address of the project token.
     * @param _lendingToken The address of the lending token.
     * @return healthFactorNumerator The numerator of the health factor.
     * @return healthFactorDenominator The denominator of the health factor.
     */
    function getHf(
        address _account,
        address _projectToken,
        address _lendingToken
    ) public view returns (uint256 healthFactorNumerator, uint256 healthFactorDenominator) {
        (healthFactorNumerator, healthFactorDenominator) = primaryLendingPlatform.healthFactor(_account, _projectToken, _lendingToken);
    }

    /**
     * @notice Get the current health factor of a specific account's position.
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
     * @notice Get the price of a token in USD.
     * @param token The address of the token.
     * @param amount The amount of the token.
     * @return price The price of the token in USD.
     */
    function getTokenPrice(address token, uint256 amount) public view returns (uint256 price) {
        price = primaryLendingPlatform.getTokenEvaluation(token, amount);
    }

    /**
     * @notice Liquidates a user's position based on the specified lending token amount.
     * @param _account The user's address to liquidate.
     * @param _projectToken The project token address associated with the user's position.
     * @param _lendingToken The lending token address used for the liquidation.
     * @param _lendingTokenAmount The amount of lending tokens used for the liquidation.
     * @param liquidator The address of the liquidator (usually the msg.sender).
     * @return projectTokenLiquidatorReceived The amount of project tokens sent to the liquidator as a result of the liquidation.
     */
    function _liquidate(
        address _account,
        address _projectToken,
        address _lendingToken,
        uint256 _lendingTokenAmount,
        address liquidator
    ) internal isProjectTokenListed(_projectToken) isLendingTokenListed(_lendingToken) returns (uint256) {
        require(_lendingTokenAmount > 0, "PITLiquidation: LendingTokenAmount must be greater than 0");

        (uint256 healthFactorNumerator, uint256 healthFactorDenominator) = getCurrentHealthFactor(_account, _projectToken, _lendingToken);
        require(healthFactorNumerator < healthFactorDenominator, "PITLiquidation: HealthFactor>=1");

        // under normal conditions: liquidator == msg.sender
        (uint256 maxLA, uint256 minLA) = getLiquidationAmount(_account, _projectToken, _lendingToken);
        require(_lendingTokenAmount >= minLA && _lendingTokenAmount <= maxLA, "PITLiquidation: Invalid amount");

        uint256 projectTokenToSendToLiquidator = _getProjectTokenToSendToLiquidator(
            _account,
            _projectToken,
            _lendingToken,
            _lendingTokenAmount,
            liquidator
        );

        uint256 projectTokenLiquidatorReceived = _distributeReward(_account, _projectToken, projectTokenToSendToLiquidator, liquidator);

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
        uint256 projectTokenEvaluation = (getTokenPrice(_lendingToken, repaid) * projectTokenMultiplier) /
            getTokenPrice(_projectToken, projectTokenMultiplier);

        projectTokenToSendToLiquidator = (projectTokenEvaluation * lrfNumerator) / lrfDenominator;
    }

    /**
     * @dev Distributes the liquidation reward to the liquidator.
     * @param _account The address of the borrower whose position is being liquidated.
     * @param _projectToken The address of the project token.
     * @param projectTokenToSendToLiquidator The amount of project tokens to be sent to the liquidator.
     * @param liquidator The address of the liquidator.
     * @return The amount of project tokens sent to the liquidator.
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
            (lrfNumerator, isNegativeNumerator) = _checkNegativeNumber(kf.numerator * hfDenominator + kf.denominator * hfDenominator, kf.numerator * hfNumerator);
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
     * MaxLA = (LVR * CVc - THF * LVc) / (LRF * LVR - THF)
     * @param account The address of the borrower whose position is being considered.
     * @param projectToken The address of the project token.
     * @param lendingToken The address of the lending token.
     * @return maxLA The maximum liquidation amount in the lending token.
     */
    function getMaxLiquidationAmount(address account, address projectToken, address lendingToken) public view returns (uint256 maxLA) {
        uint256 totalOutstandingInUSD = primaryLendingPlatform.totalOutstandingInUSD(account, projectToken, lendingToken);
        if (totalOutstandingInUSD == 0) return 0;

        uint256 depositedProjectTokenAmount = primaryLendingPlatform.getDepositedAmount(projectToken, account);
        uint256 depositedProjectTokenAmountInUSD = getTokenPrice(projectToken, depositedProjectTokenAmount);
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

        uint256 projectTokenMultiplier = 10 ** ERC20Upgradeable(lendingToken).decimals();
        maxLA = (maxLAParams.maxLACompare * projectTokenMultiplier) / getTokenPrice(lendingToken, projectTokenMultiplier);
    }

    /**
     * @dev Computes the absolute difference between two unsigned integers.
     * @param firstNumber The first unsigned integer.
     * @param secondNumber The second unsigned integer.
     * @return result The absolute difference between the two input numbers.
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
     * @dev Computes the minimum and maximum liquidation amount for a given account, project token, and lending token.
     * MinLA = min(MaxLA, MPA)
     * @param _account The account for which to compute the liquidation amount.
     * @param _projectToken The project token for which to compute the minimum liquidation amount.
     * @param _lendingToken The lending token for which to compute the minimum liquidation amount.
     * @return maxLA The maximum liquidation amount.
     * @return minLA The minimum liquidation amount.
     */
    function getLiquidationAmount(address _account, address _projectToken, address _lendingToken) public view returns (uint256 maxLA, uint256 minLA) {
        uint256 lendingTokenMultiplier = 10 ** ERC20Upgradeable(_lendingToken).decimals();
        maxLA = getMaxLiquidationAmount(_account, _projectToken, _lendingToken);
        minLA = Math.min(maxLA, (minPartialLiquidationAmount * lendingTokenMultiplier) / getTokenPrice(_lendingToken, lendingTokenMultiplier));
    }
}
