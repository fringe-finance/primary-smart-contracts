// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../PrimaryLendingPlatformLiquidationCore.sol";
import "../PrimaryLendingPlatformWrappedTokenGatewayCore.sol";

contract PrimaryLendingPlatformWrappedTokenGatewayZksync is PrimaryLendingPlatformWrappedTokenGatewayCore {
    /**
     * @notice Allows users to withdraw their WETH tokens and receive Ether.
     * @param projectTokenAmount Amount of project tokens to withdraw.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
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
     * @notice Borrows lending tokens for the caller and converts them to Ether.
     * @param projectToken Address of the project token.
     * @param lendingTokenAmount Amount of lending tokens to borrow.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     */
    function borrow(
        address projectToken,
        uint256 lendingTokenAmount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) public payable nonReentrant {
        primaryLendingPlatform.borrowFromRelatedContract{value: msg.value}(
            projectToken,
            address(WETH),
            lendingTokenAmount,
            msg.sender,
            priceIds,
            updateData
        );
        _borrow(lendingTokenAmount);
    }

    /**
     * @notice Liquidates a position by providing project tokens in Ether.
     * @param _account Address of the account to be liquidated.
     * @param _lendingToken Address of the lending token.
     * @param _lendingTokenAmount Amount of lending tokens to liquidate.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     */
    function liquidateWithProjectETH(
        address _account,
        address _lendingToken,
        uint256 _lendingTokenAmount,
        bytes32[] memory priceIds,
        bytes[] calldata updateData
    ) public payable nonReentrant {
        uint256 receivedWETH = pitLiquidation.liquidateFromModerator{value: msg.value}(
            _account,
            address(WETH),
            _lendingToken,
            _lendingTokenAmount,
            msg.sender,
            priceIds,
            updateData
        );
        _liquidateWithProjectETH(receivedWETH);
    }

    /**
     * @notice Liquidates a position by providing lending tokens in Ether.
     * @param _account Address of the account to be liquidated.
     * @param _projectToken Address of the project token.
     * @param _lendingTokenAmount Amount of lending tokens in Ether to liquidate.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     */
    function liquidateWithLendingETH(address _account, address _projectToken, uint256 _lendingTokenAmount, bytes32[] memory priceIds, bytes[] calldata updateData) public payable nonReentrant {
        WETH.deposit{value: msg.value}();
        WETH.transfer(msg.sender, msg.value);
        require(msg.value == _lendingTokenAmount, "WTG: invalid value");
        pitLiquidation.liquidateFromModerator{ value: msg.value }(_account, _projectToken, address(WETH), _lendingTokenAmount, msg.sender, priceIds, updateData);
    }

    /**
     * @notice Borrows lending tokens in a leveraged position using project tokens in Ether.
     * @param _lendingToken Address of the lending token.
     * @param _notionalExposure The notional exposure of the leveraged position.
     * @param _marginCollateralAmount Amount of collateral in margin.
     * @param buyCalldata Calldata for buying project tokens.
     * @param priceIds The priceIds need to update.
     * @param updateData The updateData provided by PythNetwork.
     */
    function leveragedBorrowWithProjectETH(address _lendingToken, uint _notionalExposure, uint _marginCollateralAmount, bytes memory buyCalldata, uint8 leverageType, bytes32[] memory priceIds, bytes[] calldata updateData) public payable nonReentrant{
        uint256 addingAmount = pitLeverage.calculateAddingAmount(msg.sender, address(WETH), _marginCollateralAmount);
        require(msg.value == addingAmount, "WTG: invalid value");
        WETH.deposit{value: addingAmount}();
        WETH.transfer(msg.sender, addingAmount);
        pitLeverage.leveragedBorrowFromRelatedContract{ value: msg.value }(address(WETH), _lendingToken, _notionalExposure, _marginCollateralAmount, buyCalldata, msg.sender, leverageType, priceIds, updateData);
    }
}
