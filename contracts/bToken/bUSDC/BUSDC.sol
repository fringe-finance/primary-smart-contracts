// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../BErc20.sol";
import "../../bondtroller/Bondtroller.sol";
import "../../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract BUSDC is Initializable, BErc20{

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
    }
    
    modifier onlyAdmin(){
        require(msg.sender == admin,"msg.sender not admin!");
        _;
    }

    modifier onlyPrimaryIndexToken {
        require(msg.sender == primaryIndexToken);
        _;
    }
    
    /********************** ADMIN FUNCTIONS ********************** */

    function setReserveFactor(uint256 reserveFactorMantissa) public onlyAdmin{
        _setReserveFactorFresh(reserveFactorMantissa);
    }

    function setPrimaryIndexToken(address _primaryIndexToken) public onlyAdmin {
        emit SetPrimaryIndexToken(primaryIndexToken, _primaryIndexToken);
        primaryIndexToken = _primaryIndexToken;
    }

    function setBorrowLimit(address projectToken, uint256 newBorrowLimit) public onlyAdmin {
        emit SetBorrowLimit(projectToken, borrowLimit[projectToken], newBorrowLimit);
        borrowLimit[projectToken] = newBorrowLimit;
    }

    /********************** ADMIN FUNCTIONS ********************** */


    function mintTo(address minter, uint mintAmount) external onlyPrimaryIndexToken returns(uint err, uint mintedAmount){
        uint error = accrueInterest();
        
        if (error != uint(Error.NO_ERROR)) {
            // accrueInterest emits logs on errors, but we still want to log the fact that an attempted borrow failed
            return (fail(Error(error), FailureInfo.MINT_ACCRUE_INTEREST_FAILED), 0);
        }
       
        (err, mintedAmount) = mintFresh(minter, mintAmount);
        require(err == 0,"cPrimaryIndexToken: err is not zero!");
        require(mintedAmount > 0, "cPrimaryIndexToken: minted amount is zero!");
        
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
