// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "./openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "./openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "./openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

import "./openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./interfaces/IPrimaryIndexToken.sol";
import "./AtomicRepayment/paraswap/interfaces/IParaSwapAugustus.sol";
import "./AtomicRepayment/paraswap/interfaces/IParaSwapAugustusRegistry.sol";

contract PrimaryIndexTokenAtomicRepayment is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for ERC20Upgradeable;
    IPrimaryIndexToken public primaryIndexToken;
    address public augustusParaswap;
    address public AUGUSTUS_REGISTRY;

    event SetPrimaryIndexToken(address indexed oldPrimaryIndexToken, address indexed newPrimaryIndexToken);
    event AtomicRepayment(address indexed user, address collateral, address lendingAsset, uint amountSold, uint amountRecive);

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    function initialize(address pit, address augustusParaswap_, address AUGUSTUS_REGISTRY_) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init_unchained();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        primaryIndexToken = IPrimaryIndexToken(pit);
        augustusParaswap = augustusParaswap_;
        AUGUSTUS_REGISTRY = AUGUSTUS_REGISTRY_;
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "AtomicRepayment: Caller is not the Admin");
        _;
    }

    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "AtomicRepayment: Caller is not the Moderator");
        _;
    }

    modifier isProjectTokenListed(address projectToken) {
        require(primaryIndexToken.projectTokenInfo(projectToken).isListed, "AtomicRepayment: project token is not listed");
        _;
    }

    function setPrimaryIndexToken(address pit) public onlyModerator() {
        require(pit != address(0), "AtomicRepayment: invalid address");
        address oldPit = address(primaryIndexToken);
        primaryIndexToken = IPrimaryIndexToken(pit);
        emit SetPrimaryIndexToken(oldPit, pit);
    }

    function setAugustusParaswap(address augustusParaswap_, address AUGUSTUS_REGISTRY_) public onlyModerator(){
        augustusParaswap = augustusParaswap_;
        AUGUSTUS_REGISTRY = AUGUSTUS_REGISTRY_;
    }

    function getTotalOutstanding(address user, address projectToken, address lendingAsset) public view returns(uint outstanding) {
        (, uint256 loanBody, uint256 accrual, , ) = primaryIndexToken.getPosition(user, projectToken, lendingAsset);
        outstanding = loanBody + accrual;       
    }

    function getCurrentPitRemaining(address account, address projectToken, address lendingToken) public view returns (uint256 pitRemaining) {
        uint pit = primaryIndexToken.pit(account, projectToken);
        uint outstandingInUSD = primaryIndexToken.getTokenEvaluation(lendingToken, getTotalOutstanding(account, projectToken, lendingToken));
        pitRemaining = pit > outstandingInUSD ? pit - outstandingInUSD : 0;
    }

    function getLendingToken(address user, address projectToken) public view returns(address actualLendingToken) {
        actualLendingToken = primaryIndexToken.getLendingToken(user, projectToken);
    }

    function getRemainingDeposit(address user, address projectToken) public view returns(uint remainingDeposit) {
        uint256 depositedProjectTokenAmount = primaryIndexToken.getDepositedAmount(projectToken, user);
        address lendingToken = getLendingToken(user, projectToken);
        if(lendingToken == address(0)) {
            remainingDeposit = depositedProjectTokenAmount;
        } else {
            uint depositRemaining = getCurrentPitRemaining(user, projectToken, lendingToken);

            uint8 projectTokenDecimals = ERC20Upgradeable(projectToken).decimals();

            IPrimaryIndexToken.Ratio memory lvr = primaryIndexToken.projectTokenInfo(projectToken).loanToValueRatio;
            
            uint256 collateralRemaining = depositRemaining * lvr.denominator * (10 ** projectTokenDecimals) / primaryIndexToken.getTokenEvaluation(projectToken, 10 ** projectTokenDecimals) / lvr.numerator;
            
            remainingDeposit = depositedProjectTokenAmount >= collateralRemaining ? collateralRemaining : 0;
        }
   }

    function repayAtomic(address prjToken, uint collateralAmount, bytes memory buyCalldata) public nonReentrant{
        require(IParaSwapAugustusRegistry(AUGUSTUS_REGISTRY).isValidAugustus(augustusParaswap), "AtomicRepayment: INVALID_AUGUSTUS");
        address lendingToken = getLendingToken(msg.sender, prjToken);
        uint remainingDeposit = getRemainingDeposit(msg.sender, prjToken);
        require(collateralAmount <= remainingDeposit, "AtomicRepayment: invalid amount");
        primaryIndexToken.calcAndTransferDepositPosition(prjToken, collateralAmount, msg.sender, address(this));
        address tokenTransferProxy = IParaSwapAugustus(augustusParaswap).getTokenTransferProxy();
        uint totalOutStanding = getTotalOutstanding(msg.sender, prjToken, lendingToken);
        if(ERC20Upgradeable(prjToken).allowance(address(this), tokenTransferProxy) <= collateralAmount) {
            ERC20Upgradeable(prjToken).approve(tokenTransferProxy, type(uint256).max);
        }
        (uint amountSold, uint amountRecive) = _buyOnParaSwap(prjToken, lendingToken, augustusParaswap, buyCalldata);
        require(amountRecive <= totalOutStanding, "AtomicRepayment: invalid amountRecive");
        //deposit collateral back in the pool, if left after the swap(buy)

        uint256 collateralBalanceLeft = collateralAmount - amountSold;
        if (collateralBalanceLeft > 0) {
            ERC20Upgradeable(prjToken).approve(address(primaryIndexToken), collateralBalanceLeft);
            primaryIndexToken.depositFromRelatedContracts(prjToken, collateralBalanceLeft, address(this), msg.sender);
        }

        address bLendingToken = primaryIndexToken.lendingTokenInfo(lendingToken).bLendingToken;
        ERC20Upgradeable(lendingToken).approve(bLendingToken, amountRecive);
        primaryIndexToken.repayFromRelatedContract(prjToken, lendingToken, amountRecive, address(this), msg.sender);
        emit AtomicRepayment(msg.sender, prjToken, lendingToken, amountSold, amountRecive);
    }

    function _buyOnParaSwap(address tokenFrom, address tokenTo, address _target, bytes memory buyCalldata) public returns (uint amountSold, uint amountRecive) {
        uint beforeBalanceFrom = ERC20Upgradeable(tokenFrom).balanceOf(address(this));
        uint beforeBalanceTo = ERC20Upgradeable(tokenTo).balanceOf(address(this));
        // solium-disable-next-line security/no-call-value
        (bool success,) = _target.call(buyCalldata);
        if (!success) {
        // Copy revert reason from call
        assembly {
            returndatacopy(0, 0, returndatasize())
            revert(0, returndatasize())
            }
        }
        uint afterBalanceFrom = ERC20Upgradeable(tokenFrom).balanceOf(address(this));
        uint afterBalanceTo = ERC20Upgradeable(tokenTo).balanceOf(address(this));
        amountSold = beforeBalanceFrom - afterBalanceFrom;
        amountRecive = afterBalanceTo - beforeBalanceTo;
    }

}