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
exports.sellLPOnDex = void 0;
const sellOnDex_1 = require("./sellOnDex");
const sellLPOnDex = (unwrapData, tokenOut, swapOnDex, receiver, chainId, signerOrProvider) => __awaiter(void 0, void 0, void 0, function* () {
    let sellData0 = yield (0, sellOnDex_1.sellOnDex)(unwrapData.token0, unwrapData.token0Decimals, unwrapData.amount0, tokenOut, swapOnDex, receiver, chainId, signerOrProvider);
    let sellData1 = yield (0, sellOnDex_1.sellOnDex)(unwrapData.token0, unwrapData.token0Decimals, unwrapData.amount0, tokenOut, swapOnDex, receiver, chainId, signerOrProvider);
    return {
        sellData0,
        sellData1
    };
});
exports.sellLPOnDex = sellLPOnDex;
