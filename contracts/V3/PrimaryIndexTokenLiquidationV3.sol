// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/V3/IPrimaryIndexTokenV3.sol";

contract PrimaryIndexTokenLiquidationV3 is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for ERC20Upgradeable;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    uint256 public constant LIQUIDATOR_REWARD_FACTOR_DECIMAL = 18;
    uint256 public minPartialLiquidationAmount;
    Ratio public targetHealthFactor;
    Ratio public liquidatorRewardCalcFactor;
    Ratio public maxLRF;

    IPrimaryIndexTokenV3 public primaryIndexToken;

    struct Ratio {
        uint8 numerator;
        uint8 denominator;
    }

    event Liquidate(address indexed liquidator, address indexed borrower, address lendingToken, address indexed prjAddress, uint256 amountPrjLiquidated);
    event SetPrimaryIndexToken(address indexed oldPrimaryIndexToken, address indexed newPrimaryIndexToken);
    event SetMinPartialLiquidationAmount(uint256 oldAmount, uint256 newAmount);
    event SetMaxLRF(uint8 numeratorLRF, uint8 denominatorLRF);
    event SetLiquidatorRewardCalculationFactor(uint8 numeratorLRF, uint8 denominatorLRF);
    event SetTargetHealthFactor(uint8 numeratorHF, uint8 denominatorHF);

    /** 
     * @notice Initializes the contract with the provided PIT address. 
     * @dev Sets up initial roles, initializes AccessControl, and sets the provided PIT address. 
     * @param pit The address of the PrimaryIndexToken contract. 
     */ 
    function initialize(address pit) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init_unchained();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        primaryIndexToken = IPrimaryIndexTokenV3(pit);
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
        require(primaryIndexToken.projectTokenInfo(_projectToken).isListed, "PITLiquidation: project token is not listed");
        _;
    }

    modifier isLendingTokenListed(address _lendingToken) {
        require(primaryIndexToken.lendingTokenInfo(_lendingToken).isListed, "PITLiquidation: lending token is not listed");
        _;
    }

    modifier onlyRelatedContracts() {
        require(primaryIndexToken.getRelatedContract(msg.sender), "PITLiquidation: caller is not related Contract");
        _;
    }

    /** 
     * @notice Sets the minimum partial liquidation amount. 
     * @dev Can only be called by accounts with the MODERATOR_ROLE. 
     * @param _amount The minimum partial liquidation amount. 
     */ 
    function setMinPartialLiquidationAmount(uint256 _amount) external onlyModerator() {
        emit SetMinPartialLiquidationAmount(minPartialLiquidationAmount, _amount);
        minPartialLiquidationAmount = _amount;
    }

    /** 
     * @notice Sets the maximum Liquidator Reward Factor (LRF). 
     * @dev Can only be called by accounts with the MODERATOR_ROLE. 
     * @param numeratorLRF The numerator for the maximum LRF. 
     * @param denominatorLRF The denominator for the maximum LRF. 
     */ 
    function setMaxLRF(uint8 numeratorLRF, uint8 denominatorLRF) external onlyModerator() {
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
    function setLiquidatorRewardCalculationFactor(uint8 numeratorLRF, uint8 denominatorLRF) external onlyModerator() {
        require(denominatorLRF != 0, "PITLiquidation: Invalid denominator");
        liquidatorRewardCalcFactor = Ratio(numeratorLRF, denominatorLRF);
        emit SetLiquidatorRewardCalculationFactor(numeratorLRF, denominatorLRF);
    }

    /** 
     * @notice Sets the PrimaryIndexToken address. 
     * @dev This function can only be called by an account with the MODERATOR_ROLE. 
     * @param _newPrimaryIndexToken The new PrimaryIndexToken address. 
     */
    function setPrimaryIndexTokenAddress(address _newPrimaryIndexToken) external onlyModerator() {
        require(_newPrimaryIndexToken != address(0), "PITLiquidation: invalid address");
        emit SetPrimaryIndexToken(address(primaryIndexToken), _newPrimaryIndexToken);
        primaryIndexToken = IPrimaryIndexTokenV3(_newPrimaryIndexToken);
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
     * @notice Get the price of a token in USD. 
     * @param token The address of the token. 
     * @param amount The amount of the token. 
     * @return price The price of the token in USD. 
     */
    function getTokenPrice(address token, uint amount) public view returns(uint price) {
        price = primaryIndexToken.getTokenEvaluation(token, amount);
    }

    /** 
     * @notice Liquidates a portion of the borrower's debt using the lending token. 
     * @param _account The address of the borrower 
     * @param _projectToken The address of the project token 
     * @param _lendingToken The address of the lending token 
     * @param _lendingTokenAmount The amount of lending tokens to be used for liquidation 
     */
    function liquidate(address _account, address _projectToken, address _lendingToken, uint256 _lendingTokenAmount) public isProjectTokenListed(_projectToken) isLendingTokenListed(_lendingToken) nonReentrant {
        _liquidate(_account, _projectToken, _lendingToken, _lendingTokenAmount, msg.sender);
    }

    /** 
     * @notice Liquidates a portion of the borrower's debt using the lending token, called by a related contract. 
     * @param _account The address of the borrower 
     * @param _projectToken The address of the project token 
     * @param _lendingToken The address of the lending token 
     * @param _lendingTokenAmount The amount of lending tokens to be used for liquidation 
     * @param liquidator The address of the liquidator 
     * @return projectTokenLiquidatorReceived The amount of project tokens received by the liquidator 
     */
    function liquidateFromModerator(address _account, address _projectToken, address _lendingToken, uint256 _lendingTokenAmount, address liquidator) public isProjectTokenListed(_projectToken) isLendingTokenListed(_lendingToken) onlyRelatedContracts() nonReentrant returns(uint256) {
        return _liquidate(_account, _projectToken, _lendingToken, _lendingTokenAmount, liquidator);
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
    function _liquidate(address _account, address _projectToken, address _lendingToken, uint256 _lendingTokenAmount, address liquidator) internal isProjectTokenListed(_projectToken) isLendingTokenListed(_lendingToken) returns(uint256) {
        // under normal conditions: liquidator == msg.sender
        (uint minLA, uint maxLA) = getLimitLiquidationAmount(_account, _projectToken, _lendingToken);
        require(_lendingTokenAmount > 0, "PITLiquidation: lendingTokenAmount must be > 0");
        require(_lendingTokenAmount >= minLA && _lendingTokenAmount <= maxLA, "PITLiquidation: invalid amount");
        (uint256 healthFactorNumerator, uint256 healthFactorDenominator) = primaryIndexToken.estimatedHealthFactor(_account);
        require(healthFactorNumerator < healthFactorDenominator, "PITLiquidation: healthFactor>=1");
        
        uint256 projectTokenToSendToLiquidator = _getProjectTokenToSendToLiquidator(_account, _projectToken, _lendingToken, _lendingTokenAmount, liquidator);

        uint256 projectTokenLiquidatorReceived = _distributeReward(_account, _projectToken, projectTokenToSendToLiquidator, liquidator);

        emit Liquidate(liquidator, _account, _lendingToken, _projectToken, projectTokenToSendToLiquidator);
        return projectTokenLiquidatorReceived;
    }

    function getEstimatedRewardAmount(address _account, address _projectToken, address _lendingToken, uint256 _lendingTokenAmount) public view returns(uint256, uint256) {
        uint256 projectTokenMultiplier = 10 ** ERC20Upgradeable(_projectToken).decimals();
        (uint256 lrfNumerator, uint256 lrfDenominator) = liquidatorRewardFactor(_account);
        uint256 projectTokenEvaluation = getTokenPrice(_lendingToken, _lendingTokenAmount) * projectTokenMultiplier / getTokenPrice(_projectToken, projectTokenMultiplier);
        uint256 depositedProjectTokenAmount = primaryIndexToken.depositedAmount(_projectToken, _account);
        (uint256 estimatedOutstanding, ) = getEstimatedOutstandingInUSD(_account, _lendingToken);
        if (_lendingTokenAmount > estimatedOutstanding) {
            _lendingTokenAmount = estimatedOutstanding;
        }
        uint256 projectTokenToSendToLiquidator = projectTokenEvaluation * lrfNumerator / lrfDenominator;

        if (depositedProjectTokenAmount == 0) {
            projectTokenToSendToLiquidator = 0;
        } else if (projectTokenToSendToLiquidator > depositedProjectTokenAmount){
            projectTokenToSendToLiquidator = depositedProjectTokenAmount;
        }
        return (_lendingTokenAmount, projectTokenToSendToLiquidator);
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
    function _getProjectTokenToSendToLiquidator(address _account, address _projectToken, address _lendingToken, uint256 _lendingTokenAmount, address liquidator) internal returns(uint256 projectTokenToSendToLiquidator) {
        uint256 projectTokenMultiplier = 10 ** ERC20Upgradeable(_projectToken).decimals();
        (uint256 lrfNumerator, uint256 lrfDenominator) = liquidatorRewardFactor(_account);
        uint256 repaid = primaryIndexToken.repayFromRelatedContract(_lendingToken, _lendingTokenAmount, liquidator, _account);
        uint256 projectTokenEvaluation = getTokenPrice(_lendingToken, repaid) * projectTokenMultiplier / getTokenPrice(_projectToken, projectTokenMultiplier);

        projectTokenToSendToLiquidator = projectTokenEvaluation * lrfNumerator / lrfDenominator;
    }

    /** 
     * @dev Distributes the liquidation reward to the liquidator. 
     * @param _account The address of the borrower whose position is being liquidated. 
     * @param _projectToken The address of the project token. 
     * @param projectTokenToSendToLiquidator The amount of project tokens to be sent to the liquidator. 
     * @param liquidator The address of the liquidator. 
     * @return The amount of project tokens sent to the liquidator. 
     */
    function _distributeReward(address _account, address _projectToken, uint256 projectTokenToSendToLiquidator, address liquidator) internal returns(uint256){
        uint256 depositedProjectTokenAmount = primaryIndexToken.depositedAmount(_projectToken, _account);
        if (depositedProjectTokenAmount == 0 || projectTokenToSendToLiquidator == 0) {
            return 0;
        } else if (projectTokenToSendToLiquidator > depositedProjectTokenAmount){
            projectTokenToSendToLiquidator = depositedProjectTokenAmount;
        }
        return primaryIndexToken.calcAndTransferDepositPosition(_projectToken, projectTokenToSendToLiquidator, _account, liquidator);
    }

    /** 
     * @dev Calculates the liquidator reward factor (LRF) for a given position. 
     * @param _account The address of the borrower whose position is being considered. 
     * @return lrfNumerator The numerator of the liquidator reward factor. 
     * @return lrfDenominator The denominator of the liquidator reward factor. 
     */
    function liquidatorRewardFactor(address _account) public view returns(uint256 lrfNumerator, uint256 lrfDenominator) {
        (uint256 hfNumerator, uint256 hfDenominator) = primaryIndexToken.estimatedHealthFactor(_account);
        if (hfDenominator == 0) {
            lrfNumerator = 0;
            lrfDenominator = 1;
        } else {
            Ratio memory kf = liquidatorRewardCalcFactor;
            lrfNumerator = kf.numerator * hfDenominator + kf.denominator * hfDenominator - kf.numerator * hfNumerator;
            lrfDenominator = kf.denominator * hfDenominator;
            uint lrfNumeratorMul = lrfNumerator * maxLRF.denominator;
            uint maxLRFNumerator = maxLRF.numerator * lrfDenominator;
            if(lrfNumeratorMul > maxLRFNumerator){
                (lrfNumerator, lrfDenominator) = (maxLRF.numerator, maxLRF.denominator);
            }
        }
    }

    struct MaxLAParams {
        uint256 numeratorMaxLA;
        uint256 denominatorMaxLA;
        uint256 calculatedMaxLA;
        uint256 maxLACompare;
    }

    /**
     * @dev Computes the estimated outstanding amount (i.e., loanBody + accrual) for a given user and lending token.
     * @param user The user for which to compute the outstanding amount.
     * @param lendingToken The lending token for which to compute the outstanding amount.
     * @return outstanding The outstanding amount for the user and lending token.
     * @return outstandingInUSD The outstanding amount for the user and lending token in USD.
     */
    function getEstimatedOutstandingInUSD(address user, address lendingToken) public view returns(uint256 outstanding, uint256 outstandingInUSD) {
        (uint256 loanBody, uint256 accrual, uint256 estimatedOutstandingInUSD) = primaryIndexToken.getEstimatedOutstandingInUSD(user, lendingToken);
        outstanding = loanBody + accrual;   
        outstandingInUSD = estimatedOutstandingInUSD;
    }

    /** 
     * @dev Calculates the maximum liquidation amount (MaxLA) for a given position.  
     * MaxLA = (LVR * CVc - THF * LVc) / (LRF * LVR - THF)
     * @param _account The address of the borrower whose position is being considered. 
     * @param _projectToken The address of the project token. 
     * @param _lendingToken The address of the lending token. 
     * @return maxLA The maximum liquidation amount in the lending token. 
     */
    function getMaxLiquidationAmount(address _account, address _projectToken, address _lendingToken) public view returns (uint256 maxLA) {
        MaxLAParams memory maxLAParams;
        (uint256 estimatedOutstanding, uint256 estimatedOutstandingInUSD) = getEstimatedOutstandingInUSD(_account, _lendingToken);
        if (estimatedOutstanding == 0) return 0;

       (uint256 calNumeratorMaxLA, uint256 calDenominatorMaxLA) = _calMaxLA(_account, _projectToken, _lendingToken);
        maxLAParams.numeratorMaxLA = calNumeratorMaxLA;
        maxLAParams.denominatorMaxLA = calDenominatorMaxLA;
        maxLAParams.calculatedMaxLA = maxLAParams.denominatorMaxLA > 0 && maxLAParams.numeratorMaxLA > 0 ? maxLAParams.numeratorMaxLA * 10 ** LIQUIDATOR_REWARD_FACTOR_DECIMAL / maxLAParams.denominatorMaxLA : 0;
        
        uint estimatedOutstandingInUSDMul = estimatedOutstandingInUSD * 10 ** LIQUIDATOR_REWARD_FACTOR_DECIMAL;
        maxLAParams.maxLACompare = maxLAParams.calculatedMaxLA > estimatedOutstandingInUSDMul ? estimatedOutstandingInUSDMul : maxLAParams.calculatedMaxLA / 10 ** LIQUIDATOR_REWARD_FACTOR_DECIMAL;
        
        uint lendingTokenMultiplier = 10 ** ERC20Upgradeable(_lendingToken).decimals();
        maxLA = maxLAParams.maxLACompare * lendingTokenMultiplier / getTokenPrice(_lendingToken, lendingTokenMultiplier);
    }

    function _calMaxLA(address _account, address _projectToken, address _lendingToken) internal view returns (uint256 numeratorMaxLA, uint256 denominatorMaxLA) {
        (uint256 lrfNumerator, uint256 lrfDenominator) = liquidatorRewardFactor(_account);
        Ratio memory targetHf = targetHealthFactor;

        uint256 totalPIT = primaryIndexToken.totalPIT(_account);
        uint256 totalEstimatedWeightedLoanInUSD = primaryIndexToken.totalEstimatedWeightedLoanInUSD(_account);

        IPrimaryIndexTokenV3.Ratio memory lvrProjectToken = primaryIndexToken.projectTokenInfo(_projectToken).loanToValueRatio;
        IPrimaryIndexTokenV3.Ratio memory lvrLendingToken = primaryIndexToken.lendingTokenInfo(_lendingToken).loanToValueRatio;

        numeratorMaxLA = _checkNegativeNumber(totalPIT * targetHf.denominator, targetHf.numerator * totalEstimatedWeightedLoanInUSD) * lrfDenominator * targetHf.denominator * lvrProjectToken.denominator * lvrLendingToken.numerator;
        denominatorMaxLA = _checkNegativeNumber(lrfNumerator * lvrProjectToken.numerator * targetHf.denominator * lvrLendingToken.numerator, lrfDenominator * lvrProjectToken.denominator * targetHf.numerator * lvrLendingToken.denominator) * targetHf.denominator;
    }

    /**
     * @dev Computes the absolute difference between two unsigned integers.
     * @param firstNumber The first unsigned integer.
     * @param secondNumber The second unsigned integer.
     * @return result The absolute difference between the two input numbers.
     */
    function _checkNegativeNumber(uint firstNumber, uint secondNumber) internal pure returns (uint256 result) {
        result = secondNumber > firstNumber ? secondNumber - firstNumber : firstNumber - secondNumber;
    }

    /**
     * @dev Computes the maximum and minimum liquidation amount for a given account, project token, and lending token.
     * MinLA = min(MaxLA, MPA)
     * @param _account The account for which to compute the minimum liquidator reward amount.
     * @param _projectToken The project token for which to compute the minimum liquidator reward amount.
     * @param _lendingToken The lending token for which to compute the minimum liquidator reward amount.
     * @return maxLA The minimum liquidation amount.
     * @return minLA The maximum liquidation amount.
     */
    function getLimitLiquidationAmount(address _account, address _projectToken, address _lendingToken) public view returns (uint256 maxLA, uint256 minLA) {
        uint projectTokenMultiplier = 10 ** ERC20Upgradeable(_lendingToken).decimals();
        maxLA = getMaxLiquidationAmount(_account, _projectToken, _lendingToken);
        minLA = Math.min(maxLA, minPartialLiquidationAmount * projectTokenMultiplier / getTokenPrice(_lendingToken, projectTokenMultiplier));
    }
}