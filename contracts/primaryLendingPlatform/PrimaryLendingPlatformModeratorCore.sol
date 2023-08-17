// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../interfaces/IPriceProviderAggregator.sol";
import "../interfaces/IBLendingToken.sol";
import "../interfaces/IPrimaryLendingPlatform.sol";

contract PrimaryLendingPlatformModerator is Initializable, AccessControlUpgradeable {
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    IPrimaryLendingPlatform public primaryLendingPlatform;

    event AddPrjToken(address indexed tokenPrj, string indexed name, string indexed symbol);
    event RemoveProjectToken(address indexed tokenPrj);
    event AddLendingToken(address indexed lendingToken, string indexed name, string indexed symbol);
    event RemoveLendingToken(address indexed lendingToken);
    event SetPausedProjectToken(address indexed projectToken, bool isDepositPaused, bool isWithdrawPaused);
    event SetPausedLendingToken(address indexed lendingToken, bool isPaused);
    event SetBorrowLimitPerCollateralAsset(address indexed projectToken, uint256 borrowLimit);
    event SetBorrowLimitPerLendingAsset(address indexed lendingToken, uint256 borrowLimit);
    event LoanToValueRatioSet(address indexed tokenPrj, uint8 lvrNumerator, uint8 lvrDenominator);
    
    event GrandModerator(address indexed moderator);
    event RevokeModerator(address indexed moderator);
    event SetPrimaryLendingPlatformLeverage(address indexed newPrimaryLendingPlatformLeverage);
    event SetPriceOracle(address indexed newOracle);
    event AddRelatedContracts(address indexed relatedContract);
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

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "PITModerator: Caller is not the Admin");
        _;
    }

    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "PITModerator: Caller is not the Moderator");
        _;
    }

    modifier isProjectTokenListed(address projectToken) {
        require(primaryLendingPlatform.projectTokenInfo(projectToken).isListed, "PITModerator: Project token is not listed");
        _;
    }

    modifier isLendingTokenListed(address lendingToken) {
        require(primaryLendingPlatform.lendingTokenInfo(lendingToken).isListed, "PITModerator: Lending token is not listed");
        _;
    }

    //************* ADMIN FUNCTIONS ********************************

    /**
     * @dev Grants the moderator role to a new address.
     * @param newModerator The address of the new moderator.
     */
    function grandModerator(address newModerator) external onlyAdmin {
        require(newModerator != address(0), "PITModerator: Invalid address");
        grantRole(MODERATOR_ROLE, newModerator);
        emit GrandModerator(newModerator);
    }

    /**
     * @dev Revokes the moderator role from an address.
     * @param moderator The address of the moderator to be revoked.
     */
    function revokeModerator(address moderator) external onlyAdmin {
        require(moderator != address(0), "PITModerator: Invalid address");
        revokeRole(MODERATOR_ROLE, moderator);
        emit RevokeModerator(moderator);
    }

    /**
     * @dev Transfers the admin role to a new address.
     * @param newAdmin The address of the new admin.
     */
    function transferAdminRole(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "PITModerator: Invalid newAdmin");
        grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
        revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Transfers the admin role for the primary index token to a new address.
     * @param currentAdmin The address of the current admin.
     * @param newAdmin The address of the new admin.
     */
    function transferAdminRoleForPIT(address currentAdmin, address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "PITModerator: Invalid newAdmin");
        primaryLendingPlatform.grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
        primaryLendingPlatform.revokeRole(DEFAULT_ADMIN_ROLE, currentAdmin);
    }

    /**
     * @dev Adds a new project token to the primary index token.
     * @param projectToken The address of the project token.
     * @param loanToValueRatioNumerator The numerator of the loan-to-value ratio.
     * @param loanToValueRatioDenominator The denominator of the loan-to-value ratio.
     */
    function addProjectToken(address projectToken, uint8 loanToValueRatioNumerator, uint8 loanToValueRatioDenominator) public onlyAdmin {
        require(projectToken != address(0), "PITModerator: Invalid token");

        string memory projectTokenName = ERC20Upgradeable(projectToken).name();
        string memory projectTokenSymbol = ERC20Upgradeable(projectToken).symbol();
        emit AddPrjToken(projectToken, projectTokenName, projectTokenSymbol);

        setProjectTokenInfo(projectToken, false, false, loanToValueRatioNumerator, loanToValueRatioDenominator);
    }

    /**
     * @dev Removes a project token from the primary index token.
     * @param projectTokenId The ID of the project token to be removed.
     */
    function removeProjectToken(uint256 projectTokenId) external onlyAdmin isProjectTokenListed(primaryLendingPlatform.projectTokens(projectTokenId)) {
        address projectToken = primaryLendingPlatform.projectTokens(projectTokenId);
        require(primaryLendingPlatform.totalDepositedProjectToken(projectToken) == 0, "PITModerator: ProjectToken amount exist on PIT");
        primaryLendingPlatform.removeProjectToken(projectTokenId, projectToken);
        emit RemoveProjectToken(projectToken);
    }

    /**
     * @dev Adds a new lending token to the primary index token.
     * @param lendingToken The address of the lending token.
     * @param bLendingToken The address of the corresponding bLending token.
     * @param isPaused The initial pause status for the lending token
     * @param loanToValueRatioNumerator The numerator of the loan-to-value ratio.
     * @param loanToValueRatioDenominator The denominator of the loan-to-value ratio.
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
     * @dev Removes a lending token from the primary index token.
     * @param lendingTokenId The ID of the lending token to be removed.
     */
    function removeLendingToken(uint256 lendingTokenId) external onlyAdmin isLendingTokenListed(primaryLendingPlatform.lendingTokens(lendingTokenId)) {
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
     * @dev Sets the leverage of the primary index token.
     * @param newPrimaryLendingPlatformLeverage The new leverage value.
     */
    function setPrimaryLendingPlatformLeverage(address newPrimaryLendingPlatformLeverage) external onlyAdmin {
        require(newPrimaryLendingPlatformLeverage != address(0), "PITModerator: Invalid address");
        primaryLendingPlatform.setPrimaryLendingPlatformLeverage(newPrimaryLendingPlatformLeverage);
        emit SetPrimaryLendingPlatformLeverage(newPrimaryLendingPlatformLeverage);
    }

    /**
     * @dev Sets the price oracle for the primary index token.
     * @param newOracle The address of the new price oracle.
     */
    function setPriceOracle(address newOracle) external onlyAdmin {
        require(newOracle != address(0), "PITModerator: Invalid address");
        primaryLendingPlatform.setPriceOracle(newOracle);
        emit SetPriceOracle(newOracle);
    }

    /**
     * @dev Adds an address to the list of related contracts.
     * @param newRelatedContract The address of the new related contract to be added.
     */
    function addRelatedContracts(address newRelatedContract) external onlyAdmin {
        require(newRelatedContract != address(0), "PITModerator: Invalid address");
        primaryLendingPlatform.setRelatedContract(newRelatedContract, true);
        emit AddRelatedContracts(newRelatedContract);
    }

    /**
     * @dev Removes an address from the list of related contracts.
     * @param relatedContract The address of the related contract to be removed.
     */
    function removeRelatedContracts(address relatedContract) external onlyAdmin {
        require(relatedContract != address(0), "PITModerator: Invalid address");
        primaryLendingPlatform.setRelatedContract(relatedContract, false);
        emit RemoveRelatedContracts(relatedContract);
    }

    //************* MODERATOR FUNCTIONS ********************************

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
     * @dev Sets the pause status for deposit and withdrawal of a project token
     * @param projectToken The address of the project token
     * @param isDepositPaused The new pause status for deposit
     * @param isWithdrawPaused The new pause status for withdrawal
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
     * @dev Sets the parameters for a lending token
     * @param lendingToken The address of the lending token
     * @param bLendingToken The address of the corresponding bLending token
     * @param isPaused The new pause status for the lending token
     * @param loanToValueRatioNumerator The numerator of the loan-to-value ratio for the lending token
     * @param loanToValueRatioDenominator The denominator of the loan-to-value ratio for the lending token
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
     * @dev Sets the pause status for a lending token
     * @param lendingToken The address of the lending token
     * @param isPaused The new pause status for the lending token
     */
    function setPausedLendingToken(address lendingToken, bool isPaused) public onlyModerator isLendingTokenListed(lendingToken) {
        primaryLendingPlatform.setPausedLendingToken(lendingToken, isPaused);
        emit SetPausedLendingToken(lendingToken, isPaused);
    }

    /**
     * @dev Sets the borrow limit per collateral for a given project token.
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
