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

    event SetAugustusParaswap(address indexed augustusParaswap, address indexed augustusRegistry);

    /** 
     * @dev Sets up initial roles, initializes AccessControl, and sets the provided PIT address,
     * Augustus Paraswap and Augustus Paraswap registry address. 
     * @param pit The address of the PrimaryIndexToken contract. 
     * @param augustusParaswap_ The new address of the Augustus Paraswap contract.
     * @param AUGUSTUS_REGISTRY_ The new address of the Augustus Paraswap registry.
     */ 
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

    /**
     * @dev Sets the primary index token to a new value.
     * @param pit The new primary index token address.
     */
    function setPrimaryIndexToken(address pit) public onlyModerator() {
        require(pit != address(0), "AtomicRepayment: invalid address");
        address oldPit = address(primaryIndexToken);
        primaryIndexToken = IPrimaryIndexToken(pit);
        emit SetPrimaryIndexToken(oldPit, pit);
    }

    /**
     * @dev Sets the address of the Augustus Paraswap contract and its registry.
     * @param augustusParaswap_ The new address of the Augustus Paraswap contract.
     * @param AUGUSTUS_REGISTRY_ The new address of the Augustus Paraswap registry.
     */
    function setAugustusParaswap(address augustusParaswap_, address AUGUSTUS_REGISTRY_) public onlyModerator(){
        require(augustusParaswap_ != address(0) && AUGUSTUS_REGISTRY_ !=address(0), "AtomicRepayment: invalid address");
        augustusParaswap = augustusParaswap_;
        AUGUSTUS_REGISTRY = AUGUSTUS_REGISTRY_;
        emit SetAugustusParaswap(augustusParaswap_, AUGUSTUS_REGISTRY_);
    }

    /**
     * @dev Computes the outstanding amount (i.e., loanBody + accrual) for a given user, project token, and lending token.
     * @param user The user for which to compute the outstanding amount.
     * @param projectToken The project token for which to compute the outstanding amount.
     * @param lendingAsset The lending token for which to compute the outstanding amount.
     * @return outstanding The outstanding amount for the user, project token, and lending token.
     */
    function getTotalOutstanding(address user, address projectToken, address lendingAsset) public view returns(uint outstanding) {
        (, uint256 loanBody, uint256 accrual, , ) = primaryIndexToken.getPosition(user, projectToken, lendingAsset);
        outstanding = loanBody + accrual;       
    }

    /**
     * @dev Computes the deposited remaining amount of PIT that a user has after taking into account their outstanding loan amount.
     * @param account The user for which to compute the remaining PIT amount.
     * @param projectToken The project token for which to compute the remaining PIT amount.
     * @param lendingToken The lending token for which to compute the remaining PIT amount.
     * @return depositedRemaining The deposited remaining amount for the user.
     */
    function getCurrentDepositedRemaining(address account, address projectToken, address lendingToken) public view returns (uint256 depositedRemaining) {
        uint depositedAmount = primaryIndexToken.getTokenEvaluation(projectToken, primaryIndexToken.getDepositedAmount(projectToken, account));
        uint outstandingInUSD = primaryIndexToken.getTokenEvaluation(lendingToken, getTotalOutstanding(account, projectToken, lendingToken));
        depositedRemaining = depositedAmount > outstandingInUSD ? depositedAmount - outstandingInUSD : 0;
    }

    /**
     * @dev Computes the lending token for a given user and project token.
     * @param user The user for which to compute the lending token.
     * @param projectToken The project token for which to compute the lending token.
     * @return actualLendingToken The lending token for the user and project token.
     */
    function getLendingToken(address user, address projectToken) public view returns(address actualLendingToken) {
        actualLendingToken = primaryIndexToken.getLendingToken(user, projectToken);
    }

    /**
     * @dev Computes the remaining deposit that a user can withdraw for a given project token.
     * @param user The user for which to compute the remaining deposit.
     * @param projectToken The project token for which to compute the remaining deposit.
     * @return remainingDeposit The remaining deposit that the user can withdraw.
     */
    function getRemainingDeposit(address user, address projectToken) public view returns(uint remainingDeposit) {
        uint256 depositedProjectTokenAmount = primaryIndexToken.getDepositedAmount(projectToken, user);
        address lendingToken = getLendingToken(user, projectToken);
        if(lendingToken == address(0)) {
            remainingDeposit = depositedProjectTokenAmount;
        } else {
            uint depositRemaining = getCurrentDepositedRemaining(user, projectToken, lendingToken);

            uint8 projectTokenDecimals = ERC20Upgradeable(projectToken).decimals();

            uint256 collateralRemaining = depositRemaining * (10 ** projectTokenDecimals) / primaryIndexToken.getTokenEvaluation(projectToken, 10 ** projectTokenDecimals);
            
            remainingDeposit = depositedProjectTokenAmount >= collateralRemaining ? collateralRemaining : 0;
        }
   }

   /**
     * @dev Computes the available lending token amount that a user can repay for a given project token.
     * @param user The user for which to compute the available lending token amount.
     * @param projectToken The project token for which to compute the available lending token amount.
     * @param lendingToken The lending token for which to compute the available lending token amount.
     * @return availableLendingAmount The available lending token amount that the user can repay.
     */
    function getAvailableRepaidAmount(address user, address projectToken, address lendingToken) public view returns(uint256 availableLendingAmount) {
        uint256 remainingDeposit = getRemainingDeposit(user, projectToken);
        // convert remainingDeposit to lending token
        uint256 lendingTokenMultiplier = 10 ** ERC20Upgradeable(lendingToken).decimals();
        availableLendingAmount = primaryIndexToken.getTokenEvaluation(projectToken, remainingDeposit) * lendingTokenMultiplier / primaryIndexToken.getTokenEvaluation(lendingToken, lendingTokenMultiplier);
   }

    /**
      * @dev Computes the repay using collateral data for a given user, project token, and lending token.
      * @param user The user address
      * @param projectToken The project token address
      * @param lendingToken The lending token address
      * @return remainingDeposit The remaining deposit that the user can use as collateral.
      * @return availableLendingAmount The available lending token amount that the user can repay.
      * @return totalOutStanding The total outstanding amount for the user, project token, and lending token.
      */
    function getRepayUsingCollateralData(address user, address projectToken, address lendingToken) public view returns(uint256 remainingDeposit, uint256 availableLendingAmount, uint256 totalOutStanding) {
        remainingDeposit = getRemainingDeposit(user, projectToken);
        availableLendingAmount = getAvailableRepaidAmount(user, projectToken, lendingToken);
        totalOutStanding = getTotalOutstanding(user, projectToken, lendingToken);
    }

    /**
     * @dev Repays a loan atomically using the given project token as collateral.
     * @param prjToken The project token to use as collateral.
     * @param collateralAmount The amount of collateral to use.
     * @param buyCalldata The calldata for the swap operation.
     * @param isRepayFully A boolean indicating whether the loan should be repaid fully or partially.
     */
    function repayAtomic(address prjToken, uint collateralAmount, bytes memory buyCalldata, bool isRepayFully) public nonReentrant{
        require(IParaSwapAugustusRegistry(AUGUSTUS_REGISTRY).isValidAugustus(augustusParaswap), "AtomicRepayment: INVALID_AUGUSTUS");
        require(collateralAmount > 0, "AtomicRepayment: collateralAmount must be greater than 0");
        address lendingToken = getLendingToken(msg.sender, prjToken);
        uint remainingDeposit = getRemainingDeposit(msg.sender, prjToken);
        if (collateralAmount > remainingDeposit) {
            collateralAmount = remainingDeposit;
        }
        primaryIndexToken.calcAndTransferDepositPosition(prjToken, collateralAmount, msg.sender, address(this));
        address tokenTransferProxy = IParaSwapAugustus(augustusParaswap).getTokenTransferProxy();
        uint totalOutStanding = getTotalOutstanding(msg.sender, prjToken, lendingToken);
        if(ERC20Upgradeable(prjToken).allowance(address(this), tokenTransferProxy) <= collateralAmount) {
            ERC20Upgradeable(prjToken).approve(tokenTransferProxy, type(uint256).max);
        }
        (uint amountSold, uint amountReceive) = _buyOnParaSwap(prjToken, lendingToken, augustusParaswap, buyCalldata);
        if (isRepayFully) require(amountReceive >= totalOutStanding, "AtomicRepayment: amount receive not enough to repay fully");

        //deposit collateral back in the pool, if left after the swap(buy)
        if (collateralAmount > amountSold) {
            uint256 collateralBalanceLeft = collateralAmount - amountSold;
            ERC20Upgradeable(prjToken).approve(address(primaryIndexToken), collateralBalanceLeft);
            primaryIndexToken.depositFromRelatedContracts(prjToken, collateralBalanceLeft, address(this), msg.sender);
        }

        address bLendingToken = primaryIndexToken.lendingTokenInfo(lendingToken).bLendingToken;
        ERC20Upgradeable(lendingToken).approve(bLendingToken, amountReceive);

        primaryIndexToken.repayFromRelatedContract(prjToken, lendingToken, amountReceive, address(this), msg.sender);
        
        uint256 afterLendingBalance = ERC20Upgradeable(lendingToken).balanceOf(address(this));
        if (afterLendingBalance > 0) {
            ERC20Upgradeable(lendingToken).transfer(msg.sender, afterLendingBalance);
        }

        emit AtomicRepayment(msg.sender, prjToken, lendingToken, amountSold, amountReceive);
    }
    /**
     * @dev Buys tokens on ParaSwap using the given project token and lending token.
     * @param tokenFrom The token to sell on ParaSwap.
     * @param tokenTo The token to buy on ParaSwap.
     * @param _target The address of the Augustus Paraswap contract.
     * @param buyCalldata The calldata for the buy operation.
     * @return amountSold The amount of tokens sold on ParaSwap.
     * @return amountReceive The amount of tokens received from ParaSwap.
     */
    function _buyOnParaSwap(address tokenFrom, address tokenTo, address _target, bytes memory buyCalldata) public returns (uint amountSold, uint amountReceive) {
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
        amountReceive = afterBalanceTo - beforeBalanceTo;
    }

}