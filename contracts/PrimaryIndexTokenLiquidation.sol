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

    IPrimaryIndexToken public primaryIndexToken;

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

    function setPrimaryIndexTokenAddress(address _newPrimaryIndexToken) external onlyModerator() {
        primaryIndexToken = IPrimaryIndexToken(_newPrimaryIndexToken);
    }

    function liquidate(address _account, address _projectToken, address _lendingToken, bool _isPartial, uint256 _lendingTokenAmount) public isProjectTokenListed(_projectToken) isLendingTokenListed(_lendingToken) {
        primaryIndexToken.updateInterestInBorrowPositions(_account, _lendingToken);
        (uint256 healthFactorNumerator, uint256 healthFactorDenominator) = primaryIndexToken.healthFactor(_account, _projectToken, _lendingToken);
        if(healthFactorNumerator >= healthFactorDenominator){
            revert("PIT: healthFactor>=1");
        }
        uint256 projectTokenMultiplier = 10 ** ERC20Upgradeable(_projectToken).decimals();
        uint256 lendingTokenAmountToRepay = _isPartial ? _lendingTokenAmount : type(uint256).max;
        uint256 repaid = primaryIndexToken.repay(_projectToken, _lendingToken, lendingTokenAmountToRepay, msg.sender, _account);
        uint256 projectTokenEvaluation = repaid * projectTokenMultiplier / primaryIndexToken.getTokenEvaluation(_projectToken, projectTokenMultiplier);
        (uint256 lrfNumerator, uint256 lrfDenominator) = getLiquidatorRewardFactor(_account, _projectToken, _lendingToken, _isPartial);
        uint256 projectTokenToSendToLiquidator = projectTokenEvaluation * lrfNumerator / lrfDenominator;
        
        uint256 depositedProjectTokenAmount = primaryIndexToken.getDepositedAmount(_projectToken, _account);
        if(projectTokenToSendToLiquidator > depositedProjectTokenAmount){
            projectTokenToSendToLiquidator = depositedProjectTokenAmount;
        }
        uint256 totalDepositedProjectToken = primaryIndexToken.totalDepositedProjectToken(_projectToken);
        primaryIndexToken.setDepositedPosition(_account, _projectToken, depositedProjectTokenAmount - projectTokenToSendToLiquidator);
        primaryIndexToken.setTotalDepositedProjectToken(_projectToken, totalDepositedProjectToken - projectTokenToSendToLiquidator);
        primaryIndexToken.distributeReward(msg.sender, _projectToken, projectTokenToSendToLiquidator);

        emit Liquidate(msg.sender, _account, _lendingToken, _projectToken, projectTokenToSendToLiquidator);
    }

    function getLiquidatorRewardFactor(address _account, address _projectToken, address _lendingToken, bool _isPartial) public view returns (uint256 numerator, uint256 denominator) {
        if (_isPartial) {
            // handle getLiquidatorRewardFactor for partial liquidation
            numerator = primaryIndexToken.projectTokenInfo(_projectToken).liquidationIncentive.numerator;
            denominator = primaryIndexToken.projectTokenInfo(_projectToken).liquidationIncentive.denominator;
        } else {
            numerator = primaryIndexToken.projectTokenInfo(_projectToken).liquidationIncentive.numerator;
            denominator = primaryIndexToken.projectTokenInfo(_projectToken).liquidationIncentive.denominator;
        }
    }

    // MaxLA = (LVR * CVc - THF * LVc) / (LRF * LVR - THF)
    function getMaxLiquidatorRewardFactor(address _account, address _projectToken, address _lendingToken, uint256 _numeratorTargetHealthFactor, uint256 _denominatorTargetHealthFactor) public view returns (uint256) {
        (uint256 lrfNumerator, uint256 lrfDenominator) = getLiquidatorRewardFactor(_account, _projectToken, _lendingToken, true);
        uint256 lvrNumerator = primaryIndexToken.projectTokenInfo(_projectToken).liquidationIncentive.numerator;
        uint256 lvrDenominator = primaryIndexToken.projectTokenInfo(_projectToken).liquidationIncentive.denominator;
        uint256 totalOutstandingInUSD = primaryIndexToken.totalOutstandingInUSD(_account, _projectToken, _lendingToken);
        uint256 depositedProjectTokenAmount = primaryIndexToken.getDepositedAmount(_projectToken, _account);
        uint256 depositedProjectTokenAmountInUSD = primaryIndexToken.getTokenEvaluation(_projectToken, depositedProjectTokenAmount);
        
        uint256 numeratorMaxLA = (lvrNumerator * depositedProjectTokenAmountInUSD * _denominatorTargetHealthFactor - lvrDenominator * _numeratorTargetHealthFactor * totalOutstandingInUSD) * lrfDenominator;
        uint256 denominatorMaxLA = lrfNumerator * lvrNumerator * _denominatorTargetHealthFactor - _numeratorTargetHealthFactor * lvrDenominator * lrfDenominator;
        return numeratorMaxLA * 10 ** LIQUIDATOR_REWARD_FACTOR_DECIMAL / denominatorMaxLA;
    }

    function getMinLiquidatorRewardFactor(address _account, address _projectToken, address _lendingToken, uint256 _numeratorTargetHealthFactor, uint256 _denominatorTargetHealthFactor) public view returns (uint256) {
        uint256 maxLrf = getMaxLiquidatorRewardFactor(_account, _projectToken, _lendingToken, _numeratorTargetHealthFactor, _denominatorTargetHealthFactor);
        return Math.min(maxLrf, minPartialLiquidationAmount * 10 ** LIQUIDATOR_REWARD_FACTOR_DECIMAL);
    }
}
