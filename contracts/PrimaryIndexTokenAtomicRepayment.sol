// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "./openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "./openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "./openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

import "./openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./interfaces/IPrimaryIndexToken.sol";

contract PrimaryIndexTokenAtomicRepayment is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    // using SafeERC20Upgradeable for ERC20Upgradeable;
    address public primaryIndexToken;
    mapping(address => bool) public isSupportedDex;

    event SetPrimaryIndexToken(address indexed oldPrimaryIndexToken, address indexed newPrimaryIndexToken);

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    function initialize(address pit) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init_unchained();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
        primaryIndexToken = pit;
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not the Admin");
        _;
    }

    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "Caller is not the Moderator");
        _;
    }

    modifier isProjectTokenListed(address projectToken) {
        require(IPrimaryIndexToken(primaryIndexToken).projectTokenInfo(projectToken).isListed, "PIT: project token is not listed");
        _;
    }

    function setPrimaryIndexToken(address pit) public onlyModerator() {
        primaryIndexToken = pit;
        emit SetPrimaryIndexToken(primaryIndexToken, pit);
    }

    function addListDexSupport(address[] memory exchanges) public onlyModerator() {
        for(uint i = 0; i < exchanges.length; i++) {
            isSupportedDex[exchanges[i]] = true;
        }
    }

    function removeListDexSupport(address[] memory exchanges) public onlyModerator() {
        for(uint i = 0; i < exchanges.length; i++) {
            isSupportedDex[exchanges[i]] = false;
        }
    }

   function getRemainingDeposit(address user, address projectToken) public view returns(uint remainingDeposit) {
        address usdcToken = IPrimaryIndexToken(primaryIndexToken).usdcToken();
        uint borrowedUSD = IPrimaryIndexToken(primaryIndexToken).totalOutstanding(user, projectToken, usdcToken);
        address currentLendingToken = IPrimaryIndexToken(primaryIndexToken).lendingTokenPerCollateral(user, projectToken);
        address actualLendingToken;
        if (currentLendingToken != address(0)) {
            actualLendingToken = currentLendingToken;
        } else {
            actualLendingToken = borrowedUSD > 0 ? usdcToken : address(0);
        }
        uint256 _totalOutstanding = actualLendingToken == address(0) ? 0 :  IPrimaryIndexToken(primaryIndexToken).totalOutstandingInUSD(user, projectToken, actualLendingToken) ;
       if (IPrimaryIndexToken(primaryIndexToken).borrowPosition(user, projectToken, actualLendingToken).loanBody > 0) {
            uint8 projectTokenDecimals = ERC20Upgradeable(projectToken).decimals();

            IPrimaryIndexToken.Ratio memory lvr = IPrimaryIndexToken(primaryIndexToken).projectTokenInfo(projectToken).loanToValueRatio;
            uint256 depositedProjectTokenAmount = IPrimaryIndexToken(primaryIndexToken).getDepositedAmount(projectToken, user);

            uint256 collateralProjectTokenAmount = _totalOutstanding * lvr.denominator * (10 ** projectTokenDecimals) / IPrimaryIndexToken(primaryIndexToken).getTokenEvaluation(projectToken, 10 ** projectTokenDecimals) / lvr.numerator;
            remainingDeposit = depositedProjectTokenAmount > collateralProjectTokenAmount ? depositedProjectTokenAmount - collateralProjectTokenAmount : 0;
        } else {
            remainingDeposit = IPrimaryIndexToken(primaryIndexToken).getDepositedAmount(projectToken, user);
        }
   }

    function repayAtomic(address prjToken, address lendingToken, address dex) public {
        uint amount;
        ERC20Upgradeable(prjToken).approve(dex, amount);

    }

    function swap(address _target, bytes memory _data) public returns (bytes memory response) {
        // solium-disable-next-line security/no-call-value
        (bool success, bytes memory returnData) = _target.call(_data);
        require(success, "Transaction execution reverted.");

    }


}