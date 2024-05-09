// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../PrimaryLendingPlatformWrappedTokenGatewayCore.sol";

/**
 * @title PrimaryLendingPlatformWrappedTokenGatewayZksync.
 * @notice The PrimaryLendingPlatformWrappedTokenGatewayZksync contract is the contract that provides the functionality for lending platform system using WETH for Zksync network.
 * @dev Contract that provides the functionality for lending platform system using WETH. Inherit from PrimaryLendingPlatformWrappedTokenGatewayCore.
 */
contract PrimaryLendingPlatformWrappedTokenGatewayZksync is PrimaryLendingPlatformWrappedTokenGatewayCore {
    /**
     * @dev Allows users to withdraw their WETH tokens and receive Ether and update related token's prices.
     * @param projectTokenAmount Amount of project tokens to withdraw.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     */
    function withdraw(uint256 projectTokenAmount, bytes32[] memory priceIds, bytes[] calldata updateData) public payable nonReentrant {
        uint256 receivedProjectTokenAmount = primaryLendingPlatform.withdrawFromRelatedContracts{value: msg.value}(
            address(WETH),
            projectTokenAmount,
            msg.sender,
            address(this),
            priceIds,
            updateData
        );
        _withdraw(receivedProjectTokenAmount);
    }

    /**
     * @dev Borrows lending tokens for the caller and converts them to Ether and update related token's prices.
     * @param projectToken Address of the project token.
     * @param lendingTokenAmount Amount of lending tokens to borrow.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     */
    function borrow(
        address projectToken,
        uint256 lendingTokenAmount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) public payable nonReentrant {
        uint256 borrowedAmount = primaryLendingPlatform.borrowFromRelatedContract{value: msg.value}(
            projectToken,
            address(WETH),
            lendingTokenAmount,
            msg.sender,
            priceIds,
            updateData
        );
        _transferETH(borrowedAmount);
    }

    /**
     * @dev Allows users to supply ETH to the PrimaryLendingPlatformWrappedTokenGatewayCore contract.
     * The ETH is converted to WETH and then transferred to the user's address.
     * The supplyFromRelatedContract function of the PrimaryLendingPlatform contract is called to supply the WETH to the user.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     */
    function supply(bytes32[] memory priceIds, bytes[] calldata updateData) external payable nonReentrant {
        WETH.deposit{value: msg.value}();
        WETH.transfer(msg.sender, msg.value);
        primaryLendingPlatform.supplyFromRelatedContract(address(WETH), msg.value, msg.sender, priceIds, updateData);
    }

    /**
     * @dev Redeems the specified amount of bLendingToken for the underlying asset (WETH) and transfers it to the caller.
     * @param bLendingTokenAmount The amount of bLendingToken to redeem. If set to `type(uint256).max`, redeems all the bLendingToken balance of the caller.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     */
    function redeem(uint256 bLendingTokenAmount, bytes32[] memory priceIds, bytes[] calldata updateData) external nonReentrant {
        address fWETH = primaryLendingPlatform.lendingTokenInfo(address(WETH)).bLendingToken;
        uint256 userBalance = IBLendingToken(fWETH).balanceOf(msg.sender);
        uint256 amountToWithdraw = bLendingTokenAmount;
        if (bLendingTokenAmount == type(uint256).max) {
            amountToWithdraw = userBalance;
        }
        primaryLendingPlatform.redeemFromRelatedContract(address(WETH), amountToWithdraw, msg.sender, priceIds, updateData);
        uint256 exchangeRate = IBLendingToken(fWETH).exchangeRateStored();
        uint256 lendingAmountToWithdraw = (amountToWithdraw * exchangeRate) / 1e18;
        WETH.transferFrom(msg.sender, address(this), lendingAmountToWithdraw);
        WETH.withdraw(lendingAmountToWithdraw);
        _safeTransferETH(msg.sender, lendingAmountToWithdraw);
    }

    /**
     * @dev Redeems the underlying asset from the Primary Lending Platform and transfers it to the caller.
     * @param lendingTokenAmount The amount of the lending token to redeem.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     */
    function redeemUnderlying(uint256 lendingTokenAmount, bytes32[] memory priceIds, bytes[] calldata updateData) external nonReentrant {
        primaryLendingPlatform.redeemUnderlyingFromRelatedContract(address(WETH), lendingTokenAmount, msg.sender, priceIds, updateData);
        _transferETH(lendingTokenAmount);
    }

    /**
     * @dev Liquidates a position by providing project tokens in Ether and update related token's prices.
     * @param _account Address of the account to be liquidated.
     * @param _prjInfo Information about the project token, including its address and type.
     * @param _lendingInfo Information about the lending token, including its address and type.
     * @param _lendingTokenAmount Amount of lending tokens to liquidate.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     * @param updateFee Update fee pays for updating price.
     * @param buyCalldata The calldata for buying the lending token from the exchange aggregator. If the calldata is empty, the liquidation will execute liquidation without hot borrowing.
     */
    function liquidate(
        address _account,
        Asset.Info memory _prjInfo,
        Asset.Info memory _lendingInfo,
        uint256 _lendingTokenAmount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData,
        uint256 updateFee,
        bytes[] memory buyCalldata
    ) public payable nonReentrant returns (address[] memory assets, uint256[] memory assetAmounts) {
        if (_prjInfo.addr == address(WETH) && _lendingInfo.addr == address(WETH)) {
            (assets, assetAmounts) = _liquidateWithLendingETH(_account, _prjInfo, _lendingTokenAmount, priceIds, updateData, updateFee, buyCalldata);
            uint256 receivedWETH = 0;
            for (uint256 i = 0; i < assets.length; i++) {
                if (assets[i] == address(WETH)) {
                    receivedWETH += assetAmounts[i];
                }
            }
            _internalLiquidateWithProjectETH(receivedWETH);
        } else if (_prjInfo.addr == address(WETH)) {
            _liquidateWithProjectETH(_account, _lendingInfo, _lendingTokenAmount, priceIds, updateData, buyCalldata);
        } else if (_lendingInfo.addr == address(WETH)) {
            _liquidateWithLendingETH(_account, _prjInfo, _lendingTokenAmount, priceIds, updateData, updateFee, buyCalldata);
        } else {
            pitLiquidation.liquidateFromModerator{value: msg.value}(
                _account,
                _prjInfo,
                _lendingInfo,
                _lendingTokenAmount,
                msg.sender,
                priceIds,
                updateData,
                buyCalldata
            );
        }
    }

    /**
     * @dev Liquidates internal a position by providing project tokens in Ether and update related token's prices.
     * @param _account Address of the account to be liquidated.
     * @param _lendingInfo Information about the lending token, including its address and type.
     * @param _lendingTokenAmount Amount of lending tokens to liquidate.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     * @param buyCalldata The calldata for buying the lending token from the exchange aggregator. If the calldata is empty, the liquidation will execute liquidation without hot borrowing.
     */
    function _liquidateWithProjectETH(
        address _account,
        Asset.Info memory _lendingInfo,
        uint256 _lendingTokenAmount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData,
        bytes[] memory buyCalldata
    ) internal nonReentrant returns (address[] memory assets, uint256[] memory assetAmounts) {
        (assets, assetAmounts) = pitLiquidation.liquidateFromModerator{value: msg.value}(
            _account,
            Asset.Info({addr: address(WETH), tokenType: Asset.Type.ERC20}),
            _lendingInfo,
            _lendingTokenAmount,
            msg.sender,
            priceIds,
            updateData,
            buyCalldata
        );

        uint256 receivedWETH = 0;
        for (uint256 i = 0; i < assets.length; i++) {
            if (assets[i] == address(WETH)) {
                receivedWETH += assetAmounts[i];
            }
        }
        _internalLiquidateWithProjectETH(receivedWETH);
    }

    /**
     * @dev Liquidates internal a position by providing lending tokens in Ether and update related token's prices.
     * @param _account Address of the account to be liquidated.
     * @param _prjInfo Information about the project token, including its address and type.
     * @param _lendingTokenAmount Amount of lending tokens in Ether to liquidate.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     * @param updateFee Update fee pays for updating price.
     * @param buyCalldata The calldata for buying the lending token from the exchange aggregator. If the calldata is empty, the liquidation will execute liquidation without hot borrowing.
     */
    function _liquidateWithLendingETH(
        address _account,
        Asset.Info memory _prjInfo,
        uint256 _lendingTokenAmount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData,
        uint256 updateFee,
        bytes[] memory buyCalldata
    ) internal nonReentrant returns (address[] memory assets, uint256[] memory assetAmounts) {
        uint256 actualLendingTokenAmount = msg.value - updateFee;
        WETH.deposit{value: actualLendingTokenAmount}();
        WETH.transfer(msg.sender, actualLendingTokenAmount);
        require(actualLendingTokenAmount == _lendingTokenAmount, "WTG: invalid value");
        (assets, assetAmounts) = pitLiquidation.liquidateFromModerator{value: updateFee}(
            _account,
            _prjInfo,
            Asset.Info({addr: address(WETH), tokenType: Asset.Type.ERC20}),
            _lendingTokenAmount,
            msg.sender,
            priceIds,
            updateData,
            buyCalldata
        );
    }

    /**
     * @dev Borrows lending tokens in a leveraged position using project tokens in Ether and update related token's prices.
     * @param _lendingInfo Information about the lending token, including its address and type.
     * @param _notionalExposure The notional exposure of the leveraged position.
     * @param _marginCollateralAmount Amount of collateral in margin.
     * @param buyCalldata Calldata for buying project tokens.
     * @param leverageType The type of leverage.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     * @param updateFee Update fee pays for updating price.
     */
    function leveragedBorrowWithProjectETH(
        Asset.Info memory _lendingInfo,
        uint _notionalExposure,
        uint _marginCollateralAmount,
        bytes[] memory buyCalldata,
        uint8 leverageType,
        bytes32[] memory priceIds,
        bytes[] calldata updateData,
        uint256 updateFee
    ) public payable nonReentrant {
        uint256 addingAmount = pitLeverage.calculateAddingAmount(msg.sender, address(WETH), _marginCollateralAmount);
        require(msg.value == addingAmount + updateFee, "WTG: invalid value");
        WETH.deposit{value: addingAmount}();
        WETH.transfer(msg.sender, addingAmount);
        pitLeverage.leveragedBorrowFromRelatedContract{value: updateFee}(
            Asset.Info({addr: address(WETH), tokenType: Asset.Type.ERC20}),
            _lendingInfo,
            _notionalExposure,
            _marginCollateralAmount,
            buyCalldata,
            msg.sender,
            leverageType,
            priceIds,
            updateData
        );
    }
}
