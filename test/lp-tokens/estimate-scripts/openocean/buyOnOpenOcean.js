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
exports.buyOnOpenOcean = void 0;
const ethers_1 = require("ethers");
const helpers_1 = require("../utils/helpers");
const sellOnOpenOcean_1 = require("./sellOnOpenOcean");
const buyOnOpenOcean = (tokenIn, tokenInDecimals, tokenInAmount, // Only to estimate amount in
tokenOut, expectedAmountOut, receiver, chainId, maxDiscrepancy) => __awaiter(void 0, void 0, void 0, function* () {
    if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) {
        return {
            amountIn: ethers_1.BigNumber.from(expectedAmountOut),
            buyCallData: undefined
        };
    }
    const sellData = yield (0, sellOnOpenOcean_1.sellOnOpenOcean)(tokenIn, tokenInDecimals, tokenInAmount, tokenOut, receiver, chainId, "10");
    if (sellData.amountOut.gte(expectedAmountOut) &&
        sellData.amountOut.lte(ethers_1.BigNumber.from(expectedAmountOut).mul(110).div(100))) {
        return {
            amountIn: (0, helpers_1.toBN)(tokenInAmount),
            buyCallData: sellData.buyCallData
        };
    }
    else {
        const newTokenInAmount = sellData.amountOut.gte(expectedAmountOut) ?
            (0, helpers_1.toBN)(tokenInAmount).mul(expectedAmountOut).div(sellData.amountOut) :
            (0, helpers_1.toBN)(tokenInAmount).mul(expectedAmountOut).div(sellData.amountOut).mul(110).div(100);
        return yield (0, exports.buyOnOpenOcean)(tokenIn, tokenInDecimals, newTokenInAmount, tokenOut, expectedAmountOut, receiver, chainId, maxDiscrepancy);
    }
});
exports.buyOnOpenOcean = buyOnOpenOcean;
