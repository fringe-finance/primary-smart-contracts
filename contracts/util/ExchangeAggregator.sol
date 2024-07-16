// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC4626Upgradeable.sol";
import "../priceOracle/priceproviders/uniswapV2/IUniswapV2Pair.sol";
import "../priceOracle/priceproviders/uniswapV2/UniswapV2Library.sol";
import "../paraswap/interfaces/IParaSwapAugustus.sol";
import "./V3/Asset.sol";
import "./V3/Errors.sol";

/**
 * @title ExchangeAggregator Library
 * @notice A library for handling approve, buy token on Exchange Aggregator
 */
library ExchangeAggregator {
    using SafeERC20Upgradeable for ERC20Upgradeable;

    uint16 public constant BUFFER_PERCENTAGE = 500;

    /**
     * @notice Unwraps the given token, converting it into its underlying assets, and approves their transfer.
     * @param info Information about the token, including its address and type.
     * @param amount The amount of token to be unwrapped and approved for transfer.
     * @return assets An array containing the addresses of the underlying assets.
     * @return assetAmounts An array containing the amounts of the underlying assets corresponding to the unwrapped project token.
     */
    function _unwrapTokenAndApprove(
        Asset.Info memory info,
        uint256 amount,
        address exchangeAggregator,
        address registryAggregator
    ) internal returns (address[] memory assets, uint256[] memory assetAmounts) {
        (assets, assetAmounts) = Asset._unwrap(info, amount);

        for (uint8 i = 0; i < assets.length; i++) {
            uint256 approvalAmount = (assetAmounts[i] * (10000 + BUFFER_PERCENTAGE)) / 10000;
            _approveTokenTransfer(assets[i], approvalAmount, exchangeAggregator, registryAggregator);
        }
    }

    /**
     * @dev Internal function to approve a token transfer if the current allowance is less than the specified amount for the exchange aggregator.
     * @param token The address of the ERC20 token to be approved.
     * @param tokenAmount The amount of tokens to be approved for transfer.
     */
    function _approveTokenTransfer(address token, uint256 tokenAmount, address exchangeAggregator, address registryAggregator) internal {
        if (exchangeAggregator == address(0)) {
            revert Errors.InvalidAddress();
        }
        if (registryAggregator != address(0)) {
            _approveTokenTransferPara(token, tokenAmount, exchangeAggregator);
        } else {
            _approveTokenTransferOO(token, tokenAmount, exchangeAggregator);
        }
    }

    /**
     * @dev Internal function to approve a token transfer if the current allowance is less than the specified amount for the Open Ocean exchange aggregator.
     * @param token The address of the ERC20 token to be approved.
     * @param tokenAmount The amount of tokens to be approved for transfer.
     */
    function _approveTokenTransferOO(address token, uint256 tokenAmount, address exchangeAggregator) internal {
        uint256 allowanceAmount = ERC20Upgradeable(token).allowance(address(this), exchangeAggregator);
        if (allowanceAmount < tokenAmount) {
            ERC20Upgradeable(token).safeIncreaseAllowance(exchangeAggregator, tokenAmount - allowanceAmount);
        }
    }

    /**
     * @dev Internal function to approve a token transfer if the current allowance is less than the specified amount for the ParaSwap exchange aggregator.
     * @param token The address of the ERC20 token to be approved.
     * @param tokenAmount The amount of tokens to be approved for transfer.
     */
    function _approveTokenTransferPara(address token, uint256 tokenAmount, address exchangeAggregator) internal {
        address tokenTransferProxy = IParaSwapAugustus(exchangeAggregator).getTokenTransferProxy();
        uint256 allowanceAmount = ERC20Upgradeable(token).allowance(address(this), tokenTransferProxy);
        if (allowanceAmount < tokenAmount) {
            ERC20Upgradeable(token).safeIncreaseAllowance(tokenTransferProxy, tokenAmount - allowanceAmount);
        }
    }

    /**
     * @notice Executes a buy order on the exchange aggregators contract for multiple assets.
     * @param tokensFrom An array of addresses representing the assets to sell on the exchange aggregator.
     * @param tokenToInfo Information about the token to buy on the exchange aggregator, including its address and type.
     * @param buyCalldata An array of calldata for the buy operations.
     * @return assetAmountRemainings An array of amounts representing the remaining amounts of each asset after executing.
     * @dev This function handles the buy operations for multiple assets, including selling tokens, buying the target token, and wrapping the received amount.
     */
    function _buyOnExchangeAggregatorWithMultiAsset(
        address[] memory tokensFrom,
        Asset.Info memory tokenToInfo,
        bytes[] memory buyCalldata,
        address exchangeAggregator
    ) internal returns (uint256[] memory assetAmountRemainings, uint256 assetAmountReceive) {
        (address[] memory unwrapTokensTo, ) = Asset._unwrap(tokenToInfo, 0);

        for (uint8 i = 0; i < buyCalldata.length; i++) {
            _buyOnExchangeAggregator(buyCalldata[i], exchangeAggregator);
        }

        uint256[] memory assetAmountReceives = new uint256[](unwrapTokensTo.length);
        for (uint8 i = 0; i < unwrapTokensTo.length; i++) {
            assetAmountReceives[i] = ERC20Upgradeable(unwrapTokensTo[i]).balanceOf(address(this));
        }
        assetAmountReceive = Asset._wrap(unwrapTokensTo, assetAmountReceives, tokenToInfo);

        assetAmountRemainings = new uint256[](tokensFrom.length);
        for (uint8 i = 0; i < tokensFrom.length; i++) {
            if (tokensFrom[i] != tokenToInfo.addr) {
                assetAmountRemainings[i] = ERC20Upgradeable(tokensFrom[i]).balanceOf(address(this));
            }
        }
    }

    /**
     * @dev Internal function to execute a buy order on the exchange aggregator contract.
     * @param buyCalldata The calldata for the buy operation.
     * After buying, the token stored to address(this)
     */
    function _buyOnExchangeAggregator(bytes memory buyCalldata, address exchangeAggregator) internal {
        // solium-disable-next-line security/no-call-value
        (bool success, ) = exchangeAggregator.call(buyCalldata);
        if (!success) {
            // Copy revert reason from call
            assembly {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }
    }
}
