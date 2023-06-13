// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../interfaces/IPriceProviderAggregator.sol";
import "../interfaces/IBLendingToken.sol";
import "../interfaces/V3/IPrimaryIndexTokenV3.sol";

contract PrimaryIndexTokenModeratorV3 is Initializable, AccessControlUpgradeable
{
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    IPrimaryIndexTokenV3 public primaryIndexToken;

    event AddPrjToken(address indexed tokenPrj, string name, string symbol);
    event RemoveProjectToken(address indexed tokenPrj);
    event SetPausedProjectToken(address _projectToken, bool _isDepositPaused, bool _isWithdrawPaused);

    event AddLendingToken(address indexed lendingToken, string name, string symbol);
    event RemoveLendingToken(address indexed lendingToken);
    event SetPausedLendingToken(address _lendingToken, bool _isPaused);
    event SetBorrowLimitPerLendingAsset(address lendingToken, uint256 _borrowLimit);

    event LoanToValueRatioSet(address indexed tokenPrj, uint8 lvrNumerator, uint8 lvrDenominator);

    event GrandModerator(address newModerator);
    event RevokeModerator(address moderator); 

    event SetPrimaryIndexTokenLeverage(address newPrimaryIndexTokenLeverage);
    event SetPriceOracle(address newOracle);

    event AddRelatedContracts(address newRelatedContract);
    event RemoveRelatedContracts(address relatedContract);
    event LendingTokenLoanToValueRatioSet(address indexed lendingToken, uint8 lvrNumerator, uint8 lvrDenominator);

    /** 
     * @dev Initializes the contract by setting up the default admin role, the moderator role, and the primary index token. 
     * @param pit The address of the primary index token.
     */
    function initialize(address pit) public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        primaryIndexToken = IPrimaryIndexTokenV3(pit);
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

    //************* ADMIN FUNCTIONS ********************************

    /**
     * @dev Grants the moderator role to a new address. 
     * @param newModerator The address of the new moderator.
     */
    function grandModerator(address newModerator) public onlyAdmin {
        require(newModerator != address(0), "PIT: invalid address");
        grantRole(MODERATOR_ROLE, newModerator);
        emit GrandModerator(newModerator);
    }

    /** 
     * @dev Revokes the moderator role from an address. 
     * @param moderator The address of the moderator to be revoked.
     */
    function revokeModerator(address moderator) public onlyAdmin {
        require(moderator != address(0), "PIT: invalid address");
        revokeRole(MODERATOR_ROLE, moderator);
        emit RevokeModerator(moderator);
    }

    /** 
     * @dev Transfers the admin role to a new address. 
     * @param newAdmin The address of the new admin.
     */
    function transferAdminRole(address newAdmin) public onlyAdmin {
        require(newAdmin != address(0), "PIT: invalid newAdmin");
        grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
        revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /** 
     * @dev Transfers the admin role for the primary index token to a new address. 
     * @param currentAdmin The address of the current admin. 
     * @param newAdmin The address of the new admin.
     */
    function transferAdminRoleForPIT(address currentAdmin, address newAdmin) public onlyAdmin {
        require(newAdmin != address(0), "PIT: invalid newAdmin");
        primaryIndexToken.grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
        primaryIndexToken.revokeRole(DEFAULT_ADMIN_ROLE, currentAdmin);
    }

    /** 
     * @dev Adds a new project token to the primary index token. 
     * @param _projectToken The address of the project token. 
     * @param _loanToValueRatioNumerator The numerator of the loan-to-value ratio. 
     * @param _loanToValueRatioDenominator The denominator of the loan-to-value ratio. 
     */
    function addProjectToken(
        address _projectToken,
        uint8 _loanToValueRatioNumerator,
        uint8 _loanToValueRatioDenominator
    ) public onlyAdmin {
        require(_projectToken != address(0), "invalid _projectToken");

        string memory projectTokenName = ERC20Upgradeable(_projectToken).name();
        string memory projectTokenSymbol = ERC20Upgradeable(_projectToken).symbol();
        emit AddPrjToken(_projectToken, projectTokenName, projectTokenSymbol);
        
        setProjectTokenInfo(
            _projectToken,
            false,
            false,
            _loanToValueRatioNumerator, 
            _loanToValueRatioDenominator
        );
    }

    /** 
     * @dev Removes a project token from the primary index token. 
     * @param _projectTokenId The ID of the project token to be removed.
     */
    function removeProjectToken(
        uint256 _projectTokenId
    ) public onlyAdmin isProjectTokenListed(primaryIndexToken.projectTokens(_projectTokenId)) {
        address projectToken = primaryIndexToken.projectTokens(_projectTokenId);
        require(primaryIndexToken.totalDepositedPerProjectToken(projectToken) == 0, "PIT: projectToken amount exist on PIT");
        primaryIndexToken.removeProjectToken(_projectTokenId, projectToken);
        emit RemoveProjectToken(projectToken);
    }

    /** 
     * @dev Adds a new lending token to the primary index token. 
     * @param _lendingToken The address of the lending token. 
     * @param _bLendingToken The address of the corresponding bLending token. 
     * @param _isPaused The initial pause status for the lending token
     * @param _loanToValueRatioNumerator The numerator of the loan-to-value ratio.
     * @param _loanToValueRatioDenominator The denominator of the loan-to-value ratio.
     */
    function addLendingToken(
        address _lendingToken, 
        address _bLendingToken,
        bool _isPaused,
        uint8 _loanToValueRatioNumerator,
        uint8 _loanToValueRatioDenominator
    ) public onlyAdmin {
        require(_lendingToken != address(0) && _bLendingToken != address(0), "PIT: invalid address");

        string memory lendingTokenName = ERC20Upgradeable(_lendingToken).name();
        string memory lendingTokenSymbol = ERC20Upgradeable(_lendingToken).symbol();
        emit AddLendingToken(_lendingToken, lendingTokenName, lendingTokenSymbol);

        setLendingTokenInfo(
            _lendingToken, 
            _bLendingToken, 
            _isPaused,
            _loanToValueRatioNumerator,
            _loanToValueRatioDenominator
        );
    }

    /** 
     * @dev Removes a lending token from the primary index token. 
     * @param _lendingTokenId The ID of the lending token to be removed.
     */
    function removeLendingToken(
        uint256 _lendingTokenId
    ) public onlyAdmin isLendingTokenListed(primaryIndexToken.lendingTokens(_lendingTokenId)) {
        address lendingToken = primaryIndexToken.lendingTokens(_lendingTokenId);

        for(uint256 i = 0; i < primaryIndexToken.projectTokensLength(); i++) {
            require(primaryIndexToken.totalBorrow(primaryIndexToken.projectTokens(i),lendingToken) == 0, "PIT: exist borrow of lendingToken");
        }
        primaryIndexToken.removeLendingToken(_lendingTokenId, lendingToken);
        emit RemoveLendingToken(lendingToken);
    }

    /** 
     * @dev Sets the leverage of the primary index token. 
     * @param newPrimaryIndexTokenLeverage The new leverage value.
     */
    function setPrimaryIndexTokenLeverage(address newPrimaryIndexTokenLeverage) public onlyAdmin {
        require(newPrimaryIndexTokenLeverage != address(0), "PIT: invalid address");
        primaryIndexToken.setPrimaryIndexTokenLeverage(newPrimaryIndexTokenLeverage);
        emit SetPrimaryIndexTokenLeverage(newPrimaryIndexTokenLeverage);
    }

    /** 
     * @dev Sets the price oracle for the primary index token. 
     * @param newOracle The address of the new price oracle.
     */
    function setPriceOracle(address newOracle) public onlyAdmin {
        require(newOracle != address(0), "PIT: invalid address");
        primaryIndexToken.setPriceOracle(newOracle);
        emit SetPriceOracle(newOracle);
    }

    /** 
     * @dev Adds an address to the list of related contracts.
     * @param newRelatedContract The address of the new related contract to be added.
     */
    function addRelatedContracts(address newRelatedContract) public onlyAdmin {
        require(newRelatedContract != address(0), "PIT: invalid address");
        primaryIndexToken.setRelatedContract(newRelatedContract, true);
        emit AddRelatedContracts(newRelatedContract);
    }

    /** 
     * @dev Removes an address from the list of related contracts. 
     * @param relatedContract The address of the related contract to be removed.
     */
    function removeRelatedContracts(address relatedContract) public onlyAdmin {
        require(relatedContract != address(0), "PIT: invalid address");
        primaryIndexToken.setRelatedContract(relatedContract, false);
        emit RemoveRelatedContracts(relatedContract);
    }

    //************* MODERATOR FUNCTIONS ********************************

    /** 
     * @dev Sets the parameters for a project token 
     * @param _projectToken The address of the project token
     * @param _isDepositPaused The new pause status for deposit 
     * @param _isWithdrawPaused The new pause status for withdrawal
     * @param _loanToValueRatioNumerator The numerator of the loan-to-value ratio for the project token 
     * @param _loanToValueRatioDenominator The denominator of the loan-to-value ratio for the project token 
     */
    function setProjectTokenInfo(
        address _projectToken,
        bool _isDepositPaused,
        bool _isWithdrawPaused,
        uint8 _loanToValueRatioNumerator,
        uint8 _loanToValueRatioDenominator
    ) public onlyModerator {
        require(_loanToValueRatioNumerator <= _loanToValueRatioDenominator, "invalid loanToValueRatio");
        
        primaryIndexToken.setProjectTokenInfo(
            _projectToken,
            _isDepositPaused,
            _isWithdrawPaused,
            _loanToValueRatioNumerator, 
            _loanToValueRatioDenominator
        );
        emit SetPausedProjectToken(_projectToken, _isDepositPaused, _isWithdrawPaused);
        emit LoanToValueRatioSet(_projectToken, _loanToValueRatioNumerator, _loanToValueRatioDenominator);
    }

    /** 
     * @dev Sets the pause status for deposit and withdrawal of a project token 
     * @param _projectToken The address of the project token 
     * @param _isDepositPaused The new pause status for deposit 
     * @param _isWithdrawPaused The new pause status for withdrawal
     */
    function setPausedProjectToken(
        address _projectToken, 
        bool _isDepositPaused, 
        bool _isWithdrawPaused
    ) public onlyModerator isProjectTokenListed(_projectToken) {
        primaryIndexToken.setPausedProjectToken(_projectToken, _isDepositPaused, _isWithdrawPaused);
        emit SetPausedProjectToken(_projectToken, _isDepositPaused, _isWithdrawPaused);
    } 

    /** 
     * @dev Sets the parameters for a lending token 
     * @param _lendingToken The address of the lending token 
     * @param _bLendingToken The address of the corresponding bLending token 
     * @param _isPaused The new pause status for the lending token
     * @param _loanToValueRatioNumerator The numerator of the loan-to-value ratio for the lending token
     * @param _loanToValueRatioDenominator The denominator of the loan-to-value ratio for the lending token
     */
    function setLendingTokenInfo(
        address _lendingToken, 
        address _bLendingToken,
        bool _isPaused,
        uint8 _loanToValueRatioNumerator,
        uint8 _loanToValueRatioDenominator
    ) public onlyModerator {
        primaryIndexToken.setLendingTokenInfo(_lendingToken, _bLendingToken, _isPaused, _loanToValueRatioNumerator, _loanToValueRatioDenominator);
        require(IBLendingToken(_bLendingToken).underlying() == _lendingToken, "PIT: underlyingOfbLendingToken!=lendingToken");
        emit SetPausedLendingToken(_lendingToken, _isPaused);
        emit LendingTokenLoanToValueRatioSet(_lendingToken, _loanToValueRatioNumerator, _loanToValueRatioDenominator);
    }

    /** 
     * @dev Sets the pause status for a lending token 
     * @param _lendingToken The address of the lending token 
     * @param _isPaused The new pause status for the lending token
     */
    function setPausedLendingToken(address _lendingToken, bool _isPaused) public onlyModerator isLendingTokenListed(_lendingToken) {
        primaryIndexToken.setPausedLendingToken(_lendingToken, _isPaused);
        emit SetPausedLendingToken(_lendingToken, _isPaused);
    }

    /**
     * @dev Sets the borrow limit per lending asset for a given lending token.
     * @param lendingToken The lending token for which to set the borrow limit.
     * @param _borrowLimit The new borrow limit.
     */
    function setBorrowLimitPerLendingAsset(address lendingToken, uint256 _borrowLimit) public onlyModerator isLendingTokenListed(lendingToken) {
        require(_borrowLimit > 0, "PIT: borrowLimit=0");
        require(lendingToken != address(0), "PIT: invalid address");
        primaryIndexToken.setBorrowLimitPerLendingAsset(lendingToken, _borrowLimit);
        emit SetBorrowLimitPerLendingAsset(lendingToken, _borrowLimit);
    }
}
