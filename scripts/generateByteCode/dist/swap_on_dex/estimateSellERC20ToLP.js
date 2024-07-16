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
exports.estimateSellERC20ToLP = void 0;
const helpers_1 = require("../utils/helpers");
const unwrap_1 = require("../utils/unwrap");
const estimateSellERC20ToERC20_1 = require("./estimateSellERC20ToERC20");
const estimateSellERC20ToLP = (tokenInAddress, tokenOutAddress, pairType, amountIn, maxDiscrepancy, receiver, chainId, dexType, provider) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // Unwrap LP token to token 0 & token 1
    const { lpTotalSupply, 
    // token 0
    lpToken0Address, lpToken0Decimals, lpToken0Reserve, 
    // token 1
    lpToken1Address, lpToken1Decimals, lpToken1Reserve, } = yield (0, unwrap_1.unwrapLP)(tokenOutAddress, pairType, provider);
    let estimate0;
    let estimate1;
    if (lpToken0Address.toLowerCase() === tokenInAddress.toLowerCase()) {
        estimate0 = {
            estimateAmountOut: (0, helpers_1.toBN)(amountIn).div(2),
            buyCallData: undefined
        };
    }
    else {
        const { estimateAmountOut, buyCallData } = yield (0, estimateSellERC20ToERC20_1.estimateSellERC20ToERC20)(tokenInAddress, lpToken0Address, (0, helpers_1.toBN)(amountIn).div(2), maxDiscrepancy, receiver, chainId, dexType, provider);
        estimate0 = { estimateAmountOut, buyCallData };
    }
    if (lpToken1Address.toLowerCase() === tokenInAddress.toLowerCase()) {
        estimate1 = {
            estimateAmountOut: (0, helpers_1.toBN)(amountIn).div(2),
            buyCallData: undefined
        };
    }
    else {
        const { estimateAmountOut, buyCallData } = yield (0, estimateSellERC20ToERC20_1.estimateSellERC20ToERC20)(tokenInAddress, lpToken1Address, (0, helpers_1.toBN)(amountIn).div(2), maxDiscrepancy, receiver, chainId, dexType, provider);
        estimate1 = { estimateAmountOut, buyCallData };
    }
    const amountOutBasedOn0 = estimate0.estimateAmountOut.mul((0, helpers_1.toBN)(lpTotalSupply)).div((0, helpers_1.toBN)(lpToken0Reserve));
    const amountOutBasedOn1 = estimate1.estimateAmountOut.mul((0, helpers_1.toBN)(lpTotalSupply)).div((0, helpers_1.toBN)(lpToken1Reserve));
    return {
        tokenIn: tokenInAddress,
        amountIn: amountIn,
        tokenOut: tokenOutAddress,
        estimateAmountOut: amountOutBasedOn0.gt(amountOutBasedOn1) ? amountOutBasedOn1 : amountOutBasedOn0,
        buyCallData: [(_a = estimate0 === null || estimate0 === void 0 ? void 0 : estimate0.buyCallData) === null || _a === void 0 ? void 0 : _a[0], (_b = estimate1 === null || estimate1 === void 0 ? void 0 : estimate1.buyCallData) === null || _b === void 0 ? void 0 : _b[0]].filter(data => !!data),
    };
});
exports.estimateSellERC20ToLP = estimateSellERC20ToLP;
