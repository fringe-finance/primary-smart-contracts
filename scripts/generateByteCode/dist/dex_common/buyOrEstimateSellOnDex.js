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
exports.buyOrEstimateSellOnDex = void 0;
const ethers_1 = require("ethers");
const buyOnDex_1 = require("./buyOnDex");
const helpers_1 = require("../utils/helpers");
const buyOrEstimateSellOnDex = (tokenIn, tokenInDecimals, token0, token0Decimals, amount0Desired, token1, token1Decimals, amount1Desired, receiver, swapOnDex, chainId, maxDiscrepancy) => __awaiter(void 0, void 0, void 0, function* () {
    let buyOrSellData0 = { amountIn: ethers_1.BigNumber.from(0), buyCallData: "" };
    let buyOrSellData1 = { amountIn: ethers_1.BigNumber.from(0), buyCallData: "" };
    if (tokenIn.toLowerCase() !== token0.toLowerCase()) {
        buyOrSellData0 = yield (0, buyOnDex_1.buyOnDex)(tokenIn, tokenInDecimals, token0, token0Decimals, amount0Desired, swapOnDex, receiver, chainId, maxDiscrepancy);
    }
    else {
        buyOrSellData0 = {
            amountIn: (0, helpers_1.toBN)(amount0Desired),
            buyCallData: null,
        };
    }
    if (tokenIn.toLowerCase() !== token1.toLowerCase()) {
        buyOrSellData1 = yield (0, buyOnDex_1.buyOnDex)(tokenIn, tokenInDecimals, token1, token1Decimals, amount1Desired, swapOnDex, receiver, chainId, maxDiscrepancy);
    }
    else {
        buyOrSellData1 = {
            amountIn: (0, helpers_1.toBN)(amount1Desired),
            buyCallData: null,
        };
    }
    return {
        buyOrSellData0,
        buyOrSellData1
    };
});
exports.buyOrEstimateSellOnDex = buyOrEstimateSellOnDex;
