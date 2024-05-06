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
exports.getPriceOnDex = void 0;
const ethers_1 = require("ethers");
const dexType_1 = require("../enum/dexType");
const sellOnOpenOcean_1 = require("../openocean/sellOnOpenOcean");
const getPriceOnParaswap_1 = require("../paraswap/getPriceOnParaswap");
const getPriceOnDex = (tokenIn, tokenInDecimals, tokenInAmount, tokenOut, tokenOutDecimals, dex, chainId) => __awaiter(void 0, void 0, void 0, function* () {
    if (dex === dexType_1.Dex.Paraswap) {
        const result = yield (0, getPriceOnParaswap_1.getPriceOnParaswap)(tokenIn, tokenInDecimals, tokenOut, tokenOutDecimals, tokenInAmount.toString(), "SELL", Number(chainId));
        return ethers_1.BigNumber.from(result.priceRoute.destAmount);
    }
    else if (dex === dexType_1.Dex.OpenOcean) {
        const { amountOut } = yield (0, sellOnOpenOcean_1.sellOnOpenOcean)(tokenIn, tokenInDecimals, tokenInAmount, tokenOut, "0x0000000000000000000000000000000000000000", chainId, "10");
        return amountOut;
    }
    else
        return ethers_1.BigNumber.from(0);
});
exports.getPriceOnDex = getPriceOnDex;
