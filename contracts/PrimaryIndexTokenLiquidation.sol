// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./openzeppelin/contracts/utils/math/Math.sol";
import "./interfaces/IPrimaryIndexToken.sol";

contract PrimaryIndexTokenLiquidation is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for ERC20Upgradeable;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    uint256 public constant LIQUIDATOR_REWARD_FACTOR_DECIMAL = 18;
    uint256 public minPartialLiquidationAmount;
    Ratio public targetHealthFactor;
    Ratio public liquidatorRewardCalcFactor;
    Ratio public maxLRF;

    IPrimaryIndexToken public primaryIndexToken;

    struct Ratio {
        uint8 numerator;
        uint8 denominator;
    }

    event Liquidate(address indexed liquidator, address indexed borrower, address lendingToken, address indexed prjAddress, uint256 amountPrjLiquidated);

    function initialize(address pit) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init_unchained();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        primaryIndexToken = IPrimaryIndexToken(pit);
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
        require(primaryIndexToken.projectTokenInfo(_projectToken).isListed, "PIT: project token is not listed");
        _;
    }

    modifier isLendingTokenListed(address _lendingToken) {
        require(primaryIndexToken.lendingTokenInfo(_lendingToken).isListed, "PIT: lending token is not listed");
        _;
    }

    modifier onlyRelatedContracts() {
        require(primaryIndexToken.getRelatedContract(msg.sender), "PIT: caller is not related Contract");
        _;
    }

    function setMinPartialLiquidationAmount(uint256 _amount) external onlyModerator() {
        minPartialLiquidationAmount = _amount;
    }

    function setMaxLRF(uint8 numeratorLRF, uint8 denominatorLRF) external onlyModerator() {
        maxLRF = Ratio(numeratorLRF, denominatorLRF);
    }

    function setLiquidatorRewardCalculationFactor(uint8 numeratorLRF, uint8 denominatorLRF) external onlyModerator() {
        liquidatorRewardCalcFactor = Ratio(numeratorLRF, denominatorLRF);
    }

    function setPrimaryIndexTokenAddress(address _newPrimaryIndexToken) external onlyModerator() {
        primaryIndexToken = IPrimaryIndexToken(_newPrimaryIndexToken);
    }

    function setTargetHealthFactor(uint8 numeratorHF, uint8 denominatorHF) external onlyModerator {
        targetHealthFactor = Ratio(numeratorHF, denominatorHF);
    }

    function getHf(address _account, address _projectToken, address _lendingToken) public view returns(uint256 healthFactorNumerator, uint256 healthFactorDenominator) {
        (healthFactorNumerator, healthFactorDenominator) = primaryIndexToken.healthFactor(_account, _projectToken, _lendingToken);
    }

    function getCurrentHealthFactor(address _account, address _projectToken, address _lendingToken) public view returns(uint256 healthFactorNumerator, uint256 healthFactorDenominator) {
        ( , , , healthFactorNumerator, healthFactorDenominator) = primaryIndexToken.getPosition(_account, _projectToken, _lendingToken);
    }

    function getTokenPrice(address token, uint amount) public view returns(uint price) {
        price = primaryIndexToken.getTokenEvaluation(token, amount);

    }

    function liquidate(address _account, address _projectToken, address _lendingToken, uint256 _lendingTokenAmount) public isProjectTokenListed(_projectToken) isLendingTokenListed(_lendingToken) nonReentrant {
        _liquidate(_account, _projectToken, _lendingToken, _lendingTokenAmount, msg.sender);
    }

    function liquidateFromModerator(address _account, address _projectToken, address _lendingToken, uint256 _lendingTokenAmount, address liquidator) public isProjectTokenListed(_projectToken) isLendingTokenListed(_lendingToken) onlyRelatedContracts() nonReentrant returns(uint256) {
        return _liquidate(_account, _projectToken, _lendingToken, _lendingTokenAmount, liquidator);
         
    }

    function _liquidate(address _account, address _projectToken, address _lendingToken, uint256 _lendingTokenAmount, address liquidator) internal isProjectTokenListed(_projectToken) isLendingTokenListed(_lendingToken) returns(uint256) {
        // under normal conditions: liquidator == msg.sender
        uint minLA = getMinLiquidatorRewardAmount(_account, _projectToken, _lendingToken);
        uint maxLA = getMaxLiquidatorRewardAmount(_account, _projectToken, _lendingToken);
        require(_lendingTokenAmount >= minLA && _lendingTokenAmount <= maxLA, "PIT: invalid amount");
        (uint256 healthFactorNumerator, uint256 healthFactorDenominator) = getCurrentHealthFactor(_account, _projectToken, _lendingToken);
        if (healthFactorDenominator != 0 ) {
            require(healthFactorNumerator < healthFactorDenominator, "PIT: healthFactor>=1");
        }
        
        uint256 projectTokenToSendToLiquidator = _getProjectTokenToSendToLiquidator(_account, _projectToken, _lendingToken, _lendingTokenAmount, liquidator);

        uint256 projectTokenLiquidatorReceived = _distributeReward(_account, _projectToken, projectTokenToSendToLiquidator, liquidator);

        emit Liquidate(liquidator, _account, _lendingToken, _projectToken, projectTokenToSendToLiquidator);
        return projectTokenLiquidatorReceived;
    }

    function _getProjectTokenToSendToLiquidator(address _account, address _projectToken, address _lendingToken, uint256 _lendingTokenAmount, address liquidator) internal returns(uint256 projectTokenToSendToLiquidator) {
        uint256 projectTokenMultiplier = 10 ** ERC20Upgradeable(_projectToken).decimals();
        (uint256 lrfNumerator, uint256 lrfDenominator) = liquidatorRewardFactor(_account, _projectToken, _lendingToken);
        uint256 repaid = primaryIndexToken.repayFromRelatedContract(_projectToken, _lendingToken, _lendingTokenAmount, liquidator, _account);
        uint256 projectTokenEvaluation = getTokenPrice(_lendingToken, repaid) * projectTokenMultiplier / getTokenPrice(_projectToken, projectTokenMultiplier);

        projectTokenToSendToLiquidator = projectTokenEvaluation * lrfNumerator / lrfDenominator;
    }

    function _distributeReward(address _account, address _projectToken, uint256 projectTokenToSendToLiquidator, address liquidator) internal returns(uint256){
        uint256 depositedProjectTokenAmount = primaryIndexToken.getDepositedAmount(_projectToken, _account);
        if(projectTokenToSendToLiquidator > depositedProjectTokenAmount){
            projectTokenToSendToLiquidator = depositedProjectTokenAmount;
        }
        return primaryIndexToken.calcAndTransferDepositPosition(_projectToken, projectTokenToSendToLiquidator, _account, liquidator);
    }

    function liquidatorRewardFactor(address _account, address _projectToken, address _lendingToken) public view returns(uint256 lrfNumerator, uint256 lrfDenominator) {
        ( , , , uint256 hfNumerator, uint256 hfDenominator) = primaryIndexToken.getPosition(_account, _projectToken, _lendingToken);
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

    // MaxLA = (LVR * CVc - THF * LVc) / (LRF * LVR - THF)
    function getMaxLiquidatorRewardAmount(address _account, address _projectToken, address _lendingToken) public view returns (uint256 maxLA) {
        (uint256 lrfNumerator, uint256 lrfDenominator) = liquidatorRewardFactor(_account, _projectToken, _lendingToken);
        Ratio memory targetHf = targetHealthFactor;
        MaxLAParams memory maxLAParams;

        (uint256 depositedProjectTokenAmount, uint256 loanBody, uint256 accrual, , ) = primaryIndexToken.getPosition(_account, _projectToken, _lendingToken);
        uint256 totalOutstandingInUSD = getTokenPrice(_lendingToken, loanBody + accrual);
        uint256 depositedProjectTokenAmountInUSD = getTokenPrice(_projectToken, depositedProjectTokenAmount);

        if (lrfNumerator == 0 && depositedProjectTokenAmount == 0) return loanBody + accrual;

        uint256 lvrNumerator = primaryIndexToken.projectTokenInfo(_projectToken).loanToValueRatio.numerator;
        uint256 lvrDenominator = primaryIndexToken.projectTokenInfo(_projectToken).loanToValueRatio.denominator;

        maxLAParams.numeratorMaxLA = _checkNegativeNumber(lvrNumerator * depositedProjectTokenAmountInUSD * targetHf.denominator, lvrDenominator * targetHf.numerator * totalOutstandingInUSD) * lrfDenominator;
        maxLAParams.denominatorMaxLA = _checkNegativeNumber(lrfNumerator * lvrNumerator * targetHf.denominator, targetHf.numerator * lvrDenominator * lrfDenominator);
        maxLAParams.calculatedMaxLA = maxLAParams.denominatorMaxLA > 0 && maxLAParams.numeratorMaxLA > 0 ? maxLAParams.numeratorMaxLA * 10 ** LIQUIDATOR_REWARD_FACTOR_DECIMAL / maxLAParams.denominatorMaxLA : 0;
        
        uint totalOutstandingInUSDMul = totalOutstandingInUSD * 10 ** LIQUIDATOR_REWARD_FACTOR_DECIMAL;
        
        maxLAParams.maxLACompare = maxLAParams.calculatedMaxLA > totalOutstandingInUSDMul ? totalOutstandingInUSD : maxLAParams.calculatedMaxLA / 10 ** LIQUIDATOR_REWARD_FACTOR_DECIMAL;
        
        uint projectTokenMultiplier = 10 ** ERC20Upgradeable(_lendingToken).decimals();
        maxLA = maxLAParams.maxLACompare * projectTokenMultiplier / getTokenPrice(_lendingToken, projectTokenMultiplier);
    }

    function _checkNegativeNumber(uint firstNumber, uint secondNumber) internal pure returns (uint256 result) {
        result = secondNumber > firstNumber ? secondNumber - firstNumber : firstNumber - secondNumber;
    }

    //MinLA = min(MaxLA, MPA)
    function getMinLiquidatorRewardAmount(address _account, address _projectToken, address _lendingToken) public view returns (uint256) {
        uint projectTokenMultiplier = 10 ** ERC20Upgradeable(_lendingToken).decimals();
        uint256 maxLrf = getMaxLiquidatorRewardAmount(_account, _projectToken, _lendingToken);
        return Math.min(maxLrf, minPartialLiquidationAmount * projectTokenMultiplier / getTokenPrice(_lendingToken, projectTokenMultiplier));
    }
}