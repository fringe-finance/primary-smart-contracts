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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const ethers_1 = require("ethers");
const dexType_1 = require("./enum/dexType");
const pairType_1 = require("./enum/pairType");
const estimateBuyLPFromERC20_1 = require("./swap_on_dex/estimateBuyLPFromERC20");
const tokenIn = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC
const amountIn = 1e9; // 1000 USDC
const tokenOut = "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc"; // USDC | WETH
const amountOut = "73500000000000"; // 0.001 USDC | WETH
const receiver = "0x3eDEf3d7a9B94edB0457613e7Cf27e2fb9f5bB3E";
const maxDiscrepancy = "0.05";
const chainId = "1"; // Ethereum Mainnet
const apiKey = "LWIW1vEKXkNnNNU2bdguPCXfGGOrksh1";
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const provider = new ethers_1.ethers.providers.AlchemyProvider(Number(chainId), apiKey);
        const result = yield (0, estimateBuyLPFromERC20_1.estimateBuyLPFromERC20)(tokenIn, tokenOut, amountOut, receiver, maxDiscrepancy, chainId, dexType_1.Dex.Paraswap, pairType_1.Pair.Uniswap, provider);
        console.log({
            tokenIn: result.tokenIn,
            estimateAmountIn: result.estimateAmountIn.toString(),
            tokenOut: result.tokenOut,
            expectedAmountOut: result.expectedAmountOut.toString(),
            buyCallData: result.buyCallData
        });
        return {
            tokenIn: result.tokenIn,
            estimateAmountIn: new bignumber_js_1.default(result.estimateAmountIn.toString()),
            tokenOut: tokenOut,
            expectedAmountOut: new bignumber_js_1.default(result.expectedAmountOut.toString()),
            buyCallData: result.buyCallData
        };
    });
}
main();
