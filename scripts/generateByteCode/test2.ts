import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import { Dex } from "./enum/dexType";
import { Pair } from "./enum/pairType";
import { estimateBuyERC20FromLP } from "./swap_on_dex/estimateBuyERC20FromLP";

const tokenIn = "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc"; // USDC | WETH
const amountIn = "1000000000000000"; // 0.001 USDC | WETH
const tokenOut = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC
const amountOut = "1000000000"; // 1000 USDC
const receiver = "0x3eDEf3d7a9B94edB0457613e7Cf27e2fb9f5bB3E";
const maxDiscrepancy = "0.05";
const chainId = "1"; // Ethereum Mainnet
const apiKey = "LWIW1vEKXkNnNNU2bdguPCXfGGOrksh1";

async function main() {
    const provider = new ethers.providers.AlchemyProvider(Number(chainId), apiKey);
    const result = await estimateBuyERC20FromLP(
        tokenIn,
        amountIn,
        tokenOut,
        amountOut,
        receiver,
        maxDiscrepancy,
        chainId,
        Dex.Paraswap,
        Pair.Uniswap,
        provider
    );

    console.log({
        tokenIn: result.tokenIn,
        estimateAmountIn: new BigNumber(result.estimateAmountIn.toString())
            .div(new BigNumber(10).pow(result.tokenInDecimals.toString()))
            .toString(),
        estimateAmountToken0BuyIn: new BigNumber(result?.estimateAmountInBuyToken0?.toString() ?? 0)
            .div(new BigNumber(10).pow(result.token0Decimals))
            .toString(),
        estimateAmountToken1BuyIn: new BigNumber(result?.estimateAmountInBuyToken1?.toString() ?? 0)
            .div(new BigNumber(10).pow(result.token1Decimals))
            .toString(),
        tokenOut: result.tokenOut,
        expectedAmountOut: new BigNumber(result.expectedAmountOut.toString())
            .div(new BigNumber(10).pow(result.tokenOutDecimals))
            .toString(),
        buyCallData: result.buyCallData
    });
}
main();
