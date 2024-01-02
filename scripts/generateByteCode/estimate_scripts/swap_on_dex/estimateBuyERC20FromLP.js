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
exports.estimateBuyERC20FromLP = void 0;
const unwrapAndSellLPOnDex_1 = require("../dex_common/unwrapAndSellLPOnDex");
const checkDiscrepancy_1 = require("../utils/checkDiscrepancy");
const helpers_1 = require("../utils/helpers");
const estimateBuyERC20FromLP = (tokenIn, amountIn, tokenOut, expectedAmountOut, receiver, maxDiscrepancy, chainId, swapOnDex, pairType, signerOrProvider) => __awaiter(void 0, void 0, void 0, function* () {
    const { sellData0, sellData1 } = yield (0, unwrapAndSellLPOnDex_1.unwrapAndSellLPOnDex)(tokenIn, amountIn, tokenOut, receiver, chainId, swapOnDex, pairType, signerOrProvider);
    const actualAmountOut = sellData0.amountOut.add(sellData1.amountOut);
    if (!actualAmountOut || actualAmountOut.lt(expectedAmountOut)) {
        return {
            tokenIn,
            estimateAmountIn: amountIn,
            tokenOut,
            expectedAmountOut,
            actualAmountOut,
            buyCallData: [sellData0.buyCallData, sellData1.buyCallData],
            status: false,
        };
    }
    else if ((0, checkDiscrepancy_1.checkDiscrepancy)((0, helpers_1.toBN)(expectedAmountOut), actualAmountOut, maxDiscrepancy)) {
        return {
            tokenIn,
            estimateAmountIn: amountIn,
            tokenOut,
            expectedAmountOut,
            actualAmountOut,
            buyCallData: [sellData0.buyCallData, sellData1.buyCallData],
            status: true,
        };
    }
    else {
        const estimateAmountIn = (0, helpers_1.toBN)(amountIn).mul(expectedAmountOut).div(actualAmountOut);
        return yield (0, exports.estimateBuyERC20FromLP)(tokenIn, estimateAmountIn, tokenOut, expectedAmountOut, receiver, maxDiscrepancy, chainId, swapOnDex, pairType, signerOrProvider);
    }
});
exports.estimateBuyERC20FromLP = estimateBuyERC20FromLP;
