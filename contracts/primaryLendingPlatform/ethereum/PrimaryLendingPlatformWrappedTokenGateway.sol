// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../PrimaryLendingPlatformWrappedTokenGatewayCore.sol";

contract PrimaryLendingPlatformWrappedTokenGateway is PrimaryLendingPlatformWrappedTokenGatewayCore {
    /**
     * @notice Allows users to withdraw their WETH tokens and receive Ether.
     * @param projectTokenAmount Amount of project tokens to withdraw.
     */
    function withdraw(uint256 projectTokenAmount) external nonReentrant {
        uint256 receivedProjectTokenAmount = primaryLendingPlatform.withdrawFromRelatedContracts(
            address(WETH),
            projectTokenAmount,
            msg.sender,
            address(this)
        );
        _withdraw(receivedProjectTokenAmount);
    }

    /**
     * @notice Borrows lending tokens for the caller and converts them to Ether.
     * @param projectToken Address of the project token.
     * @param lendingTokenAmount Amount of lending tokens to borrow.
     */
    function borrow(address projectToken, uint256 lendingTokenAmount) external nonReentrant {
        primaryLendingPlatform.borrowFromRelatedContract(projectToken, address(WETH), lendingTokenAmount, msg.sender);
        _borrow(lendingTokenAmount);
    }

    /**
     * @notice Liquidates a position by providing project tokens in Ether.
     * @param account Address of the account to be liquidated.
     * @param lendingToken Address of the lending token.
     * @param lendingTokenAmount Amount of lending tokens to liquidate.
     */
    function liquidateWithProjectETH(address account, address lendingToken, uint256 lendingTokenAmount) external nonReentrant {
        uint256 receivedWETH = pitLiquidation.liquidateFromModerator(account, address(WETH), lendingToken, lendingTokenAmount, msg.sender);
        _liquidateWithProjectETH(receivedWETH);
    }

    /**
     * @notice Liquidates a position by providing lending tokens in Ether.
     * @param account Address of the account to be liquidated.
     * @param projectToken Address of the project token.
     * @param lendingTokenAmount Amount of lending tokens in Ether to liquidate.
     */
    function liquidateWithLendingETH(address account, address projectToken, uint256 lendingTokenAmount) external payable nonReentrant {
        WETH.deposit{value: msg.value}();
        WETH.transfer(msg.sender, msg.value);
        require(msg.value == lendingTokenAmount, "WTG: Invalid value");
        pitLiquidation.liquidateFromModerator(account, projectToken, address(WETH), lendingTokenAmount, msg.sender);
    }

    /**
     * @notice Borrows lending tokens in a leveraged position using project tokens in Ether.
     * @param lendingToken Address of the lending token.
     * @param notionalExposure The notional exposure of the leveraged position.
     * @param marginCollateralAmount Amount of collateral in margin.
     * @param buyCalldata Calldata for buying project tokens.
     */
    function leveragedBorrowWithProjectETH(
        address lendingToken,
        uint256 notionalExposure,
        uint256 marginCollateralAmount,
        bytes memory buyCalldata,
        uint8 leverageType
    ) external payable nonReentrant {
        uint256 addingAmount = pitLeverage.calculateAddingAmount(msg.sender, address(WETH), marginCollateralAmount);
        require(msg.value == addingAmount, "WTG: Invalid value");
        WETH.deposit{value: addingAmount}();
        WETH.transfer(msg.sender, addingAmount);
        pitLeverage.leveragedBorrowFromRelatedContract(
            address(WETH),
            lendingToken,
            notionalExposure,
            marginCollateralAmount,
            buyCalldata,
            msg.sender,
            leverageType
        );
    }
}
