"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swapFromERC20ToLP = void 0;
const loadContract_1 = require("./loadContract");
const ERC20_1 = require("./abis/ERC20");
const helpers_1 = require("./helpers");
const loadPairInstance_1 = require("./loadPairInstance");
const buyOrEstimateSellOnDex_1 = require("./buyOrEstimateSellOnDex");
const swapFromERC20ToLP = (tokenIn, amountIn, tokenOut, expectedAmountOut, receiver, maxDiscrepancy, chainId, swapOnDex, pairType, signer) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenInInstance = (0, loadContract_1.loadContractInstance)(tokenIn, ERC20_1.ERC20_ABI, signer);
    const tokenInDecimals = yield tokenInInstance.decimals();
    const pairInstance = (0, loadPairInstance_1.loadPairInstance)(tokenOut, pairType, signer);
    const { _reserve0, _reserve1, } = yield (pairInstance === null || pairInstance === void 0 ? void 0 : pairInstance.getReserves());
    const totalSupply = yield (pairInstance === null || pairInstance === void 0 ? void 0 : pairInstance.totalSupply());
    const token0 = yield (pairInstance === null || pairInstance === void 0 ? void 0 : pairInstance.token0());
    const token1 = yield (pairInstance === null || pairInstance === void 0 ? void 0 : pairInstance.token1());
    const token0Instance = (0, loadContract_1.loadContractInstance)(token0, ERC20_1.ERC20_ABI, signer);
    const token0Decimals = yield token0Instance.decimals();
    const balance0 = yield token0Instance.balanceOf(tokenOut);
    const token1Instance = (0, loadContract_1.loadContractInstance)(token1, ERC20_1.ERC20_ABI, signer);
    const token1Decimals = yield token1Instance.decimals();
    const balance1 = yield token1Instance.balanceOf(tokenOut);
    const actualAmountOut = (0, helpers_1.getDiscrepancyAmount)((0, helpers_1.toBN)(expectedAmountOut), maxDiscrepancy);
    const { amount0Desired, amount1Desired } = (0, helpers_1.estimateAmountDesired)(_reserve0, _reserve1, balance0, balance1, totalSupply, actualAmountOut);
    const { buyOrSellData0, buyOrSellData1 } = yield (0, buyOrEstimateSellOnDex_1.buyOrEstimateSellOnDex)(tokenIn, tokenInDecimals, amountIn, token0, token0Decimals, amount0Desired, token1, token1Decimals, amount1Desired, receiver, swapOnDex, chainId, maxDiscrepancy);
    const estimateAmountIn = buyOrSellData0.amountIn.add(buyOrSellData1.amountIn);
    if ((0, helpers_1.toBN)(amountIn).lt(estimateAmountIn)) {
        return {
            tokenIn,
            estimateAmountIn: estimateAmountIn,
            estimateAmountInBuyToken0: buyOrSellData0.amountIn,
            estimateAmountInBuyToken1: buyOrSellData1.amountIn,
            tokenOut,
            expectedAmountOut,
            actualAmountOut,
            buyCallData: [
                buyOrSellData0.buyCallData,
                buyOrSellData1.buyCallData
            ],
            status: false
        };
    }
    else {
        return {
            tokenIn,
            estimateAmountIn: estimateAmountIn,
            estimateAmountInBuyToken0: buyOrSellData0.amountIn,
            estimateAmountInBuyToken1: buyOrSellData1.amountIn,
            tokenOut,
            expectedAmountOut,
            actualAmountOut,
            buyCallData: [
                buyOrSellData0.buyCallData,
                buyOrSellData1.buyCallData
            ],
            status: true
        };
    }
});
exports.swapFromERC20ToLP = swapFromERC20ToLP;
