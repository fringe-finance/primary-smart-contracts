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
const ethers_1 = require("ethers");
const _1 = require(".");
const dexType_1 = require("./enum/dexType");
const pairType_1 = require("./enum/pairType");
const tokenIn = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC
const amountIn = 1e9; // 1000 USDC
const tokenOut = "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc"; // USDC | WETH
const amountOut = "1000000000000000"; // 0.001 USDC | WETH
const receiver = "0x3eDEf3d7a9B94edB0457613e7Cf27e2fb9f5bB3E";
const maxDiscrepancy = "0.05";
const chainId = "1"; // Ethereum Mainnet
const apiKey = "LWIW1vEKXkNnNNU2bdguPCXfGGOrksh1";
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let a = _1.createDataLeverageBorrow;
        const provider = new ethers_1.ethers.providers.AlchemyProvider(Number(chainId), apiKey);
        const result = yield _1.createDataRepayAtomic.buy_lp_from_erc20(tokenIn, amountIn, tokenOut, amountOut, receiver, maxDiscrepancy, chainId, dexType_1.Dex.Paraswap, pairType_1.Pair.Uniswap, provider);
        console.log(result.tokenInDecimals);
        console.log({
            tokenIn: result.tokenIn,
            estimateAmountIn: result.estimateAmountIn.div(ethers_1.BigNumber.from(10).pow(result.tokenInDecimals)).toString(),
            estimateAmountInBuyToken0: result.estimateAmountInBuyToken0
                .div(ethers_1.BigNumber.from(10).pow(result.tokenInDecimals))
                .toString(),
            estimateAmountInBuyToken1: result.estimateAmountInBuyToken1
                .div(ethers_1.BigNumber.from(10).pow(result.tokenInDecimals))
                .toString(),
            tokenOut: result.tokenOut,
            expectedAmountOut: ethers_1.BigNumber.from(result.expectedAmountOut).div(1e18).toString(),
            actualAmountOut: ethers_1.BigNumber.from(result.actualAmountOut).div(1e18).toString(),
        });
    });
}
main();
