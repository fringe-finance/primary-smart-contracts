// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./BErc20.sol";
import "./../bondtroller/Bondtroller.sol";
import "./../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";


contract BLendingToken is Initializable, BErc20, AccessControlUpgradeable {

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    address public primaryIndexToken;

    mapping(address => uint256) public borrowLimit; // prj token address => borrow limit in USD
    mapping(address => uint256) public totalBorrow; // prj token address => totalBorrow of 

    event SetPrimaryIndexToken(address indexed oldPrimaryIndexToken, address indexed newPrimaryIndexToken);
    event SetBorrowLimit(address indexed projectToken, uint256 oldBorrowLimit, uint256 newBorrowLimit);

    function init(  address underlying_,
                    Bondtroller bondtroller_,
                    InterestRateModel interestRateModel_,
                    uint initialExchangeRateMantissa_,
                    string memory name_, 
                    string memory symbol_,
                    uint8 decimals_,
                    address admin_) public initializer{
        
        admin = payable(msg.sender);
        super.initialize(underlying_, bondtroller_, interestRateModel_, initialExchangeRateMantissa_, name_, symbol_, decimals_);
        admin = payable(admin_);
        __AccessControl_init();
        _setupRole(MODERATOR_ROLE, admin);
    }
    
    modifier onlyAdmin(){
        require(msg.sender == admin,"msg.sender not admin!");
        _;
    }

    modifier onlyPrimaryIndexToken {
        require(msg.sender == primaryIndexToken);
        _;
    }

    modifier onlyModerator {
        require(hasRole(MODERATOR_ROLE, msg.sender), "msg.sender not moderator");
        _;
    }
    
    /********************** ADMIN FUNCTIONS ********************** */

    function setPrimaryIndexToken(address _primaryIndexToken) public onlyAdmin {
        require(primaryIndexToken == address(0), "BLendingToken: primary index token is set");
        emit SetPrimaryIndexToken(primaryIndexToken, _primaryIndexToken);
        primaryIndexToken = _primaryIndexToken;
    }

    function grandModerator(address newModerator) public onlyAdmin {
        grantRole(MODERATOR_ROLE, newModerator);
    }

    function revokeModerator(address moderator) public onlyAdmin {
        revokeRole(MODERATOR_ROLE, moderator);
    }

    /********************** END ADMIN FUNCTIONS ********************** */

    /********************** MODERATOR FUNCTIONS ********************** */

    function setBorrowLimit(address projectToken, uint256 newBorrowLimit) public onlyModerator {
        emit SetBorrowLimit(projectToken, borrowLimit[projectToken], newBorrowLimit);
        borrowLimit[projectToken] = newBorrowLimit;
    }

    function setReserveFactor(uint256 reserveFactorMantissa) public onlyModerator{
        _setReserveFactorFresh(reserveFactorMantissa);
    }

    /********************** END MODERATOR FUNCTIONS ********************** */


    function mintTo(address minter, uint mintAmount) external onlyPrimaryIndexToken returns(uint err, uint mintedAmount){
        uint error = accrueInterest();
        
        if (error != uint(Error.NO_ERROR)) {
            // accrueInterest emits logs on errors, but we still want to log the fact that an attempted borrow failed
            return (fail(Error(error), FailureInfo.MINT_ACCRUE_INTEREST_FAILED), 0);
        }
       
        (err, mintedAmount) = mintFresh(minter, mintAmount);
        require(err == 0,"BLendingToken: err is not zero!");
        require(mintedAmount > 0, "BLendingToken: minted amount is zero!");
        
    }

     function redeemTo(address redeemer,uint redeemTokens) external onlyPrimaryIndexToken returns(uint redeemErr){
        uint error = accrueInterest();
        if (error != uint(Error.NO_ERROR)) {
            // accrueInterest emits logs on errors, but we still want to log the fact that an attempted redeem failed
            return fail(Error(error), FailureInfo.REDEEM_ACCRUE_INTEREST_FAILED);
        }
        // redeemFresh emits redeem-specific logs on errors, so we don't need to
        //return redeemFresh(payable(msg.sender), redeemTokens, 0);
        redeemErr = redeemFresh(payable(redeemer), redeemTokens, 0);
    }

    function redeemUnderlyingTo(address redeemer, uint redeemAmount) external onlyPrimaryIndexToken returns(uint redeemUnderlyingError){
        uint error = accrueInterest();
        if (error != uint(Error.NO_ERROR)) {
            // accrueInterest emits logs on errors, but we still want to log the fact that an attempted redeem failed
            return fail(Error(error), FailureInfo.REDEEM_ACCRUE_INTEREST_FAILED);
        }
        // redeemFresh emits redeem-specific logs on errors, so we don't need to
        redeemUnderlyingError = redeemFresh(payable(redeemer), 0, redeemAmount);
    }

    function borrowTo(address projectToken, address borrower, uint borrowAmount) external onlyPrimaryIndexToken returns (uint borrowError) {
        uint error = accrueInterest();
        totalBorrow[projectToken] += borrowAmount;
        require(totalBorrow[projectToken] <= borrowLimit[projectToken], "bToken: totalBorrow exceeded borrowLimit");
        if (error != uint(Error.NO_ERROR)) {
            // accrueInterest emits logs on errors, but we still want to log the fact that an attempted borrow failed
            return fail(Error(error), FailureInfo.BORROW_ACCRUE_INTEREST_FAILED);
        }
        // borrowFresh emits borrow-specific logs on errors, so we don't need to
        borrowError = borrowFresh(payable(borrower), borrowAmount);
    }

    function repayBorrowTo(address projectToken, address payer, uint repayAmount) external onlyPrimaryIndexToken returns (uint repayBorrowError, uint amountRepayed) {
        uint error = accrueInterest();
        if (error != uint(Error.NO_ERROR)) {
            // accrueInterest emits logs on errors, but we still want to log the fact that an attempted borrow failed
            return (fail(Error(error), FailureInfo.REPAY_BORROW_ACCRUE_INTEREST_FAILED), 0);
        }
        // repayBorrowFresh emits repay-borrow-specific logs on errors, so we don't need to
        (repayBorrowError,amountRepayed) = repayBorrowFresh(payer, payer, repayAmount);
        totalBorrow[projectToken] -= amountRepayed;
    }

    function repayBorrowToBorrower(address projectToken, address payer,address borrower, uint repayAmount) external onlyPrimaryIndexToken returns (uint repayBorrowError, uint amountRepayed) {
        uint error = accrueInterest();
        if (error != uint(Error.NO_ERROR)) {
            // accrueInterest emits logs on errors, but we still want to log the fact that an attempted borrow failed
            return (fail(Error(error), FailureInfo.REPAY_BORROW_ACCRUE_INTEREST_FAILED), 0);
        }
        // repayBorrowFresh emits repay-borrow-specific logs on errors, so we don't need to
        (repayBorrowError,amountRepayed) = repayBorrowFresh(payer, borrower, repayAmount);
        totalBorrow[projectToken] -= amountRepayed;
    }

    


}
