// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./BErc20.sol";
import "./../bondtroller/Bondtroller.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/**
 * @title BLendingToken
 * @notice The BLendingToken contract
 */
contract BLendingToken is Initializable, BErc20, AccessControlUpgradeable {
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    address public primaryLendingPlatform;

    /**
     * @dev Emitted when the primary lending platform is set.
     * @param oldPrimaryLendingPlatform The address of the old primary lending platform.
     * @param newPrimaryLendingPlatform The address of the new primary lending platform.
     */
    event SetPrimaryLendingPlatform(address indexed oldPrimaryLendingPlatform, address indexed newPrimaryLendingPlatform);

    /**
     * @dev Initializes the bToken contract with the given parameters.
     * @param underlying_ The address of the underlying asset contract.
     * @param bondtroller_ The address of the Bondtroller contract.
     * @param interestRateModel_ The address of the interest rate model contract.
     * @param initialExchangeRateMantissa_ The initial exchange rate mantissa for the bToken contract.
     * @param name_ The name of the bToken contract.
     * @param symbol_ The symbol of the bToken contract.
     * @param decimals_ The number of decimals for the bToken contract.
     * @param admin_ The address of the admin for the bToken contract.
     */
    function init(
        address underlying_,
        Bondtroller bondtroller_,
        InterestRateModel interestRateModel_,
        uint256 initialExchangeRateMantissa_,
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        address admin_
    ) public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, admin_);
        _setupRole(MODERATOR_ROLE, admin_);
        admin = payable(msg.sender);
        super.initialize(underlying_, bondtroller_, interestRateModel_, initialExchangeRateMantissa_, name_, symbol_, decimals_);
        admin = payable(admin_);
    }

    /**
     * @dev Modifier to check if the caller has the DEFAULT_ADMIN_ROLE.
     */
    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "msg.sender not admin!");
        _;
    }

    /**
     * @dev Modifier to restrict access to functions that can only be called by the primary lending platform.
     */
    modifier onlyPrimaryLendingPlatform() {
        require(msg.sender == primaryLendingPlatform);
        _;
    }

    /********************** ADMIN FUNCTIONS ********************** */

    /**
     * @dev Sets the primary lending platform for the BLendingToken contract.
     * @param _primaryLendingPlatform The address of the primary lending platform to be set.
     */
    function setPrimaryLendingPlatform(address _primaryLendingPlatform) public onlyAdmin {
        require(primaryLendingPlatform == address(0), "BLendingToken: primary index token is set");
        emit SetPrimaryLendingPlatform(primaryLendingPlatform, _primaryLendingPlatform);
        primaryLendingPlatform = _primaryLendingPlatform;
    }

    /**
     * @dev Grants the `MODERATOR_ROLE` to a new address.
     * @param newModerator The address to grant the `MODERATOR_ROLE` to.
     */
    function grantModerator(address newModerator) public onlyAdmin {
        grantRole(MODERATOR_ROLE, newModerator);
    }

    /**
     * @dev Revokes the moderator role from the specified address.
     * @param moderator The address of the moderator to revoke the role from.
     */
    function revokeModerator(address moderator) public onlyAdmin {
        revokeRole(MODERATOR_ROLE, moderator);
    }

    /**
     * @dev Transfers the adminship to a new address.
     * @param newAdmin The address of the new admin.
     */
    function transferAdminship(address payable newAdmin) public onlyAdmin {
        require(newAdmin != address(0), "BLendingToken: newAdmin==0");
        grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
        revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
        admin = newAdmin;
    }

    /********************** END ADMIN FUNCTIONS ********************** */

    /********************** MODERATOR FUNCTIONS ********************** */

    /**
     * @dev Returns true if the specified account has the moderator role.
     * @param account The address to check for the moderator role.
     * @return A boolean indicating whether the account has the moderator role or not.
     */
    function hasRoleModerator(address account) public view override returns (bool) {
        return hasRole(MODERATOR_ROLE, account);
    }

    /********************** END MODERATOR FUNCTIONS ********************** */

    /**
     * @dev Mints new tokens to the specified minter address.
     * @param minter The address of the minter.
     * @param mintAmount The amount of tokens to mint.
     * @return err An error code (0 if successful).
     * @return mintedAmount The amount of tokens that were minted.
     */
    function mintTo(address minter, uint256 mintAmount) external onlyPrimaryLendingPlatform returns (uint256 err, uint256 mintedAmount) {
        uint256 error = accrueInterest();

        if (error != uint256(Error.NO_ERROR)) {
            // accrueInterest emits logs on errors, but we still want to log the fact that an attempted borrow failed
            return (fail(Error(error), FailureInfo.MINT_ACCRUE_INTEREST_FAILED), 0);
        }

        (err, mintedAmount) = mintFresh(minter, mintAmount);
        require(err == 0, "BLendingToken: err is not zero!");
        require(mintedAmount > 0, "BLendingToken: minted amount is zero!");
    }

    /**
     * @dev Redeems `redeemTokens` amount of bTokens for underlying assets to the `redeemer` address.
     * Only the primary lending platform can call this function.
     * @param redeemer The address of the account that will receive the underlying assets.
     * @param redeemTokens The amount of bTokens to be redeemed.
     * @return redeemErr An error code corresponding to the success or failure of the redemption operation.
     */
    function redeemTo(address redeemer, uint256 redeemTokens) external onlyPrimaryLendingPlatform returns (uint256 redeemErr) {
        uint256 error = accrueInterest();
        if (error != uint256(Error.NO_ERROR)) {
            // accrueInterest emits logs on errors, but we still want to log the fact that an attempted redeem failed
            return fail(Error(error), FailureInfo.REDEEM_ACCRUE_INTEREST_FAILED);
        }
        // redeemFresh emits redeem-specific logs on errors, so we don't need to
        //return redeemFresh(payable(msg.sender), redeemTokens, 0);
        redeemErr = redeemFresh(payable(redeemer), redeemTokens, 0);
    }

    /**
     * @dev Redeems `redeemAmount` of bTokens for underlying asset and transfers them to `redeemer`.
     * Only the primary lending platform can call this function.
     * @param redeemer The address of the account that will receive the underlying asset.
     * @param redeemAmount The amount of bTokens to redeem for underlying asset.
     * @return redeemUnderlyingError An error code corresponding to the success or failure of the redeem operation.
     */
    function redeemUnderlyingTo(address redeemer, uint256 redeemAmount) external onlyPrimaryLendingPlatform returns (uint256 redeemUnderlyingError) {
        uint256 error = accrueInterest();
        if (error != uint256(Error.NO_ERROR)) {
            // accrueInterest emits logs on errors, but we still want to log the fact that an attempted redeem failed
            return fail(Error(error), FailureInfo.REDEEM_ACCRUE_INTEREST_FAILED);
        }
        // redeemFresh emits redeem-specific logs on errors, so we don't need to
        redeemUnderlyingError = redeemFresh(payable(redeemer), 0, redeemAmount);
    }

    /**
     * @dev Allows the primary lending platform to borrow tokens on behalf of a borrower.
     * @param borrower The address of the borrower.
     * @param borrowAmount The amount of tokens to be borrowed.
     * @return borrowError The error code (if any) returned by the borrowFresh function.
     */
    function borrowTo(address borrower, uint256 borrowAmount) external onlyPrimaryLendingPlatform returns (uint256 borrowError) {
        uint256 error = accrueInterest();
        if (error != uint256(Error.NO_ERROR)) {
            // accrueInterest emits logs on errors, but we still want to log the fact that an attempted borrow failed
            return fail(Error(error), FailureInfo.BORROW_ACCRUE_INTEREST_FAILED);
        }
        // borrowFresh emits borrow-specific logs on errors, so we don't need to
        borrowError = borrowFresh(payable(borrower), borrowAmount);
    }

    /**
     * @dev Repays a specified amount of the calling user's borrow balance to a borrower.
     * Only callable by the primary lending platform.
     * @param payer The address of the account that will be paying the borrow balance.
     * @param borrower The address of the account with the borrow balance being repaid.
     * @param repayAmount The amount of the borrow balance to repay.
     * @return repayBorrowError The error code corresponding to the success or failure of the repay borrow operation.
     * @return amountRepaid The actual amount repaid, which may be less than the specified `repayAmount` if there is not enough balance available to repay.
     */
    function repayTo(
        address payer,
        address borrower,
        uint256 repayAmount
    ) external onlyPrimaryLendingPlatform returns (uint256 repayBorrowError, uint256 amountRepaid) {
        uint256 error = accrueInterest();
        if (error != uint256(Error.NO_ERROR)) {
            // accrueInterest emits logs on errors, but we still want to log the fact that an attempted borrow failed
            return (fail(Error(error), FailureInfo.REPAY_BORROW_ACCRUE_INTEREST_FAILED), 0);
        }
        // repayBorrowFresh emits repay-borrow-specific logs on errors, so we don't need to
        (repayBorrowError, amountRepaid) = repayBorrowFresh(payer, borrower, repayAmount);
    }

    /**
     * @dev Calculates the estimated borrow index based on the current borrow interest rate and the number of blocks elapsed since the last accrual.
     * @return The estimated borrow index as a uint256 value.
     */
    function getEstimatedBorrowIndex() public view returns (uint256) {
        /* Remember the initial block number */
        uint256 currentBlockNumber = getBlockNumber();
        uint256 accrualBlockNumberPrior = accrualBlockNumber;

        /* Short-circuit accumulating 0 interest */
        if (accrualBlockNumberPrior == currentBlockNumber) {
            return borrowIndex;
        }

        /* Read the previous values out of storage */
        uint256 cashPrior = getCashPrior();
        uint256 borrowsPrior = totalBorrows;
        uint256 reservesPrior = totalReserves;
        uint256 borrowIndexPrior = borrowIndex;

        /* Calculate the current borrow interest rate */
        uint256 borrowRateMantissa = interestRateModel.getBorrowRate(cashPrior, borrowsPrior, reservesPrior, address(this));
        require(borrowRateMantissa <= borrowRateMaxMantissa, "borrow rate is absurdly high");

        /* Calculate the number of blocks elapsed since the last accrual */
        (MathError mathErr, uint256 blockDelta) = subUInt(currentBlockNumber, accrualBlockNumberPrior);
        require(mathErr == MathError.NO_ERROR, "BLendingToken: Could not calculate block delta");

        /*
         * Calculate the interest accumulated into borrows and reserves and the new index:
         *  simpleInterestFactor = borrowRate * blockDelta
         *  interestAccumulated = simpleInterestFactor * totalBorrows
         *  totalBorrowsNew = interestAccumulated + totalBorrows
         *  totalReservesNew = interestAccumulated * reserveFactor + totalReserves
         *  borrowIndexNew = simpleInterestFactor * borrowIndex + borrowIndex
         */

        Exp memory simpleInterestFactor;
        // uint256 interestAccumulated;
        // uint256 totalBorrowsNew;
        // uint256 totalReservesNew;
        uint256 borrowIndexNew;
        (mathErr, simpleInterestFactor) = mulScalar(Exp({mantissa: borrowRateMantissa}), blockDelta);
        if (mathErr != MathError.NO_ERROR) {
            return 0;
        }

        // (mathErr, interestAccumulated) = mulScalarTruncate(simpleInterestFactor, borrowsPrior);
        // if (mathErr != MathError.NO_ERROR) {
        //     return 0;
        // }

        // (mathErr, totalBorrowsNew) = addUInt(interestAccumulated, borrowsPrior);
        // if (mathErr != MathError.NO_ERROR) {
        //     return 0;
        // }

        // (mathErr, totalReservesNew) = mulScalarTruncateAddUInt(Exp({mantissa: reserveFactorMantissa}), interestAccumulated, reservesPrior);
        // if (mathErr != MathError.NO_ERROR) {
        //     return 0;
        // }

        (mathErr, borrowIndexNew) = mulScalarTruncateAddUInt(simpleInterestFactor, borrowIndexPrior, borrowIndexPrior);
        if (mathErr != MathError.NO_ERROR) {
            return 0;
        }

        return borrowIndexNew;
    }

    /**
     * @dev Returns the estimated borrow balance of an account based on the current borrow index.
     * @param account The address of the account to get the borrow balance for.
     * @return accrual The estimated borrow balance of the account.
     */
    function getEstimatedBorrowBalanceStored(address account) public view returns (uint256 accrual) {
        uint256 borrowIndexNew = getEstimatedBorrowIndex();
        MathError mathErr;
        uint256 principalTimesIndex;
        uint256 result;

        /* Get borrowBalance and borrowIndex */
        BorrowSnapshot memory borrowSnapshot = accountBorrows[account];

        /* If borrowBalance = 0 then borrowIndex is likely also 0.
         * Rather than failing the calculation with a division by 0, we immediately return 0 in this case.
         */
        if (borrowSnapshot.principal == 0) {
            return 0;
        }

        /* Calculate new borrow balance using the interest index:
         *  recentBorrowBalance = borrower.borrowBalance * market.borrowIndex / borrower.borrowIndex
         */
        (mathErr, principalTimesIndex) = mulUInt(borrowSnapshot.principal, borrowIndexNew);
        if (mathErr != MathError.NO_ERROR) {
            return 0;
        }

        (mathErr, result) = divUInt(principalTimesIndex, borrowSnapshot.interestIndex);
        if (mathErr != MathError.NO_ERROR) {
            return 0;
        }

        return result;
    }
}
