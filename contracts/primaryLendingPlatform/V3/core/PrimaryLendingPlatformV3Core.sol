// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../../../interfaces/IPriceProviderAggregator.sol";
import "../../../bToken/BLendingToken.sol";
import "../../../interfaces/V3/IPrimaryLendingPlatformLeverageV3.sol";
import "../../../util/V3/Errors.sol";

/**
 * @title PrimaryLendingPlatformV3Core.
 * @notice Core contract for the Primary Lending Platform V3.
 * @dev Abstract contract that defines the core functionality of the primary lending platform.
 */
abstract contract PrimaryLendingPlatformV3Core is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for ERC20Upgradeable;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    IPriceProviderAggregator public priceOracle; // address of price oracle with interface of PriceProviderAggregator

    address[] public projectTokens;
    mapping(address => ProjectTokenInfo) public projectTokenInfo; // project token address => ProjectTokenInfo

    address[] public lendingTokens;
    mapping(address => LendingTokenInfo) public lendingTokenInfo; // lending token address => LendingTokenInfo

    mapping(address => mapping(address => uint256)) public depositedAmount; // user address => PRJ token address => PRJ token deposited
    mapping(address => mapping(address => BorrowPosition)) public borrowPosition; // user address => lending token address => BorrowPosition

    mapping(address => uint256) public totalDepositedPerProjectToken; // tokenAddress => PRJ token staked
    mapping(address => uint256) public totalBorrowedPerLendingToken; //lending token address => total borrow by lending token [] - irrespective of the collateral assets used

    mapping(address => uint256) public borrowLimitPerLendingToken; //lending token address => limit of borrowing; [borrowLimit]=$

    mapping(address => bool) public isRelatedContract;

    IPrimaryLendingPlatformLeverageV3 public primaryLendingPlatformLeverage;

    address public primaryLendingPlatformModerator;

    mapping(address => uint256) public depositLimitPerProjectToken; //project token address => limit of depositing; [depositLimit]=$

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

    // _lendingToken
    struct BorrowPosition {
        uint256 loanBody; // [loanBody] = _lendingToken
        uint256 accrual; // [accrual] = _lendingToken
    }

    /**
     * @dev Emitted when a user deposits project tokens.
     * @param who The address of the user who deposited the tokens.
     * @param tokenPrj The address of the project token that was deposited.
     * @param prjDepositAmount The amount of project tokens that were deposited.
     * @param beneficiary The address of the beneficiary who will receive the deposited tokens.
     */
    event Deposit(address indexed who, address indexed tokenPrj, uint256 prjDepositAmount, address indexed beneficiary);

    /**
     * @dev Emitted when a user withdraws project tokens.
     * @param who The address of the user who withdrew the tokens.
     * @param tokenPrj The address of the project token that was withdrawn.
     * @param prjWithdrawAmount The amount of project tokens that were withdrawn.
     * @param beneficiary The address of the beneficiary who will receive the withdrawn tokens.
     */
    event Withdraw(address indexed who, address indexed tokenPrj, uint256 prjWithdrawAmount, address indexed beneficiary);

    /**
     * @dev Emitted when a user supplies lending tokens.
     * @param who The address of the user who supplied the tokens.
     * @param supplyToken The address of the token that was supplied.
     * @param supplyAmount The amount of tokens that were supplied.
     * @param supplyBToken The address of the bToken that was received in exchange for the supplied tokens.
     * @param amountSupplyBTokenReceived The amount of bTokens that were received in exchange for the supplied tokens.
     */
    event Supply(
        address indexed who,
        address indexed supplyToken,
        uint256 supplyAmount,
        address indexed supplyBToken,
        uint256 amountSupplyBTokenReceived
    );

    /**
     * @dev Emitted when a user redeems bTokens for the underlying token.
     * @param who The address of the user who redeemed the tokens.
     * @param redeemToken The address of the token that was redeemed.
     * @param redeemBToken The address of the bToken that was redeemed.
     * @param redeemAmount The amount of bTokens that were redeemed.
     */
    event Redeem(address indexed who, address indexed redeemToken, address indexed redeemBToken, uint256 redeemAmount);

    /**
     * @dev Emitted when a user redeems underlying token for the bToken.
     * @param who The address of the user who redeemed the tokens.
     * @param redeemToken The address of the token that was redeemed.
     * @param redeemBToken The address of the bToken that was redeemed.
     * @param redeemAmountUnderlying The amount of underlying tokens that were redeemed.
     */
    event RedeemUnderlying(address indexed who, address indexed redeemToken, address indexed redeemBToken, uint256 redeemAmountUnderlying);

    /**
     * @dev Emitted when a user borrows lending tokens.
     * @param who The address of the user who borrowed the tokens.
     * @param borrowToken The address of the token that was borrowed.
     * @param borrowAmount The amount of tokens that were borrowed.
     */
    event Borrow(address indexed who, address indexed borrowToken, uint256 borrowAmount);

    /**
     * @dev Emitted when a user repays borrowed lending tokens.
     * @param who The address of the user who repaid the tokens.
     * @param borrowToken The address of the token that was repaid.
     * @param borrowAmount The amount of tokens that were repaid.
     * @param isPositionFullyRepaid A boolean indicating whether the entire borrow position was repaid.
     * @param positionId The ID of the borrow position.
     */
    event RepayBorrow(address indexed who, address indexed borrowToken, uint256 borrowAmount, bool isPositionFullyRepaid, bytes32 indexed positionId);

    /**
     * @dev Emitted when the moderator contract address is updated.
     * @param newAddress The address of the new moderator contract.
     */
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

    /**
     * @dev Modifier that allows only the admin to call the function.
     */
    modifier onlyAdmin() {
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert Errors.CallerIsNotAdmin();
        }
        _;
    }

    /**
     * @dev Modifier that requires the project token to be listed.
     * @param projectToken The address of the project token.
     */
    modifier isProjectTokenListed(address projectToken) {
        if (!projectTokenInfo[projectToken].isListed) {
            revert Errors.ProjectTokenIsNotListed();
        }
        _;
    }

    /**
     * @dev Modifier that requires the lending token to be listed.
     * @param lendingToken The address of the lending token.
     */
    modifier isLendingTokenListed(address lendingToken) {
        if (!lendingTokenInfo[lendingToken].isListed) {
            revert Errors.LendingTokenIsNotListed();
        }
        _;
    }

    /**
     * @dev Modifier that allows only related contracts to call the function.
     */
    modifier onlyRelatedContracts() {
        if (!isRelatedContract[msg.sender]) {
            revert Errors.CallerIsNotRelatedContract();
        }
        _;
    }

    /**
     * @dev Modifier that allows only the moderator contract to call the function.
     */
    modifier onlyModeratorContract() {
        if (msg.sender != primaryLendingPlatformModerator) {
            revert Errors.CallerIsNotModerator();
        }
        _;
    }

    //************* ADMIN CONTRACT FUNCTIONS ********************************

    /**
     * @dev Sets the address of the new moderator contract for the Primary Lending Platform.
     *
     * Requirements:
     * - `newModeratorContract` cannot be the zero address.
     * - Only the admin can call this function.
     * @param newModeratorContract The address of the new moderator contract.
     */
    function setPrimaryLendingPlatformModerator(address newModeratorContract) external onlyAdmin {
        if (newModeratorContract == address(0)) {
            revert Errors.InvalidAddress();
        }
        primaryLendingPlatformModerator = newModeratorContract;
        emit SetModeratorContract(newModeratorContract);
    }

    //************* MODERATOR CONTRACT FUNCTIONS ********************************

    /**
     * @dev Sets the price oracle contract address.
     *
     * Requirements:
     * - Only the moderator contract can call this function.
     * @param newPriceOracle The address of the new price oracle contract.
     */
    function setPriceOracle(address newPriceOracle) external onlyModeratorContract {
        priceOracle = IPriceProviderAggregator(newPriceOracle);
    }

    /**
     * @dev Sets the address of the new primary lending platform leverage contract by the moderator contract.
     *
     * Requirements:
     * - Only the moderator contract can call this function.
     * @param newPrimaryLendingPlatformLeverage The address of the new primary lending platform leverage contract.
     */
    function setPrimaryLendingPlatformLeverage(address newPrimaryLendingPlatformLeverage) external onlyModeratorContract {
        primaryLendingPlatformLeverage = IPrimaryLendingPlatformLeverageV3(newPrimaryLendingPlatformLeverage);
    }

    /**
     * @dev Sets the related contract status for a given contract address.
     *
     * Requirements:
     * - The caller must be the moderator contract.
     * @param relatedContract The address of the contract to set the related status for.
     * @param isRelated The related status to set for the contract.
     */
    function setRelatedContract(address relatedContract, bool isRelated) external onlyModeratorContract {
        isRelatedContract[relatedContract] = isRelated;
    }

    /**
     * @dev Removes a project token from the platform.
     *
     * Requirements:
     * - The caller must be the moderator contract.
     * - The project token must exist in the platform.
     * @param projectTokenId The ID of the project token to remove.
     * @param projectToken The address of the project token to remove.
     */
    function removeProjectToken(uint256 projectTokenId, address projectToken) external onlyModeratorContract {
        if (projectTokens[projectTokenId] != projectToken) {
            revert Errors.InvalidAddress();
        }
        delete projectTokenInfo[projectToken];
        projectTokens[projectTokenId] = projectTokens[projectTokens.length - 1];
        projectTokens.pop();
    }

    /**
     * @dev Removes a lending token from the platform.
     *
     * Requirements:
     * - The caller must be the moderator contract.
     * - The lending token address must be valid.
     * @param lendingTokenId The ID of the lending token to be removed.
     * @param lendingToken The address of the lending token to be removed.
     */
    function removeLendingToken(uint256 lendingTokenId, address lendingToken) external onlyModeratorContract {
        if (lendingTokens[lendingTokenId] != lendingToken) {
            revert Errors.InvalidAddress();
        }
        delete lendingTokenInfo[lendingToken];
        lendingTokens[lendingTokenId] = lendingTokens[lendingTokens.length - 1];
        lendingTokens.pop();
    }

    /**
     * @dev Sets the borrow limit for a specific lending asset.
     *
     * Requirements:
     * - The caller must be the moderator contract.
     * @param lendingToken The address of the lending asset.
     * @param newBorrowLimit The new borrow limit for the lending asset.
     */
    function setBorrowLimitPerLendingAsset(address lendingToken, uint256 newBorrowLimit) external onlyModeratorContract {
        borrowLimitPerLendingToken[lendingToken] = newBorrowLimit;
    }

    /**
     * @dev Sets the borrow limit per project asset by the moderator contract.
     *
     * Requirements:
     * - The caller must be the moderator contract.
     * @param projectToken The address of the project token.
     * @param depositLimit The new deposit limit.
     */
    function setDepositLimitPerProjectAsset(address projectToken, uint256 depositLimit) external onlyModeratorContract {
        depositLimitPerProjectToken[projectToken] = depositLimit;
    }

    /**
     * @dev Sets the loan-to-value ratio, liquidation threshold factor, and liquidation incentive of a project token.
     * Adds the project token to the list of listed project tokens if it is not already listed. Call by the moderator contract.
     *
     * Requirements:
     * - The caller must be the moderator contract.
     * @param projectToken The address of the project token to set the information for.
     * @param isDepositPaused The new pause status for deposit
     * @param isWithdrawPaused The new pause status for withdrawal
     * @param loanToValueRatioNumerator The numerator of the loan-to-value ratio for the project token.
     * @param loanToValueRatioDenominator The denominator of the loan-to-value ratio for the project token.
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
     * @dev Sets the bLendingToken and paused status of a lending token.
     *
     * Requirements:
     * - The caller must be the moderator contract.
     * @param lendingToken The address of the lending token.
     * @param bLendingToken The address of the bLendingToken.
     * @param isPaused Boolean indicating whether the lending token is paused or unpaused.
     * @param loanToValueRatioNumerator The numerator of the loan-to-value ratio for the lending token
     * @param loanToValueRatioDenominator The denominator of the loan-to-value ratio for the lending token
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
        lendingTokenInfo[lendingToken].isPaused = isPaused;
        info.bLendingToken = BLendingToken(bLendingToken);
        info.loanToValueRatio = Ratio(loanToValueRatioNumerator, loanToValueRatioDenominator);
    }

    /**
     * @dev Pauses or unpauses a lending token.
     *
     * Requirements:
     * - The caller must be the moderator contract.
     * - The lending token must be listed.
     * @param lendingToken The address of the lending token.
     * @param isPaused Boolean indicating whether the lending token is paused or unpaused.
     */
    function setPausedLendingToken(address lendingToken, bool isPaused) external onlyModeratorContract isLendingTokenListed(lendingToken) {
        lendingTokenInfo[lendingToken].isPaused = isPaused;
    }

    //************* EXTERNAL FUNCTIONS ********************************
    //************* Deposit FUNCTIONS ********************************

    /**
     * @dev Internal function to deposit project tokens into the Primary Lending Platform.
     * @param projectToken The address of the project token being deposited
     * @param projectTokenAmount The amount of project tokens being deposited
     * @param user The address of the user depositing the project tokens
     * @param beneficiary The address of the user who will receive the deposit position
     * @param updatePriceTokens Array of addresses of the tokens to update the price
     */
    function _deposit(
        address projectToken,
        uint256 projectTokenAmount,
        address user,
        address beneficiary,
        address[] memory updatePriceTokens
    ) internal {
        if (projectTokenInfo[projectToken].isDepositPaused) {
            revert Errors.TokenIsPaused();
        }
        if (projectTokenAmount == 0) {
            revert Errors.InvalidAmount();
        }

        priceOracle.updateMultiFinalPrices(updatePriceTokens);

        (uint256 collateralEvaluation, ) = getTokenEvaluation(projectToken, projectTokenAmount);
        if (!(getDepositedPerProjectTokenInUSD(projectToken) + collateralEvaluation <= depositLimitPerProjectToken[projectToken])) {
            revert Errors.TotalDepositExceededLimit();
        }
        ERC20Upgradeable(projectToken).safeTransferFrom(user, address(this), projectTokenAmount);
        _calcDepositPosition(projectToken, projectTokenAmount, beneficiary);

        emit Deposit(user, projectToken, projectTokenAmount, beneficiary);
    }

    /**
     * @dev Calculates and transfers the deposit position of a user for a specific project token.
     *
     * Requirements:
     * - The project token must be listed.
     * - Called by a related contract.
     *
     * Effects:
     * - Decreases the deposited project token amount in the user's deposit position.
     * - Decreases the total deposited project token amount.
     * - Transfers the project tokens to the receiver.
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
        _calcAndTransferDepositPosition(projectToken, projectTokenAmount, user, receiver);
        return projectTokenAmount;
    }

    /**
     * @dev Updates the deposit position of a user by descreasing the deposited project token amount
     * and updating the total deposited project token amount.
     * @param projectToken The address of the project token being deposited
     * @param projectTokenAmount The amount of project tokens being deposited
     * @param user The address of the user whose deposit position is being updated
     * @param receiver The address of the user received the descreasing amount
     */
    function _calcAndTransferDepositPosition(address projectToken, uint256 projectTokenAmount, address user, address receiver) internal {
        depositedAmount[user][projectToken] -= projectTokenAmount;
        totalDepositedPerProjectToken[projectToken] -= projectTokenAmount;
        ERC20Upgradeable(projectToken).safeTransfer(receiver, projectTokenAmount);
    }

    /**
     * @dev Calculates the deposit position for a user based on the project token, project token amount and user address.
     *
     * Requirements:
     * - The project token must be listed.
     * - Called by a related contract.
     * @param projectToken The address of the project token being deposited
     * @param projectTokenAmount The amount of project tokens being deposited
     * @param user The address of the user making the deposit
     */
    function calcDepositPosition(
        address projectToken,
        uint256 projectTokenAmount,
        address user
    ) external isProjectTokenListed(projectToken) onlyRelatedContracts nonReentrant {
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
        depositedAmount[beneficiary][projectToken] += projectTokenAmount; //beneficiary = msg.sender
        totalDepositedPerProjectToken[projectToken] += projectTokenAmount;
    }

    //************* Withdraw FUNCTIONS ********************************

    /**
     * @dev Withdraws project tokens from a user's deposit position.
     * @param projectToken Address of the project token.
     * @param projectTokenAmount Amount of project tokens to be withdrawn.
     * @param user Address of the user.
     * @param beneficiary Address of the beneficiary to receive the withdrawn tokens.
     * @param updatePriceTokens Array of addresses of the tokens to update the price.
     * @return The amount of project tokens withdrawn.
     */
    function _withdraw(
        address projectToken,
        uint256 projectTokenAmount,
        address user,
        address beneficiary,
        address[] memory updatePriceTokens
    ) internal returns (uint256) {
        if (projectTokenInfo[projectToken].isDepositPaused) {
            revert Errors.TokenIsPaused();
        }
        if (projectTokenAmount <= 0 || depositedAmount[user][projectToken] <= 0) {
            revert Errors.InvalidAmountOrDepositDoesNotExist();
        }
        priceOracle.updateMultiFinalPrices(updatePriceTokens);

        for (uint256 i = 0; i < lendingTokens.length; i++) {
            address actualLendingToken = lendingTokens[i];
            if (actualLendingToken != address(0) && borrowPosition[user][actualLendingToken].loanBody > 0) {
                updateInterestInBorrowPosition(user, actualLendingToken);
            }
        }

        uint256 collateralAvailableToWithdraw = getCollateralAvailableToWithdraw(user, projectToken);
        if (collateralAvailableToWithdraw == 0) {
            revert Errors.WithdrawableAmountIsZero();
        }

        if (projectTokenAmount > collateralAvailableToWithdraw) {
            projectTokenAmount = collateralAvailableToWithdraw;
        }

        _calcAndTransferDepositPosition(projectToken, projectTokenAmount, user, beneficiary);

        emit Withdraw(user, projectToken, projectTokenAmount, beneficiary);
        return projectTokenAmount;
    }

    //************* Supply FUNCTIONS ********************************

    /**
     * @dev Internal function that performs the supply of lending token to the user by minting bLendingToken.
     * @param lendingToken Address of the lending token.
     * @param lendingTokenAmount Amount of lending tokens to be supplied.
     * @param user Address of the user.
     * @param updatePriceTokens Array of addresses of the tokens to update the price.
     */
    function _supply(address lendingToken, uint256 lendingTokenAmount, address user, address[] memory updatePriceTokens) internal {
        if (lendingTokenInfo[lendingToken].isPaused) {
            revert Errors.TokenIsPaused();
        }
        if (lendingTokenAmount == 0) {
            revert Errors.InvalidLendingAmount();
        }

        priceOracle.updateMultiFinalPrices(updatePriceTokens);

        BLendingToken bLendingToken = lendingTokenInfo[lendingToken].bLendingToken;
        (uint256 mintError, uint256 mintedAmount) = bLendingToken.mintTo(user, lendingTokenAmount);
        if (mintError != 0) {
            revert Errors.MintErrorIsNotZero();
        }
        if (mintedAmount == 0) {
            revert Errors.MintedAmountIsZero();
        }

        emit Supply(user, lendingToken, lendingTokenAmount, address(bLendingToken), mintedAmount);
    }

    //************* Redeem FUNCTION ********************************

    /**
     * @dev Internal function that performs the redemption of bLendingToken and returns the corresponding lending token to the user.
     * @param lendingToken Address of the lending token.
     * @param bLendingTokenAmount Amount of bLending tokens to be redeemed.
     * @param user Address of the user.
     * @param updatePriceTokens Array of addresses of the tokens to update the price.
     */
    function _redeem(address lendingToken, uint256 bLendingTokenAmount, address user, address[] memory updatePriceTokens) internal {
        if (lendingTokenInfo[lendingToken].isPaused) {
            revert Errors.TokenIsPaused();
        }
        if (bLendingTokenAmount == 0) {
            revert Errors.BLendingTokenAmountIsZero();
        }

        priceOracle.updateMultiFinalPrices(updatePriceTokens);

        BLendingToken bLendingToken = lendingTokenInfo[lendingToken].bLendingToken;
        uint256 redeemError = bLendingToken.redeemTo(user, bLendingTokenAmount);
        if (redeemError != 0) {
            revert Errors.RedeemErrorIsNotZero();
        }

        emit Redeem(user, lendingToken, address(bLendingToken), bLendingTokenAmount);
    }

    //************* RedeemUnderlying FUNCTION ********************************

    /**
     * @dev Internal function that performs the redemption of lending token and returns the corresponding underlying token to the user.
     * @param lendingToken Address of the lending token.
     * @param lendingTokenAmount Amount of lending tokens to be redeemed.
     * @param user Address of the user.
     * @param updatePriceTokens Array of addresses of the tokens to update the price.
     */
    function _redeemUnderlying(address lendingToken, uint256 lendingTokenAmount, address user, address[] memory updatePriceTokens) internal {
        if (lendingTokenInfo[lendingToken].isPaused) {
            revert Errors.TokenIsPaused();
        }
        if (lendingTokenAmount == 0) {
            revert Errors.InvalidLendingAmount();
        }

        priceOracle.updateMultiFinalPrices(updatePriceTokens);

        BLendingToken bLendingToken = lendingTokenInfo[lendingToken].bLendingToken;
        uint256 redeemUnderlyingError = bLendingToken.redeemUnderlyingTo(user, lendingTokenAmount);

        if (redeemUnderlyingError != 0) {
            revert Errors.RedeemUnderlyingErrorIsNotZero();
        }

        emit RedeemUnderlying(user, lendingToken, address(bLendingToken), lendingTokenAmount);
    }

    //************* Borrow FUNCTION ********************************

    /**
     * @dev Internal function to borrow lending tokens.
     * @param lendingToken The address of the lending token being borrowed.
     * @param lendingTokenAmount The amount of lending tokens to be borrowed.
     * @param user The address of the user on whose behalf the lending tokens are being borrowed.
     * @param updatePriceTokens Array of addresses of the tokens to update the price.
     */
    function _borrow(address lendingToken, uint256 lendingTokenAmount, address user, address[] memory updatePriceTokens) internal returns (uint256) {
        if (lendingTokenAmount == 0) {
            revert Errors.InvalidLendingAmount();
        }
        priceOracle.updateMultiFinalPrices(updatePriceTokens);
        updateInterestInAllBorrowPositions(user);

        uint256 availableToBorrow = getLendingAvailableToBorrow(user, lendingToken);
        if (availableToBorrow == 0) {
            revert Errors.AvailableAmountToBorrowIsZero();
        }
        if (lendingTokenAmount > availableToBorrow) {
            lendingTokenAmount = availableToBorrow;
        }

        _calcBorrowPosition(user, lendingToken, lendingTokenAmount);

        emit Borrow(user, lendingToken, lendingTokenAmount);

        return lendingTokenAmount;
    }

    /**
     * @dev Allows a related contract to calculate the new borrow position of a user.
     *
     * Requirements:
     * - The lending token must be listed.
     * - Called by a related contract.
     * @param borrower The address of the user for whom the borrow position is being calculated.
     * @param lendingToken The address of the lending token being borrowed.
     * @param lendingTokenAmount The amount of lending tokens being borrowed.
     */
    function calcBorrowPosition(
        address borrower,
        address lendingToken,
        uint256 lendingTokenAmount
    ) external onlyRelatedContracts isLendingTokenListed(lendingToken) nonReentrant {
        _calcBorrowPosition(borrower, lendingToken, lendingTokenAmount);
    }

    /**
     * @dev Increase the borrower's borrow position in a given project and lending token, updating the total borrow statistics
     * @param borrower The borrower's address
     * @param lendingToken The lending token's address
     * @param lendingTokenAmount The amount of lending tokens to borrow
     */
    function _calcBorrowPosition(address borrower, address lendingToken, uint256 lendingTokenAmount) internal {
        BorrowPosition storage borrowPosition_ = borrowPosition[borrower][lendingToken];
        LendingTokenInfo memory info = lendingTokenInfo[lendingToken];
        borrowPosition_.loanBody += lendingTokenAmount;
        totalBorrowedPerLendingToken[lendingToken] += lendingTokenAmount;
        info.bLendingToken.borrowTo(borrower, lendingTokenAmount);
    }

    /**
     * @dev Calculates the estimated lending token available amount for borrowing.
     * @param user The address of the user.
     * @param lendingToken The address of the lending token.
     * @return availableToBorrow The lending token available amount for borrowing.
     */
    function getLendingAvailableToBorrow(address user, address lendingToken) public view returns (uint256 availableToBorrow) {
        uint256 pitRemaining = convertEstimatedPitRemaining(user, lendingToken);
        (, uint256 pitRemainingInUSD) = getTokenEvaluation(lendingToken, pitRemaining);
        uint256 limitBorrowPerCollateralInUSD = borrowLimitPerLendingToken[lendingToken] - getBorrowedPerLendingTokenInUSD(lendingToken);

        if (pitRemainingInUSD <= limitBorrowPerCollateralInUSD) {
            availableToBorrow = pitRemaining;
        } else {
            uint8 lendingTokenDecimals = ERC20Upgradeable(lendingToken).decimals();
            (, uint256 lendingTokenPrice) = getTokenEvaluation(lendingToken, 10 ** lendingTokenDecimals);
            availableToBorrow = (limitBorrowPerCollateralInUSD * (10 ** lendingTokenDecimals)) / lendingTokenPrice;
        }
    }

    //************* Repay FUNCTION ********************************

    /**
     * @dev Allows a borrower to repay their outstanding loan for lending token.
     *
     * Requirements:
     * - The lending token must be listed.
     * - The lending amount must be greater than 0.
     * - The borrower must have an outstanding loan.
     *
     * Effects:
     * - Updates the interest in all borrow positions for the borrower.
     * - Repays the lending token amount to the borrower's loan.
     * - May fully or partially repay the borrow position, depending on the lending token amount and the borrower's outstanding loan.
     * - Updates the borrower's borrow position.
     * - Emits a RepayBorrow event.
     * @param lendingToken The lending token's address
     * @param lendingTokenAmount The amount of lending tokens to repay
     * @return amount of lending tokens actually repaid
     */
    function repay(address lendingToken, uint256 lendingTokenAmount) external isLendingTokenListed(lendingToken) nonReentrant returns (uint256) {
        return _repay(msg.sender, msg.sender, lendingToken, lendingTokenAmount, bytes32(0));
    }

    /**
     * @dev Allows a related contract to repay the outstanding loan for a given borrower's lending token.
     *
     * Requirements:
     * - The lending token must be listed.
     * - Called by a related contract.
     * - The lending amount must be greater than 0.
     * - The borrower must have an outstanding loan.
     *
     * Effects:
     * - Updates the interest in all borrow positions for the borrower.
     * - Repays the lending token amount to the related contract.
     * - May fully or partially repay the borrow position, depending on the lending token amount and the borrower's outstanding loan.
     * - Updates the borrower's borrow position.
     * - Emits a RepayBorrow event.
     * @param lendingToken The lending token's address
     * @param lendingTokenAmount The amount of lending tokens to repay
     * @param repairer The address that initiated the repair transaction
     * @param borrower The borrower's address
     * @param positionId The ID of the borrower's position
     * @return amount of lending tokens actually repaid
     */
    function repayFromRelatedContract(
        address lendingToken,
        uint256 lendingTokenAmount,
        address repairer,
        address borrower,
        bytes32 positionId
    ) external isLendingTokenListed(lendingToken) onlyRelatedContracts nonReentrant returns (uint256) {
        return _repay(repairer, borrower, lendingToken, lendingTokenAmount, positionId); // under normal conditions: repairer == borrower
    }

    /**
     * @dev This function is called internally to handle the repayment of a borrower's outstanding loan.
     * @param repairer The address that initiated the repair transaction.
     * @param borrower The borrower's address.
     * @param lendingToken The lending token's address.
     * @param lendingTokenAmount The amount of lending tokens to repay.
     * @param positionId The ID of the borrower's position.
     * @return amount of lending tokens actually repaid.
     */
    function _repay(
        address repairer,
        address borrower,
        address lendingToken,
        uint256 lendingTokenAmount,
        bytes32 positionId
    ) internal returns (uint256) {
        if (lendingTokenAmount == 0) {
            revert Errors.InvalidLendingAmount();
        }
        BorrowPosition storage borrowPosition_ = borrowPosition[borrower][lendingToken];
        if (borrowPosition_.loanBody == 0) {
            revert Errors.NoBorrowPosition();
        }
        LendingTokenInfo memory info = lendingTokenInfo[lendingToken];
        updateInterestInAllBorrowPositions(borrower);
        uint256 amountRepaid;
        bool isPositionFullyRepaid;
        uint256 totalOutstanding = outstanding(borrower, lendingToken);

        if (
            (lendingTokenAmount >= totalOutstanding && lendingTokenAmount >= info.bLendingToken.borrowBalanceStored(borrower)) ||
            lendingTokenAmount == type(uint256).max
        ) {
            amountRepaid = _repayTo(repairer, borrower, info, type(uint256).max);
            isPositionFullyRepaid = _repayFully(lendingToken, borrowPosition_);
        } else {
            amountRepaid = _repayTo(repairer, borrower, info, lendingTokenAmount);
            isPositionFullyRepaid = _repayPartially(lendingToken, lendingTokenAmount, borrowPosition_);
        }

        emit RepayBorrow(borrower, lendingToken, amountRepaid, isPositionFullyRepaid, positionId);
        return amountRepaid;
    }

    /**
     * @dev This function is called internally to fully repay a borrower's outstanding loan.
     * @param lendingToken The lending token's address.
     * @param borrowPosition_ The borrower's borrowing position for the given project and lending token.
     * @return True.
     */
    function _repayFully(address lendingToken, BorrowPosition storage borrowPosition_) internal returns (bool) {
        totalBorrowedPerLendingToken[lendingToken] -= borrowPosition_.loanBody;
        borrowPosition_.loanBody = 0;
        borrowPosition_.accrual = 0;
        return true;
    }

    /**
     * @dev This function is called internally to partially repay a borrower's outstanding loan.
     * @param lendingToken Address of the lending token.
     * @param lendingTokenAmountToRepay Amount of the lending token to repay.
     * @param borrowPosition_ The borrower's borrow position.
     * @return False.
     */
    function _repayPartially(
        address lendingToken,
        uint256 lendingTokenAmountToRepay,
        BorrowPosition storage borrowPosition_
    ) internal returns (bool) {
        if (lendingTokenAmountToRepay > borrowPosition_.accrual) {
            lendingTokenAmountToRepay -= borrowPosition_.accrual;
            borrowPosition_.accrual = 0;
            totalBorrowedPerLendingToken[lendingToken] -= lendingTokenAmountToRepay;
            borrowPosition_.loanBody -= lendingTokenAmountToRepay;
        } else {
            borrowPosition_.accrual -= lendingTokenAmountToRepay;
        }
        return false;
    }

    /**
     * @dev This function is called internally to handle the transfer of the repayment amount.
     * @param repairer Address of the contract caller.
     * @param borrower Address of the borrower.
     * @param _info Lending token information.
     * @param lendingTokenAmountToRepay Amount of the lending token to repay.
     * @return amountRepaid amount of lending token repaid.
     */
    function _repayTo(
        address repairer,
        address borrower,
        LendingTokenInfo memory _info,
        uint256 lendingTokenAmountToRepay
    ) internal returns (uint256 amountRepaid) {
        (, amountRepaid) = _info.bLendingToken.repayTo(repairer, borrower, lendingTokenAmountToRepay);
    }

    //************* PUBLIC FUNCTION ********************************

    /**
     * @dev This function is called to update the interest in a borrower's borrow position.
     * @param account Address of the borrower.
     * @param lendingToken Address of the lending token.
     */
    function updateInterestInBorrowPosition(address account, address lendingToken) public {
        BorrowPosition storage borrowPosition_ = borrowPosition[account][lendingToken];
        uint256 cumulativeTotalOutstanding = borrowPosition_.loanBody + borrowPosition_.accrual;
        if (borrowPosition_.loanBody == 0) {
            return;
        }

        BLendingToken bLendingToken = lendingTokenInfo[lendingToken].bLendingToken;
        uint256 currentBorrowBalance = bLendingToken.borrowBalanceCurrent(account);
        if (currentBorrowBalance >= cumulativeTotalOutstanding) {
            borrowPosition_.accrual = currentBorrowBalance - cumulativeTotalOutstanding;
        }
    }

    /**
     * @dev This function is called to update the interest in all borrower's borrow positions.
     * @param account Address of the borrower.
     */
    function updateInterestInAllBorrowPositions(address account) public {
        for (uint256 i = 0; i < lendingTokens.length; i++) {
            address actualLendingToken = lendingTokens[i];
            if (actualLendingToken != address(0) && borrowPosition[account][actualLendingToken].loanBody > 0) {
                updateInterestInBorrowPosition(account, actualLendingToken);
            }
        }
    }

    //************* PUBLIC VIEW FUNCTIONS ********************************

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
            (uint256 collateralEvaluation, ) = getTokenEvaluation(
                projectToken,
                (depositedAmount[account][projectToken] * lvrNumerator) / lvrDenominator
            );
            totalEvaluation += collateralEvaluation;
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
            (uint256 collateralEvaluation, ) = getTokenEvaluation(projectToken, depositedAmount[account][projectToken]);
            totalEvaluation += collateralEvaluation;
        }
        return totalEvaluation;
    }

    /**
     * @dev Returns the total remaining PIT (primary index token) of a given account and all project tokens.
     * @param account The address of the user's borrow position.
     * @return remaining The remaining PIT of the user's borrow position.
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

    /**
     * @dev Returns the total outstanding amount of a user's borrow position for a specific lending token
     * @param account The address of the user's borrow position
     * @param lendingToken The address of the lending token
     * @return total outstanding amount of the user's borrow position
     */
    function outstanding(address account, address lendingToken) public view returns (uint256) {
        BorrowPosition memory borrowPosition_ = borrowPosition[account][lendingToken];
        return borrowPosition_.loanBody + borrowPosition_.accrual;
    }

    /**
     * @dev Converts the outstanding amount of a user's borrow position to USD
     * @param account The address of the user account
     * @param lendingToken The address of the lending token
     * @return amountInUsd The outstanding amount in USD
     */
    function outstandingInUSD(address account, address lendingToken) public view returns (uint256 amountInUsd) {
        uint256 amount = outstanding(account, lendingToken);
        (, amountInUsd) = getTokenEvaluation(lendingToken, amount);
        return amountInUsd;
    }

    /**
     * @dev Converts the total outstanding amount of all user's borrow positions to USD
     * @param account The address of the user account
     * @return totalEvaluation total outstanding amount in USD
     */
    function totalOutstandingInUSD(address account) public view returns (uint256 totalEvaluation) {
        for (uint256 i = 0; i < lendingTokens.length; i++) {
            totalEvaluation += outstandingInUSD(account, lendingTokens[i]);
        }
    }

    /**
     * @dev Returns the total weighted loan amount of user's all borrow positions to USD
     * @param account The address of the user account
     * @return totalEvaluation total outstanding amount in USD
     */
    function totalWeightedLoanInUSD(address account) public view returns (uint256 totalEvaluation) {
        for (uint256 i = 0; i < lendingTokens.length; i++) {
            Ratio memory lvr = lendingTokenInfo[lendingTokens[i]].loanToValueRatio;
            totalEvaluation += (outstandingInUSD(account, lendingTokens[i]) * lvr.denominator) / lvr.numerator;
        }
    }

    /**
     * @dev Returns the estimated outstanding amount of a user's borrow position for a specific lending token
     * @param account The address of the user's borrow position
     * @param lendingToken The address of the lending token
     * @return loanBody The amount of the lending token borrowed by the user
     * @return accrual The accrued interest of the borrow position
     */
    function getEstimatedOutstanding(address account, address lendingToken) public view returns (uint256 loanBody, uint256 accrual) {
        loanBody = borrowPosition[account][lendingToken].loanBody;
        uint256 cumulativeTotalOutstanding = outstanding(account, lendingToken);
        BLendingToken bLendingToken = lendingTokenInfo[lendingToken].bLendingToken;
        uint256 estimatedBorrowBalance = bLendingToken.getEstimatedBorrowBalanceStored(account);
        accrual = borrowPosition[account][lendingToken].accrual;
        if (estimatedBorrowBalance >= cumulativeTotalOutstanding && loanBody > 0) {
            accrual = estimatedBorrowBalance - cumulativeTotalOutstanding;
        }
    }

    /**
     * @dev Returns the estimated outstanding amount of a user's borrow position for a specific lending token to USD
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
        (, estimatedOutstandingInUSD) = getTokenEvaluation(lendingToken, loanBody + accrual);
    }

    /**
     * @dev Converts the total estimated outstanding amount of all user's borrow positions to USD
     * @param account The address of the user account
     * @return totalEvaluation total outstanding amount in USD
     */
    function totalEstimatedOutstandingInUSD(address account) public view returns (uint256 totalEvaluation) {
        for (uint256 i = 0; i < lendingTokens.length; i++) {
            (, , uint256 estimatedOutstandingInUSD) = getEstimatedOutstandingInUSD(account, lendingTokens[i]);
            totalEvaluation += estimatedOutstandingInUSD;
        }
    }

    /**
     * @dev Converts the total estimated weighted loan amount of all user's borrow positions to USD
     * @param account The address of the user account
     * @return totalEvaluation total weighted loan amount in USD
     */
    function totalEstimatedWeightedLoanInUSD(address account) public view returns (uint256 totalEvaluation) {
        for (uint256 i = 0; i < lendingTokens.length; i++) {
            Ratio memory lvr = lendingTokenInfo[lendingTokens[i]].loanToValueRatio;
            (, , uint256 estimatedOutstandingInUSD) = getEstimatedOutstandingInUSD(account, lendingTokens[i]);
            totalEvaluation += (estimatedOutstandingInUSD * lvr.denominator) / lvr.numerator;
        }
    }

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

    /**
     * @dev Returns the estimated health factor of a user account at current
     * @param account The address of the user's borrow position
     * @return numerator The numerator of the health factor
     * @return denominator The denominator of the health factor
     */
    function healthFactor(address account) public view returns (uint256 numerator, uint256 denominator) {
        numerator = totalPIT(account);
        denominator = totalEstimatedWeightedLoanInUSD(account);
    }

    /**
     * @dev Returns the evaluation of a specific token amount in USD
     * @param token The address of the token to evaluate
     * @param tokenAmount The amount of the token to evaluate
     * @return collateralEvaluation The USD evaluation of token by its `tokenAmount` in collateral price
     * @return capitalEvaluation The USD evaluation of token by its `tokenAmount` in capital price
     */
    function getTokenEvaluation(address token, uint256 tokenAmount) public view returns (uint256 collateralEvaluation, uint256 capitalEvaluation) {
        (collateralEvaluation, capitalEvaluation) = priceOracle.getEvaluation(token, tokenAmount);
    }

    /**
     * @dev Returns the length of the lending tokens array
     * @return The length of the lending tokens array
     */
    function lendingTokensLength() external view returns (uint256) {
        return lendingTokens.length;
    }

    /**
     * @dev Returns the length of the project tokens array
     * @return The length of the project tokens array
     */
    function projectTokensLength() external view returns (uint256) {
        return projectTokens.length;
    }

    /**
     * @dev Gets deposited amount in USD for a specific project token
     * @param projectToken The address of the project token
     * @return depositedPerProjectTokenInUSD The deposited amount in USD
     */
    function getDepositedPerProjectTokenInUSD(address projectToken) public view returns (uint256 depositedPerProjectTokenInUSD) {
        (depositedPerProjectTokenInUSD, ) = getTokenEvaluation(projectToken, totalDepositedPerProjectToken[projectToken]);
    }

    /**
     * @dev Gets borrow amount in USD for a specific lending token
     * @param lendingToken The address of the lending token
     * @return borrowedPerLendingTokenInUSD The total borrow amount in USD
     */
    function getBorrowedPerLendingTokenInUSD(address lendingToken) public view returns (uint256 borrowedPerLendingTokenInUSD) {
        (, borrowedPerLendingTokenInUSD) = getTokenEvaluation(lendingToken, totalBorrowedPerLendingToken[lendingToken]);
    }

    /**
     * @dev Converts the total remaining pit amount to the corresponding lending token amount
     * @param account The address of the user account
     * @param lendingToken The address of the lending token
     * @return lendingTokenAmount The converted lending token amount
     */
    function convertPitRemaining(address account, address lendingToken) public view returns (uint256 lendingTokenAmount) {
        Ratio memory lvr = lendingTokenInfo[lendingToken].loanToValueRatio;
        uint256 pitRemainingValue = totalPITRemaining(account);
        uint8 lendingTokenDecimals = ERC20Upgradeable(lendingToken).decimals();
        (, uint256 capitalPrice) = getTokenEvaluation(lendingToken, 10 ** lendingTokenDecimals);
        lendingTokenAmount = (pitRemainingValue * (10 ** lendingTokenDecimals) * lvr.numerator) / (capitalPrice * lvr.denominator);
    }

    /**
     * @dev Converts the total estimated remaining pit amount to the corresponding lending token amount
     * @param account The address of the user account
     * @param lendingToken The address of the lending token
     * @return The converted lending token amount
     */
    function convertEstimatedPitRemaining(address account, address lendingToken) public view returns (uint256) {
        Ratio memory lvr = lendingTokenInfo[lendingToken].loanToValueRatio;
        uint256 pitRemainingValue = totalEstimatedPITRemaining(account);
        uint8 lendingTokenDecimals = ERC20Upgradeable(lendingToken).decimals();
        (, uint256 capitalPrice) = getTokenEvaluation(lendingToken, 10 ** lendingTokenDecimals);
        uint256 lendingTokenAmount = (pitRemainingValue * (10 ** lendingTokenDecimals) * lvr.numerator) / (capitalPrice * lvr.denominator);
        return lendingTokenAmount;
    }

    /**
     * @dev Calculates the collateral available for withdrawal based on the loan-to-value ratio of a specific project token.
     * @param account Address of the user.
     * @param projectToken Address of the project token.
     * @return collateralProjectToWithdraw The amount of collateral available for withdrawal in the project token.
     */
    function getCollateralAvailableToWithdraw(address account, address projectToken) public view returns (uint256 collateralProjectToWithdraw) {
        Ratio memory lvr = projectTokenInfo[projectToken].loanToValueRatio;
        uint256 totalEstimatedWeightedLoan = totalEstimatedWeightedLoanInUSD(account);
        uint256 pitRemainingExceptPrjToken = _pitRemainingExceptIndexToken(account, projectToken);
        uint256 depositedProjectTokenAmount = depositedAmount[account][projectToken];
        if (pitRemainingExceptPrjToken >= totalEstimatedWeightedLoan) {
            collateralProjectToWithdraw = depositedProjectTokenAmount;
        } else if (totalPIT(account) > totalEstimatedWeightedLoan) {
            uint256 projectTokenDecimals = ERC20Upgradeable(projectToken).decimals();
            (uint256 collateralPrice, ) = getTokenEvaluation(projectToken, 10 ** projectTokenDecimals);
            uint256 targetProjectTokenAmount = ((totalEstimatedWeightedLoan - pitRemainingExceptPrjToken) *
                lvr.denominator *
                (10 ** projectTokenDecimals)) /
                collateralPrice /
                lvr.numerator;
            collateralProjectToWithdraw = depositedProjectTokenAmount - targetProjectTokenAmount;
        }
    }

    /**
     * @dev Gets the loan to value ratio of a position taken by a project token and a lending token
     * @param projectToken The address of the project token
     * @param lendingToken The address of the lending token
     * @return lvrNumerator The numerator of the loan to value ratio
     * @return lvrDenominator The denominator of the loan to value ratio
     */
    function getLoanToValueRatio(address projectToken, address lendingToken) external view returns (uint256 lvrNumerator, uint256 lvrDenominator) {
        Ratio memory lvrProjectToken = projectTokenInfo[projectToken].loanToValueRatio;
        Ratio memory lvrLendingToken = lendingTokenInfo[lendingToken].loanToValueRatio;
        lvrNumerator = uint256(lvrProjectToken.numerator) * uint256(lvrLendingToken.numerator);
        lvrDenominator = uint256(lvrProjectToken.denominator) * uint256(lvrLendingToken.denominator);
    }

    /**
     * @dev Returns the remaining PIT (primary index token) of a user's borrow position except for a specific project token.
     * @param account Address of the user.
     * @param prjToken Address of the project token.
     * @return The remaining PIT of the user's borrow position except for the specific project token.
     */
    function _pitRemainingExceptIndexToken(address account, address prjToken) internal view returns (uint256) {
        uint8 lvrNumerator = projectTokenInfo[prjToken].loanToValueRatio.numerator;
        uint8 lvrDenominator = projectTokenInfo[prjToken].loanToValueRatio.denominator;
        (uint256 collateralEvaluation, ) = getTokenEvaluation(prjToken, (depositedAmount[account][prjToken] * lvrNumerator) / lvrDenominator);

        return totalPIT(account) - collateralEvaluation;
    }
}
