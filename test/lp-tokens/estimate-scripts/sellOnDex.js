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
exports.sellOnDex = void 0;
const dexType_1 = require("./dexType");
const loadContract_1 = require("./loadContract");
const sellOnParaswap_1 = require("./sellOnParaswap");
const sellOnOpenOcean_1 = require("./sellOnOpenOcean");
const ERC20_1 = require("./abis/ERC20");
const sellOnDex = (unwrapData, tokenOut, swapOnDex, receiver, chainId, signer) => __awaiter(void 0, void 0, void 0, function* () {
    let sellData0;
    let sellData1;
    if (swapOnDex === dexType_1.Dex.Paraswap) {
        const tokenOutInstance = (0, loadContract_1.loadContractInstance)(tokenOut, ERC20_1.ERC20_ABI, signer);
        const tokenOutDecimals = yield tokenOutInstance.decimals();
        sellData0 = yield (0, sellOnParaswap_1.sellOnParaswap)(unwrapData.token0, unwrapData.token0Decimals, unwrapData.amount0, tokenOut, tokenOutDecimals, receiver, chainId);
        sellData1 = yield (0, sellOnParaswap_1.sellOnParaswap)(unwrapData.token1, unwrapData.token1Decimals, unwrapData.amount1, tokenOut, tokenOutDecimals, receiver, chainId);
    }
    else if (swapOnDex === dexType_1.Dex.OpenOcean) {
        sellData0 = yield (0, sellOnOpenOcean_1.sellOnOpenOcean)(unwrapData.token0, unwrapData.token0Decimals, unwrapData.amount0, tokenOut, receiver, chainId, "10");
        sellData1 = yield (0, sellOnOpenOcean_1.sellOnOpenOcean)(unwrapData.token1, unwrapData.token1Decimals, unwrapData.amount1, tokenOut, receiver, chainId, "10");
    }
    return {
        sellData0,
        sellData1
    };
});
exports.sellOnDex = sellOnDex;
