// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Callee.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../interfaces/IPrimaryLendingPlatform.sol";
import "../interfaces/IPrimaryLendingPlatformLiquidation.sol";


/**
 * @title PairFlash
 * @dev This contract enables liquidators to liquidate a borrower's loan position that falls below
 * the minimum collateralization level on the Fringe Finance V2 over-collateralized DeFi lending platform.
 * The contract interacts with Uniswap V2 and supports flash loans for liquidation.
 */
contract PairFlash is
    IUniswapV2Callee,
    Initializable,
    AccessControlUpgradeable
{
    using SafeERC20Upgradeable for ERC20Upgradeable;

    IUniswapV2Factory public uniswapFactory;
    IPrimaryLendingPlatform public plp;
    IPrimaryLendingPlatformLiquidation public plpLiquidation;

    struct LiquidateParams {
        address borrower;
        address collateralToken;
        address lendingToken;
        bytes32[] priceIds;
        bytes[] updateData;
        uint256 updateFee;
    }

    struct FlashParams {
        address token0;
        address token1;
        uint256 amount0;
        uint256 amount1;
        LiquidateParams liquidateParam;
    }

    struct FlashCallbackData {
        address payer;
        LiquidateParams liquidateParam;
    }

    /**
     * @dev Emitted when the Uniswap Factory address is updated.
     */
    event OnSetUniswapFactory(
        address indexed oldFactory,
        address indexed newFactory
    );

    /**
     * @dev Emitted when the Primary Lending Platform (PLP) contract address is updated.
     */
    event OnSetPlp(address indexed oldPLP, address indexed newPLP);

    /**
     * @dev Emitted when the Primary Lending Platform Liquidation (PLP Liquidation) contract address is updated.
     */
    event OnSetPlpLiquidation(
        address indexed oldPLPLiquidation,
        address indexed newPLPLiquidation
    );

    /**
     * @dev Emitted when a flash loan liquidation is performed.
     */
    event OnFlash(
        address indexed liquidator,
        FlashParams params,
        uint256 profitAmount
    );

    /**
     * @dev Initializes the contract and sets the initial Uniswap Factory, PLP, PLP Liquidation and owner addresses.
     */
    function initialize(
        address _uniswapFactory,
        address _plp,
        address _plpLiquidation
    ) public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        uniswapFactory = IUniswapV2Factory(_uniswapFactory);
        plp = IPrimaryLendingPlatform(_plp);
        plpLiquidation = IPrimaryLendingPlatformLiquidation(_plpLiquidation);
    }

    /**
     * @dev Modifier to restrict function access to only the admin.
     */
    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "BOT: Only Admin");
        _;
    }

    /**
     * @dev Fallback function to receive Ether.
     */
    receive() external payable {}

    /**
     * @dev Updates the Uniswap Factory address.
     * @param newFactory The new Uniswap Factory address.
     */
    function setUniswapFactory(address newFactory) external onlyAdmin {
        require(newFactory != address(0), "BOT: Invalid address");
        emit OnSetUniswapFactory(address(uniswapFactory), newFactory);
        uniswapFactory = IUniswapV2Factory(newFactory);
    }

    /**
     * @dev Updates the Primary Lending Platform (PLP) contract address.
     * @param newPlp The new PLP contract address.
     */
    function setPlp(address newPlp) external onlyAdmin {
        require(newPlp != address(0), "BOT: Invalid address");
        emit OnSetPlp(address(plp), newPlp);
        plp = IPrimaryLendingPlatform(newPlp);
    }

    /**
     * @dev Updates the Primary Lending Platform Liquidation (PLP Liquidation) contract address.
     * @param newLiquidation The new PLP Liquidation contract address.
     */
    function setPlpLiquidation(address newLiquidation) external onlyAdmin {
        require(newLiquidation != address(0), "BOT: Invalid address");
        emit OnSetPlpLiquidation(address(plpLiquidation), newLiquidation);
        plpLiquidation = IPrimaryLendingPlatformLiquidation(newLiquidation);
    }

    /**
     * @dev Initiates a flash loan liquidation process.
     * @param params The parameters for the flash loan liquidation.
     * @return amountProfit The profit amount earned by the liquidator.
     */
    function initFlash(
        FlashParams memory params
    ) external payable returns (uint256 amountProfit) {
        require(
            params.amount0 == 0 || params.amount1 == 0,
            "Invalid input amount"
        );
        address pair = uniswapFactory.getPair(params.token0, params.token1);
        require(pair != address(0), "Pair not exist");

        address token0 = IUniswapV2Pair(pair).token0();
        address token1 = IUniswapV2Pair(pair).token1();

        params.amount1 = _getAmountLiquidate(
            params.liquidateParam.borrower,
            params.token0,
            params.token1,
            params.liquidateParam.priceIds,
            params.liquidateParam.updateData,
            params.liquidateParam.updateFee,
            params.amount1
        );


        uint256 amountToken0 = token0 == params.token0 &&
            token1 == params.token1
            ? params.amount0
            : params.amount1;
        uint256 amountToken1 = token0 == params.token0 &&
            token1 == params.token1
            ? params.amount1
            : params.amount0;

        uint256 amountCollateralBeforeSwap = ERC20Upgradeable(
            params.liquidateParam.collateralToken
        ).balanceOf(address(this));

        IUniswapV2Pair(pair).swap(
            amountToken0,
            amountToken1,
            address(this),
            abi.encode(
                FlashCallbackData({
                    payer: msg.sender,
                    liquidateParam: params.liquidateParam
                })
            )
        );
        uint256 amountCollateralAfterSwap = ERC20Upgradeable(
            params.liquidateParam.collateralToken
        ).balanceOf(address(this));

        amountProfit = amountCollateralAfterSwap - amountCollateralBeforeSwap;

        emit OnFlash(msg.sender, params, amountProfit);
    }

    /**
     * @dev Callback function for the flash loan, which liquidates the loan position and repays the flash loan.
     * @param sender The address of the sender.
     * @param amount0 The amount of token0 borrowed.
     * @param amount1 The amount of token1 borrowed.
     * @param data The callback data.
     */
    function uniswapV2Call(
        address sender,
        uint amount0,
        uint amount1,
        bytes calldata data
    ) external override {
        require(amount0 == 0 || amount1 == 0, "BOT: Invalid input amount");
        require(sender == address(this), "BOT: Not sender");
        address token0 = IUniswapV2Pair(msg.sender).token0();
        address token1 = IUniswapV2Pair(msg.sender).token1();
        require(
            msg.sender == uniswapFactory.getPair(token0, token1),
            "BOT: Caller is not pair contract"
        );

        FlashCallbackData memory decoded = abi.decode(
            data,
            (FlashCallbackData)
        );

        uint256 amount = token0 == decoded.liquidateParam.lendingToken
            ? amount0
            : amount1;

        // liquidate
        IPrimaryLendingPlatform.LendingTokenInfo memory lendingInfo = plp
            .lendingTokenInfo(decoded.liquidateParam.lendingToken);

        ERC20Upgradeable(decoded.liquidateParam.lendingToken).safeApprove(
            lendingInfo.bLendingToken,
            amount
        );

        uint256 amountCollateralBeforeLiquidate = ERC20Upgradeable(
            decoded.liquidateParam.collateralToken
        ).balanceOf(address(this));

        plpLiquidation.liquidate(
            decoded.liquidateParam.borrower,
            decoded.liquidateParam.collateralToken,
            decoded.liquidateParam.lendingToken,
            amount,
            decoded.liquidateParam.priceIds,
            decoded.liquidateParam.updateData
        );

        uint256 amountCollateralAfterLiquidate = ERC20Upgradeable(
            decoded.liquidateParam.collateralToken
        ).balanceOf(address(this));

        uint256 amountCollateralReceived = amountCollateralAfterLiquidate -
            amountCollateralBeforeLiquidate;

        // calculate amountRequired to repay
        (uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(msg.sender)
            .getReserves();

        (uint256 reserveIn, uint256 reserveOut) = token0 ==
            decoded.liquidateParam.lendingToken
            ? (reserve1, reserve0)
            : (reserve0, reserve1);

        uint256 amountRequired = getAmountIn(amount, reserveIn, reserveOut);

        require(
            amountCollateralReceived >= amountRequired,
            "BOT: Not enough Token back to repay flash loan"
        );

        //repay flash loan
        ERC20Upgradeable(decoded.liquidateParam.collateralToken).safeTransfer(
            msg.sender,
            amountRequired
        );

        //transfer profit to bot address
        ERC20Upgradeable(decoded.liquidateParam.collateralToken).safeTransfer(
            decoded.payer,
            amountCollateralReceived - amountRequired
        );
    }

    /**
     * @notice Calculate the amount of input tokens required to achieve the desired output amount.
     * @dev This function uses the Uniswap formula to calculate the amount of input tokens
     * required to achieve the desired output amount.
     * @param amountOut The desired output amount in tokens.
     * @param reserveIn The current amount of input tokens in the liquidity pool.
     * @param reserveOut The current amount of output tokens in the liquidity pool.
     * @return amountIn The amount of input tokens required.
     */
    function getAmountIn(
        uint amountOut,
        uint reserveIn,
        uint reserveOut
    ) public pure returns (uint amountIn) {
        require(amountOut > 0, "BOT: INSUFFICIENT_OUTPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "BOT: INSUFFICIENT_LIQUIDITY");
        uint numerator = reserveIn * amountOut * 1000;
        uint denominator = (reserveOut - amountOut) * 997;
        amountIn = (numerator / denominator) + 1;
    }

    /**
     * @notice Calculate the amount of input tokens required to achieve the desired output
     * amount in a UniswapV2 trading pair.
     * @dev This function retrieves the reserves and the token addresses of the trading pair,
     * then calls the getAmountIn function to calculate the input amount required.
     * @param collateral The address of the collateral token.
     * @param lending The address of the lending token.
     * @param amount The desired output amount in lending tokens.
     * @return amountRequired The amount of collateral tokens required.
     */
    function getAmountRequired(
        address collateral,
        address lending,
        uint256 amount
    ) external view returns (uint256) {
        address pair = uniswapFactory.getPair(collateral, lending);
        address token0 = IUniswapV2Pair(pair).token0();
        (uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(pair)
            .getReserves();

        (uint256 reserveIn, uint256 reserveOut) = token0 == lending
            ? (reserve1, reserve0)
            : (reserve0, reserve1);

        uint256 amountRequired = getAmountIn(amount, reserveIn, reserveOut);
        return amountRequired;
    }

    /**
     * @notice Calculates the liquidation amount based on specified parameters and updates prices.
     * @dev This function interacts with a plpLiquidation contract to determine the liquidation amount.
     * @param borrower The address of the borrower whose position is being liquidated.
     * @param projectToken The address of project token.
     * @param lendingToken The address of lending token.
     * @param priceIds An array of bytes32 price identifiers to update.
     * @param updateData An array of bytes update data for the corresponding price identifiers.
     * @param updateFee The fee paid for updating prices.
     * @param amount The requested liquidation amount.
     * @return The calculated liquidation amount within the specified bounds.
     */
    function _getAmountLiquidate(
        address borrower,
        address projectToken,
        address lendingToken,
        bytes32[] memory priceIds,
        bytes[] memory updateData,
        uint256 updateFee,
        uint256 amount
    ) internal returns (uint256) {

        (uint256 maxLA, uint256 minLA) = plpLiquidation.getLiquidationAmountWithUpdatePrices{value: updateFee}(
            borrower,
            projectToken,
            lendingToken,
            priceIds,
            updateData
        );

        if (maxLA == minLA) {
            return maxLA;
        } else {
            amount = amount < minLA ? minLA : amount;
            amount = amount > maxLA ? maxLA : amount; 
            return amount;
        }
    }
}
