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
exports.sellOnOpenOcean = void 0;
const createCallDataOpenOcean_1 = require("./createCallDataOpenOcean");
const helpers_1 = require("../utils/helpers");
const sellOnOpenOcean = (tokenIn, tokenInDecimals, amountIn, tokenOut, receiver, chainId, gasPriceInGWei) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, amount } = yield (0, createCallDataOpenOcean_1.createCallDataOpenOcean)(tokenIn, Number(tokenInDecimals), amountIn.toString(), tokenOut, {
        chainId,
        account: receiver
    }, gasPriceInGWei);
    const amountOut = (0, helpers_1.toBN)(amount);
    const buyCallData = data;
    return {
        amountOut,
        buyCallData
    };
});
exports.sellOnOpenOcean = sellOnOpenOcean;
