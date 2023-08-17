// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../interfaces/IPriceProviderAggregator.sol";
import "../bToken/BLendingToken.sol";
import "../interfaces/IPrimaryLendingPlatformLeverage.sol";

abstract contract PrimaryLendingPlatformV2Core is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for ERC20Upgradeable;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    IPriceProviderAggregator public priceOracle; // address of price oracle with interface of PriceProviderAggregator

    address[] public projectTokens;
    mapping(address => ProjectTokenInfo) public projectTokenInfo; // project token address => ProjectTokenInfo

    address[] public lendingTokens;
    mapping(address => LendingTokenInfo) public lendingTokenInfo; // lending token address => LendingTokenInfo

    mapping(address => uint256) public totalDepositedProjectToken; // tokenAddress => PRJ token staked
    mapping(address => mapping(address => uint256)) public depositedAmount; // user address => PRJ token address => PRJ token deposited
    mapping(address => mapping(address => mapping(address => BorrowPosition))) public borrowPosition; // user address => project token address => lending token address => BorrowPosition

    mapping(address => mapping(address => uint256)) public totalBorrow; //project token address => total borrow by project token [] = prjToken
    mapping(address => mapping(address => uint256)) public borrowLimit; //project token address => limit of borrowing; [borrowLimit]=$
    mapping(address => uint256) public borrowLimitPerCollateral; //project token address => limit of borrowing; [borrowLimit]=$

    mapping(address => uint256) public totalBorrowPerLendingToken; //lending token address => total borrow by lending token [] - irrespective of the collateral assets used
    mapping(address => uint256) public borrowLimitPerLendingToken; //lending token address => limit of borrowing; [borrowLimit]=$
    mapping(address => mapping(address => address)) public lendingTokenPerCollateral; // user address => project token address => lending token address

    mapping(address => bool) public isRelatedContract;

    IPrimaryLendingPlatformLeverage public primaryLendingPlatformLeverage;

    address public primaryLendingPlatformModerator;

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

    struct BorrowPosition {
        uint256 loanBody; // [loanBody] = lendingToken
        uint256 accrual; // [accrual] = lendingToken
    }

    event Deposit(address indexed who, address indexed tokenPrj, uint256 prjDepositAmount, address indexed beneficiary);

    event Withdraw(address indexed who, address indexed tokenPrj, address lendingToken, uint256 prjWithdrawAmount, address indexed beneficiary);

    event Supply(
        address indexed who,
        address indexed supplyToken,
        uint256 supplyAmount,
        address indexed supplyBToken,
        uint256 amountSupplyBTokenReceived
    );

    event Redeem(address indexed who, address indexed redeemToken, address indexed redeemBToken, uint256 redeemAmount);

    event RedeemUnderlying(address indexed who, address indexed redeemToken, address indexed redeemBToken, uint256 redeemAmountUnderlying);

    event Borrow(address indexed who, address indexed borrowToken, uint256 borrowAmount, address indexed prjAddress, uint256 prjAmount);

    event RepayBorrow(address indexed who, address indexed borrowToken, uint256 borrowAmount, address indexed prjAddress, bool isPositionFullyRepaid);

    event SetModeratorContract(address indexed newAddress);

    /**
     * @dev Initializes the contract and sets the name, symbol, and default roles.
     */
    function initialize() public initializer {
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
        require(projectTokenInfo[projectToken].isListed, "PIT: Project token is not listed");
        _;
    }

    modifier isLendingTokenListed(address lendingToken) {
        require(lendingTokenInfo[lendingToken].isListed, "PIT: Lending token is not listed");
        _;
    }

    modifier onlyRelatedContracts() {
        require(isRelatedContract[msg.sender], "PIT: Caller is not related Contract");
        _;
    }

    modifier onlyModeratorContract() {
        require(msg.sender == primaryLendingPlatformModerator, "PIT: Caller is not primaryLendingPlatformModerator");
        _;
    }

    //************* ADMIN CONTRACT FUNCTIONS ********************************

    /**
     * @dev Sets the address of the new moderator contract by the admin.
     * @param newModeratorContract The address of the new moderator contract.
     */
    function setPrimaryLendingPlatformModeratorModerator(address newModeratorContract) external onlyAdmin {
        require(newModeratorContract != address(0), "PIT: Invalid address");
        primaryLendingPlatformModerator = newModeratorContract;
        emit SetModeratorContract(newModeratorContract);
    }

    //************* MODERATOR CONTRACT FUNCTIONS ********************************

    /**
     * @dev Sets the address of the new price oracle by the moderator contract.
     * @param newPriceOracle The address of the new price oracle contract.
     */
    function setPriceOracle(address newPriceOracle) external onlyModeratorContract {
        priceOracle = IPriceProviderAggregator(newPriceOracle);
    }

    /**
     * @dev Sets the address of the new primary index token leverage contract by the moderator contract.
     * @param newPrimaryLendingPlatformLeverage The address of the new primary index token leverage contract.
     */
    function setPrimaryLendingPlatformLeverage(address newPrimaryLendingPlatformLeverage) external onlyModeratorContract {
        primaryLendingPlatformLeverage = IPrimaryLendingPlatformLeverage(newPrimaryLendingPlatformLeverage);
        setRelatedContract(newPrimaryLendingPlatformLeverage, true);
    }

    /**
     * @dev Sets whether an address is a related contract or not by the moderator contract.
     * @param relatedContract The address of the contract to be set as related.
     * @param isRelated Boolean to indicate whether the contract is related or not.
     */
    function setRelatedContract(address relatedContract, bool isRelated) public onlyModeratorContract {
        isRelatedContract[relatedContract] = isRelated;
    }

    /**
     * @dev Removes a project token from the list by the moderator contract.
     * @param projectTokenId The ID of the project token to be removed.
     * @param projectToken The address of the project token to be removed.
     */
    function removeProjectToken(uint256 projectTokenId, address projectToken) external onlyModeratorContract {
        require(projectTokens[projectTokenId] == projectToken, "PIT: Invalid address");
        delete projectTokenInfo[projectToken];
        projectTokens[projectTokenId] = projectTokens[projectTokens.length - 1];
        projectTokens.pop();
    }

    /**
     * @dev Removes a lending token from the list by the moderator contract.
     * @param lendingTokenId The ID of the lending token to be removed.
     * @param lendingToken The address of the lending token to be removed.
     */
    function removeLendingToken(uint256 lendingTokenId, address lendingToken) external onlyModeratorContract {
        require(lendingTokens[lendingTokenId] == lendingToken, "PIT: Invalid address");
        delete lendingTokenInfo[lendingToken];
        lendingTokens[lendingTokenId] = lendingTokens[lendingTokens.length - 1];
        lendingTokens.pop();
    }

    /**
     * @dev Sets the borrow limit per collateral by the moderator contract.
     * @param projectToken The address of the project token.
     * @param newBorrowLimit The new borrow limit.
     */
    function setBorrowLimitPerCollateralAsset(address projectToken, uint256 newBorrowLimit) external onlyModeratorContract {
        borrowLimitPerCollateral[projectToken] = newBorrowLimit;
    }

    /**
     * @dev Sets the borrow limit per lending asset by the moderator contract.
     * @param lendingToken The address of the lending token.
     * @param newBorrowLimit The new borrow limit.
     */
    function setBorrowLimitPerLendingAsset(address lendingToken, uint256 newBorrowLimit) external onlyModeratorContract {
        borrowLimitPerLendingToken[lendingToken] = newBorrowLimit;
    }

    /**
     * @dev Sets the parameters for a project token
     * @param projectToken The address of the project token
     * @param isDepositPaused The new pause status for deposit
     * @param isWithdrawPaused The new pause status for withdrawal
     * @param loanToValueRatioNumerator The numerator of the loan-to-value ratio for the project token
     * @param loanToValueRatioDenominator The denominator of the loan-to-value ratio for the project token
     */
    function setProjectTokenInfo(
        address projectToken,
        bool isDepositPaused,
        bool isWithdrawPaused,
        uint8 loanToValueRatioNumerator,
        uint8 loanToValueRatioDenominator
    ) external onlyModeratorContract {
        ProjectTokenInfo storage info = projectTokenInfo[projectToken];
        if (!info.isListed) {
            projectTokens.push(projectToken);
            info.isListed = true;
        }
        info.isDepositPaused = isDepositPaused;
        info.isWithdrawPaused = isWithdrawPaused;
        info.loanToValueRatio = Ratio(loanToValueRatioNumerator, loanToValueRatioDenominator);
    }

    /**
     * @dev Pauses or unpauses deposits and withdrawals of a project token.
     * @param projectToken The address of the project token.
     * @param isDepositPaused Boolean indicating whether deposits are paused or unpaused.
     * @param isWithdrawPaused Boolean indicating whether withdrawals are paused or unpaused.
     */
    function setPausedProjectToken(address projectToken, bool isDepositPaused, bool isWithdrawPaused) external onlyModeratorContract {
        projectTokenInfo[projectToken].isDepositPaused = isDepositPaused;
        projectTokenInfo[projectToken].isWithdrawPaused = isWithdrawPaused;
    }

    /**
     * @dev Sets the bLendingToken and paused status of a lending token.
     * @param lendingToken The address of the lending token.
     * @param bLendingToken The address of the bLendingToken.
     * @param isPaused Boolean indicating whether the lending token is paused or unpaused.
     * @param loanToValueRatioNumerator The numerator of the loan-to-value ratio for the lending token.
     * @param loanToValueRatioDenominator The denominator of the loan-to-value ratio for the lending token.
     */
    function setLendingTokenInfo(
        address lendingToken,
        address bLendingToken,
        bool isPaused,
        uint8 loanToValueRatioNumerator,
        uint8 loanToValueRatioDenominator
    ) external onlyModeratorContract {
        if (!lendingTokenInfo[lendingToken].isListed) {
            lendingTokens.push(lendingToken);
            lendingTokenInfo[lendingToken].isListed = true;
        }

        LendingTokenInfo storage info = lendingTokenInfo[lendingToken];
        info.isPaused = isPaused;
        info.bLendingToken = BLendingToken(bLendingToken);
        info.loanToValueRatio = Ratio(loanToValueRatioNumerator, loanToValueRatioDenominator);
    }

    /**
     * @dev Pauses or unpauses a lending token.
     * @param lendingToken The address of the lending token.
     * @param isPaused Boolean indicating whether the lending token is paused or unpaused.
     */
    function setPausedLendingToken(address lendingToken, bool isPaused) external onlyModeratorContract isLendingTokenListed(lendingToken) {
        lendingTokenInfo[lendingToken].isPaused = isPaused;
    }

    //************* PUBLIC FUNCTIONS ********************************
    //************* Deposit FUNCTION ********************************

    /**
     * @dev Deposits project tokens and calculates the deposit position.
     * @param projectToken The address of the project token to be deposited.
     * @param projectTokenAmount The amount of project tokens to be deposited.
     */
    function deposit(address projectToken, uint256 projectTokenAmount) external isProjectTokenListed(projectToken) nonReentrant {
        _deposit(projectToken, projectTokenAmount, msg.sender, msg.sender);
    }

    /**
     * @dev Deposits project tokens on behalf of a user from a related contract and calculates the deposit position.
     * @param projectToken The address of the project token to be deposited.
     * @param projectTokenAmount The amount of project tokens to be deposited.
     * @param user The address of the user who representative deposit.
     * @param beneficiary The address of the beneficiary whose deposit position will be updated.
     */
    function depositFromRelatedContracts(
        address projectToken,
        uint256 projectTokenAmount,
        address user,
        address beneficiary
    ) external isProjectTokenListed(projectToken) nonReentrant onlyRelatedContracts {
        _deposit(projectToken, projectTokenAmount, user, beneficiary);
    }

    /**
     * @dev Transfers a given amount of a project token from a user to the contract, and calculates the deposit position and emits the Deposit event.
     * @param projectToken The address of the project token being deposited
     * @param projectTokenAmount The amount of project tokens being deposited
     * @param user The address of the user depositing the project tokens
     * @param beneficiary The address of the user who will receive the deposit position
     */
    function _deposit(address projectToken, uint256 projectTokenAmount, address user, address beneficiary) internal {
        require(!projectTokenInfo[projectToken].isDepositPaused, "PIT: ProjectToken is paused");
        require(projectTokenAmount > 0, "PIT: ProjectTokenAmount==0");
        ERC20Upgradeable(projectToken).safeTransferFrom(user, address(this), projectTokenAmount);
        _calcDepositPosition(projectToken, projectTokenAmount, beneficiary);
        emit Deposit(user, projectToken, projectTokenAmount, beneficiary);
    }

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
    ) external isProjectTokenListed(projectToken) onlyRelatedContracts nonReentrant returns (uint256) {
        depositedAmount[user][projectToken] -= projectTokenAmount;
        totalDepositedProjectToken[projectToken] -= projectTokenAmount;
        ERC20Upgradeable(projectToken).safeTransfer(receiver, projectTokenAmount);
        return projectTokenAmount;
    }

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
    ) external isProjectTokenListed(projectToken) onlyRelatedContracts onlyRelatedContracts nonReentrant {
        _calcDepositPosition(projectToken, projectTokenAmount, user);
    }

    /**
     * @dev Updates the deposit position of a user by increasing the deposited project token amount
     * and updating the total deposited project token amount.
     * @param projectToken The address of the project token being deposited
     * @param projectTokenAmount The amount of project tokens being deposited
     * @param beneficiary The address of the user whose deposit position is being updated
     */
    function _calcDepositPosition(address projectToken, uint256 projectTokenAmount, address beneficiary) internal {
        depositedAmount[beneficiary][projectToken] += projectTokenAmount;
        totalDepositedProjectToken[projectToken] += projectTokenAmount;
    }

    //************* Withdraw FUNCTION ********************************

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
    function _withdraw(address projectToken, uint256 projectTokenAmount, address user, address beneficiary) internal returns (uint256) {
        require(!projectTokenInfo[projectToken].isWithdrawPaused, "PIT: ProjectToken is paused");
        uint256 depositedProjectTokenAmount = depositedAmount[user][projectToken];
        require(projectTokenAmount > 0 && depositedProjectTokenAmount > 0, "PIT: Invalid PRJ token amount or depositPosition doesn't exist");
        address actualLendingToken = getLendingToken(user, projectToken);

        uint256 loanBody = borrowPosition[user][projectToken][actualLendingToken].loanBody;

        if (loanBody > 0) {
            updateInterestInBorrowPositions(user, actualLendingToken);
        }

        uint256 withdrawableAmount = getCollateralAvailableToWithdraw(user, projectToken, actualLendingToken);
        require(withdrawableAmount > 0, "PIT: Withdrawable amount is 0");
        if (projectTokenAmount > withdrawableAmount) {
            projectTokenAmount = withdrawableAmount;
        }
        depositedAmount[user][projectToken] -= projectTokenAmount;
        if (loanBody > 0) {
            (uint256 healthFactorNumerator, uint256 healthFactorDenominator) = healthFactor(user, projectToken, actualLendingToken);
            require(healthFactorNumerator >= healthFactorDenominator, "PIT: Withdrawable amount makes healthFactor<1");
        }
        totalDepositedProjectToken[projectToken] -= projectTokenAmount;
        ERC20Upgradeable(projectToken).safeTransfer(beneficiary, projectTokenAmount);
        emit Withdraw(user, projectToken, actualLendingToken, projectTokenAmount, beneficiary);
        return projectTokenAmount;
    }

    /**
     * @dev Calculates the collateral available for withdrawal based on the loan-to-value ratio of a specific project token.
     * @param account Address of the user.
     * @param projectToken Address of the project token.
     * @param lendingToken Address of the lending token.
     * @return collateralProjectToWithdraw The amount of collateral available for withdrawal in the project token.
     */
    function getCollateralAvailableToWithdraw(
        address account,
        address projectToken,
        address lendingToken
    ) public view returns (uint256 collateralProjectToWithdraw) {
        uint256 depositedProjectTokenAmount = depositedAmount[account][projectToken];
        if (lendingToken == address(0) || borrowPosition[account][projectToken][lendingToken].loanBody == 0) return depositedProjectTokenAmount;

        (uint256 lvrNumerator, uint256 lvrDenominator) = getLoanToValueRatio(projectToken, lendingToken);
        uint256 depositRemaining = pitRemaining(account, projectToken, lendingToken);
        uint256 collateralProjectRemaining = (depositRemaining * lvrDenominator * (10 ** ERC20Upgradeable(projectToken).decimals())) /
            getTokenEvaluation(projectToken, 10 ** ERC20Upgradeable(projectToken).decimals()) /
            lvrNumerator;

        uint256 outstandingInUSD = totalOutstandingInUSD(account, projectToken, lendingToken);
        uint256 depositedAmountSatisfyHF = (outstandingInUSD * lvrDenominator * (10 ** ERC20Upgradeable(projectToken).decimals())) /
            getTokenEvaluation(projectToken, 10 ** ERC20Upgradeable(projectToken).decimals()) /
            lvrNumerator;
        uint256 amountToWithdraw = depositedProjectTokenAmount > depositedAmountSatisfyHF
            ? depositedProjectTokenAmount - depositedAmountSatisfyHF
            : 0;

        collateralProjectToWithdraw = collateralProjectRemaining >= amountToWithdraw ? amountToWithdraw : collateralProjectRemaining;
    }

    //************* supply FUNCTION ********************************

    /**
     * @dev Supplies a certain amount of lending tokens to the platform.
     * @param lendingToken Address of the lending token.
     * @param lendingTokenAmount Amount of lending tokens to be supplied.
     */
    function supply(address lendingToken, uint256 lendingTokenAmount) external isLendingTokenListed(lendingToken) nonReentrant {
        _supply(lendingToken, lendingTokenAmount, msg.sender);
    }

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
    ) external isLendingTokenListed(lendingToken) onlyRelatedContracts nonReentrant {
        _supply(lendingToken, lendingTokenAmount, user);
    }

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
    function _supply(address lendingToken, uint256 lendingTokenAmount, address user) internal {
        require(!lendingTokenInfo[lendingToken].isPaused, "PIT: Lending token is paused");
        require(lendingTokenAmount > 0, "PIT: LendingTokenAmount==0");

        (uint256 mintError, uint256 mintedAmount) = lendingTokenInfo[lendingToken].bLendingToken.mintTo(user, lendingTokenAmount);
        require(mintError == 0, "PIT: MintError!=0");
        require(mintedAmount > 0, "PIT: MintedAmount==0");

        emit Supply(user, lendingToken, lendingTokenAmount, address(lendingTokenInfo[lendingToken].bLendingToken), mintedAmount);
    }

    //************* redeem FUNCTION ********************************

    /**
     * @dev Function that performs the redemption of bLendingToken and returns the corresponding lending token to the msg.sender.
     * @param lendingToken Address of the lending token.
     * @param bLendingTokenAmount Amount of bLending tokens to be redeemed.
     */
    function redeem(address lendingToken, uint256 bLendingTokenAmount) external isLendingTokenListed(lendingToken) nonReentrant {
        _redeem(lendingToken, bLendingTokenAmount, msg.sender);
    }

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
    ) external isLendingTokenListed(lendingToken) onlyRelatedContracts nonReentrant {
        _redeem(lendingToken, bLendingTokenAmount, user);
    }

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
        require(!lendingTokenInfo[lendingToken].isPaused, "PIT: Lending token is paused");
        require(bLendingTokenAmount > 0, "PIT: BLendingTokenAmount==0");

        uint256 redeemError = lendingTokenInfo[lendingToken].bLendingToken.redeemTo(user, bLendingTokenAmount);
        require(redeemError == 0, "PIT: RedeemError!=0. redeem>=supply.");

        emit Redeem(user, lendingToken, address(lendingTokenInfo[lendingToken].bLendingToken), bLendingTokenAmount);
    }

    //************* redeemUnderlying FUNCTION ********************************

    /**
     * @dev Function that performs the redemption of lending token and returns the corresponding underlying token to the msg.sender.
     * @param lendingToken Address of the lending token.
     * @param lendingTokenAmount Amount of lending tokens to be redeemed.
     */
    function redeemUnderlying(address lendingToken, uint256 lendingTokenAmount) external isLendingTokenListed(lendingToken) nonReentrant {
        _redeemUnderlying(lendingToken, lendingTokenAmount, msg.sender);
    }

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
    ) external isLendingTokenListed(lendingToken) onlyRelatedContracts nonReentrant {
        _redeemUnderlying(lendingToken, lendingTokenAmount, user);
    }

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
    function _redeemUnderlying(address lendingToken, uint256 lendingTokenAmount, address user) internal {
        require(!lendingTokenInfo[lendingToken].isPaused, "PIT: Lending token is paused");
        require(lendingTokenAmount > 0, "PIT: LendingTokenAmount==0");

        uint256 redeemUnderlyingError = lendingTokenInfo[lendingToken].bLendingToken.redeemUnderlyingTo(user, lendingTokenAmount);
        require(redeemUnderlyingError == 0, "PIT:Redeem>=supply");

        emit RedeemUnderlying(user, lendingToken, address(lendingTokenInfo[lendingToken].bLendingToken), lendingTokenAmount);
    }

    //************* borrow FUNCTION ********************************

    /**
     * @dev Internal function to borrow lending tokens.
     * @param projectToken The address of the project token being used as collateral.
     * @param lendingToken The address of the lending token being borrowed.
     * @param lendingTokenAmount The amount of lending tokens to be borrowed.
     * @param user The address of the user on whose behalf the lending tokens are being borrowed.
     */
    function _borrow(address projectToken, address lendingToken, uint256 lendingTokenAmount, address user) internal {
        require(!primaryLendingPlatformLeverage.isLeveragePosition(user, projectToken), "PIT: Invalid position");
        require(lendingToken != address(0), "PIT: Invalid lending token");
        require(lendingTokenAmount > 0, "PIT: Invalid lending amount");
        address _lendingToken = lendingTokenPerCollateral[user][projectToken];
        if (_lendingToken != address(0)) {
            require(lendingToken == _lendingToken, "PIT: Invalid lending token");
        }
        uint256 loanBody = borrowPosition[user][projectToken][lendingToken].loanBody;
        if (loanBody > 0) {
            updateInterestInBorrowPositions(user, lendingToken);
        }
        uint256 availableToBorrow = getLendingAvailableToBorrow(user, projectToken, lendingToken);
        require(availableToBorrow > 0, "PIT: Available amount to borrow is 0");
        if (lendingTokenAmount > availableToBorrow) {
            lendingTokenAmount = availableToBorrow;
        }
        _calcBorrowPosition(user, projectToken, lendingToken, lendingTokenAmount, _lendingToken);

        emit Borrow(user, lendingToken, lendingTokenAmount, projectToken, depositedAmount[user][projectToken]);
    }

    /**
     * @dev Allows a related contract to calculate the new borrow position of a user.
     * @param borrower The address of the user for whom the borrow position is being calculated.
     * @param projectToken The address of the project token being used as collateral.
     * @param lendingToken The address of the lending token being borrowed.
     * @param lendingTokenAmount The amount of lending tokens being borrowed.
     * @param currentLendingToken The address of the current lending token being used as collateral.
     */
    function calcBorrowPosition(
        address borrower,
        address projectToken,
        address lendingToken,
        uint256 lendingTokenAmount,
        address currentLendingToken
    ) external isProjectTokenListed(projectToken) isLendingTokenListed(lendingToken) onlyRelatedContracts nonReentrant {
        _calcBorrowPosition(borrower, projectToken, lendingToken, lendingTokenAmount, currentLendingToken);
    }

    /**
     * @dev Increase the borrower's borrow position in a given project and lending token, updating the total borrow statistics
     * @param borrower The borrower's address
     * @param projectToken The project token's address
     * @param lendingToken The lending token's address
     * @param lendingTokenAmount The amount of lending tokens to borrow
     * @param currentLendingToken The current lending token used by the borrower for collateral
     */
    function _calcBorrowPosition(
        address borrower,
        address projectToken,
        address lendingToken,
        uint256 lendingTokenAmount,
        address currentLendingToken
    ) internal {
        BorrowPosition storage _borrowPosition = borrowPosition[borrower][projectToken][lendingToken];
        LendingTokenInfo memory info = lendingTokenInfo[lendingToken];
        _borrowPosition.loanBody += lendingTokenAmount;
        totalBorrow[projectToken][lendingToken] += lendingTokenAmount;
        totalBorrowPerLendingToken[lendingToken] += lendingTokenAmount;

        if (currentLendingToken == address(0)) {
            lendingTokenPerCollateral[borrower][projectToken] = lendingToken;
        }
        info.bLendingToken.borrowTo(borrower, lendingTokenAmount);
    }

    /**
     * @dev Calculates the lending token available amount for borrowing.
     * @param account Address of the user.
     * @param projectToken Address of the project token.
     * @param lendingToken Address of the lending token.
     * @return availableToBorrow The amount of lending token available amount for borrowing.
     */
    function getLendingAvailableToBorrow(
        address account,
        address projectToken,
        address lendingToken
    ) public view returns (uint256 availableToBorrow) {
        uint256 pitRemainingValue = pitRemaining(account, projectToken, lendingToken);
        uint256 limitBorrowPerCollateral = borrowLimitPerCollateral[projectToken] - getTotalBorrowPerCollateral(projectToken);
        uint256 limitBorrowPerLendingToken = borrowLimitPerLendingToken[lendingToken] - getTotalBorrowPerLendingToken(lendingToken);

        uint256 availableToBorrowInUSD = limitBorrowPerCollateral < limitBorrowPerLendingToken
            ? limitBorrowPerCollateral
            : limitBorrowPerLendingToken;
        availableToBorrowInUSD = availableToBorrow < pitRemainingValue ? availableToBorrow : pitRemainingValue;

        uint8 lendingTokenDecimals = ERC20Upgradeable(lendingToken).decimals();
        availableToBorrow = (availableToBorrowInUSD * (10 ** lendingTokenDecimals)) / getTokenEvaluation(lendingToken, 10 ** lendingTokenDecimals);
    }

    //************* repay FUNCTION ********************************

    /**
     * @dev Allows a borrower to repay their outstanding loan for a given project token and lending token.
     * @param projectToken The project token's address
     * @param lendingToken The lending token's address
     * @param lendingTokenAmount The amount of lending tokens to repay
     * @return amount of lending tokens actually repaid
     */
    function repay(
        address projectToken,
        address lendingToken,
        uint256 lendingTokenAmount
    ) external isProjectTokenListed(projectToken) isLendingTokenListed(lendingToken) returns (uint256) {
        return _repay(msg.sender, msg.sender, projectToken, lendingToken, lendingTokenAmount);
    }

    /**
     * @dev Allows a related contract to repay the outstanding loan for a given borrower's project token and lending token.
     * @param projectToken The project token's address
     * @param lendingToken The lending token's address
     * @param lendingTokenAmount The amount of lending tokens to repay
     * @param repairer The address that initiated the repair transaction
     * @param borrower The borrower's address
     * @return amount of lending tokens actually repaid
     */
    function repayFromRelatedContract(
        address projectToken,
        address lendingToken,
        uint256 lendingTokenAmount,
        address repairer,
        address borrower
    ) external isProjectTokenListed(projectToken) isLendingTokenListed(lendingToken) returns (uint256) {
        return _repay(repairer, borrower, projectToken, lendingToken, lendingTokenAmount); // under normal conditions: repairer == borrower
    }

    /**
     * @dev This function is called internally to handle the repayment of a borrower's outstanding loan.
     * @param repairer The address that initiated the repair transaction
     * @param borrower The borrower's address
     * @param projectToken The project token's address
     * @param lendingToken The lending token's address
     * @param lendingTokenAmount The amount of lending tokens to repay
     * @return amount of lending tokens actually repaid
     */
    function _repay(
        address repairer,
        address borrower,
        address projectToken,
        address lendingToken,
        uint256 lendingTokenAmount
    ) internal returns (uint256) {
        require(lendingTokenAmount > 0, "PIT: LendingTokenAmount==0");
        uint256 borrowPositionsAmount = 0;
        for (uint256 i = 0; i < projectTokens.length; i++) {
            if (borrowPosition[borrower][projectTokens[i]][lendingToken].loanBody > 0) {
                borrowPositionsAmount++;
            }
        }
        BorrowPosition storage _borrowPosition = borrowPosition[borrower][projectToken][lendingToken];
        if (borrowPositionsAmount == 0 || _borrowPosition.loanBody == 0) {
            revert("PIT: No borrow position");
        }
        LendingTokenInfo memory info = lendingTokenInfo[lendingToken];
        updateInterestInBorrowPositions(borrower, lendingToken);
        uint256 amountRepaid;
        bool isPositionFullyRepaid;
        uint256 _totalOutstanding = totalOutstanding(borrower, projectToken, lendingToken);
        if (borrowPositionsAmount == 1) {
            if (lendingTokenAmount > info.bLendingToken.borrowBalanceStored(borrower) || lendingTokenAmount >= _totalOutstanding) {
                amountRepaid = _repayTo(repairer, borrower, info, type(uint256).max);
                isPositionFullyRepaid = _repayFully(borrower, projectToken, lendingToken, _borrowPosition);
            } else {
                uint256 lendingTokenAmountToRepay = lendingTokenAmount;
                amountRepaid = _repayTo(repairer, borrower, info, lendingTokenAmountToRepay);
                isPositionFullyRepaid = _repayPartially(projectToken, lendingToken, lendingTokenAmountToRepay, _borrowPosition);
            }
        } else {
            if (lendingTokenAmount >= _totalOutstanding) {
                amountRepaid = _repayTo(repairer, borrower, info, _totalOutstanding);
                isPositionFullyRepaid = _repayFully(borrower, projectToken, lendingToken, _borrowPosition);
            } else {
                uint256 lendingTokenAmountToRepay = lendingTokenAmount;
                amountRepaid = _repayTo(repairer, borrower, info, lendingTokenAmountToRepay);
                isPositionFullyRepaid = _repayPartially(projectToken, lendingToken, lendingTokenAmountToRepay, _borrowPosition);
            }
        }

        emit RepayBorrow(borrower, lendingToken, amountRepaid, projectToken, isPositionFullyRepaid);
        return amountRepaid;
    }

    /**
     * @dev This function is called internally to fully repay a borrower's outstanding loan.
     * @param borrower The borrower's address
     * @param projectToken The project token's address
     * @param lendingToken The lending token's address
     * @param borrowPositionInfo The borrower's borrowing position for the given project and lending token
     * @return True.
     */
    function _repayFully(
        address borrower,
        address projectToken,
        address lendingToken,
        BorrowPosition storage borrowPositionInfo
    ) internal returns (bool) {
        totalBorrow[projectToken][lendingToken] -= borrowPositionInfo.loanBody;
        totalBorrowPerLendingToken[lendingToken] -= borrowPositionInfo.loanBody;
        borrowPositionInfo.loanBody = 0;
        borrowPositionInfo.accrual = 0;
        delete lendingTokenPerCollateral[borrower][projectToken];
        if (primaryLendingPlatformLeverage.isLeveragePosition(borrower, projectToken)) {
            primaryLendingPlatformLeverage.deleteLeveragePosition(borrower, projectToken);
        }
        return true;
    }

    /**
     * @dev This function is called internally to partially repay a borrower's outstanding loan.
     * @param projectToken Address of the project token.
     * @param lendingToken Address of the lending token.
     * @param lendingTokenAmountToRepay Amount of the lending token to repay.
     * @param borrowPositionInfo The borrower's borrow position.
     * @return False.
     */
    function _repayPartially(
        address projectToken,
        address lendingToken,
        uint256 lendingTokenAmountToRepay,
        BorrowPosition storage borrowPositionInfo
    ) internal returns (bool) {
        if (lendingTokenAmountToRepay > borrowPositionInfo.accrual) {
            lendingTokenAmountToRepay -= borrowPositionInfo.accrual;
            borrowPositionInfo.accrual = 0;
            totalBorrow[projectToken][lendingToken] -= lendingTokenAmountToRepay;
            totalBorrowPerLendingToken[lendingToken] -= lendingTokenAmountToRepay;
            borrowPositionInfo.loanBody -= lendingTokenAmountToRepay;
        } else {
            borrowPositionInfo.accrual -= lendingTokenAmountToRepay;
        }
        return false;
    }

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
        (, amountRepaid) = info.bLendingToken.repayTo(repairer, borrower, lendingTokenAmountToRepay);
    }

    /**
     * @dev This function is called to update the interest in a borrower's borrow position.
     * @param account Address of the borrower.
     * @param lendingToken Address of the lending token.
     */
    function updateInterestInBorrowPositions(address account, address lendingToken) public {
        uint256 cumulativeLoanBody = 0;
        uint256 cumulativeTotalOutstanding = 0;
        for (uint256 i = 0; i < projectTokens.length; i++) {
            BorrowPosition memory borrowPositionInfo = borrowPosition[account][projectTokens[i]][lendingToken];
            if (borrowPositionInfo.loanBody > 0) {
                cumulativeLoanBody += borrowPositionInfo.loanBody;
                cumulativeTotalOutstanding += borrowPositionInfo.loanBody + borrowPositionInfo.accrual;
            }
        }
        if (cumulativeLoanBody == 0) {
            return;
        }
        uint256 currentBorrowBalance = lendingTokenInfo[lendingToken].bLendingToken.borrowBalanceCurrent(account);
        if (currentBorrowBalance >= cumulativeTotalOutstanding) {
            uint256 estimatedAccrual = currentBorrowBalance - cumulativeTotalOutstanding;
            BorrowPosition memory borrowPositionInfo;
            for (uint256 i = 0; i < projectTokens.length; i++) {
                borrowPositionInfo = borrowPosition[account][projectTokens[i]][lendingToken];
                if (borrowPositionInfo.loanBody > 0) {
                    borrowPositionInfo.accrual += (estimatedAccrual * borrowPositionInfo.loanBody) / cumulativeLoanBody;
                    borrowPosition[account][projectTokens[i]][lendingToken] = borrowPositionInfo;
                }
            }
        }
    }

    //************* VIEW FUNCTIONS ********************************

    /**
     * @dev Returns the PIT (primary index token) value for a given account and position after a position is opened
     * @param account Address of the account.
     * @param projectToken Address of the project token.
     * @param lendingToken Address of the lending token.
     * @return The PIT value.
     * Formula: pit = $ * LVR
     */
    function pit(address account, address projectToken, address lendingToken) public view returns (uint256) {
        (uint256 lvrNumerator, uint256 lvrDenominator) = getLoanToValueRatio(projectToken, lendingToken);
        uint256 evaluation = getTokenEvaluation(projectToken, (depositedAmount[account][projectToken] * lvrNumerator) / lvrDenominator);
        return evaluation;
    }

    /**
     * @dev Returns the PIT (primary index token) value for a given account and collateral before a position is opened
     * @param account Address of the account.
     * @param projectToken Address of the project token.
     * @return The PIT value.
     * Formula: pit = $ * LVR
     */
    function pitCollateral(address account, address projectToken) public view returns (uint256) {
        uint8 lvrNumerator = projectTokenInfo[projectToken].loanToValueRatio.numerator;
        uint8 lvrDenominator = projectTokenInfo[projectToken].loanToValueRatio.denominator;
        uint256 evaluation = getTokenEvaluation(projectToken, (depositedAmount[account][projectToken] * lvrNumerator) / lvrDenominator);
        return evaluation;
    }

    /**
     * @dev Returns the actual lending token of a user's borrow position for a specific project token
     * @param user The address of the user's borrow position
     * @param projectToken The address of the project token
     * @return actualLendingToken The address of the actual lending token
     */
    function getLendingToken(address user, address projectToken) public view returns (address actualLendingToken) {
        actualLendingToken = lendingTokenPerCollateral[user][projectToken];
    }

    /**
     * @dev Returns the remaining PIT (primary index token) of a user's borrow position
     * @param account The address of the user's borrow position
     * @param projectToken The address of the project token
     * @param lendingToken The address of the lending token
     * @return remaining The remaining PIT of the user's borrow position
     */
    function pitRemaining(address account, address projectToken, address lendingToken) public view returns (uint256 remaining) {
        remaining = lendingToken == address(0)
            ? pitCollateral(account, projectToken)
            : _pitRemaining(account, projectToken, lendingToken, pit(account, projectToken, lendingToken));
    }

    /**
     * @dev Returns the remaining PIT (primary index token) of a user's borrow position for a specific project token and lending token
     * @param account The address of the user's borrow position
     * @param projectToken The address of the project token
     * @param lendingToken The address of the lending token
     * @param pitValue The PIT of the user's borrow position
     * @return remaining PIT of the user's borrow position
     */
    function _pitRemaining(address account, address projectToken, address lendingToken, uint256 pitValue) internal view returns (uint256) {
        if (pitValue > 0) {
            uint256 totalOutstandingInUSDValue = totalOutstandingInUSD(account, projectToken, lendingToken);
            if (pitValue > totalOutstandingInUSDValue) {
                return pitValue - totalOutstandingInUSDValue;
            }
        }
        return 0;
    }

    /**
     * @dev Returns the total outstanding amount of a user's borrow position for a specific project token and lending token
     * @param account The address of the user's borrow position
     * @param projectToken The address of the project token
     * @param lendingToken The address of the lending token
     * @return total outstanding amount of the user's borrow position
     */
    function totalOutstanding(address account, address projectToken, address lendingToken) public view returns (uint256) {
        BorrowPosition memory borrowPositionInfo = borrowPosition[account][projectToken][lendingToken];
        return borrowPositionInfo.loanBody + borrowPositionInfo.accrual;
    }

    /**
     * @dev Returns the health factor of a user's borrow position for a specific project token and lending token
     * @param account The address of the user's borrow position
     * @param projectToken The address of the project token
     * @param lendingToken The address of the lending token
     * @return numerator The numerator of the health factor
     * @return denominator The denominator of the health factor
     */
    function healthFactor(address account, address projectToken, address lendingToken) public view returns (uint256 numerator, uint256 denominator) {
        numerator = pit(account, projectToken, lendingToken);
        denominator = totalOutstandingInUSD(account, projectToken, lendingToken);
    }

    /**
     * @dev Returns the evaluation of a specific token amount in USD
     * @param token The address of the token to evaluate
     * @param tokenAmount The amount of the token to evaluate
     * @return The evaluated token amount in USD
     */
    function getTokenEvaluation(address token, uint256 tokenAmount) public view returns (uint256) {
        return priceOracle.getEvaluation(token, tokenAmount);
    }

    /**
     * @dev Returns the length of the lending tokens array
     * @return The length of the lending tokens array
     */
    function lendingTokensLength() public view returns (uint256) {
        return lendingTokens.length;
    }

    /**
     * @dev Returns the length of the project tokens array
     * @return The length of the project tokens array
     */
    function projectTokensLength() public view returns (uint256) {
        return projectTokens.length;
    }

    /**
     * @dev Returns the details of a user's borrow position for a specific project token and lending token
     * @param account The address of the user's borrow position
     * @param projectToken The address of the project token
     * @param lendingToken The address of the lending token
     * @return depositedProjectTokenAmount The amount of project tokens deposited by the user
     * @return loanBody The amount of the lending token borrowed by the user
     * @return accrual The accrued interest of the borrow position
     * @return healthFactorNumerator The numerator of the health factor
     * @return healthFactorDenominator The denominator of the health factor
     */
    function getPosition(
        address account,
        address projectToken,
        address lendingToken
    )
        public
        view
        returns (
            uint256 depositedProjectTokenAmount,
            uint256 loanBody,
            uint256 accrual,
            uint256 healthFactorNumerator,
            uint256 healthFactorDenominator
        )
    {
        depositedProjectTokenAmount = getDepositedAmount(projectToken, account);
        loanBody = borrowPosition[account][projectToken][lendingToken].loanBody;
        uint256 cumulativeTotalOutstanding = 0;
        uint256 cumulativeLoanBody = 0;
        for (uint256 i = 0; i < projectTokens.length; i++) {
            uint256 loanBodyPerCollateral = borrowPosition[account][projectTokens[i]][lendingToken].loanBody;
            if (loanBodyPerCollateral > 0) {
                cumulativeLoanBody += loanBodyPerCollateral;
                cumulativeTotalOutstanding += totalOutstanding(account, projectTokens[i], lendingToken);
            }
        }
        uint256 estimatedBorrowBalance = lendingTokenInfo[lendingToken].bLendingToken.getEstimatedBorrowBalanceStored(account);
        accrual = borrowPosition[account][projectToken][lendingToken].accrual;
        if (estimatedBorrowBalance >= cumulativeTotalOutstanding && cumulativeLoanBody > 0) {
            accrual += (loanBody * (estimatedBorrowBalance - cumulativeTotalOutstanding)) / cumulativeLoanBody;
        }
        healthFactorNumerator = pit(account, projectToken, lendingToken);
        uint256 amount = loanBody + accrual;
        healthFactorDenominator = getTokenEvaluation(lendingToken, amount);
    }

    /**
     * @dev Returns the amount of project tokens deposited by a user for a specific project token and collateral token
     * @param projectToken The address of the project token
     * @param user The address of the user
     * @return amount of project tokens deposited by the user
     */
    function getDepositedAmount(address projectToken, address user) public view returns (uint) {
        return depositedAmount[user][projectToken];
    }

    /**
     * @dev Returns whether an address is a related contract or not.
     * @param relatedContract The address of the contract to check.
     * @return isRelated Boolean indicating whether the contract is related or not.    
     */
    function getRelatedContract(address relatedContract) public view returns(bool) {
        return isRelatedContract[relatedContract];
    }

    /**
     * @dev Get total borrow amount in USD per collateral for a specific project token
     * @param projectToken The address of the project token
     * @return The total borrow amount in USD
     */
    function getTotalBorrowPerCollateral(address projectToken) public view returns (uint) {
        require(lendingTokensLength() > 0, "PIT: List lendingTokens is empty");
        uint256 totalBorrowInUSD;
        for (uint256 i = 0; i < lendingTokensLength(); i++) {
            uint256 amount = totalBorrow[projectToken][lendingTokens[i]];
            if (amount > 0) {
                totalBorrowInUSD += getTokenEvaluation(lendingTokens[i], amount);
            }
        }
        return totalBorrowInUSD;
    }

    /**
     * @dev Get total borrow amount in USD for a specific lending token
     * @param lendingToken The address of the lending token
     * @return The total borrow amount in USD
     */
    function getTotalBorrowPerLendingToken(address lendingToken) public view returns (uint) {
        uint256 amount = totalBorrowPerLendingToken[lendingToken];
        return getTokenEvaluation(lendingToken, amount);
    }

    /**
     * @dev Convert the total outstanding amount of a user's borrow position to USD
     * @param account The address of the user account
     * @param projectToken The address of the project token
     * @param lendingToken The address of the lending token
     * @return The total outstanding amount in USD
     */
    function totalOutstandingInUSD(address account, address projectToken, address lendingToken) public view returns (uint256) {
        (, uint256 loanBody, uint256 accrual, , ) = getPosition(account, projectToken, lendingToken);
        uint256 estimatedAmount = loanBody + accrual;
        return getTokenEvaluation(lendingToken, estimatedAmount);
    }

    /**
     * @dev Get the loan to value ratio of a position taken by a project token and a lending token
     * @param projectToken The address of the project token
     * @param lendingToken The address of the lending token
     * @return lvrNumerator The numerator of the loan to value ratio
     * @return lvrDenominator The denominator of the loan to value ratio
     */
    function getLoanToValueRatio(address projectToken, address lendingToken) public view returns (uint256 lvrNumerator, uint256 lvrDenominator) {
        Ratio memory lvrProjectToken = projectTokenInfo[projectToken].loanToValueRatio;
        Ratio memory lvrLendingToken = lendingTokenInfo[lendingToken].loanToValueRatio;
        lvrNumerator = lvrProjectToken.numerator * lvrLendingToken.numerator;
        lvrDenominator = lvrProjectToken.denominator * lvrLendingToken.denominator;
    }
}
