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
exports.estimateSellLPToERC20 = void 0;
const estimateAmountDesired_1 = require("../utils/estimateAmountDesired");
const helpers_1 = require("../utils/helpers");
const unwrap_1 = require("../utils/unwrap");
const sellOnDex_1 = require("../dex_common/sellOnDex");
const estimateSellLPToERC20 = (tokenInAddress, pairType, tokenOutAddress, amountIn, maxDiscrepancy, receiver, chainId, dexType, provider) => __awaiter(void 0, void 0, void 0, function* () {
    // Unwrap LP token to token 0 & token 1
    const { lpTotalSupply, 
    // token 0
    lpToken0Address, lpToken0Decimals, lpToken0Reserve, 
    // token 1
    lpToken1Address, lpToken1Decimals, lpToken1Reserve } = yield (0, unwrap_1.unwrapLP)(tokenInAddress, pairType, provider);
    const { amount0Desired: lpToken0DesiredAmount, amount1Desired: lpToken1DesiredAmount } = (0, estimateAmountDesired_1.estimateSellLPAmountDesired)(lpToken0Reserve, lpToken1Reserve, lpTotalSupply, (0, helpers_1.toBN)(amountIn));
    let estimate0;
    let estimate1;
    if (lpToken0Address.toLowerCase() === tokenOutAddress.toLowerCase()) {
        estimate0 = {
            amountOut: lpToken0DesiredAmount,
            buyCallData: undefined
        };
    }
    else {
        estimate0 = yield (0, sellOnDex_1.sellOnDex)(lpToken0Address, lpToken0Decimals, lpToken0DesiredAmount, tokenOutAddress, dexType, maxDiscrepancy, receiver, chainId, provider);
    }
    if (lpToken1Address.toLowerCase() === tokenOutAddress.toLowerCase()) {
        estimate1 = {
            amountOut: lpToken1DesiredAmount,
            buyCallData: null
        };
    }
    else {
        estimate1 = yield (0, sellOnDex_1.sellOnDex)(lpToken1Address, lpToken1Decimals, lpToken1DesiredAmount, tokenOutAddress, dexType, maxDiscrepancy, receiver, chainId, provider);
    }
    return {
        tokenIn: tokenInAddress,
        amountIn: amountIn,
        tokenOut: tokenOutAddress,
        estimateAmountOut: estimate0 === null || estimate0 === void 0 ? void 0 : estimate0.amountOut.add((estimate1 === null || estimate1 === void 0 ? void 0 : estimate1.amountOut) || "0"),
        buyCallData: [estimate0 === null || estimate0 === void 0 ? void 0 : estimate0.buyCallData, estimate1 === null || estimate1 === void 0 ? void 0 : estimate1.buyCallData].filter(data => !!data),
    };
});
exports.estimateSellLPToERC20 = estimateSellLPToERC20;
