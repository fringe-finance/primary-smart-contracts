// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../interfaces/IPriceProviderAggregator.sol";
import "../interfaces/IBLendingToken.sol";
import "../interfaces/IPrimaryLendingPlatform.sol";

/**
 * @title PrimaryLendingPlatformModerator.
 * @notice The PrimaryLendingPlatformModerator contract is the contract that provides the functionality for moderating the primary lending platform.
 * @dev Contract for managing the moderators of the PrimaryLendingPlatform contract.
 */
contract PrimaryLendingPlatformModerator is Initializable, AccessControlUpgradeable {
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    IPrimaryLendingPlatform public primaryLendingPlatform;

    /**
     * @dev Emitted when a project token is added to the platform.
     * @param tokenPrj The address of the project token.
     * @param name The name of the project token.
     * @param symbol The symbol of the project token.
     */
    event AddPrjToken(address indexed tokenPrj, string indexed name, string indexed symbol);

    /**
     * @dev Emitted when a project token is removed from the platform.
     * @param tokenPrj The address of the project token.
     */
    event RemoveProjectToken(address indexed tokenPrj);

    /**
     * @dev Emitted when a lending token is added to the platform.
     * @param lendingToken The address of the lending token.
     * @param name The name of the lending token.
     * @param symbol The symbol of the lending token.
     */
    event AddLendingToken(address indexed lendingToken, string indexed name, string indexed symbol);

    /**
     * @dev Emitted when a lending token is removed from the platform.
     * @param lendingToken The address of the lending token.
     */
    event RemoveLendingToken(address indexed lendingToken);

    /**
     * @dev Emitted when the deposit or withdraw functionality of a project token is paused or unpaused.
     * @param projectToken The address of the project token.
     * @param isDepositPaused Whether the deposit functionality is paused or unpaused.
     * @param isWithdrawPaused Whether the withdraw functionality is paused or unpaused.
     */
    event SetPausedProjectToken(address indexed projectToken, bool isDepositPaused, bool isWithdrawPaused);

    /**
     * @dev Emitted when the borrow functionality of a lending token is paused or unpaused.
     * @param lendingToken The address of the lending token.
     * @param isPaused Whether the borrow functionality is paused or unpaused.
     */
    event SetPausedLendingToken(address indexed lendingToken, bool isPaused);

    /**
     * @dev Emitted when the borrow limit per collateral asset is set for a project token.
     * @param projectToken The address of the project token.
     * @param borrowLimit The borrow limit per collateral asset.
     */
    event SetBorrowLimitPerCollateralAsset(address indexed projectToken, uint256 borrowLimit);

    /**
     * @dev Emitted when the borrow limit per lending asset is set for a lending token.
     * @param lendingToken The address of the lending token.
     * @param borrowLimit The borrow limit per lending asset.
     */
    event SetBorrowLimitPerLendingAsset(address indexed lendingToken, uint256 borrowLimit);

    /**
     * @dev Emitted when the loan-to-value ratio is set for a project token.
     * @param tokenPrj The address of the project token.
     * @param lvrNumerator The numerator of the loan-to-value ratio.
     * @param lvrDenominator The denominator of the loan-to-value ratio.
     */
    event LoanToValueRatioSet(address indexed tokenPrj, uint8 lvrNumerator, uint8 lvrDenominator);

    /**
     * @dev Emitted when a moderator is granted access to the platform.
     * @param moderator The address of the moderator.
     */
    event GrandModerator(address indexed moderator);

    /**
     * @dev Emitted when a moderator's access to the platform is revoked.
     * @param moderator The address of the moderator.
     */
    event RevokeModerator(address indexed moderator);

    /**
     * @dev Emitted when the leverage of the PrimaryLendingPlatform contract is set.
     * @param newPrimaryLendingPlatformLeverage The new leverage of the PrimaryLendingPlatform contract.
     */
    event SetPrimaryLendingPlatformLeverage(address indexed newPrimaryLendingPlatformLeverage);

    /**
     * @dev Emitted when the price oracle contract is set.
     * @param newOracle The address of the new price oracle contract.
     */
    event SetPriceOracle(address indexed newOracle);

    /**
     * @dev Emitted when a related contract is added to the platform.
     * @param relatedContract The address of the related contract.
     */
    event AddRelatedContracts(address indexed relatedContract);

    /**
     * @dev Emitted when a related contract is removed from the platform.
     * @param relatedContract The address of the related contract.
     */
    event RemoveRelatedContracts(address indexed relatedContract);

    /**
     * @dev Initializes the contract by setting up the default admin role, the moderator role, and the primary index token.
     * @param pit The address of the primary index token.
     */
    function initialize(address pit) public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        primaryLendingPlatform = IPrimaryLendingPlatform(pit);
    }

    /**
     * @dev Modifier to check if the caller has the admin role.
     */
    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "PITModerator: Caller is not the Admin");
        _;
    }

    /**
     * @dev Modifier to check if the caller has the moderator role.
     */
    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "PITModerator: Caller is not the Moderator");
        _;
    }

    /**
     * @dev Modifier to check if a project token is listed on the platform.
     * @param projectToken The address of the project token.
     */
    modifier isProjectTokenListed(address projectToken) {
        require(primaryLendingPlatform.projectTokenInfo(projectToken).isListed, "PITModerator: Project token is not listed");
        _;
    }

    /**
     * @dev Modifier to check if a lending token is listed on the platform.
     * @param lendingToken The address of the lending token.
     */
    modifier isLendingTokenListed(address lendingToken) {
        require(primaryLendingPlatform.lendingTokenInfo(lendingToken).isListed, "PITModerator: Lending token is not listed");
        _;
    }

    //************* ADMIN FUNCTIONS ********************************

    /**
     * @dev Grants the moderator role to a new address.
     *
     * Requirements:
     * - Called by the admin role.
     * - The new moderator address must not be the zero address.
     * @param newModerator The address of the new moderator.
     */
    function grandModerator(address newModerator) external onlyAdmin {
        require(newModerator != address(0), "PITModerator: Invalid address");
        grantRole(MODERATOR_ROLE, newModerator);
        emit GrandModerator(newModerator);
    }

    /**
     * @dev Revokes the moderator role from an address.
     *
     * Requirements:
     * - Called by the admin role.
     * - The moderator address must not be the zero address.
     * @param moderator The address of the moderator to be revoked.
     */
    function revokeModerator(address moderator) external onlyAdmin {
        require(moderator != address(0), "PITModerator: Invalid address");
        revokeRole(MODERATOR_ROLE, moderator);
        emit RevokeModerator(moderator);
    }

    /**
     * @dev Transfers the admin role to a new address.
     *
     * Requirements:
     * - Called by the admin role.
     * - The moderator address must not be the zero address.
     * @param newAdmin The address of the new admin.
     */
    function transferAdminRole(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "PITModerator: Invalid newAdmin");
        grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
        revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Transfers the admin role for the primary index token to a new address.
     *
     * Requirements:
     * - Called by the admin role.
     * - The current admin address must not be the zero address.
     * - The new admin address must not be the zero address.
     * @param currentAdmin The address of the current admin.
     * @param newAdmin The address of the new admin.
     */
    function transferAdminRoleForPIT(address currentAdmin, address newAdmin) external onlyAdmin {
        require(currentAdmin != address(0) && newAdmin != address(0), "PITModerator: Invalid addresses");
        primaryLendingPlatform.grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
        primaryLendingPlatform.revokeRole(DEFAULT_ADMIN_ROLE, currentAdmin);
    }

    /**
     * @dev Adds a project token to the platform with the specified loan-to-value ratio.
     * @param projectToken The address of the project token to be added.
     * @param loanToValueRatioNumerator The numerator of the loan-to-value ratio.
     * @param loanToValueRatioDenominator The denominator of the loan-to-value ratio.
     *
     * Requirements:
     * - The project token address must not be the zero address.
     * - Only the admin can call this function.
     *
     * Effects:
     * - Adds the project token to the platform.
     * - Sets the loan-to-value ratio for the project token.
     * - Sets the pause status for deposit and withdrawal of the project token to false.
     */
    function addProjectToken(address projectToken, uint8 loanToValueRatioNumerator, uint8 loanToValueRatioDenominator) public onlyAdmin {
        require(projectToken != address(0), "PITModerator: Invalid token");

        string memory projectTokenName = ERC20Upgradeable(projectToken).name();
        string memory projectTokenSymbol = ERC20Upgradeable(projectToken).symbol();
        emit AddPrjToken(projectToken, projectTokenName, projectTokenSymbol);

        setProjectTokenInfo(projectToken, false, false, loanToValueRatioNumerator, loanToValueRatioDenominator);
    }

    /**
     * @dev Removes a project token from the primary lending platform.
     * @param projectTokenId The ID of the project token to be removed.
     *
     * Requirements:
     * - The caller must be an admin.
     * - The project token must be listed on the primary lending platform.
     * - The total deposited project token amount must be zero.
     */
    function removeProjectToken(
        uint256 projectTokenId
    ) external onlyAdmin isProjectTokenListed(primaryLendingPlatform.projectTokens(projectTokenId)) {
        address projectToken = primaryLendingPlatform.projectTokens(projectTokenId);
        require(primaryLendingPlatform.totalDepositedProjectToken(projectToken) == 0, "PITModerator: ProjectToken amount exist on PIT");
        primaryLendingPlatform.removeProjectToken(projectTokenId, projectToken);
        emit RemoveProjectToken(projectToken);
    }

    /**
     * @dev Adds a new lending token to the platform.
     * @param lendingToken The address of the lending token to be added.
     * @param bLendingToken The address of the corresponding bLending token.
     * @param isPaused A boolean indicating whether the lending token is paused or not.
     * @param loanToValueRatioNumerator The numerator of the loan-to-value ratio for the lending token.
     * @param loanToValueRatioDenominator The denominator of the loan-to-value ratio for the lending token.
     *
     * Requirements:
     * - The lending token address and bLending token address must not be zero.
     * - Only the admin can call this function.
     *
     * Effects:
     * - Adds the lending token to the platform.
     * - Sets the loan-to-value ratio for the lending token.
     * - Sets the pause status for borrowing of the lending token.
     */
    function addLendingToken(
        address lendingToken,
        address bLendingToken,
        bool isPaused,
        uint8 loanToValueRatioNumerator,
        uint8 loanToValueRatioDenominator
    ) external onlyAdmin {
        require(lendingToken != address(0) && bLendingToken != address(0), "PITModerator: Invalid address");

        string memory lendingTokenName = ERC20Upgradeable(lendingToken).name();
        string memory lendingTokenSymbol = ERC20Upgradeable(lendingToken).symbol();
        emit AddLendingToken(lendingToken, lendingTokenName, lendingTokenSymbol);

        setLendingTokenInfo(lendingToken, bLendingToken, isPaused, loanToValueRatioNumerator, loanToValueRatioDenominator);
    }

    /**
     * @dev Removes a lending token from the primary lending platform.
     * @param lendingTokenId The ID of the lending token to be removed.
     *
     * Requirements:
     * - The caller must have admin role.
     * - The lending token must be listed in the primary lending platform.
     * - There must be no borrow of the lending token in any project.
     */
    function removeLendingToken(
        uint256 lendingTokenId
    ) external onlyAdmin isLendingTokenListed(primaryLendingPlatform.lendingTokens(lendingTokenId)) {
        address lendingToken = primaryLendingPlatform.lendingTokens(lendingTokenId);

        for (uint256 i = 0; i < primaryLendingPlatform.projectTokensLength(); i++) {
            require(
                primaryLendingPlatform.totalBorrow(primaryLendingPlatform.projectTokens(i), lendingToken) == 0,
                "PITModerator: Exist borrow of lendingToken"
            );
        }
        primaryLendingPlatform.removeLendingToken(lendingTokenId, lendingToken);
        emit RemoveLendingToken(lendingToken);
    }

    /**
     * @dev Sets the address of the primary lending platform leverage contract.
     *
     * Requirements:
     * - Only the admin can call this function.
     * - The new address must not be the zero address.
     * @param newPrimaryLendingPlatformLeverage The address of the new primary lending platform leverage contract.
     */
    function setPrimaryLendingPlatformLeverage(address newPrimaryLendingPlatformLeverage) external onlyAdmin {
        require(newPrimaryLendingPlatformLeverage != address(0), "PITModerator: Invalid address");
        primaryLendingPlatform.setPrimaryLendingPlatformLeverage(newPrimaryLendingPlatformLeverage);
        emit SetPrimaryLendingPlatformLeverage(newPrimaryLendingPlatformLeverage);
    }

    /**
     * @dev Sets the price oracle address for the primary lending platform.
     *
     * Requirements:
     * - Only the admin can call this function.
     * - The new address must not be the zero address.
     * @param newOracle The new price oracle address to be set.
     */
    function setPriceOracle(address newOracle) external onlyAdmin {
        require(newOracle != address(0), "PITModerator: Invalid address");
        primaryLendingPlatform.setPriceOracle(newOracle);
        emit SetPriceOracle(newOracle);
    }

    /**
     * @dev Adds an address to the list of related contracts.
     *
     * Requirements:
     * - Only the admin can call this function.
     * - The new address must not be the zero address.
     * @param newRelatedContract The address of the new related contract to be added.
     */
    function addRelatedContracts(address newRelatedContract) external onlyAdmin {
        require(newRelatedContract != address(0), "PITModerator: Invalid address");
        primaryLendingPlatform.setRelatedContract(newRelatedContract, true);
        emit AddRelatedContracts(newRelatedContract);
    }

    /**
     * @dev Removes an address from the list of related contracts.
     *
     * Requirements:
     * - Only the admin can call this function.
     * - The new address must not be the zero address.
     * @param relatedContract The address of the related contract to be removed.
     */
    function removeRelatedContracts(address relatedContract) external onlyAdmin {
        require(relatedContract != address(0), "PITModerator: Invalid address");
        primaryLendingPlatform.setRelatedContract(relatedContract, false);
        emit RemoveRelatedContracts(relatedContract);
    }

    //************* MODERATOR FUNCTIONS ********************************

    /**
     * @dev Sets the project token information such as deposit and withdraw pause status, and loan-to-value ratio for a given project token.
     *
     * Requirements:
     * - The `loanToValueRatioNumerator` must be less than or equal to `loanToValueRatioDenominator`.
     * - Only the moderator can call this function.
     * @param projectToken The address of the project token.
     * @param isDepositPaused The boolean value indicating whether deposit is paused for the project token.
     * @param isWithdrawPaused The boolean value indicating whether withdraw is paused for the project token.
     * @param loanToValueRatioNumerator The numerator value of the loan-to-value ratio for the project token.
     * @param loanToValueRatioDenominator The denominator value of the loan-to-value ratio for the project token.
     */
    function setProjectTokenInfo(
        address projectToken,
        bool isDepositPaused,
        bool isWithdrawPaused,
        uint8 loanToValueRatioNumerator,
        uint8 loanToValueRatioDenominator
    ) public onlyModerator {
        require(loanToValueRatioNumerator <= loanToValueRatioDenominator, "PITModerator: Invalid loanToValueRatio");
        primaryLendingPlatform.setProjectTokenInfo(
            projectToken,
            isDepositPaused,
            isWithdrawPaused,
            loanToValueRatioNumerator,
            loanToValueRatioDenominator
        );

        emit SetPausedProjectToken(projectToken, isDepositPaused, isWithdrawPaused);
        emit LoanToValueRatioSet(projectToken, loanToValueRatioNumerator, loanToValueRatioDenominator);
    }

    /**
     * @dev Sets the deposit and withdraw pause status for a project token.
     * @param projectToken The address of the project token.
     * @param isDepositPaused The boolean value indicating whether deposit is paused or not.
     * @param isWithdrawPaused The boolean value indicating whether withdraw is paused or not.
     */
    function setPausedProjectToken(
        address projectToken,
        bool isDepositPaused,
        bool isWithdrawPaused
    ) public onlyModerator isProjectTokenListed(projectToken) {
        primaryLendingPlatform.setPausedProjectToken(projectToken, isDepositPaused, isWithdrawPaused);
        emit SetPausedProjectToken(projectToken, isDepositPaused, isWithdrawPaused);
    }

    /**
     * @dev Sets the lending token information for the primary lending platform.
     *
     * Requirements:
     * - The function can only be called by the moderator.
     * - The underlying asset of the bLending token must be the same as the lending token.
     * @param lendingToken The address of the lending token.
     * @param bLendingToken The address of the corresponding bLending token.
     * @param isPaused A boolean indicating whether the lending token is paused or not.
     * @param loanToValueRatioNumerator The numerator of the loan-to-value ratio.
     * @param loanToValueRatioDenominator The denominator of the loan-to-value ratio.
     */
    function setLendingTokenInfo(
        address lendingToken,
        address bLendingToken,
        bool isPaused,
        uint8 loanToValueRatioNumerator,
        uint8 loanToValueRatioDenominator
    ) public onlyModerator {
        primaryLendingPlatform.setLendingTokenInfo(lendingToken, bLendingToken, isPaused, loanToValueRatioNumerator, loanToValueRatioDenominator);
        require(IBLendingToken(bLendingToken).underlying() == lendingToken, "PITModerator: UnderlyingOfbLendingToken!=lendingToken");
        emit SetPausedLendingToken(lendingToken, isPaused);
        emit LoanToValueRatioSet(lendingToken, loanToValueRatioNumerator, loanToValueRatioDenominator);
    }

    /**
     * @dev Sets the pause status for a lending token.
     *
     * Requirements:
     * - The function can only be called by the moderator.
     * - The lending token must be listed on the primary lending platform.
     * @param lendingToken The address of the lending token.
     * @param isPaused The new pause status for the lending token.
     */
    function setPausedLendingToken(address lendingToken, bool isPaused) public onlyModerator isLendingTokenListed(lendingToken) {
        primaryLendingPlatform.setPausedLendingToken(lendingToken, isPaused);
        emit SetPausedLendingToken(lendingToken, isPaused);
    }

    /**
     * @dev Sets the borrow limit per collateral for a given project token.
     *
     * Requirements:
     * - The function can only be called by the moderator.
     * - The project token must be listed on the primary lending platform.
     * - The borrow limit must be greater than zero.
     * - The project token address must not be the zero address.
     * @param projectToken The project token for which to set the borrow limit.
     * @param borrowLimit The new borrow limit.
     */
    function setBorrowLimitPerCollateralAsset(address projectToken, uint256 borrowLimit) external onlyModerator isProjectTokenListed(projectToken) {
        require(borrowLimit > 0, "PITModerator: BorrowLimit = 0");
        require(projectToken != address(0), "PITModerator: Invalid address");
        primaryLendingPlatform.setBorrowLimitPerCollateralAsset(projectToken, borrowLimit);
        emit SetBorrowLimitPerCollateralAsset(projectToken, borrowLimit);
    }

    /**
     * @dev Sets the borrow limit per lending asset for a given lending token.
     *
     * Requirements:
     * - The function can only be called by the moderator.
     * - The lending token must be listed on the primary lending platform.
     * - The borrow limit must be greater than zero.
     * - The lendingToken token address must not be the zero address.
     * @param lendingToken The lending token for which to set the borrow limit.
     * @param borrowLimit The new borrow limit.
     */
    function setBorrowLimitPerLendingAsset(address lendingToken, uint256 borrowLimit) external onlyModerator isLendingTokenListed(lendingToken) {
        require(borrowLimit > 0, "PITModerator: BorrowLimit = 0");
        require(lendingToken != address(0), "PITModerator: Invalid address");
        primaryLendingPlatform.setBorrowLimitPerLendingAsset(lendingToken, borrowLimit);
        emit SetBorrowLimitPerLendingAsset(lendingToken, borrowLimit);
    }
}
