// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../bToken/BToken.sol";
import "../util/ErrorReporter.sol";
import "../util/ExponentialNoError.sol";
import "./BondtrollerStorage.sol";

/**
 * @title Remastered from Compound's Bondtroller Contract
 * @author Bonded
 * @dev Contract for managing the Bond market and its associated BToken contracts.
 */
contract Bondtroller is BondtrollerV5Storage, BondtrollerErrorReporter, ExponentialNoError, Initializable {
    /// @notice Emitted when an admin supports a market
    event MarketListed(BToken bToken);

    /// @notice Emitted when an account enters a market
    event MarketEntered(BToken bToken, address account);

    /// @notice Emitted when an account exits a market
    event MarketExited(BToken bToken, address account);

    /// @notice Emitted when price oracle is changed
    event NewPriceOracle(address oldPriceOracle, address newPriceOracle);

    /// @notice Emitted when pause guardian is changed
    event NewPauseGuardian(address oldPauseGuardian, address newPauseGuardian);

    /// @notice Emitted when an action is paused globally
    event GlobalActionPaused(string action, bool pauseState);

    /// @notice Emitted when an action is paused on a market
    event ActionPaused(BToken bToken, string action, bool pauseState);

    /// @notice Emitted when borrow cap for a bToken is changed
    event NewBorrowCap(BToken indexed bToken, uint256 newBorrowCap);

    /// @notice Emitted when borrow cap guardian is changed
    event NewBorrowCapGuardian(address oldBorrowCapGuardian, address newBorrowCapGuardian);

    /// @notice Emitted when COMP is granted by admin
    event CompGranted(address recipient, uint256 amount);

    event NewPrimaryLendingPlatform(address oldPrimaryLendingPlatform, address newPrimaryLendingPlatform);

    /// @notice Emitted when admin address is changed by previous admin
    event NewAdmin(address newAdmin);

    /// @notice the address of primary index token
    address public primaryLendingPlatform;

    /**
     * @dev Initializes the Bondtroller contract by setting the admin to the sender's address and setting the pause guardian to the admin.
     */
    function init() public initializer {
        admin = msg.sender;
        setPauseGuardian(admin);
    }

    /**
     * @dev Throws if called by any account other than the primary index token.
     */
    modifier onlyPrimaryLendingPlatform() {
        require(msg.sender == primaryLendingPlatform);
        _;
    }

    /**
     * @dev Returns the address of the primary lending platform.
     * @return The address of the primary lending platform.
     */
    function getPrimaryLendingPlatformAddress() external view returns (address) {
        return primaryLendingPlatform;
    }

    /*** Assets You Are In ***/

    /**
     * @dev Returns the assets an account has entered.
     * @param account The address of the account to pull assets for.
     * @return A dynamic list with the assets the account has entered.
     */
    function getAssetsIn(address account) external view returns (BToken[] memory) {
        BToken[] memory assetsIn = accountAssets[account];

        return assetsIn;
    }

    /**
     * @dev Returns whether the given account is entered in the given asset.
     * @param account The address of the account to check.
     * @param bToken The bToken to check.
     * @return True if the account is in the asset, otherwise false.
     */
    function checkMembership(address account, BToken bToken) external view returns (bool) {
        return accountMembership[account][address(bToken)];
    }

    /**
     * @dev Changes the admin address of the Bondtroller contract.
     * @param newAdmin The new admin address to be set.
     */
    function changeAdmin(address newAdmin) external {
        require(msg.sender == admin && newAdmin != address(0), "Bondtroller: Invalid address");
        admin = newAdmin;
        emit NewAdmin(newAdmin);
    }

    /**
     * @dev Add assets to be included in account liquidity calculation.
     * @param bTokens The list of addresses of the bToken markets to be enabled.
     * @return Success indicator for whether each corresponding market was entered.
     */
    function enterMarkets(address[] memory bTokens) public onlyPrimaryLendingPlatform returns (uint256[] memory) {
        uint256 len = bTokens.length;

        uint256[] memory results = new uint256[](len);
        for (uint256 i = 0; i < len; i++) {
            BToken bToken = BToken(bTokens[i]);

            results[i] = uint256(addToMarketInternal(bToken, msg.sender));
        }

        return results;
    }

    /**
     * @dev Allows a borrower to enter a market by adding the corresponding BToken to the market and updating the borrower's status.
     * @param bToken The address of the BToken to add to the market.
     * @param borrower The address of the borrower to update status for.
     * @return An Error code indicating if the operation was successful or not.
     */
    function enterMarket(address bToken, address borrower) public onlyPrimaryLendingPlatform returns (Error) {
        return addToMarketInternal(BToken(bToken), borrower);
    }

    /**
     * @dev Adds the market to the borrower's "assets in" for liquidity calculations.
     * @param bToken The market to enter.
     * @param borrower The address of the account to modify.
     * @return Success indicator for whether the market was entered.
     */
    function addToMarketInternal(BToken bToken, address borrower) internal returns (Error) {
        Market storage marketToJoin = markets[address(bToken)];

        if (!marketToJoin.isListed) {
            // market is not listed, cannot join
            return Error.MARKET_NOT_LISTED;
        }

        if (accountMembership[borrower][address(bToken)] == true) {
            // already joined
            return Error.NO_ERROR;
        }

        // survived the gauntlet, add to list
        // NOTE: we store these somewhat redundantly as a significant optimization
        //  this avoids having to iterate through the list for the most common use cases
        //  that is, only when we need to perform liquidity checks
        //  and not whenever we want to check if an account is in a particular market
        accountMembership[borrower][address(bToken)] = true;
        accountAssets[borrower].push(bToken);

        emit MarketEntered(bToken, borrower);

        return Error.NO_ERROR;
    }

    /**
     * @dev Removes asset from sender's account liquidity calculation.
     * Sender must not have an outstanding borrow balance in the asset,
     * or be providing necessary collateral for an outstanding borrow.
     * @param cTokenAddress The address of the asset to be removed.
     * @return Whether or not the account successfully exited the market.
     */
    function exitMarket(address cTokenAddress) external onlyPrimaryLendingPlatform returns (uint) {
        BToken bToken = BToken(cTokenAddress);
        /* Get sender tokensHeld and amountOwed underlying from the bToken */
        (uint256 oErr, uint256 tokensHeld, uint256 amountOwed, ) = bToken.getAccountSnapshot(msg.sender);
        require(oErr == 0, "Bondtroller: GetAccountSnapshot failed"); // semi-opaque error code

        /* Fail if the sender has a borrow balance */
        if (amountOwed != 0) {
            return fail(Error.NONZERO_BORROW_BALANCE, FailureInfo.EXIT_MARKET_BALANCE_OWED);
        }

        /* Fail if the sender is not permitted to redeem all of their tokens */
        uint256 allowed = redeemAllowedInternal(cTokenAddress, msg.sender, tokensHeld);
        if (allowed != 0) {
            return failOpaque(Error.REJECTION, FailureInfo.EXIT_MARKET_REJECTION, allowed);
        }

        //Market storage marketToExit = markets[address(bToken)];

        /* Return true if the sender is not already ‘in’ the market */
        if (!accountMembership[msg.sender][address(bToken)]) {
            return uint256(Error.NO_ERROR);
        }

        /* Set bToken account membership to false */
        delete accountMembership[msg.sender][address(bToken)];

        /* Delete bToken from the account’s list of assets */
        // load into memory for faster iteration
        BToken[] memory userAssetList = accountAssets[msg.sender];
        uint256 len = userAssetList.length;
        uint256 assetIndex = len;
        for (uint256 i = 0; i < len; i++) {
            if (userAssetList[i] == bToken) {
                assetIndex = i;
                break;
            }
        }

        // We *must* have found the asset in the list or our redundant data structure is broken
        assert(assetIndex < len);

        // copy last item in list to location of item to be removed, reduce length by 1
        BToken[] storage storedList = accountAssets[msg.sender];
        storedList[assetIndex] = storedList[storedList.length - 1];
        storedList.pop();

        emit MarketExited(bToken, msg.sender);

        return uint256(Error.NO_ERROR);
    }

    /*** Policy Hooks ***/

    /**
     * @dev Checks if the account should be allowed to mint tokens in the given market.
     * @param bToken The market to verify the mint against.
     * @param minter The account which would get the minted tokens.
     * @param mintAmount The amount of underlying being supplied to the market in exchange for tokens.
     * @return 0 if the mint is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol).
     */
    function mintAllowed(address bToken, address minter, uint256 mintAmount) external view returns (uint) {
        // Shh - currently unused
        bToken;
        minter;
        mintAmount;

        // Pausing is a very serious situation - we revert to sound the alarms
        require(!mintGuardianPaused[bToken], "Bondtroller: Mint is paused");

        // Shh - currently unused
        minter;
        mintAmount;

        if (!markets[bToken].isListed) {
            return uint256(Error.MARKET_NOT_LISTED);
        }

        // // Keep the flywheel moving
        // updateCompSupplyIndex(bToken);
        // distributeSupplierComp(bToken, minter);

        return uint256(Error.NO_ERROR);
    }

    /**
     * @dev Validates mint and reverts on rejection. May emit logs.
     * @param bToken Asset being minted.
     * @param minter The address minting the tokens.
     * @param actualMintAmount The amount of the underlying asset being minted.
     * @param mintTokens The number of tokens being minted.
     */
    function mintVerify(address bToken, address minter, uint256 actualMintAmount, uint256 mintTokens) external {
        // Shh - currently unused
        bToken;
        minter;
        actualMintAmount;
        mintTokens;

        // Shh - we don't ever want this hook to be marked pure
        if (false) {
            maxAssets = maxAssets;
        }
    }

    /**
     * @dev Checks if the account should be allowed to redeem tokens in the given market.
     * @param bToken The market to verify the redeem against.
     * @param redeemer The account which would redeem the tokens.
     * @param redeemTokens The number of bTokens to exchange for the underlying asset in the market.
     * @return 0 if the redeem is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol).
     */
    function redeemAllowed(address bToken, address redeemer, uint256 redeemTokens) external view returns (uint) {
        // Shh - - currently unused
        bToken;
        redeemer;
        redeemTokens;

        uint256 allowed = redeemAllowedInternal(bToken, redeemer, redeemTokens);
        if (allowed != uint256(Error.NO_ERROR)) {
            return allowed;
        }

        return uint256(Error.NO_ERROR);
    }

    /**
     * @dev Checks if redeeming tokens is allowed for a given bToken and redeemer.
     * @param bToken The address of the bToken to check.
     * @param redeemer The address of the redeemer to check.
     * @param redeemTokens The amount of tokens to redeem.
     * @return uint256 0 if redeeming is allowed, otherwise an error code.
     */
    function redeemAllowedInternal(address bToken, address redeemer, uint256 redeemTokens) internal view returns (uint) {
        // Shh - currently unused
        redeemTokens;

        if (!markets[bToken].isListed) {
            return uint256(Error.MARKET_NOT_LISTED);
        }

        /* If the redeemer is not 'in' the market, then we can bypass the liquidity check */
        if (!accountMembership[redeemer][address(bToken)]) {
            return uint256(Error.NO_ERROR);
        }

        return uint256(Error.NO_ERROR);
    }

    /**
     * @dev Validates redeem and reverts on rejection. May emit logs.
     * @param bToken Asset being redeemed.
     * @param redeemer The address redeeming the tokens.
     * @param redeemAmount The amount of the underlying asset being redeemed.
     * @param redeemTokens The number of tokens being redeemed.
     */
    function redeemVerify(address bToken, address redeemer, uint256 redeemAmount, uint256 redeemTokens) external pure {
        // Shh - currently unused
        bToken;
        redeemer;

        // Require tokens is zero or amount is also zero
        if (redeemTokens == 0 && redeemAmount > 0) {
            revert("Bondtroller: RedeemTokens zero");
        }
    }

    /**
     * @dev Checks if the account should be allowed to borrow the underlying asset of the given market.
     * @param bToken The market to verify the borrow against.
     * @param borrower The account which would borrow the asset.
     * @param borrowAmount The amount of underlying the account would borrow.
     * @return 0 if the borrow is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol).
     */
    function borrowAllowed(address bToken, address borrower, uint256 borrowAmount) external returns (uint) {
        // Pausing is a very serious situation - we revert to sound the alarms
        require(!borrowGuardianPaused[bToken], "Bondtroller: Borrow is paused");

        if (!markets[bToken].isListed) {
            return uint256(Error.MARKET_NOT_LISTED);
        }

        if (!accountMembership[borrower][address(bToken)]) {
            // only bTokens may call borrowAllowed if borrower not in market
            //require(msg.sender == bToken, "sender must be bToken");

            // attempt to add borrower to the market
            Error errAddMarketInternal = addToMarketInternal(BToken(msg.sender), borrower);
            if (errAddMarketInternal != Error.NO_ERROR) {
                return uint256(errAddMarketInternal);
            }

            // it should be impossible to break the important invariant
            assert(accountMembership[borrower][address(bToken)]);
        }

        // if (oracle.getUnderlyingPrice(BToken(bToken)) == 0) {
        //     return uint256(Error.PRICE_ERROR);
        // }

        uint256 borrowCap = borrowCaps[bToken];
        // Borrow cap of 0 corresponds to unlimited borrowing
        if (borrowCap != 0) {
            uint256 totalBorrows = BToken(bToken).totalBorrows();
            uint256 nextTotalBorrows = add_(totalBorrows, borrowAmount);
            require(nextTotalBorrows < borrowCap, "Bondtroller: Market borrow cap reached");
        }
        return uint256(Error.NO_ERROR);
    }

    /**
     * @dev Validates borrow and reverts on rejection. May emit logs.
     * @param bToken Asset whose underlying is being borrowed.
     * @param borrower The address borrowing the underlying.
     * @param borrowAmount The amount of the underlying asset requested to borrow.
     */
    function borrowVerify(address bToken, address borrower, uint256 borrowAmount) external {
        // Shh - currently unused
        bToken;
        borrower;
        borrowAmount;

        // Shh - we don't ever want this hook to be marked pure
        if (false) {
            maxAssets = maxAssets;
        }
    }

    /**
     * @dev Checks if the account should be allowed to repay a borrow in the given market.
     * @param bToken The market to verify the repay against.
     * @param payer The account which would repay the asset.
     * @param borrower The account which would borrowed the asset.
     * @param repayAmount The amount of the underlying asset the account would repay.
     * @return 0 if the repay is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol).
     */
    function repayBorrowAllowed(address bToken, address payer, address borrower, uint256 repayAmount) external view returns (uint) {
        // Shh - currently unused
        payer;
        borrower;
        repayAmount;

        if (!markets[bToken].isListed) {
            return uint256(Error.MARKET_NOT_LISTED);
        }

        // // Keep the flywheel moving
        // Exp memory borrowIndex = Exp({mantissa: BToken(bToken).borrowIndex()});
        // updateCompBorrowIndex(bToken, borrowIndex);
        // distributeBorrowerComp(bToken, borrower, borrowIndex);

        return uint256(Error.NO_ERROR);
    }

    /**
     * @dev Validates repayBorrow and reverts on rejection. May emit logs.
     * @param bToken Asset being repaid.
     * @param payer The address repaying the borrow.
     * @param borrower The address of the borrower.
     * @param actualRepayAmount The amount of underlying being repaid.
     */
    function repayBorrowVerify(address bToken, address payer, address borrower, uint256 actualRepayAmount, uint256 borrowerIndex) external {
        // Shh - currently unused
        bToken;
        payer;
        borrower;
        actualRepayAmount;
        borrowerIndex;

        // Shh - we don't ever want this hook to be marked pure
        if (false) {
            maxAssets = maxAssets;
        }
    }

    /**
     * @dev Checks if the account should be allowed to transfer tokens in the given market.
     * @param bToken The market to verify the transfer against.
     * @param src The account which sources the tokens.
     * @param dst The account which receives the tokens.
     * @param transferTokens The number of bTokens to transfer.
     * @return 0 if the transfer is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol).
     */
    function transferAllowed(address bToken, address src, address dst, uint256 transferTokens) external returns (uint) {
        // Shh - currently unused
        bToken;
        src;
        dst;
        transferTokens;

        // Pausing is a very serious situation - we revert to sound the alarms
        require(!transferGuardianPaused, "Bondtroller: Transfer is paused");

        // Currently the only consideration is whether or not
        //  the src is allowed to redeem this many tokens
        // uint256 allowed = redeemAllowedInternal(bToken, src, transferTokens);
        // if (allowed != uint256(Error.NO_ERROR)) {
        //     return allowed;
        // }

        // Shh - we don't ever want this hook to be marked pure
        if (false) {
            maxAssets = maxAssets;
        }

        return uint256(Error.NO_ERROR);
    }

    /**
     * @dev Validates transfer and reverts on rejection. May emit logs.
     * @param bToken Asset being transferred.
     * @param src The account which sources the tokens.
     * @param dst The account which receives the tokens.
     * @param transferTokens The number of bTokens to transfer.
     */
    function transferVerify(address bToken, address src, address dst, uint256 transferTokens) external onlyPrimaryLendingPlatform {
        // Shh - currently unused
        bToken;
        src;
        dst;
        transferTokens;

        // Shh - we don't ever want this hook to be marked pure
        if (false) {
            maxAssets = maxAssets;
        }
    }

    /*** Admin Functions ***/

    /**
     * @dev Sets a new price oracle for the bondtroller.
     * Admin function to set a new price oracle.
     * @return uint256 0=success, otherwise a failure (see ErrorReporter.sol for details).
     */
    function setPriceOracle(address newOracle) public returns (uint) {
        // Check caller is admin
        if (msg.sender != admin) {
            return fail(Error.UNAUTHORIZED, FailureInfo.SET_PRICE_ORACLE_OWNER_CHECK);
        }

        // Track the old oracle for the bondtroller
        address oldOracle = oracle;

        // Set bondtroller's oracle to newOracle
        oracle = newOracle;

        // Emit NewPriceOracle(oldOracle, newOracle)
        emit NewPriceOracle(oldOracle, newOracle);

        return uint256(Error.NO_ERROR);
    }

    /**
     * @dev Sets the address of the primary lending platform.
     * @param _newPrimaryLendingPlatform The new address of the primary lending platform.
     * @return uint 0=success, otherwise a failure (see ErrorReporter.sol for details).
     */
    function setPrimaryLendingPlatformAddress(address _newPrimaryLendingPlatform) external returns (uint) {
        // Check caller is admin
        if (msg.sender != admin) {
            return fail(Error.UNAUTHORIZED, FailureInfo.SET_LIQUIDATION_INCENTIVE_OWNER_CHECK);
        }

        address oldPrimaryLendingPlatform = primaryLendingPlatform;

        primaryLendingPlatform = _newPrimaryLendingPlatform;

        emit NewPrimaryLendingPlatform(oldPrimaryLendingPlatform, _newPrimaryLendingPlatform);

        return uint256(Error.NO_ERROR);
    }

    /**
     * @dev Add the market to the markets mapping and set it as listed.
     * Admin function to set isListed and add support for the market.
     * @param bToken The address of the market (token) to list.
     * @return uint256 0=success, otherwise a failure. (See enum Error for details).
     */
    function supportMarket(BToken bToken) external returns (uint) {
        if (msg.sender != admin) {
            return fail(Error.UNAUTHORIZED, FailureInfo.SUPPORT_MARKET_OWNER_CHECK);
        }

        if (markets[address(bToken)].isListed) {
            return fail(Error.MARKET_ALREADY_LISTED, FailureInfo.SUPPORT_MARKET_EXISTS);
        }

        bToken.isCToken(); // Sanity check to make sure its really a BToken

        // Note that isComped is not in active use anymore
        markets[address(bToken)] = Market({isListed: true, isComped: false, collateralFactorMantissa: 0});

        _addMarketInternal(address(bToken));

        emit MarketListed(bToken);

        return uint256(Error.NO_ERROR);
    }

    /**
     * @dev Adds a new market to the list of all markets.
     * @param bToken The address of the BToken contract to be added.
     */
    function _addMarketInternal(address bToken) internal {
        for (uint256 i = 0; i < allMarkets.length; i++) {
            require(allMarkets[i] != BToken(bToken), "Bondtroller: Market already added");
        }
        allMarkets.push(BToken(bToken));
    }

    /**
     * @dev Sets the given borrow caps for the given bToken markets. Borrowing that brings total borrows to or above borrow cap will revert.
     * Admin or borrowCapGuardian function to set the borrow caps. A borrow cap of 0 corresponds to unlimited borrowing.
     * @param bTokens The addresses of the markets (tokens) to change the borrow caps for.
     * @param newBorrowCaps The new borrow cap values in underlying to be set. A value of 0 corresponds to unlimited borrowing.
     */
    function setMarketBorrowCaps(BToken[] calldata bTokens, uint256[] calldata newBorrowCaps) external {
        require(msg.sender == admin || msg.sender == borrowCapGuardian, "Bondtroller: Only admin or borrow cap guardian can set borrow caps");

        uint256 numMarkets = bTokens.length;
        uint256 numBorrowCaps = newBorrowCaps.length;

        require(numMarkets != 0 && numMarkets == numBorrowCaps, "Bondtroller: Invalid input");

        for (uint256 i = 0; i < numMarkets; i++) {
            borrowCaps[address(bTokens[i])] = newBorrowCaps[i];
            emit NewBorrowCap(bTokens[i], newBorrowCaps[i]);
        }
    }

    /**
     * @dev Admin function to change the Borrow Cap Guardian.
     * @param newBorrowCapGuardian The address of the new Borrow Cap Guardian.
     */
    function setBorrowCapGuardian(address newBorrowCapGuardian) external {
        require(msg.sender == admin, "Bondtroller: Only admin can set borrow cap guardian");

        // Save current value for inclusion in log
        address oldBorrowCapGuardian = borrowCapGuardian;

        // Store borrowCapGuardian with value newBorrowCapGuardian
        borrowCapGuardian = newBorrowCapGuardian;

        // Emit NewBorrowCapGuardian(OldBorrowCapGuardian, NewBorrowCapGuardian)
        emit NewBorrowCapGuardian(oldBorrowCapGuardian, newBorrowCapGuardian);
    }

    /**
     * @dev Admin function to change the Pause Guardian.
     * @param newPauseGuardian The address of the new Pause Guardian.
     * @return uint256 0=success, otherwise a failure. (See enum Error for details).
     */
    function setPauseGuardian(address newPauseGuardian) public returns (uint) {
        if (msg.sender != admin) {
            return fail(Error.UNAUTHORIZED, FailureInfo.SET_PAUSE_GUARDIAN_OWNER_CHECK);
        }

        // Save current value for inclusion in log
        address oldPauseGuardian = pauseGuardian;

        // Store pauseGuardian with value newPauseGuardian
        pauseGuardian = newPauseGuardian;

        // Emit NewPauseGuardian(OldPauseGuardian, NewPauseGuardian)
        emit NewPauseGuardian(oldPauseGuardian, pauseGuardian);

        return uint256(Error.NO_ERROR);
    }

    /**
     * @dev Pauses or unpauses minting of a specific BToken.
     * @param bToken The address of the BToken to pause or unpause minting for.
     * @param state The boolean state to set the minting pause status to.
     * @return A boolean indicating whether the minting pause status was successfully set.
     */
    function setMintPaused(BToken bToken, bool state) public returns (bool) {
        require(markets[address(bToken)].isListed, "Bondtroller: Cannot pause a market that is not listed");
        require(msg.sender == pauseGuardian || msg.sender == admin, "Bondtroller: Only pause guardian and admin can pause");
        require(msg.sender == admin || state == true, "Bondtroller: Only admin can unpause");

        mintGuardianPaused[address(bToken)] = state;
        emit ActionPaused(bToken, "Mint", state);
        return state;
    }

    /**
     * @dev Pauses or unpauses borrowing for a given market.
     * @param bToken The address of the BToken to pause or unpause borrowing.
     * @param state The boolean state to set the borrowing pause to.
     * @return A boolean indicating whether the operation was successful.
     */
    function setBorrowPaused(BToken bToken, bool state) public returns (bool) {
        require(markets[address(bToken)].isListed, "Bondtroller: Cannot pause a market that is not listed");
        require(msg.sender == pauseGuardian || msg.sender == admin, "Bondtroller: Only pause guardian and admin can pause");
        require(msg.sender == admin || state == true, "Bondtroller: Only admin can unpause");

        borrowGuardianPaused[address(bToken)] = state;
        emit ActionPaused(bToken, "Borrow", state);
        return state;
    }

    /**
     * @dev Sets the transfer pause state.
     * @param state The new transfer pause state.
     * @return bool Returns the new transfer pause state.
     */
    function setTransferPaused(bool state) public returns (bool) {
        require(msg.sender == pauseGuardian || msg.sender == admin, "Bondtroller: Only pause guardian and admin can pause");
        require(msg.sender == admin || state == true, "Bondtroller: Only admin can unpause");

        transferGuardianPaused = state;
        emit GlobalActionPaused("Transfer", state);
        return state;
    }

    /**
     * @dev Sets the state of the seizeGuardianPaused variable to the given state.
     * @param state The new state of the seizeGuardianPaused variable.
     * @return The new state of the seizeGuardianPaused variable.
     */
    function setSeizePaused(bool state) public returns (bool) {
        require(msg.sender == pauseGuardian || msg.sender == admin, "Bondtroller: Only pause guardian and admin can pause");
        require(msg.sender == admin || state == true, "Bondtroller: Only admin can unpause");

        seizeGuardianPaused = state;
        emit GlobalActionPaused("Seize", state);
        return state;
    }

    /**
     * @dev Checks caller is admin, or this contract is becoming the new implementation.
     */
    function adminOrInitializing() internal view returns (bool) {
        return msg.sender == admin;
    }

    /**
     * @dev Returns all of the markets.
     * The automatic getter may be used to access an individual market.
     * @return The list of market addresses.
     */
    function getAllMarkets() public view returns (BToken[] memory) {
        return allMarkets;
    }

    /**
     * @dev Returns true if the given bToken market has been deprecated.
     * All borrows in a deprecated bToken market can be immediately liquidated.
     * @param bToken The market to check if deprecated.
     */
    function isDeprecated(BToken bToken) public view returns (bool) {
        return
            markets[address(bToken)].collateralFactorMantissa == 0 &&
            borrowGuardianPaused[address(bToken)] == true &&
            bToken.reserveFactorMantissa() == 1e18;
    }

    /**
     * @dev Returns the current block number.
     * @return uint representing the current block number.
     */
    function getBlockNumber() public view returns (uint) {
        return block.number;
    }
}
