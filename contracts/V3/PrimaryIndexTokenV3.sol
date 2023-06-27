// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "../openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../interfaces/IPriceProviderAggregator.sol";
import "../bToken/BLendingToken.sol";
import "../interfaces/V3/IPrimaryIndexTokenLeverageV3.sol";

contract PrimaryIndexTokenV3 is
	Initializable,
	AccessControlUpgradeable,
	ReentrancyGuardUpgradeable
{
	using SafeERC20Upgradeable for ERC20Upgradeable;

	bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

	string public name;

	string public symbol;

	IPriceProviderAggregator public priceOracle;

	address[] public projectTokens;
	mapping(address => ProjectTokenInfo) public projectTokenInfo;

	address[] public lendingTokens;
	mapping(address => LendingTokenInfo) public lendingTokenInfo;

	mapping(address => mapping(address => uint256)) public depositedAmount;
	mapping(address => mapping(address => BorrowPosition)) public borrowPosition;

	mapping(address => uint256) public totalDepositedPerProjectToken;
	mapping(address => uint256) public totalBorrowedPerLendingToken;

	mapping(address => uint256) public borrowLimitPerLendingToken;

	mapping(address => bool) public isRelatedContract;

	IPrimaryIndexTokenLeverageV3 public primaryIndexTokenLeverage;

	address public primaryIndexTokenModerator;
	
	mapping(address => uint256) public depositLimitPerProjectToken;

	struct Ratio {
		uint8 numerator;
		uint8 denominator;
	}

	struct ProjectTokenInfo {
		bool isListed;
		bool isDepositPaused; // true - paused, false - not paused
		bool isWithdrawPaused; // true - paused, false - not paused
		Ratio loanToValueRatio;
	}

	struct LendingTokenInfo {
		bool isListed;
		bool isPaused;
		BLendingToken bLendingToken;
		Ratio loanToValueRatio;
	}

	// lendingToken
	struct BorrowPosition {
		uint256 loanBody; // [loanBody] = lendingToken
		uint256 accrual; // [accrual] = lendingToken
	}

	event Deposit(
		address indexed who,
		address indexed tokenPrj,
		uint256 prjDepositAmount,
		address indexed beneficiary
	);

	event Withdraw(
		address indexed who,
		address indexed tokenPrj,
		uint256 prjWithdrawAmount,
		address indexed beneficiary
	);

	event Supply(
		address indexed who,
		address indexed supplyToken,
		uint256 supplyAmount,
		address indexed supplyBToken,
		uint256 amountSupplyBTokenReceived
	);

	event Redeem(
		address indexed who,
		address indexed redeemToken,
		address indexed redeemBToken,
		uint256 redeemAmount
	);

	event RedeemUnderlying(
		address indexed who,
		address indexed redeemToken,
		address indexed redeemBToken,
		uint256 redeemAmountUnderlying
	);

	event Borrow(address indexed who, address indexed borrowToken, uint256 borrowAmount);

	event RepayBorrow(
		address indexed who,
		address indexed borrowToken,
		uint256 borrowAmount,
		bool isPositionFullyRepaid
	);

	event SetModeratorContract(address indexed oldAddress, address indexed newAddress);

	/**
	 * @dev Initializes the contract and sets the name, symbol, and default roles.
	 */
	function initialize() public initializer {
		name = "Primary Index Token";
		symbol = "PIT";
		__AccessControl_init();
		__ReentrancyGuard_init_unchained();
		_setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
		_setupRole(MODERATOR_ROLE, msg.sender);
	}

	modifier onlyAdmin() {
		require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "PIT: Caller is not the Admin");
		_;
	}

	modifier isProjectTokenListed(address projectToken) {
		require(projectTokenInfo[projectToken].isListed, "PIT: project token is not listed");
		_;
	}

	modifier isLendingTokenListed(address lendingToken) {
		require(lendingTokenInfo[lendingToken].isListed, "PIT: lending token is not listed");
		_;
	}

	modifier onlyRelatedContracts() {
		require(isRelatedContract[msg.sender], "PIT: caller is not related Contract");
		_;
	}

	modifier onlyModeratorContract() {
		require(
			msg.sender == primaryIndexTokenModerator,
			"PIT: caller is not primaryIndexTokenModerator"
		);
		_;
	}

	//************* ADMIN CONTRACT FUNCTIONS ********************************

	/**
	 * @dev Sets the address of the new moderator contract by the admin.
	 * @param newModeratorContract The address of the new moderator contract.
	 */
	function setPrimaryIndexTokenModerator(address newModeratorContract) public onlyAdmin {
		require(newModeratorContract != address(0), "PIT: invalid address");
		emit SetModeratorContract(primaryIndexTokenModerator, newModeratorContract);
		primaryIndexTokenModerator = newModeratorContract;
	}

	//************* MODERATOR CONTRACT FUNCTIONS ********************************

	/**
	 * @dev Sets the address of the new price oracle by the moderator contract.
	 * @param _priceOracle The address of the new price oracle contract.
	 */
	function setPriceOracle(address _priceOracle) public onlyModeratorContract {
		priceOracle = IPriceProviderAggregator(_priceOracle);
	}

	/**
	 * @dev Sets the address of the new primary index token leverage contract by the moderator contract.
	 * @param newPrimaryIndexTokenLeverage The address of the new primary index token leverage contract.
	 */
	function setPrimaryIndexTokenLeverage(
		address newPrimaryIndexTokenLeverage
	) public onlyModeratorContract {
		primaryIndexTokenLeverage = IPrimaryIndexTokenLeverageV3(newPrimaryIndexTokenLeverage);
	}

	/**
	 * @dev Sets whether an address is a related contract or not by the moderator contract.
	 * @param relatedContract The address of the contract to be set as related.
	 * @param isRelated Boolean to indicate whether the contract is related or not.
	 */
	function setRelatedContract(
		address relatedContract,
		bool isRelated
	) public onlyModeratorContract {
		isRelatedContract[relatedContract] = isRelated;
	}

	/**
	 * @dev Returns whether an address is a related contract or not.
	 * @param relatedContract The address of the contract to check.
	 * @return isRelated Boolean indicating whether the contract is related or not.
	 */
	function getRelatedContract(address relatedContract) public view returns (bool) {
		return isRelatedContract[relatedContract];
	}

	/**
	 * @dev Removes a project token from the list by the moderator contract.
	 * @param _projectTokenId The ID of the project token to be removed.
	 * @param projectToken The address of the project token to be removed.
	 */
	function removeProjectToken(
		uint256 _projectTokenId,
		address projectToken
	) public onlyModeratorContract {
		require(projectTokens[_projectTokenId] == projectToken, "PIT: invalid address");
		delete projectTokenInfo[projectToken];
		projectTokens[_projectTokenId] = projectTokens[projectTokens.length - 1];
		projectTokens.pop();
	}

	/**
	 * @dev Removes a lending token from the list by the moderator contract.
	 * @param _lendingTokenId The ID of the lending token to be removed.
	 * @param lendingToken The address of the lending token to be removed.
	 */
	function removeLendingToken(
		uint256 _lendingTokenId,
		address lendingToken
	) public onlyModeratorContract {
		require(lendingTokens[_lendingTokenId] == lendingToken, "PIT: invalid address");
		delete lendingTokenInfo[lendingToken];

		lendingTokens[_lendingTokenId] = lendingTokens[lendingTokens.length - 1];
		lendingTokens.pop();
	}

	/**
	 * @dev Sets the borrow limit per lending asset by the moderator contract.
	 * @param lendingToken The address of the lending token.
	 * @param _borrowLimit The new borrow limit.
	 */
	function setBorrowLimitPerLendingAsset(
		address lendingToken,
		uint256 _borrowLimit
	) public onlyModeratorContract {
		borrowLimitPerLendingToken[lendingToken] = _borrowLimit;
	}

	/**
	 * @dev Sets the borrow limit per project asset by the moderator contract.
	 * @param projectToken The address of the project token.
	 * @param _depositLimit The new deposit limit.
	 */
	function setDepositLimitPerProjectAsset(
		address projectToken,
		uint256 _depositLimit
	) public onlyModeratorContract {
		depositLimitPerProjectToken[projectToken] = _depositLimit;
	}

	/**
	 * @dev Sets the loan-to-value ratio, liquidation threshold factor, and liquidation incentive of a project token.
	 * Adds the project token to the list of listed project tokens if it is not already listed. Call by the moderator contract.
	 * @param _projectToken The address of the project token to set the information for.
	 * @param _isDepositPaused The new pause status for deposit
	 * @param _isWithdrawPaused The new pause status for withdrawal
	 * @param _loanToValueRatioNumerator The numerator of the loan-to-value ratio for the project token.
	 * @param _loanToValueRatioDenominator The denominator of the loan-to-value ratio for the project token.
	 */
	function setProjectTokenInfo(
		address _projectToken,
		bool _isDepositPaused,
		bool _isWithdrawPaused,
		uint8 _loanToValueRatioNumerator,
		uint8 _loanToValueRatioDenominator
	) public onlyModeratorContract {
		ProjectTokenInfo storage info = projectTokenInfo[_projectToken];
		if (!info.isListed) {
			projectTokens.push(_projectToken);
			info.isListed = true;
		}
		if (info.isDepositPaused != _isDepositPaused) {
			projectTokenInfo[_projectToken].isDepositPaused = _isDepositPaused;
		}
		if (info.isWithdrawPaused != _isWithdrawPaused) {
			projectTokenInfo[_projectToken].isWithdrawPaused = _isWithdrawPaused;
		}
		info.loanToValueRatio = Ratio(_loanToValueRatioNumerator, _loanToValueRatioDenominator);
	}

	/**
	 * @dev Pauses or unpauses deposits and withdrawals of a project token.
	 * @param _projectToken The address of the project token.
	 * @param _isDepositPaused Boolean indicating whether deposits are paused or unpaused.
	 * @param _isWithdrawPaused Boolean indicating whether withdrawals are paused or unpaused.
	 */
	function setPausedProjectToken(
		address _projectToken,
		bool _isDepositPaused,
		bool _isWithdrawPaused
	) public onlyModeratorContract {
		ProjectTokenInfo storage info = projectTokenInfo[_projectToken];
		if (info.isDepositPaused != _isDepositPaused) {
			projectTokenInfo[_projectToken].isDepositPaused = _isDepositPaused;
		}
		if (info.isWithdrawPaused != _isWithdrawPaused) {
			projectTokenInfo[_projectToken].isWithdrawPaused = _isWithdrawPaused;
		}
	}

	/**
	 * @dev Sets the bLendingToken and paused status of a lending token.
	 * @param _lendingToken The address of the lending token.
	 * @param _bLendingToken The address of the bLendingToken.
	 * @param _isPaused Boolean indicating whether the lending token is paused or unpaused.
	 * @param _loanToValueRatioNumerator The numerator of the loan-to-value ratio for the lending token
	 * @param _loanToValueRatioDenominator The denominator of the loan-to-value ratio for the lending token
	 */
	function setLendingTokenInfo(
		address _lendingToken,
		address _bLendingToken,
		bool _isPaused,
		uint8 _loanToValueRatioNumerator,
		uint8 _loanToValueRatioDenominator
	) public onlyModeratorContract {
		if (!lendingTokenInfo[_lendingToken].isListed) {
			lendingTokens.push(_lendingToken);
			lendingTokenInfo[_lendingToken].isListed = true;
		}

		LendingTokenInfo storage info = lendingTokenInfo[_lendingToken];

		if (info.isPaused != _isPaused) {
			lendingTokenInfo[_lendingToken].isPaused = _isPaused;
		}
		info.bLendingToken = BLendingToken(_bLendingToken);
		info.loanToValueRatio = Ratio(_loanToValueRatioNumerator, _loanToValueRatioDenominator);
	}

	/**
	 * @dev Pauses or unpauses a lending token.
	 * @param _lendingToken The address of the lending token.
	 * @param _isPaused Boolean indicating whether the lending token is paused or unpaused.
	 */
	function setPausedLendingToken(
		address _lendingToken,
		bool _isPaused
	) public onlyModeratorContract isLendingTokenListed(_lendingToken) {
		if (lendingTokenInfo[_lendingToken].isPaused != _isPaused) {
			lendingTokenInfo[_lendingToken].isPaused = _isPaused;
		}
	}

	//************* PUBLIC FUNCTIONS ********************************
	//************* Deposit FUNCTION ********************************

	// REVIEW
	/**
	 * @dev Deposits project tokens and calculates the deposit position.
	 * @param projectToken The address of the project token to be deposited.
	 * @param projectTokenAmount The amount of project tokens to be deposited.
	 */
	function deposit(
		address projectToken,
		uint256 projectTokenAmount
	) public isProjectTokenListed(projectToken) nonReentrant {
		_deposit(projectToken, projectTokenAmount, msg.sender, msg.sender);
	}

	// REVIEW
	/**
	 * @dev Deposits project tokens on behalf of a user from a related contract and calculates the deposit position.
	 * @param projectToken The address of the project token to be deposited.
	 * @param projectTokenAmount The amount of project tokens to be deposited.
	 * @param user The address of the user who representative deposited.
	 * @param beneficiary The address of the beneficiary whose deposit position will be updated.
	 */
	function depositFromRelatedContracts(
		address projectToken,
		uint256 projectTokenAmount,
		address user,
		address beneficiary
	) public isProjectTokenListed(projectToken) nonReentrant onlyRelatedContracts {
		_deposit(projectToken, projectTokenAmount, user, beneficiary);
	}

	// REVIEW
	/**
	 * @dev Transfers a given amount of a project token from a user to the contract, and calculates the deposit position and emits the Deposit event.
	 * @param projectToken The address of the project token being deposited
	 * @param projectTokenAmount The amount of project tokens being deposited
	 * @param user The address of the user depositing the project tokens
	 * @param beneficiary The address of the user who will receive the deposit position
	 */
	function _deposit(
		address projectToken,
		uint256 projectTokenAmount,
		address user,
		address beneficiary
	) internal {
		require(!projectTokenInfo[projectToken].isDepositPaused, "PIT: projectToken is paused");
		require(projectTokenAmount > 0, "PIT: projectTokenAmount==0");
        require(getDepositedPerProjectTokenInUSD(projectToken) + getTokenEvaluation(projectToken, projectTokenAmount) <= depositLimitPerProjectToken[projectToken], "PIT: totalDeposit exceeded depositLimit per collateral asset");
		ERC20Upgradeable(projectToken).safeTransferFrom(user, address(this), projectTokenAmount);
		_calcDepositPosition(projectToken, projectTokenAmount, beneficiary);
		bool isNeedToUpdatePositionData = primaryIndexTokenLeverage.isNeedToUpdatePositionData(
			beneficiary,
			projectToken,
			address(0)
		);
		if (isNeedToUpdatePositionData) {
			primaryIndexTokenLeverage.addDepositedLongAsset(beneficiary, projectToken);
		}
		emit Deposit(user, projectToken, projectTokenAmount, beneficiary);
	}

	// REVIEW
	/**
	 * @dev Decreases the deposited project token amount of the user's deposit position by the given amount,
	 * transfers the given amount of project tokens to the receiver, and returns the amount transferred.
	 * @param projectToken The address of the project token being withdrawn
	 * @param projectTokenAmount The amount of project tokens being withdrawn
	 * @param user The address of the user whose deposit position is being updated
	 * @param receiver The address of the user receiving the withdrawn project tokens
	 * @return The amount of project tokens transferred to the receiver
	 */
	function calcAndTransferDepositPosition(
		address projectToken,
		uint256 projectTokenAmount,
		address user,
		address receiver
	)
		external
		isProjectTokenListed(projectToken)
		onlyRelatedContracts
		nonReentrant
		returns (uint256)
	{
		depositedAmount[user][projectToken] -= projectTokenAmount;
		totalDepositedPerProjectToken[projectToken] -= projectTokenAmount;
		bool isNeedToUpdatePositionData = primaryIndexTokenLeverage.isNeedToUpdatePositionData(
			user,
			projectToken,
			address(0)
		);
		if (isNeedToUpdatePositionData) {
			primaryIndexTokenLeverage.reduceDepositedLongAsset(user, projectToken, false);
		}
		ERC20Upgradeable(projectToken).safeTransfer(receiver, projectTokenAmount);

		return projectTokenAmount;
	}

	// REVIEW
	/**
	 * @dev Calculates the deposit position for a user's deposit of a given amount of a project token.
	 * @param projectToken The address of the project token being deposited
	 * @param projectTokenAmount The amount of project tokens being deposited
	 * @param user The address of the user making the deposit
	 */
	function calcDepositPosition(
		address projectToken,
		uint256 projectTokenAmount,
		address user
	)
		public
		isProjectTokenListed(projectToken)
		onlyRelatedContracts
		onlyRelatedContracts
		nonReentrant
	{
		_calcDepositPosition(projectToken, projectTokenAmount, user);
	}

	// REVIEW
	/**
	 * @dev Updates the deposit position of a user by increasing the deposited project token amount
	 * and updating the total deposited project token amount.
	 * @param projectToken The address of the project token being deposited
	 * @param projectTokenAmount The amount of project tokens being deposited
	 * @param beneficiary The address of the user whose deposit position is being updated
	 */
	function _calcDepositPosition(
		address projectToken,
		uint256 projectTokenAmount,
		address beneficiary
	) internal {
		depositedAmount[beneficiary][projectToken] += projectTokenAmount; //beneficiary = msg.sender
		totalDepositedPerProjectToken[projectToken] += projectTokenAmount;
	}

	//************* Withdraw FUNCTION ********************************

	// REVIEW
	/**
	 * @dev Allows a user to withdraw a given amount of a project token from their deposit position.
	 * @param projectToken The address of the project token being withdrawn
	 * @param projectTokenAmount The amount of project tokens being withdrawn
	 */
	function withdraw(
		address projectToken,
		uint256 projectTokenAmount
	) public isProjectTokenListed(projectToken) nonReentrant {
		_withdraw(projectToken, projectTokenAmount, msg.sender, msg.sender);
	}

	// REVIEW
	/**
	 * @dev Allows a related contract to initiate a withdrawal of a given amount of a project token from a user's deposit position.
	 * @param projectToken The address of the project token being withdrawn
	 * @param projectTokenAmount The amount of project tokens being withdrawn
	 * @param user The address of the user whose deposit position is being withdrawn from
	 * @param beneficiary The address of the user receiving the withdrawn project tokens
	 * @return amount of project tokens withdrawn and transferred to the beneficiary
	 */
	function withdrawFromRelatedContracts(
		address projectToken,
		uint256 projectTokenAmount,
		address user,
		address beneficiary
	) public isProjectTokenListed(projectToken) nonReentrant returns (uint256) {
		return _withdraw(projectToken, projectTokenAmount, user, beneficiary);
	}

	// REVIEW
	/**
	 * @dev Withdraws project tokens from a user's deposit position.
	 * @param projectToken Address of the project token.
	 * @param projectTokenAmount Amount of project tokens to be withdrawn.
	 * @param user Address of the user.
	 * @param beneficiary Address of the beneficiary to receive the withdrawn tokens.
	 * @return The amount of project tokens withdrawn.
	 * Requirements:
	 ** The project token is not paused for withdrawals.
	 ** The project token amount and deposited project token amount in the user's deposit position is greater than 0.
	 ** The amount of project tokens to be withdrawn is less than or equal to the deposited project token amount in the user's deposit position.
	 ** If the project token amount is type(uint256).max, the deposited project token amount must be greater than or equal to the available collateral to withdraw. Otherwise, the project token amount cannot be greater than the deposited project token amount.
	 ** If there is an outstanding loan in the actual lending token, the withdrawable amount must not make the health factor less than 1.
	 * Effects:
	 ** Decreases the deposited project token amount in the user's deposit position.
	 ** Transfers the withdrawn project tokens to the beneficiary.
	 ** Emits a Withdraw event.
	 */
	function _withdraw(
		address projectToken,
		uint256 projectTokenAmount,
		address user,
		address beneficiary
	) internal returns (uint256) {
		require(!projectTokenInfo[projectToken].isWithdrawPaused, "PIT: projectToken is paused");
		require(
			projectTokenAmount > 0 && depositedAmount[user][projectToken] > 0,
			"PIT: invalid collateral token amount or hasn't deposited before"
		);
		bool isExistedLoan = false;
		// update interest in borrow positions if there is an outstanding loan
		for (uint256 i = 0; i < lendingTokens.length; i++) {
			address actualLendingToken = lendingTokens[i];
			if (
				actualLendingToken != address(0) &&
				borrowPosition[user][actualLendingToken].loanBody > 0
			) {
				updateInterestInBorrowPosition(user, actualLendingToken);
				if (isExistedLoan == false) {
					isExistedLoan = true;
				}
			}
		}
		// if projectTokenAmount is type(uint256).max, withdraw all available collateral
		if (projectTokenAmount == type(uint256).max) {
			if (isExistedLoan) {
				uint256 collateralAvailableToWithdraw = getCollateralAvailableToWithdraw(
					user,
					projectToken
				);
				require(
					depositedAmount[user][projectToken] >= collateralAvailableToWithdraw,
					"Position under liquidation"
				);
				projectTokenAmount = collateralAvailableToWithdraw;
			} else {
				projectTokenAmount = depositedAmount[user][projectToken];
			}
		}
		depositedAmount[user][projectToken] -= projectTokenAmount;
		totalDepositedPerProjectToken[projectToken] -= projectTokenAmount;

		// check health factor after withdrawing
		if (totalOutstandingInUSD(user) > 0) {
			(uint256 healthFactorNumerator, uint256 healthFactorDenominator) = healthFactor(user);
			require(
				healthFactorNumerator >= healthFactorDenominator,
				"PIT: withdrawable amount makes healthFactor<1"
			);
		}
		ERC20Upgradeable(projectToken).safeTransfer(beneficiary, projectTokenAmount);

		bool isNeedToUpdatePositionData = primaryIndexTokenLeverage.isNeedToUpdatePositionData(
			beneficiary,
			projectToken,
			address(0)
		);
		if (isNeedToUpdatePositionData) {
			primaryIndexTokenLeverage.reduceDepositedLongAsset(beneficiary, projectToken, true);
		}

		emit Withdraw(user, projectToken, projectTokenAmount, beneficiary);
		return projectTokenAmount;
	}

	//************* supply FUNCTION ********************************

	// REVIEW
	/**
	 * @dev Supplies a certain amount of lending tokens to the platform.
	 * @param lendingToken Address of the lending token.
	 * @param lendingTokenAmount Amount of lending tokens to be supplied.
	 */
	function supply(
		address lendingToken,
		uint256 lendingTokenAmount
	) public isLendingTokenListed(lendingToken) nonReentrant {
		_supply(lendingToken, lendingTokenAmount, msg.sender);
	}

	// REVIEW
	/**
	 * @dev Supplies a certain amount of lending tokens to the platform from a specific user.
	 * @param lendingToken Address of the lending token.
	 * @param lendingTokenAmount Amount of lending tokens to be supplied.
	 * @param user Address of the user.
	 */
	function supplyFromRelatedContract(
		address lendingToken,
		uint256 lendingTokenAmount,
		address user
	) public isLendingTokenListed(lendingToken) onlyRelatedContracts nonReentrant {
		_supply(lendingToken, lendingTokenAmount, user);
	}

	// REVIEW
	/**
	 * @dev Internal function that performs the supply of lending token to the user by minting bLendingToken.
	 * @param lendingToken Address of the lending token.
	 * @param lendingTokenAmount Amount of lending tokens to be supplied.
	 * @param user Address of the user.
	 * Requirements:
	 ** The lending token is not paused.
	 ** The lending token amount is greater than 0.
	 ** Minting the bLendingTokens is successful and the minted amount is greater than 0.
	 * Effects:
	 ** Mints the corresponding bLendingTokens and credits them to the user.
	 ** Emits a Supply event.
	 */
	function _supply(
		address lendingToken,
		uint256 lendingTokenAmount,
		address user
	) internal isLendingTokenListed(lendingToken) {
		require(!lendingTokenInfo[lendingToken].isPaused, "PIT: lending token is paused");
		require(lendingTokenAmount > 0, "PIT: lendingTokenAmount==0");

		(uint256 mintError, uint256 mintedAmount) = lendingTokenInfo[lendingToken]
			.bLendingToken
			.mintTo(user, lendingTokenAmount);
		require(mintError == 0, "PIT: mintError!=0");
		require(mintedAmount > 0, "PIT: mintedAmount==0");

		emit Supply(
			user,
			lendingToken,
			lendingTokenAmount,
			address(lendingTokenInfo[lendingToken].bLendingToken),
			mintedAmount
		);
	}

	//************* redeem FUNCTION ********************************

	// REVIEW
	/**
	 * @dev Function that performs the redemption of bLendingToken and returns the corresponding lending token to the msg.sender.
	 * @param lendingToken Address of the lending token.
	 * @param bLendingTokenAmount Amount of bLending tokens to be redeemed.
	 */
	function redeem(
		address lendingToken,
		uint256 bLendingTokenAmount
	) public isLendingTokenListed(lendingToken) nonReentrant {
		_redeem(lendingToken, bLendingTokenAmount, msg.sender);
	}

	// REVIEW
	/**
	 * @dev Function that performs the redemption of bLendingToken on behalf of a user and returns the corresponding lending token to the user by related contract.
	 * @param lendingToken Address of the lending token.
	 * @param bLendingTokenAmount Amount of bLending tokens to be redeemed.
	 * @param user Address of the user.
	 */
	function redeemFromRelatedContract(
		address lendingToken,
		uint256 bLendingTokenAmount,
		address user
	) public isLendingTokenListed(lendingToken) onlyRelatedContracts nonReentrant {
		_redeem(lendingToken, bLendingTokenAmount, user);
	}

	// REVIEW
	/**
	 * @dev Internal function that performs the redemption of bLendingToken and returns the corresponding lending token to the user.
	 * @param lendingToken Address of the lending token.
	 * @param bLendingTokenAmount Amount of bLending tokens to be redeemed.
	 * @param user Address of the user.
	 * Requirements:
	 ** The lending token should not be paused.
	 ** The bLendingTokenAmount should be greater than zero.
	 ** The redemption of bLendingToken should not result in a redemption error.
	 ** Emits a Redeem event.
	 */
	function _redeem(address lendingToken, uint256 bLendingTokenAmount, address user) internal {
		require(!lendingTokenInfo[lendingToken].isPaused, "PIT: lending token is paused");
		require(bLendingTokenAmount > 0, "PIT: bLendingTokenAmount==0");

		uint256 redeemError = lendingTokenInfo[lendingToken].bLendingToken.redeemTo(
			user,
			bLendingTokenAmount
		);
		require(redeemError == 0, "PIT: redeemError!=0. redeem>=supply.");

		emit Redeem(
			user,
			lendingToken,
			address(lendingTokenInfo[lendingToken].bLendingToken),
			bLendingTokenAmount
		);
	}

	//************* redeemUnderlying FUNCTION ********************************

	// REVIEW
	/**
	 * @dev Function that performs the redemption of lending token and returns the corresponding underlying token to the msg.sender.
	 * @param lendingToken Address of the lending token.
	 * @param lendingTokenAmount Amount of lending tokens to be redeemed.
	 */
	function redeemUnderlying(
		address lendingToken,
		uint256 lendingTokenAmount
	) public isLendingTokenListed(lendingToken) nonReentrant {
		_redeemUnderlying(lendingToken, lendingTokenAmount, msg.sender);
	}

	// REVIEW
	/**
	 * @dev Function that performs the redemption of lending token on behalf of a user and returns the corresponding underlying token to the user by related contract.
	 * @param lendingToken Address of the lending token.
	 * @param lendingTokenAmount Amount of lending tokens to be redeemed.
	 * @param user Address of the user.
	 */
	function redeemUnderlyingFromRelatedContract(
		address lendingToken,
		uint256 lendingTokenAmount,
		address user
	) public isLendingTokenListed(lendingToken) onlyRelatedContracts nonReentrant {
		_redeemUnderlying(lendingToken, lendingTokenAmount, user);
	}

	// REVIEW
	/**
	 * @dev Internal function that performs the redemption of lending token and returns the corresponding underlying token to the user.
	 * @param lendingToken Address of the lending token.
	 * @param lendingTokenAmount Amount of lending tokens to be redeemed.
	 * @param user Address of the user.
	 * Requirements:
	 * The lending token should not be paused.
	 * The lendingTokenAmount should be greater than zero.
	 * The redemption of lendingToken should not result in a redemption error.
	 * Emits a RedeemUnderlying event.
	 */
	function _redeemUnderlying(
		address lendingToken,
		uint256 lendingTokenAmount,
		address user
	) internal {
		require(!lendingTokenInfo[lendingToken].isPaused, "PIT: lending token is paused");
		require(lendingTokenAmount > 0, "PIT: lendingTokenAmount==0");

		uint256 redeemUnderlyingError = lendingTokenInfo[lendingToken]
			.bLendingToken
			.redeemUnderlyingTo(user, lendingTokenAmount);
		require(redeemUnderlyingError == 0, "PIT:redeem>=supply");

		emit RedeemUnderlying(
			user,
			lendingToken,
			address(lendingTokenInfo[lendingToken].bLendingToken),
			lendingTokenAmount
		);
	}

	//************* borrow FUNCTION ********************************

	// REVIEW
	/**
	 * @dev Allows a user to borrow lending tokens by providing pooled collateral.
	 * @param lendingToken The address of the lending token being borrowed.
	 * @param lendingTokenAmount The amount of lending tokens to be borrowed.
	 */
	function borrow(
		address lendingToken,
		uint256 lendingTokenAmount
	) public isLendingTokenListed(lendingToken) nonReentrant {
		_borrow(lendingToken, lendingTokenAmount, msg.sender);
	}

	// REVIEW
	/**
	 * @dev Allows a related contract to borrow lending tokens on behalf of a user by providing pooled collateral.
	 * @param lendingToken The address of the lending token being borrowed.
	 * @param lendingTokenAmount The amount of lending tokens to be borrowed.
	 * @param user The address of the user on whose behalf the lending tokens are being borrowed.
	 */
	function borrowFromRelatedContract(
		address lendingToken,
		uint256 lendingTokenAmount,
		address user
	) public isLendingTokenListed(lendingToken) nonReentrant onlyRelatedContracts {
		_borrow(lendingToken, lendingTokenAmount, user);
	}

	// REVIEW
	/**
	 * @dev Internal function to borrow lending tokens.
	 * @param lendingToken The address of the lending token being borrowed.
	 * @param lendingTokenAmount The amount of lending tokens to be borrowed.
	 * @param user The address of the user on whose behalf the lending tokens are being borrowed.
	 */
	function _borrow(address lendingToken, uint256 lendingTokenAmount, address user) internal {
		require(lendingTokenAmount > 0, "PIT: lendingTokenAmount==0");
		updateInterestInAllBorrowPositions(user);
		if (lendingTokenAmount == type(uint256).max) {
			lendingTokenAmount = convertPitRemaining(user, lendingToken);
		} else {
			require(
				getTokenEvaluation(lendingToken, lendingTokenAmount) <= totalPITRemaining(user),
				"PIT: lendingTokenAmount exceeds pitRemaining"
			);
		}

		require(
			getBorrowedPerLendingTokenInUSD(lendingToken) +
				getTokenEvaluation(lendingToken, lendingTokenAmount) <=
				borrowLimitPerLendingToken[lendingToken],
			"PIT: totalBorrow exceeded borrowLimit per lending asset"
		);

		_calcBorrowPosition(user, lendingToken, lendingTokenAmount);

		bool isNeedToUpdatePositionData = primaryIndexTokenLeverage.isNeedToUpdatePositionData(
			user,
			address(0),
			lendingToken
		);
		if (isNeedToUpdatePositionData) {
			primaryIndexTokenLeverage.addShortAsset(user, lendingToken);
		}

		emit Borrow(user, lendingToken, lendingTokenAmount);
	}

	// REVIEW
	/**
	 * @dev Allows a related contract to calculate the new borrow position of a user.
	 * @param borrower The address of the user for whom the borrow position is being calculated.
	 * @param lendingToken The address of the lending token being borrowed.
	 * @param lendingTokenAmount The amount of lending tokens being borrowed.
	 */
	function calcBorrowPosition(
		address borrower,
		address lendingToken,
		uint256 lendingTokenAmount
	) external onlyRelatedContracts nonReentrant {
		_calcBorrowPosition(borrower, lendingToken, lendingTokenAmount);
	}

	// REVIEW
	/**
	 * @dev Increase the borrower's borrow position in a given project and lending token, updating the total borrow statistics
	 * @param borrower The borrower's address
	 * @param lendingToken The lending token's address
	 * @param lendingTokenAmount The amount of lending tokens to borrow
	 */
	function _calcBorrowPosition(
		address borrower,
		address lendingToken,
		uint256 lendingTokenAmount
	) internal {
		BorrowPosition storage _borrowPosition = borrowPosition[borrower][lendingToken];
		LendingTokenInfo memory info = lendingTokenInfo[lendingToken];
		_borrowPosition.loanBody += lendingTokenAmount;
		totalBorrowedPerLendingToken[lendingToken] += lendingTokenAmount;
		info.bLendingToken.borrowTo(borrower, lendingTokenAmount);
	}

	//************* repay FUNCTION ********************************

	// REVIEW
	/**
	 * @dev Allows a borrower to repay their outstanding loan for lending token.
	 * @param lendingToken The lending token's address
	 * @param lendingTokenAmount The amount of lending tokens to repay
	 * @return amount of lending tokens actually repaid
	 */
	function repay(
		address lendingToken,
		uint256 lendingTokenAmount
	) public isLendingTokenListed(lendingToken) returns (uint256) {
		return _repay(msg.sender, msg.sender, lendingToken, lendingTokenAmount);
	}

	// REVIEW
	/**
	 * @dev Allows a related contract to repay the outstanding loan for a given borrower's lending token.
	 * @param lendingToken The lending token's address
	 * @param lendingTokenAmount The amount of lending tokens to repay
	 * @param repairer The address that initiated the repair transaction
	 * @param borrower The borrower's address
	 * @return amount of lending tokens actually repaid
	 */
	function repayFromRelatedContract(
		address lendingToken,
		uint256 lendingTokenAmount,
		address repairer,
		address borrower
	) public isLendingTokenListed(lendingToken) returns (uint256) {
		return _repay(repairer, borrower, lendingToken, lendingTokenAmount); // under normal conditions: repairer == borrower
	}

	// REVIEW
	/**
	 * @dev This function is called internally to handle the repayment of a borrower's outstanding loan.
	 * @param repairer The address that initiated the repair transaction
	 * @param borrower The borrower's address
	 * @param lendingToken The lending token's address
	 * @param lendingTokenAmount The amount of lending tokens to repay
	 * @return amount of lending tokens actually repaid
	 */
	function _repay(
		address repairer,
		address borrower,
		address lendingToken,
		uint256 lendingTokenAmount
	) internal returns (uint256) {
		require(lendingTokenAmount > 0, "PIT: lendingTokenAmount==0");
		BorrowPosition storage _borrowPosition = borrowPosition[borrower][lendingToken];
		require(_borrowPosition.loanBody > 0, "PIT: no borrow position");
		LendingTokenInfo memory info = lendingTokenInfo[lendingToken];
		updateInterestInAllBorrowPositions(borrower);
		uint256 amountRepaid;
		bool isPositionFullyRepaid;
		uint256 totalOutstanding = outstanding(borrower, lendingToken);
		if (
			lendingTokenAmount > info.bLendingToken.borrowBalanceStored(borrower) ||
			lendingTokenAmount >= totalOutstanding ||
			lendingTokenAmount == type(uint256).max
		) {
			amountRepaid = _repayTo(repairer, borrower, info, type(uint256).max);
			isPositionFullyRepaid = _repayFully(lendingToken, _borrowPosition);
		} else {
			uint256 lendingTokenAmountToRepay = lendingTokenAmount;
			amountRepaid = _repayTo(repairer, borrower, info, lendingTokenAmountToRepay);
			isPositionFullyRepaid = _repayPartially(
				lendingToken,
				lendingTokenAmountToRepay,
				_borrowPosition
			);
		}

		bool isNeedToUpdatePositionData = primaryIndexTokenLeverage.isNeedToUpdatePositionData(
			borrower,
			address(0),
			lendingToken
		);
		if (isNeedToUpdatePositionData) {
			primaryIndexTokenLeverage.reduceShortAsset(borrower, lendingToken);
		}

		emit RepayBorrow(borrower, lendingToken, amountRepaid, isPositionFullyRepaid);
		return amountRepaid;
	}

	// REVIEW
	/**
	 * @dev This function is called internally to fully repay a borrower's outstanding loan.
	 * @param lendingToken The lending token's address
	 * @param _borrowPosition The borrower's borrowing position for the given project and lending token
	 * @return True.
	 */
	function _repayFully(
		address lendingToken,
		BorrowPosition storage _borrowPosition
	) internal returns (bool) {
		totalBorrowedPerLendingToken[lendingToken] -= _borrowPosition.loanBody;
		_borrowPosition.loanBody = 0;
		_borrowPosition.accrual = 0;
		return true;
	}

	// REVIEW
	/**
	 * @dev This function is called internally to partially repay a borrower's outstanding loan.
	 * @param lendingToken Address of the lending token.
	 * @param lendingTokenAmountToRepay Amount of the lending token to repay.
	 * @param _borrowPosition The borrower's borrow position.
	 * @return False.
	 */
	function _repayPartially(
		address lendingToken,
		uint256 lendingTokenAmountToRepay,
		BorrowPosition storage _borrowPosition
	) internal returns (bool) {
		if (lendingTokenAmountToRepay > _borrowPosition.accrual) {
			lendingTokenAmountToRepay -= _borrowPosition.accrual;
			_borrowPosition.accrual = 0;
			totalBorrowedPerLendingToken[lendingToken] -= lendingTokenAmountToRepay;
			_borrowPosition.loanBody -= lendingTokenAmountToRepay;
		} else {
			_borrowPosition.accrual -= lendingTokenAmountToRepay;
		}
		return false;
	}

	// REVIEW
	/**
	 * @dev This function is called internally to handle the transfer of the repayment amount.
	 * @param repairer Address of the contract caller.
	 * @param borrower Address of the borrower.
	 * @param info Lending token information.
	 * @param lendingTokenAmountToRepay Amount of the lending token to repay.
	 * @return amountRepaid amount of lending token repaid.
	 */
	function _repayTo(
		address repairer,
		address borrower,
		LendingTokenInfo memory info,
		uint256 lendingTokenAmountToRepay
	) internal returns (uint256 amountRepaid) {
		(, amountRepaid) = info.bLendingToken.repayTo(
			repairer,
			borrower,
			lendingTokenAmountToRepay
		);
	}

	// REVIEW
	/**
	 * @dev This function is called to update the interest in a borrower's borrow position.
	 * @param account Address of the borrower.
	 * @param lendingToken Address of the lending token.
	 */
	function updateInterestInBorrowPosition(address account, address lendingToken) public {
		uint256 cumulativeLoanBody = 0;
		uint256 cumulativeTotalOutstanding = 0;
		BorrowPosition storage _borrowPosition = borrowPosition[account][lendingToken];
		cumulativeLoanBody += _borrowPosition.loanBody;
		cumulativeTotalOutstanding += _borrowPosition.loanBody + _borrowPosition.accrual;
		if (cumulativeLoanBody == 0) {
			return;
		}
		uint256 currentBorrowBalance = lendingTokenInfo[lendingToken]
			.bLendingToken
			.borrowBalanceCurrent(account);
		if (currentBorrowBalance >= cumulativeTotalOutstanding) {
			uint256 estimatedAccrual = currentBorrowBalance - cumulativeTotalOutstanding;
			_borrowPosition.accrual +=
				(estimatedAccrual * _borrowPosition.loanBody) /
				cumulativeLoanBody;
		}
	}

	// REVIEW
	/**
	 * @dev This function is called to update the interest in all borrower's borrow positions.
	 * @param account Address of the borrower.
	 */
	function updateInterestInAllBorrowPositions(address account) public {
		for (uint256 i = 0; i < lendingTokens.length; i++) {
			address actualLendingToken = lendingTokens[i];
			if (
				actualLendingToken != address(0) &&
				borrowPosition[account][actualLendingToken].loanBody > 0
			) {
				updateInterestInBorrowPosition(account, actualLendingToken);
			}
		}
	}

	//************* VIEW FUNCTIONS ********************************

	// REVIEW
	/**
	 * @dev Returns the total PIT (primary index token) value for a given account and all project tokens.
	 * @param account Address of the account.
	 * @return totalEvaluation total PIT value.
	 * Formula: pit = $ * LVR
	 * total PIT = sum of PIT for all project tokens
	 */
	function totalPIT(address account) public view returns (uint256) {
		uint256 totalEvaluation = 0;
		for (uint256 i = 0; i < projectTokens.length; i++) {
			address projectToken = projectTokens[i];
			uint8 lvrNumerator = projectTokenInfo[projectToken].loanToValueRatio.numerator;
			uint8 lvrDenominator = projectTokenInfo[projectToken].loanToValueRatio.denominator;
			totalEvaluation += getTokenEvaluation(
				projectToken,
				(depositedAmount[account][projectToken] * lvrNumerator) / lvrDenominator
			);
		}
		return totalEvaluation;
	}

	/**
	 * @dev Returns the total deposited amount in USD for a given account and all project tokens.
	 * @param account Address of the account.
	 * @return totalEvaluation total deposited amount.
	 */
	function totalDepositedAmountInUSD(address account) public view returns (uint256) {
		uint256 totalEvaluation = 0;
		for (uint256 i = 0; i < projectTokens.length; i++) {
			address projectToken = projectTokens[i];
			totalEvaluation += getTokenEvaluation(
				projectToken,
				depositedAmount[account][projectToken]
			);
		}
		return totalEvaluation;
	}

	// REVIEW
	/**
	 * @dev Returns the total remaining PIT (primary index token) of a given account and all project tokens.
	 * @param account The address of the user's borrow position
	 * @return remaining The remaining PIT of the user's borrow position
	 */
	function totalPITRemaining(address account) public view returns (uint256) {
		uint256 _pit = totalPIT(account);
		uint256 remaining = 0;
		if (_pit > 0) {
			if (lendingTokens.length == 0) {
				return _pit;
			} else {
				uint256 _totalWeightedLoanInUSD = totalWeightedLoanInUSD(account);
				if (_pit >= _totalWeightedLoanInUSD) {
					remaining = _pit - _totalWeightedLoanInUSD;
				}
			}
		}
		return remaining;
	}

	// REVIEW
	/**
	 * @dev Returns the total outstanding amount of a user's borrow position for a specific lending token
	 * @param account The address of the user's borrow position
	 * @param lendingToken The address of the lending token
	 * @return total outstanding amount of the user's borrow position
	 */
	function outstanding(address account, address lendingToken) public view returns (uint256) {
		BorrowPosition memory _borrowPosition = borrowPosition[account][lendingToken];
		return _borrowPosition.loanBody + _borrowPosition.accrual;
	}

	// REVIEW
	/**
	 * @dev Convert the outstanding amount of a user's borrow position to USD
	 * @param account The address of the user account
	 * @param lendingToken The address of the lending token
	 * @return The outstanding amount in USD
	 */
	function outstandingInUSD(address account, address lendingToken) public view returns (uint256) {
		uint256 amount = outstanding(account, lendingToken);
		return getTokenEvaluation(lendingToken, amount);
	}

	// REVIEW
	/**
	 * @dev Convert the total outstanding amount of all user's borrow positions to USD
	 * @param account The address of the user account
	 * @return totalEvaluation total outstanding amount in USD
	 */
	function totalOutstandingInUSD(address account) public view returns (uint256 totalEvaluation) {
		for (uint256 i = 0; i < lendingTokens.length; i++) {
			totalEvaluation += outstandingInUSD(account, lendingTokens[i]);
		}
	}

	// REVIEW
	/**
	 * @dev Returns the total weighted loan amount of user's all borrow positions to USD
	 * @param account The address of the user account
	 * @return totalEvaluation total outstanding amount in USD
	 */
	function totalWeightedLoanInUSD(address account) public view returns (uint256 totalEvaluation) {
		for (uint256 i = 0; i < lendingTokens.length; i++) {
			Ratio memory lvr = lendingTokenInfo[lendingTokens[i]].loanToValueRatio;
			totalEvaluation +=
				(outstandingInUSD(account, lendingTokens[i]) * lvr.denominator) /
				lvr.numerator;
		}
	}

	// REVIEW
	/**
	 * @dev Returns the estimated outstanding amount of a user's borrow position for a specific lending token
	 * @param account The address of the user's borrow position
	 * @param lendingToken The address of the lending token
	 * @return loanBody The amount of the lending token borrowed by the user
	 * @return accrual The accrued interest of the borrow position
	 */
	function getEstimatedOutstanding(
		address account,
		address lendingToken
	) public view returns (uint256 loanBody, uint256 accrual) {
		loanBody = borrowPosition[account][lendingToken].loanBody;
		uint256 cumulativeTotalOutstanding = 0;
		uint256 cumulativeLoanBody = 0;
		cumulativeLoanBody += borrowPosition[account][lendingToken].loanBody;
		cumulativeTotalOutstanding += outstanding(account, lendingToken);
		uint256 estimatedBorrowBalance = lendingTokenInfo[lendingToken]
			.bLendingToken
			.getEstimatedBorrowBalanceStored(account);
		accrual = borrowPosition[account][lendingToken].accrual;
		if (estimatedBorrowBalance >= cumulativeTotalOutstanding && cumulativeLoanBody > 0) {
			accrual +=
				(loanBody * (estimatedBorrowBalance - cumulativeTotalOutstanding)) /
				cumulativeLoanBody;
		}
	}

	// REVIEW
	/**
	 * @dev Returns the total outstanding amount of a user's borrow position for a specific lending token to USD
	 * @param account The address of the user's borrow position
	 * @param lendingToken The address of the lending token
	 * @return loanBody The amount of the lending token borrowed by the user
	 * @return accrual The accrued interest of the borrow position
	 * @return estimatedOutstandingInUSD estimated outstanding amount in USD
	 */
	function getEstimatedOutstandingInUSD(
		address account,
		address lendingToken
	) public view returns (uint256 loanBody, uint256 accrual, uint256 estimatedOutstandingInUSD) {
		(loanBody, accrual) = getEstimatedOutstanding(account, lendingToken);
		estimatedOutstandingInUSD = getTokenEvaluation(lendingToken, loanBody + accrual);
	}

	// REVIEW
	/**
	 * @dev Convert the total estimated outstanding amount of all user's borrow positions to USD
	 * @param account The address of the user account
	 * @return totalEvaluation total outstanding amount in USD
	 */
	function totalEstimatedOutstandingInUSD(
		address account
	) public view returns (uint256 totalEvaluation) {
		for (uint256 i = 0; i < lendingTokens.length; i++) {
			(, , uint256 estimatedOutstandingInUSD) = getEstimatedOutstandingInUSD(
				account,
				lendingTokens[i]
			);
			totalEvaluation += estimatedOutstandingInUSD;
		}
	}

	// REVIEW
	/**
	 * @dev Convert the total estimated weighted loan amount of all user's borrow positions to USD
	 * @param account The address of the user account
	 * @return totalEvaluation total weighted loan amount in USD
	 */
	function totalEstimatedWeightedLoanInUSD(
		address account
	) public view returns (uint256 totalEvaluation) {
		for (uint256 i = 0; i < lendingTokens.length; i++) {
			Ratio memory lvr = lendingTokenInfo[lendingTokens[i]].loanToValueRatio;
			(, , uint256 estimatedOutstandingInUSD) = getEstimatedOutstandingInUSD(
				account,
				lendingTokens[i]
			);
			totalEvaluation += (estimatedOutstandingInUSD * lvr.denominator) / lvr.numerator;
		}
	}

	// REVIEW
	/**
	 * @dev Returns the total estimated remaining PIT (primary index token) of a given account and all project tokens.
	 * @param account The address of the user's borrow position
	 * @return remaining The remaining PIT of the user's borrow position
	 */
	function totalEstimatedPITRemaining(address account) public view returns (uint256) {
		uint256 _pit = totalPIT(account);
		uint256 remaining = 0;
		if (_pit > 0) {
			if (lendingTokens.length == 0) {
				return _pit;
			} else {
				uint256 _totalEstimatedWeightedLoanInUSD = totalEstimatedWeightedLoanInUSD(account);
				if (_pit >= _totalEstimatedWeightedLoanInUSD) {
					remaining = _pit - _totalEstimatedWeightedLoanInUSD;
				}
			}
		}
		return remaining;
	}

	// REVIEW
	/**
	 * @dev Returns the health factor of a user account
	 * @param account The address of the user's borrow position
	 * @return numerator The numerator of the health factor
	 * @return denominator The denominator of the health factor
	 */
	function healthFactor(
		address account
	) public view returns (uint256 numerator, uint256 denominator) {
		numerator = totalPIT(account);
		denominator = totalWeightedLoanInUSD(account);
	}

	// REVIEW
	/**
	 * @dev Returns the estimated health factor of a user account at current
	 * @param account The address of the user's borrow position
	 * @return numerator The numerator of the health factor
	 * @return denominator The denominator of the health factor
	 */
	function estimatedHealthFactor(
		address account
	) public view returns (uint256 numerator, uint256 denominator) {
		numerator = totalPIT(account);
		denominator = totalEstimatedWeightedLoanInUSD(account);
	}

	// REVIEW
	/**
	 * @dev Returns the evaluation of a specific token amount in USD
	 * @param token The address of the token to evaluate
	 * @param tokenAmount The amount of the token to evaluate
	 * @return The evaluated token amount in USD
	 */
	function getTokenEvaluation(address token, uint256 tokenAmount) public view returns (uint256) {
		return priceOracle.getEvaluation(token, tokenAmount);
	}

	// REVIEW
	/**
	 * @dev Returns the length of the lending tokens array
	 * @return The length of the lending tokens array
	 */
	function lendingTokensLength() public view returns (uint256) {
		return lendingTokens.length;
	}

	// REVIEW
	/**
	 * @dev Returns the length of the project tokens array
	 * @return The length of the project tokens array
	 */
	function projectTokensLength() public view returns (uint256) {
		return projectTokens.length;
	}

	// REVIEW
	/**
	 * @dev Returns the decimals of the contract
	 * @return The decimals of the contract
	 */
	function decimals() public pure returns (uint8) {
		return 6;
	}

	// REVIEW
	/**
	 * @dev Get deposited amount in USD for a specific project token
	 * @param projectToken The address of the project token
	 * @return The deposited amount in USD
	 */
	function getDepositedPerProjectTokenInUSD(address projectToken) public view returns (uint) {
		return getTokenEvaluation(projectToken, totalDepositedPerProjectToken[projectToken]);
	}

	// REVIEW
	/**
	 * @dev Get borrow amount in USD for a specific lending token
	 * @param lendingToken The address of the lending token
	 * @return The total borrow amount in USD
	 */
	function getBorrowedPerLendingTokenInUSD(address lendingToken) public view returns (uint) {
		return getTokenEvaluation(lendingToken, totalBorrowedPerLendingToken[lendingToken]);
	}

	// REVIEW
	/**
	 * @dev Convert the total remaining pit amount to the corresponding lending token amount
	 * @param account The address of the user account
	 * @param lendingToken The address of the lending token
	 * @return The converted lending token amount
	 */
	function convertPitRemaining(
		address account,
		address lendingToken
	) public view returns (uint256) {
		uint256 pitRemainingValue = totalPITRemaining(account);
		uint8 lendingTokenDecimals = ERC20Upgradeable(lendingToken).decimals();
		uint256 lendingTokenAmount = (pitRemainingValue * (10 ** lendingTokenDecimals)) /
			getTokenEvaluation(lendingToken, 10 ** lendingTokenDecimals);
		return lendingTokenAmount;
	}

	/**
	 * @dev Convert the total estimated remaining pit amount to the corresponding lending token amount
	 * @param account The address of the user account
	 * @param lendingToken The address of the lending token
	 * @return The converted lending token amount
	 */
	function convertEstimatedPitRemaining(
		address account,
		address lendingToken
	) public view returns (uint256) {
		uint256 pitRemainingValue = totalEstimatedPITRemaining(account);
		uint8 lendingTokenDecimals = ERC20Upgradeable(lendingToken).decimals();
		uint256 lendingTokenAmount = (pitRemainingValue * (10 ** lendingTokenDecimals)) /
			getTokenEvaluation(lendingToken, 10 ** lendingTokenDecimals);
		return lendingTokenAmount;
	}

	function _pitRemainingExceptIndexToken(
		address account,
		address prjToken
	) internal view returns (uint256) {
		uint256 totalEvaluation = 0;
		for (uint256 i = 0; i < projectTokens.length; i++) {
			address projectToken = projectTokens[i];
			if (projectToken == prjToken) {
				continue;
			}
			uint8 lvrNumerator = projectTokenInfo[projectToken].loanToValueRatio.numerator;
			uint8 lvrDenominator = projectTokenInfo[projectToken].loanToValueRatio.denominator;
			totalEvaluation += getTokenEvaluation(
				projectToken,
				(depositedAmount[account][projectToken] * lvrNumerator) / lvrDenominator
			);
		}
		return totalEvaluation;
	}

	/**
	 * @dev Calculates the collateral available for withdrawal based on the loan-to-value ratio of a specific project token.
	 * @param account Address of the user.
	 * @param projectToken Address of the project token.
	 * @return collateralProjectToWithdraw The amount of collateral available for withdrawal in the project token.
	 */
	function getCollateralAvailableToWithdraw(
		address account,
		address projectToken
	) public view returns (uint256 collateralProjectToWithdraw) {
		Ratio memory lvr = projectTokenInfo[projectToken].loanToValueRatio;
		uint256 totalEstimatedWeightedLoan = totalEstimatedWeightedLoanInUSD(account);
		uint256 pitRemainingExceptPrjToken = _pitRemainingExceptIndexToken(account, projectToken);
		uint256 depositedProjectTokenAmount = depositedAmount[account][projectToken];
		if (pitRemainingExceptPrjToken >= totalEstimatedWeightedLoan) {
			collateralProjectToWithdraw = depositedProjectTokenAmount;
		} else if (totalPIT(account) > totalEstimatedWeightedLoan) {
			uint256 projectTokenDecimals = ERC20Upgradeable(projectToken).decimals();
			uint256 targetProjectTokenAmount = ((totalEstimatedWeightedLoan -
				pitRemainingExceptPrjToken) *
				lvr.denominator *
				(10 ** projectTokenDecimals)) /
				getTokenEvaluation(projectToken, 10 ** projectTokenDecimals) /
				lvr.numerator;
			collateralProjectToWithdraw = depositedProjectTokenAmount - targetProjectTokenAmount;
		}
	}

	/**
	 * @dev Get the loan to value ratio of a position taken by a project token and a lending token
	 * @param projectToken The address of the project token
	 * @param lendingToken The address of the lending token
	 * @return lvrNumerator The numerator of the loan to value ratio
	 * @return lvrDenominator The denominator of the loan to value ratio
	 */
	function getLoanToValueRatio(
		address projectToken,
		address lendingToken
	) public view returns (uint256 lvrNumerator, uint256 lvrDenominator) {
		Ratio memory lvrProjectToken = projectTokenInfo[projectToken].loanToValueRatio;
		Ratio memory lvrLendingToken = lendingTokenInfo[lendingToken].loanToValueRatio;
		lvrNumerator = lvrProjectToken.numerator * lvrLendingToken.numerator;
		lvrDenominator = lvrProjectToken.denominator * lvrLendingToken.denominator;
	}
}
