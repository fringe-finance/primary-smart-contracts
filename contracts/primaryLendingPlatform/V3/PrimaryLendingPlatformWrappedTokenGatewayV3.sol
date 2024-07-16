// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./core/PrimaryLendingPlatformLiquidationV3Core.sol";
import "./core/PrimaryLendingPlatformWrappedTokenGatewayV3Core.sol";
import "../../util/V3/Asset.sol";

/**
 * @title PrimaryLendingPlatformWrappedTokenGatewayZksync.
 * @notice The PrimaryLendingPlatformWrappedTokenGatewayZksync contract is the contract that provides the functionality for lending platform system using WETH for Zksync network.
 * @dev Contract that provides the functionality for lending platform system using WETH. Inherit from PrimaryLendingPlatformWrappedTokenGatewayCore.
 */
contract PrimaryLendingPlatformWrappedTokenGatewayV3 is PrimaryLendingPlatformWrappedTokenGatewayV3Core {
    //************* EXTERNAL FUNCTION ********************************

    /**
     * @dev Allows users to withdraw their WETH tokens and receive Ether.
     * @param projectTokenAmount Amount of project tokens to withdraw.
     * @param updatePriceTokens An array of tokens used to update the price oracle.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     */
    function withdraw(
        uint256 projectTokenAmount,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable nonReentrant {
        uint256 receivedProjectTokenAmount = primaryLendingPlatform.withdrawFromRelatedContracts{value: msg.value}(
            address(WETH),
            projectTokenAmount,
            msg.sender,
            address(this),
            updatePriceTokens,
            priceIds,
            updateData
        );
        _withdrawETH(receivedProjectTokenAmount);
    }

    /**
     * @dev Borrows lending tokens for the caller and converts them to Ether.
     * @param lendingTokenAmount Amount of lending tokens to borrow.
     * @param updatePriceTokens An array of tokens used to update the price oracle.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     */
    function borrow(
        uint256 lendingTokenAmount,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) external payable nonReentrant {
        uint256 borrowedAmount = primaryLendingPlatform.borrowFromRelatedContract{value: msg.value}(
            address(WETH),
            lendingTokenAmount,
            msg.sender,
            updatePriceTokens,
            priceIds,
            updateData
        );
        _withdrawETHTransferFrom(borrowedAmount);
    }

    /**
     * @dev Liquidates a position by providing project tokens in Ether.
     * @param account The address of the borrower
     * @param lendingInfo Information about the lending token, including its address and type.
     * @param lendingTokenAmount The amount of lending tokens to be used for liquidation
     * @param updatePriceTokens the list of token addresses need to be updated price
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @param buyCalldata the buy calldata for hot borrow
     */
    function liquidateWithProjectETH(
        address account,
        Asset.Info memory lendingInfo,
        uint256 lendingTokenAmount,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData,
        bytes[] memory buyCalldata
    ) external payable nonReentrant {
        Asset.Info memory WETHinfo = Asset.Info(address(WETH), Asset.Type.ERC20);

        uint256 receivedWETH = primaryLendingPlatformLiquidation.liquidateFromModerator{value: msg.value}(
            account,
            WETHinfo,
            lendingInfo,
            lendingTokenAmount,
            msg.sender,
            updatePriceTokens,
            priceIds,
            updateData,
            buyCalldata
        );
        _withdrawETHTransferFrom(receivedWETH);
    }

    /**
     * @dev Liquidates a position by providing lending tokens in Ether.
     * @param account The address of the borrower.
     * @param prjInfo Information about the project token, including its address and type.
     * @param lendingTokenAmount The amount of lending tokens to be used for liquidation.
     * @param updatePriceTokens the list of token addresses need to be updated price.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @param updateFee Update fee pays for updating price.
     * @param buyCalldata the buy calldata for hot borrow.
     */
    function liquidateWithLendingETH(
        address account,
        Asset.Info memory prjInfo,
        uint256 lendingTokenAmount,
        address[] memory updatePriceTokens,
        bytes32[] memory priceIds,
        bytes[] calldata updateData,
        uint256 updateFee,
        bytes[] memory buyCalldata
    ) external payable nonReentrant {
        uint256 actualLendingTokenAmount = msg.value - updateFee;
        require(actualLendingTokenAmount == lendingTokenAmount, "WTG: Invalid value");
        WETH.deposit{value: actualLendingTokenAmount}();
        WETH.transfer(msg.sender, actualLendingTokenAmount);
        Asset.Info memory WETHinfo = Asset.Info(address(WETH), Asset.Type.ERC20);
        primaryLendingPlatformLiquidation.liquidateFromModerator{value: updateFee}(
            account,
            prjInfo,
            WETHinfo,
            lendingTokenAmount,
            msg.sender,
            updatePriceTokens,
            priceIds,
            updateData,
            buyCalldata
        );
    }

    /**
     * @dev Borrows lending tokens in a leveraged position using project tokens in Ether.
     * @param _lendingInfo Information about the lending token, including its address and type.
     * @param notionalExposure The notional exposure of the leveraged position.
     * @param marginCollateralAmount Amount of collateral in margin.
     * @param buyCalldata Calldata for buying project tokens.
     * @param leverageType The type of leverage.
     * @param priceIds An array of price identifiers used to update the price oracle.
     * @param updateData An array of update data used to update the price oracle.
     * @param updateFee Update fee pays for updating price.
     * @param updatePriceTokens An array of tokens used to update the price oracle.
     */
    function leveragedBorrowWithProjectETH(
        Asset.Info memory _lendingInfo,
        uint256 notionalExposure,
        uint256 marginCollateralAmount,
        bytes[] memory buyCalldata,
        uint8 leverageType,
        bytes32[] memory priceIds,
        bytes[] calldata updateData,
        uint256 updateFee,
        address[] memory updatePriceTokens
    ) external payable nonReentrant {
        {
            uint256 addingAmount = primaryLendingPlatformLeverage.calculateAddingAmount(msg.sender, address(WETH), marginCollateralAmount);
            require(msg.value == addingAmount + updateFee, "WTG: invalid value");
            WETH.deposit{value: addingAmount}();
            WETH.transfer(msg.sender, addingAmount);
        }

        primaryLendingPlatformLeverage.leveragedBorrowFromRelatedContract{value: updateFee}(
            Asset.Info({addr: address(WETH), tokenType: Asset.Type.ERC20}),
            _lendingInfo,
            notionalExposure,
            marginCollateralAmount,
            buyCalldata,
            msg.sender,
            leverageType,
            updatePriceTokens,
            priceIds,
            updateData
        );
    }
}
