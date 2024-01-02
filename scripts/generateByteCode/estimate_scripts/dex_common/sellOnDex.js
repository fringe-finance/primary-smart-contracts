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
const dexType_1 = require("../enum/dexType");
const loadContract_1 = require("../utils/loadContract");
const ERC20_1 = require("../abis/ERC20");
const sellOnParaswap_1 = require("../paraswap/sellOnParaswap");
const sellOnOpenOcean_1 = require("../openocean/sellOnOpenOcean");
const sellOnDex = (tokenIn, tokenInDecimals, tokenInAmount, tokenOut, swapOnDex, receiver, chainId, signerOrProvider) => __awaiter(void 0, void 0, void 0, function* () {
    if (swapOnDex === dexType_1.Dex.Paraswap) {
        const tokenOutInstance = (0, loadContract_1.loadContractInstance)(tokenOut, ERC20_1.ERC20_ABI, signerOrProvider);
        const tokenOutDecimals = yield tokenOutInstance.decimals();
        return yield (0, sellOnParaswap_1.sellOnParaswap)(tokenIn, tokenInDecimals, tokenInAmount, tokenOut, tokenOutDecimals, receiver, chainId);
    }
    else if (swapOnDex === dexType_1.Dex.OpenOcean) {
        return yield (0, sellOnOpenOcean_1.sellOnOpenOcean)(tokenIn, tokenInDecimals, tokenInAmount, tokenOut, receiver, chainId, "10");
    }
});
exports.sellOnDex = sellOnDex;
