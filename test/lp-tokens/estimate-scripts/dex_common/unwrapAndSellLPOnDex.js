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
exports.unwrapAndSellLPOnDex = void 0;
const unwrap_1 = require("../utils/unwrap");
const sellLPOnDex_1 = require("./sellLPOnDex");
const unwrapAndSellLPOnDex = (tokenIn, amountIn, tokenOut, receiver, chainId, swapOnDex, pairType, signerOrProvider) => __awaiter(void 0, void 0, void 0, function* () {
    const unwrapData = yield (0, unwrap_1.unwrap)(tokenIn, amountIn, pairType, signerOrProvider);
    const { sellData0, sellData1 } = yield (0, sellLPOnDex_1.sellLPOnDex)(unwrapData, tokenOut, swapOnDex, receiver, chainId, signerOrProvider);
    return {
        sellData0,
        sellData1
    };
});
exports.unwrapAndSellLPOnDex = unwrapAndSellLPOnDex;
