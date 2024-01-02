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
exports.estimateSellOnDex = void 0;
const sellOnOpenOcean_1 = require("../openocean/sellOnOpenOcean");
const checkDiscrepancy_1 = require("../utils/checkDiscrepancy");
const helpers_1 = require("../utils/helpers");
const estimateSellOnDex = (tokenIn, tokenInDecimals, tokenInAmount, tokenOut, expectedAmountOut, receiver, chainId, maxDiscrepancy) => __awaiter(void 0, void 0, void 0, function* () {
    const sellData = yield (0, sellOnOpenOcean_1.sellOnOpenOcean)(tokenIn, tokenInDecimals, tokenInAmount, tokenOut, receiver, chainId, "10");
    if (sellData.amountOut.lt(expectedAmountOut) ||
        (0, checkDiscrepancy_1.checkDiscrepancy)((0, helpers_1.toBN)(expectedAmountOut), sellData.amountOut, maxDiscrepancy)) {
        return {
            amountIn: tokenInAmount,
            buyCallData: sellData.buyCallData
        };
    }
    else {
        return yield (0, exports.estimateSellOnDex)(tokenIn, tokenInDecimals, (0, helpers_1.toBN)(tokenInAmount).mul(expectedAmountOut).div(sellData.amountOut), tokenOut, expectedAmountOut, receiver, chainId, maxDiscrepancy);
    }
});
exports.estimateSellOnDex = estimateSellOnDex;
