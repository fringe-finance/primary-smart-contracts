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
const buyOnParaswap_1 = require("../paraswap/buyOnParaswap");
const dexType_1 = require("../enum/dexType");
const estimateSellOnDex_1 = require("./estimateSellOnDex");
const buyOrEstimateSellOnDex = (tokenIn, tokenInDecimals, tokenInAmount, token0, token0Decimals, amount0Desired, token1, token1Decimals, amount1Desired, receiver, swapOnDex, chainId, maxDiscrepancy) => __awaiter(void 0, void 0, void 0, function* () {
    let buyOrSellData0;
    let buyOrSellData1;
    if (swapOnDex === dexType_1.Dex.Paraswap) {
        buyOrSellData0 = yield (0, buyOnParaswap_1.buyOnParaswap)(tokenIn, tokenInDecimals, token0, token0Decimals, amount0Desired, receiver, chainId);
        buyOrSellData1 = yield (0, buyOnParaswap_1.buyOnParaswap)(tokenIn, tokenInDecimals, token1, token1Decimals, amount1Desired, receiver, chainId);
    }
    else if (swapOnDex === dexType_1.Dex.OpenOcean) {
        buyOrSellData0 = maxDiscrepancy && (yield (0, estimateSellOnDex_1.estimateSellOnDex)(tokenIn, tokenInDecimals, tokenInAmount, token0, amount0Desired, receiver, chainId, maxDiscrepancy));
        buyOrSellData1 = maxDiscrepancy && (yield (0, estimateSellOnDex_1.estimateSellOnDex)(tokenIn, tokenInDecimals, tokenInAmount, token1, amount1Desired, receiver, chainId, maxDiscrepancy));
    }
    return {
        buyOrSellData0,
        buyOrSellData1
    };
});
exports.buyOrEstimateSellOnDex = buyOrEstimateSellOnDex;
