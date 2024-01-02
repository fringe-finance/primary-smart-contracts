// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC4626Upgradeable.sol";
import "../priceOracle/priceproviders/uniswapV2/IUniswapV2Pair.sol";
import "../priceOracle/priceproviders/uniswapV2/UniswapV2Library.sol";

/**
 * @title Asset Library
 * @notice A library for handling different types of assets, including ERC20 tokens, ERC4626 tokens, and Uniswap V2 LP tokens.
 */
library Asset {
    using SafeERC20Upgradeable for ERC20Upgradeable;

    enum Type {
        ERC20,
        ERC4626,
        LP
    }

    struct Info {
        address addr;
        Type tokenType;
    }

    /**
     * @notice Unwraps the specified amount of tokens based on their type.
     * @param _tokenInfo Information about the token, including its address and type.
     * @param _tokenAmount The amount of tokens to unwrap.
     * @return assets The unwrapped assets' addresses.
     * @return assetAmounts The amounts of the unwrapped assets.
     */
    function _unwrap(
        Info memory _tokenInfo,
        uint256 _tokenAmount
    ) internal returns (address[] memory assets, uint256[] memory assetAmounts) {
        if (_tokenInfo.tokenType == Type.LP) {
            assets = new address[](2);
            assets[0] = IUniswapV2Pair(_tokenInfo.addr).token0();
            assets[1] = IUniswapV2Pair(_tokenInfo.addr).token1();
            if (_tokenAmount > 0) {
                assetAmounts = new uint256[](2);
                IUniswapV2Pair(_tokenInfo.addr).transfer(_tokenInfo.addr, _tokenAmount);
                (assetAmounts[0], assetAmounts[1]) = IUniswapV2Pair(_tokenInfo.addr).burn(address(this));
            }
        } else {
            assets = new address[](1);
            assetAmounts = new uint256[](1);
            if (_tokenInfo.tokenType == Type.ERC4626) {
                assets[0] = IERC4626Upgradeable(_tokenInfo.addr).asset();
                if (_tokenAmount > 0) {
                    assetAmounts[0] = IERC4626Upgradeable(_tokenInfo.addr).redeem(_tokenAmount, address(this), address(this));
                }
            } else {
                assets[0] = _tokenInfo.addr;
                assetAmounts[0] = _tokenAmount;
            }
        }
    }

    /**
     * @notice Wraps the specified amounts of assets into a token.
     * @param _assets The addresses of the assets to wrap.
     * @param _assetAmounts The amounts of the assets to wrap.
     * @param _tokenInfo Information about the token, including its address and type.
     * @return tokenAmount The amount of the wrapped token.
     */
    function _wrap(
        address[] memory _assets,
        uint256[] memory _assetAmounts,
        Info memory _tokenInfo
    ) internal returns (uint256 tokenAmount) {
        if (_tokenInfo.tokenType == Type.LP) {
            
            if (_assetAmounts[0] > 0 && _assetAmounts[1] > 0) {

                (uint112 reserve0, uint112 reserve1, ) = IUniswapV2Pair(_tokenInfo.addr).getReserves();

                uint256 amountA;
                uint256 amountB;

                if (reserve0 == 0 && reserve1 == 0) {
                    (amountA, amountB) = (_assetAmounts[0], _assetAmounts[1]);
                } else {
                    uint256 amountBOptimal = UniswapV2Library.quote(_assetAmounts[0], reserve0, reserve1);
                    if (amountBOptimal <= _assetAmounts[1]) {
                        (amountA, amountB) = (_assetAmounts[0], amountBOptimal);
                    } else {
                        uint256 amountAOptimal = UniswapV2Library.quote(_assetAmounts[1], reserve1, reserve0);
                        assert(amountAOptimal <= _assetAmounts[0]);
                        (amountA, amountB) = (amountAOptimal, _assetAmounts[1]);
                    }
                }

                ERC20Upgradeable(_assets[0]).safeTransfer(_tokenInfo.addr, amountA);
                ERC20Upgradeable(_assets[1]).safeTransfer(_tokenInfo.addr, amountB);

                tokenAmount = IUniswapV2Pair(_tokenInfo.addr).mint(address(this));

            } else if (_assetAmounts[0] > 0) {
                ERC20Upgradeable(_assets[0]).safeTransfer(msg.sender, _assetAmounts[0]);
            } else if (_assetAmounts[1] > 0) {
                ERC20Upgradeable(_assets[1]).safeTransfer(msg.sender, _assetAmounts[1]);
            }
        } else if (_tokenInfo.tokenType == Type.ERC4626) {
            _safeIncreaseAllowance(_tokenInfo.addr, _assets[0], _assetAmounts[0]);
            tokenAmount = IERC4626Upgradeable(_tokenInfo.addr).deposit(_assetAmounts[0], address(this));
        } else {
            tokenAmount = _assetAmounts[0];
        }
    }

    /**
     * @notice Safely increases the allowance of a spender for a given token.
     * @param _spender The address allowed to spend the tokens.
     * @param _token The address of the token.
     * @param _tokenAmount The amount of tokens to allow.
     */
    function _safeIncreaseAllowance(address _spender, address _token, uint256 _tokenAmount) internal {
        uint256 allowanceAmount = ERC20Upgradeable(_token).allowance(address(this), _spender);
        if (allowanceAmount < _tokenAmount) {
            ERC20Upgradeable(_token).safeIncreaseAllowance(_spender, _tokenAmount - allowanceAmount);
        }
    }
}
