// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "../openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "../openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "../openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

import "../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../interfaces/V3/IPrimaryIndexTokenV3.sol";
import "../AtomicRepayment/paraswap/interfaces/IParaSwapAugustus.sol";
import "../AtomicRepayment/paraswap/interfaces/IParaSwapAugustusRegistry.sol";

contract PrimaryIndexTokenAtomicRepaymentV3 is
	Initializable,
	AccessControlUpgradeable,
	ReentrancyGuardUpgradeable
{
	using SafeERC20Upgradeable for ERC20Upgradeable;
	IPrimaryIndexTokenV3 public primaryIndexToken;
	address public augustusParaswap;
	address public AUGUSTUS_REGISTRY;

	event SetPrimaryIndexToken(
		address indexed oldPrimaryIndexToken,
		address indexed newPrimaryIndexToken
	);
	event AtomicRepayment(
		address indexed user,
		address collateral,
		address lendingAsset,
		uint256 amountSold,
		uint256 amountReceive
	);

	bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

	event SetAugustusParaswap(address indexed augustusParaswap, address indexed augustusRegistry);

	/**
	 * @dev Sets up initial roles, initializes AccessControl, and sets the provided PIT address,
	 * Augustus Paraswap and Augustus Paraswap registry address.
	 * @param pit The address of the PrimaryIndexToken contract.
	 * @param augustusParaswap_ The new address of the Augustus Paraswap contract.
	 * @param AUGUSTUS_REGISTRY_ The new address of the Augustus Paraswap registry.
	 */
	function initialize(
		address pit,
		address augustusParaswap_,
		address AUGUSTUS_REGISTRY_
	) public initializer {
		__AccessControl_init();
		__ReentrancyGuard_init_unchained();
		_setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
		_setupRole(MODERATOR_ROLE, msg.sender);
		primaryIndexToken = IPrimaryIndexTokenV3(pit);
		augustusParaswap = augustusParaswap_;
		AUGUSTUS_REGISTRY = AUGUSTUS_REGISTRY_;
	}

	modifier onlyAdmin() {
		require(
			hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
			"AtomicRepayment: Caller is not the Admin"
		);
		_;
	}

	modifier onlyModerator() {
		require(
			hasRole(MODERATOR_ROLE, msg.sender),
			"AtomicRepayment: Caller is not the Moderator"
		);
		_;
	}

	modifier isProjectTokenListed(address projectToken) {
		require(
			primaryIndexToken.projectTokenInfo(projectToken).isListed,
			"AtomicRepayment: project token is not listed"
		);
		_;
	}

	// REVIEW
	/**
	 * @dev Sets the primary index token to a new value.
	 * @param pit The new primary index token address.
	 */
	function setPrimaryIndexToken(address pit) public onlyModerator {
		require(pit != address(0), "AtomicRepayment: invalid address");
		address oldPit = address(primaryIndexToken);
		primaryIndexToken = IPrimaryIndexTokenV3(pit);
		emit SetPrimaryIndexToken(oldPit, pit);
	}

	// REVIEW
	/**
	 * @dev Sets the address of the Augustus Paraswap contract and its registry.
	 * @param augustusParaswap_ The new address of the Augustus Paraswap contract.
	 * @param AUGUSTUS_REGISTRY_ The new address of the Augustus Paraswap registry.
	 */
	function setAugustusParaswap(
		address augustusParaswap_,
		address AUGUSTUS_REGISTRY_
	) public onlyModerator {
		require(
			augustusParaswap_ != address(0) && AUGUSTUS_REGISTRY_ != address(0),
			"AtomicRepayment: invalid address"
		);
		augustusParaswap = augustusParaswap_;
		AUGUSTUS_REGISTRY = AUGUSTUS_REGISTRY_;
		emit SetAugustusParaswap(augustusParaswap_, AUGUSTUS_REGISTRY_);
	}

	/**
	 * @dev Computes the outstanding amount (i.e., loanBody + accrual) for a given user and lending token.
	 * @param user The user for which to compute the outstanding amount.
	 * @param lendingToken The lending token for which to compute the outstanding amount.
	 * @return outstanding The outstanding amount for the user and lending token.
	 */
	function getTotalOutstanding(
		address user,
		address lendingToken
	) public view returns (uint256 outstanding) {
		(uint256 loanBody, uint256 accrual) = primaryIndexToken.getEstimatedOutstanding(
			user,
			lendingToken
		);
		outstanding = loanBody + accrual;
	}

	/**
	 * @dev Computes the deposited remaining amount of PIT that a user has after taking into account their outstanding loan amount.
	 * @param account The user for which to compute the remaining PIT amount.
	 * @return depositedRemaining The deposited remaining amount for the user.
	 */
	function getCurrentDepositedRemaining(
		address account
	) public view returns (uint256 depositedRemaining) {
		uint256 depositedAmount = primaryIndexToken.totalDepositedAmountInUSD(account);
		uint256 outstandingInUSD = primaryIndexToken.totalEstimatedOutstandingInUSD(account);
		depositedRemaining = depositedAmount > outstandingInUSD
			? depositedAmount - outstandingInUSD
			: 0;
	}

	/**
	 * @dev Computes the remaining deposit that a user can withdraw for a given project token.
	 * @param user The user for which to compute the remaining deposit.
	 * @param projectToken The project token for which to compute the remaining deposit.
	 * @return remainingDeposit The remaining deposit that the user can withdraw.
	 */
	function getRemainingDeposit(
		address user,
		address projectToken
	) public view returns (uint256 remainingDeposit) {
		uint256 depositedProjectTokenAmount = primaryIndexToken.depositedAmount(user, projectToken);
		uint256 depositedRemaining = getCurrentDepositedRemaining(user);
		uint256 projectTokenMultiplier = 10 ** ERC20Upgradeable(projectToken).decimals();
		uint256 collateralRemaining = (depositedRemaining * (projectTokenMultiplier)) /
			primaryIndexToken.getTokenEvaluation(projectToken, projectTokenMultiplier);
		remainingDeposit = depositedProjectTokenAmount >= collateralRemaining
			? collateralRemaining
			: depositedProjectTokenAmount;
	}

	/**
	 * @dev Computes the available lending token amount that a user can repay for a given project token.
	 * @param user The user for which to compute the available lending token amount.
	 * @param projectToken The project token for which to compute the available lending token amount.
	 * @param lendingToken The lending token for which to compute the available lending token amount.
	 * @return availableLendingAmount The available lending token amount that the user can repay.
	 */
	function getAvailableRepaidAmount(
		address user,
		address projectToken,
		address lendingToken
	) public view returns (uint256 availableLendingAmount) {
		uint256 remainingDeposit = getRemainingDeposit(user, projectToken);
		// convert remainingDeposit to lending token
		uint256 lendingTokenMultiplier = 10 ** ERC20Upgradeable(lendingToken).decimals();
		availableLendingAmount =
			(primaryIndexToken.getTokenEvaluation(projectToken, remainingDeposit) *
				lendingTokenMultiplier) /
			primaryIndexToken.getTokenEvaluation(lendingToken, lendingTokenMultiplier);
	}

	/**
	 * @dev Repays a loan atomically using the given project token as collateral.
	 * @param lendingToken The lending token to be repaid.
	 * @param prjToken The project token to use as collateral.
	 * @param collateralAmount The amount of collateral to use.
	 * @param buyCalldata The calldata for the swap operation.
	 * @param isRepayFully A boolean indicating whether the loan should be repaid fully or partially.
	 */
	function repayAtomic(
		address lendingToken,
		address prjToken,
		uint256 collateralAmount,
		bytes memory buyCalldata,
		bool isRepayFully
	) public nonReentrant {
		_repayAtomic(
			msg.sender,
			lendingToken,
			prjToken,
			collateralAmount,
			buyCalldata,
			isRepayFully
		);
	}

	function repayAtomicFromRelatedContract(
		address user,
		address lendingToken,
		address prjToken,
		uint256 collateralAmount,
		bytes memory buyCalldata,
		bool isRepayFully
	) public nonReentrant returns (uint256 amountReceivedLendingToken) {
		(, amountReceivedLendingToken) = _repayAtomic(
			user,
			lendingToken,
			prjToken,
			collateralAmount,
			buyCalldata,
			isRepayFully
		);
	}

	function _repayAtomic(
		address user,
		address lendingToken,
		address prjToken,
		uint256 collateralAmount,
		bytes memory buyCalldata,
		bool isRepayFully
	) internal returns (uint256 amountSold, uint256 amountReceive) {
		require(
			IParaSwapAugustusRegistry(AUGUSTUS_REGISTRY).isValidAugustus(augustusParaswap),
			"AtomicRepayment: INVALID_AUGUSTUS"
		);
		require(collateralAmount > 0, "AtomicRepayment: collateralAmount must be greater than 0");

		uint256 remainingDeposit = getRemainingDeposit(user, prjToken);
		if (collateralAmount > remainingDeposit) {
			collateralAmount = remainingDeposit;
		}

		(amountSold, amountReceive) = _swapAtomic(
			user,
			prjToken,
			lendingToken,
			collateralAmount,
			buyCalldata
		);
		if (isRepayFully)
			require(
				amountReceive >= getTotalOutstanding(user, lendingToken),
				"AtomicRepayment: amount receive not enough to repay fully"
			);

		//deposit collateral back in the pool, if left after the swap(buy)
		if (collateralAmount > amountSold) {
			uint256 collateralBalanceLeft = collateralAmount - amountSold;
			ERC20Upgradeable(prjToken).approve(address(primaryIndexToken), collateralBalanceLeft);
			primaryIndexToken.depositFromRelatedContracts(
				prjToken,
				collateralBalanceLeft,
				address(this),
				user
			);
		}

		address bLendingToken = primaryIndexToken.lendingTokenInfo(lendingToken).bLendingToken;
		ERC20Upgradeable(lendingToken).approve(bLendingToken, amountReceive);
		primaryIndexToken.repayFromRelatedContract(
			lendingToken,
			amountReceive,
			address(this),
			user
		);

		uint256 afterLendingBalance = ERC20Upgradeable(lendingToken).balanceOf(address(this));
		if (afterLendingBalance > 0) {
			ERC20Upgradeable(lendingToken).transfer(user, afterLendingBalance);
		}

		emit AtomicRepayment(user, prjToken, lendingToken, amountSold, amountReceive);
		return (amountSold, amountReceive);
	}

	/**
	 * @dev Swaps the project token for the given lending token on ParaSwap.
	 * @param user The user address.
	 * @param prjToken The project token to swap.
	 * @param lendingToken The lending token to swap for.
	 * @param collateralAmount The amount of collateral to use.
	 * @param buyCalldata The calldata for the swap operation.
	 * @return amountSold The amount of project token sold.
	 * @return amountReceive The amount of lending token received.
	 */
	function _swapAtomic(
		address user,
		address prjToken,
		address lendingToken,
		uint256 collateralAmount,
		bytes memory buyCalldata
	) internal returns (uint256 amountSold, uint256 amountReceive) {
		primaryIndexToken.calcAndTransferDepositPosition(
			prjToken,
			collateralAmount,
			user,
			address(this)
		);
		address tokenTransferProxy = IParaSwapAugustus(augustusParaswap).getTokenTransferProxy();
		if (
			ERC20Upgradeable(prjToken).allowance(address(this), tokenTransferProxy) <=
			collateralAmount
		) {
			ERC20Upgradeable(prjToken).approve(tokenTransferProxy, type(uint256).max);
		}
		(amountSold, amountReceive) = _buyOnParaSwap(
			prjToken,
			lendingToken,
			augustusParaswap,
			buyCalldata
		);
	}

	// REVIEW
	/**
	 * @dev Buys tokens on ParaSwap using the given project token and lending token.
	 * @param tokenFrom The token to sell on ParaSwap.
	 * @param tokenTo The token to buy on ParaSwap.
	 * @param _target The address of the Augustus Paraswap contract.
	 * @param buyCalldata The calldata for the buy operation.
	 * @return amountSold The amount of tokens sold on ParaSwap.
	 * @return amountReceive The amount of tokens received from ParaSwap.
	 */
	function _buyOnParaSwap(
		address tokenFrom,
		address tokenTo,
		address _target,
		bytes memory buyCalldata
	) internal returns (uint256 amountSold, uint256 amountReceive) {
		uint256 beforeBalanceFrom = ERC20Upgradeable(tokenFrom).balanceOf(address(this));
		uint256 beforeBalanceTo = ERC20Upgradeable(tokenTo).balanceOf(address(this));
		// solium-disable-next-line security/no-call-value
		(bool success, ) = _target.call(buyCalldata);
		if (!success) {
			// Copy revert reason from call
			assembly {
				returndatacopy(0, 0, returndatasize())
				revert(0, returndatasize())
			}
		}
		uint256 afterBalanceFrom = ERC20Upgradeable(tokenFrom).balanceOf(address(this));
		uint256 afterBalanceTo = ERC20Upgradeable(tokenTo).balanceOf(address(this));
		amountSold = beforeBalanceFrom - afterBalanceFrom;
		amountReceive = afterBalanceTo - beforeBalanceTo;
	}
}
