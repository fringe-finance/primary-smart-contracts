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
exports.buyOnDex = void 0;
const ethers_1 = require("ethers");
const dexType_1 = require("../enum/dexType");
const buyOnParaswap_1 = require("../paraswap/buyOnParaswap");
const buyOnOpenOcean_1 = require("../openocean/buyOnOpenOcean");
const buyOnDex = (tokenSrc_1, tokenSrcDecimals_1, tokenDest_1, tokenDestDecimals_1, tokenDestAmount_1, swapOnDex_1, receiver_1, chainId_1, ...args_1) => __awaiter(void 0, [tokenSrc_1, tokenSrcDecimals_1, tokenDest_1, tokenDestDecimals_1, tokenDestAmount_1, swapOnDex_1, receiver_1, chainId_1, ...args_1], void 0, function* (tokenSrc, tokenSrcDecimals, tokenDest, tokenDestDecimals, tokenDestAmount, swapOnDex, receiver, chainId, maxDiscrepancy = "0.005") {
    if (swapOnDex === dexType_1.Dex.Paraswap) {
        return yield (0, buyOnParaswap_1.buyOnParaswap)(tokenSrc, tokenSrcDecimals, tokenDest, tokenDestDecimals, tokenDestAmount, receiver, chainId, maxDiscrepancy);
    }
    else if (swapOnDex === dexType_1.Dex.OpenOcean) {
        return yield (0, buyOnOpenOcean_1.buyOnOpenOcean)(tokenSrc, tokenSrcDecimals, ethers_1.BigNumber.from(1000).mul(ethers_1.BigNumber.from(10).pow(tokenSrcDecimals)), tokenDest, tokenDestAmount, receiver, chainId, maxDiscrepancy);
    }
});
exports.buyOnDex = buyOnDex;
