// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
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

    function initialize() public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init_unchained();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
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

    function liquidate(address _account, address _projectToken, address _lendingToken, uint256 _lendingTokenAmount) public isProjectTokenListed(_projectToken) isLendingTokenListed(_lendingToken) {
        uint minLA = getMinLiquidatorRewardAmount(_account, _projectToken, _lendingToken);
        uint maxLA = getMaxLiquidatorRewardAmount(_account, _projectToken, _lendingToken);
        uint lendingTokenAmountMul = _lendingTokenAmount * 10 ** LIQUIDATOR_REWARD_FACTOR_DECIMAL;
        require(lendingTokenAmountMul >= minLA && lendingTokenAmountMul <= maxLA, "PIT: invalid amount");
        
        primaryIndexToken.updateInterestInBorrowPositions(_account, _lendingToken);

        uint256 projectTokenToSendToLiquidator = getProjectTokenToSendToLiquidator(_account, _projectToken, _lendingToken,_lendingTokenAmount);

        distributeReward(_account, _projectToken, _lendingToken, projectTokenToSendToLiquidator);

        emit Liquidate(msg.sender, _account, _lendingToken, _projectToken, projectTokenToSendToLiquidator);
    }

    function getProjectTokenToSendToLiquidator(address _account, address _projectToken, address _lendingToken, uint256 _lendingTokenAmount) internal returns(uint256 projectTokenToSendToLiquidator) {
        (uint256 healthFactorNumerator, uint256 healthFactorDenominator) = primaryIndexToken.healthFactor(_account, _projectToken, _lendingToken);
        if(healthFactorNumerator >= healthFactorDenominator){
            revert("PIT: healthFactor>=1");
        }
        uint256 projectTokenMultiplier = 10 ** ERC20Upgradeable(_projectToken).decimals();
        uint256 repaid = primaryIndexToken.repay(_projectToken, _lendingToken, _lendingTokenAmount, msg.sender, _account);
        uint256 projectTokenEvaluation = repaid * projectTokenMultiplier / primaryIndexToken.getProjectTokenEvaluation(_projectToken, projectTokenMultiplier);

        (uint256 lrfNumerator, uint256 lrfDenominator) = liquidatorRewardFactor(_account, _projectToken, _lendingToken);
        projectTokenToSendToLiquidator = projectTokenEvaluation * lrfNumerator / lrfDenominator;
    }

    function distributeReward(address _account, address _projectToken, address _lendingToken, uint256 projectTokenToSendToLiquidator) internal {
        uint256 depositedProjectTokenAmount = primaryIndexToken.getDepositedAmount(_projectToken, _account);
        if(projectTokenToSendToLiquidator > depositedProjectTokenAmount){
            projectTokenToSendToLiquidator = depositedProjectTokenAmount;
        }
        primaryIndexToken.calculatePositionWhenLiquidate(_account, _projectToken, _lendingToken, projectTokenToSendToLiquidator, msg.sender);
    }

    function liquidatorRewardFactor(address _account, address _projectToken, address _lendingToken) public view returns(uint256 lrfNumerator, uint256 lrfDenominator) {
        (uint256 hfNumerator, uint256 hfDenominator) = primaryIndexToken.healthFactor(_account, _projectToken, _lendingToken);
        Ratio memory kf = liquidatorRewardCalcFactor;
        lrfNumerator = kf.numerator * (hfDenominator - hfNumerator) + kf.denominator * hfDenominator;
        lrfDenominator = kf.denominator * hfDenominator;
        uint lrfNumeratorMul = lrfNumerator * maxLRF.denominator;
        uint maxLRFNumerator = maxLRF.numerator * lrfDenominator;
        if(lrfNumeratorMul > maxLRFNumerator){
            (lrfNumerator, lrfDenominator) = (maxLRF.numerator, maxLRF.denominator);
        }  
    }

    // MaxLA = (LVR * CVc - THF * LVc) / (LRF * LVR - THF)
    function getMaxLiquidatorRewardAmount(address _account, address _projectToken, address _lendingToken) public view returns (uint256 maxLA) {
        (uint256 lrfNumerator, uint256 lrfDenominator) = liquidatorRewardFactor(_account, _projectToken, _lendingToken);
        Ratio memory targetHf = targetHealthFactor;

        uint256 lvrNumerator = primaryIndexToken.projectTokenInfo(_projectToken).loanToValueRatio.numerator;
        uint256 lvrDenominator = primaryIndexToken.projectTokenInfo(_projectToken).loanToValueRatio.denominator;

        uint256 totalOutstanding = primaryIndexToken.totalOutstanding(_account, _projectToken, _lendingToken);
        uint256 totalOutstandingInUSD = primaryIndexToken.getProjectTokenEvaluation(_lendingToken, totalOutstanding);

        uint256 depositedProjectTokenAmount = primaryIndexToken.getDepositedAmount(_projectToken, _account);
        uint256 depositedProjectTokenAmountInUSD = primaryIndexToken.getProjectTokenEvaluation(_projectToken, depositedProjectTokenAmount);



        uint256 numeratorMaxLA = checkNegativeNumber(lvrNumerator * depositedProjectTokenAmountInUSD * targetHf.denominator, lvrDenominator * targetHf.numerator * totalOutstandingInUSD) * lrfDenominator;
        uint256 denominatorMaxLA = checkNegativeNumber(lrfNumerator * lvrNumerator * targetHf.denominator, targetHf.numerator * lvrDenominator * lrfDenominator);
        uint256 calculatedMaxLA = numeratorMaxLA * 10 ** LIQUIDATOR_REWARD_FACTOR_DECIMAL / denominatorMaxLA;
        
        uint totalOutstandingInUSDMul = totalOutstandingInUSD * 10 ** LIQUIDATOR_REWARD_FACTOR_DECIMAL;
        
        maxLA = calculatedMaxLA > totalOutstandingInUSDMul ? totalOutstandingInUSDMul : calculatedMaxLA;
    }

    function checkNegativeNumber(uint firstNumber, uint secondNumber) internal pure returns (uint256 result) {
        result = secondNumber > firstNumber ? secondNumber - firstNumber : firstNumber - secondNumber;
    }

    //MinLA = min(MaxLA, MPA)
    function getMinLiquidatorRewardAmount(address _account, address _projectToken, address _lendingToken) public view returns (uint256) {
        uint256 maxLrf = getMaxLiquidatorRewardAmount(_account, _projectToken, _lendingToken);
        return Math.min(maxLrf, minPartialLiquidationAmount * 10 ** LIQUIDATOR_REWARD_FACTOR_DECIMAL);
    }


}
