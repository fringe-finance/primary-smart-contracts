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
exports.sellOnParaswap = void 0;
const createCallDataParaswap_1 = require("./createCallDataParaswap");
const helpers_1 = require("./helpers");
const sellOnParaswap = (tokenIn, tokenInDecimals, amountIn, tokenOut, tokenOutDecimals, receiver, chainId) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, amount } = yield (0, createCallDataParaswap_1.createCallDataParaswap)(tokenIn, Number(tokenInDecimals), tokenOut, Number(tokenOutDecimals), amountIn.toString(), "SELL", {
        chainId: Number(chainId),
        account: receiver
    });
    const amountOut = (0, helpers_1.toBN)(amount);
    const buyCallData = data;
    return {
        amountOut,
        buyCallData
    };
});
exports.sellOnParaswap = sellOnParaswap;
