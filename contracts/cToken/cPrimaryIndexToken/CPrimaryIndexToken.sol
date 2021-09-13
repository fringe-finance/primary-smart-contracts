// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../CErc20.sol";
import "../../../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../comptroller/ComptrollerInterface.sol";
import "../../interestRateModel/InterestRateModel.sol";

contract CPrimaryIndexToken is Initializable, CErc20{

    function init(  address underlying_,
                    ComptrollerInterface comptroller_,
                    InterestRateModel interestRateModel_,
                    uint initialExchangeRateMantissa_,
                    string memory name_, 
                    string memory symbol_,
                    uint8 decimals_,
                    address admin_) public initializer{
        admin = payable(msg.sender);
        super.initialize(underlying_, comptroller_, interestRateModel_, initialExchangeRateMantissa_, name_, symbol_, decimals_);
        admin = payable(admin_);
    }

    function mintTo(address minter, uint mintAmount) external returns(uint err, uint mintedAmount){
        require(msg.sender == underlying,"cPrimaryIndexToken: only Primary Index Token can call mintTo!");
        uint error = accrueInterest();
        if (error != uint(Error.NO_ERROR)) {
            // accrueInterest emits logs on errors, but we still want to log the fact that an attempted borrow failed
            return (fail(Error(error), FailureInfo.MINT_ACCRUE_INTEREST_FAILED), 0);
        }
        (err, mintedAmount) = mintFresh(minter, mintAmount);
    }

    function redeemTo(address redeemer,uint redeemTokens) external returns(uint redeemErr){
        require(msg.sender == underlying,"cPrimaryIndexToken: only Primary Index Token can call redeemTo!");
        uint error = accrueInterest();
        if (error != uint(Error.NO_ERROR)) {
            // accrueInterest emits logs on errors, but we still want to log the fact that an attempted redeem failed
            return fail(Error(error), FailureInfo.REDEEM_ACCRUE_INTEREST_FAILED);
        }
        // redeemFresh emits redeem-specific logs on errors, so we don't need to
        //return redeemFresh(payable(msg.sender), redeemTokens, 0);
        redeemErr = redeemFresh(payable(redeemer), redeemTokens, 0);
    }

    function redeemUnderlyingTo(address redeemer, uint redeemAmount) external returns(uint redeemUnderlyingError){
        uint error = accrueInterest();
        if (error != uint(Error.NO_ERROR)) {
            // accrueInterest emits logs on errors, but we still want to log the fact that an attempted redeem failed
            return fail(Error(error), FailureInfo.REDEEM_ACCRUE_INTEREST_FAILED);
        }
        // redeemFresh emits redeem-specific logs on errors, so we don't need to
        redeemUnderlyingError = redeemFresh(payable(redeemer), 0, redeemAmount);
    }

}