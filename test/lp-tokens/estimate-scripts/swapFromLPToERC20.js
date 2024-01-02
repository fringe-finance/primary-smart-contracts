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
exports.swapFromLPToERC20 = void 0;
const unwrap_1 = require("./unwrap");
const helpers_1 = require("./helpers");
const sellOnDex_1 = require("./sellOnDex");
const swapFromLPToERC20 = (tokenIn, amountIn, tokenOut, expectedAmountOut, receiver, maxDiscrepancy, chainId, swapOnDex, pairType, signer) => __awaiter(void 0, void 0, void 0, function* () {
    const unwrapData = yield (0, unwrap_1.unwrap)(tokenIn, amountIn, pairType, signer);
    const { sellData0, sellData1 } = yield (0, sellOnDex_1.sellOnDex)(unwrapData, tokenOut, swapOnDex, receiver, chainId, signer);
    const actualAmountOut = (sellData1 === null || sellData1 === void 0 ? void 0 : sellData1.amountOut) && (sellData0 === null || sellData0 === void 0 ? void 0 : sellData0.amountOut.add(sellData1.amountOut));
    if (!actualAmountOut || actualAmountOut.lt(expectedAmountOut)) {
        return {
            tokenIn,
            estimateAmountIn: amountIn,
            tokenOut,
            expectedAmountOut,
            actualAmountOut,
            buyCallData: [
                sellData0 === null || sellData0 === void 0 ? void 0 : sellData0.buyCallData,
                sellData1 === null || sellData1 === void 0 ? void 0 : sellData1.buyCallData
            ],
            status: false
        };
    }
    else if ((0, helpers_1.checkDiscrepancy)((0, helpers_1.toBN)(expectedAmountOut), actualAmountOut, maxDiscrepancy)) {
        return {
            tokenIn,
            estimateAmountIn: amountIn,
            tokenOut,
            expectedAmountOut,
            actualAmountOut,
            buyCallData: [
                sellData0 === null || sellData0 === void 0 ? void 0 : sellData0.buyCallData,
                sellData1 === null || sellData1 === void 0 ? void 0 : sellData1.buyCallData
            ],
            status: true
        };
    }
    else {
        const estimateAmountIn = (0, helpers_1.toBN)(amountIn).mul(expectedAmountOut).div(actualAmountOut);
        return yield (0, exports.swapFromLPToERC20)(tokenIn, estimateAmountIn, tokenOut, expectedAmountOut, receiver, maxDiscrepancy, chainId, swapOnDex, pairType, signer);
    }
});
exports.swapFromLPToERC20 = swapFromLPToERC20;
