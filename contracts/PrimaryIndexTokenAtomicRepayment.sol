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

contract PrimaryIndexTokenAtomicRepayment is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for ERC20Upgradeable;
    address public primaryIndexToken;
    mapping(address => bool) public isSupportedDex;
    address augustusParaswap;

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

    function getTotalOutstanding(address user, address projectToken, address lendingAsset) public view returns(uint outstanding) {
        outstanding = IPrimaryIndexToken(primaryIndexToken).totalOutstanding(user, projectToken, lendingAsset);       
    }

    function getLendingToken(address user, address projectToken) public view returns(address actualLendingToken) {
        address usdcToken = IPrimaryIndexToken(primaryIndexToken).usdcToken();

        uint borrowedUSD = IPrimaryIndexToken(primaryIndexToken).totalOutstanding(user, projectToken, usdcToken);

        address currentLendingToken = IPrimaryIndexToken(primaryIndexToken).lendingTokenPerCollateral(user, projectToken);

        if (currentLendingToken != address(0)) {
            actualLendingToken = currentLendingToken;
        } else {
            actualLendingToken = borrowedUSD > 0 ? usdcToken : address(0);
        }
    }

    function getRemainingDeposit(address user, address projectToken, address lendingToken) public view returns(uint remainingDeposit) {
        uint256 depositedProjectTokenAmount = IPrimaryIndexToken(primaryIndexToken).getDepositedAmount(projectToken, user);
        if(lendingToken == address(0)) {
            remainingDeposit = depositedProjectTokenAmount;
        } else {
            uint256 _totalOutstanding = IPrimaryIndexToken(primaryIndexToken).totalOutstandingInUSD(user, projectToken, lendingToken);
            uint8 projectTokenDecimals = ERC20Upgradeable(projectToken).decimals();
            IPrimaryIndexToken.Ratio memory lvr = IPrimaryIndexToken(primaryIndexToken).projectTokenInfo(projectToken).loanToValueRatio;
            uint256 collateralProjectTokenAmount = _totalOutstanding * lvr.denominator * (10 ** projectTokenDecimals) / IPrimaryIndexToken(primaryIndexToken).getTokenEvaluation(projectToken, 10 ** projectTokenDecimals) / lvr.numerator;
             if (depositedProjectTokenAmount >= collateralProjectTokenAmount){
                    remainingDeposit = depositedProjectTokenAmount - collateralProjectTokenAmount;
            } else {
                    remainingDeposit = 0;
            }
        }
   }

    function repayAtomic(address prjToken, uint collateralAmount, bytes memory buyCalldata) public {
        address lendingToken = getLendingToken(msg.sender, prjToken);
        uint remainingDeposit = getRemainingDeposit(msg.sender, prjToken, lendingToken);
        require(remainingDeposit <= collateralAmount, "PIT: invlid amount");
        IPrimaryIndexToken(primaryIndexToken).calcDepositPositionWhenAtomicRepay(prjToken, collateralAmount, msg.sender);
        (uint amountSold, uint amountRecive) = _buyOnParaSwap(prjToken, lendingToken, augustusParaswap, buyCalldata);
        //deposit collateral back in the pool, if left after the swap(buy)
        uint256 collateralBalanceLeft = collateralAmount - amountSold;
        if (collateralBalanceLeft > 0) {
            ERC20Upgradeable(prjToken).safeApprove(primaryIndexToken, collateralBalanceLeft);
            IPrimaryIndexToken(primaryIndexToken).deposit(prjToken, collateralBalanceLeft, msg.sender);
        }
        uint totalOutStanding = getTotalOutstanding(msg.sender, prjToken, lendingToken);
        if(amountRecive > totalOutStanding) {
            uint amountBackToUser = amountRecive - totalOutStanding;
            ERC20Upgradeable(prjToken).safeTransferFrom(address(this), msg.sender, amountBackToUser);
        }
        address bLendingToken = address(IPrimaryIndexToken(primaryIndexToken).lendingTokenInfo(lendingToken).bLendingToken);
        ERC20Upgradeable(lendingToken).safeApprove(bLendingToken, amountRecive);
        IPrimaryIndexToken(primaryIndexToken).repay(address(this), msg.sender, prjToken, lendingToken, amountRecive);
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
        amountSold = afterBalanceFrom - beforeBalanceFrom;
        amountRecive = afterBalanceTo - beforeBalanceTo;
    }


}