import { BigNumberish } from "ethers";
import { Dex } from "../enum/dexType";
import { Pair } from "../enum/pairType";
export declare const unwrapAndSellLPOnDex: (tokenIn: string, amountIn: BigNumberish, tokenOut: string, maxDiscrepancy: string, receiver: string, chainId: string, swapOnDex: Dex, pairType: Pair, signerOrProvider: any) => Promise<{
    sellData0: {
        amountOut: import("ethers").BigNumber;
        buyCallData: any;
    } | undefined;
    sellData1: {
        amountOut: import("ethers").BigNumber;
        buyCallData: any;
    } | undefined;
}>;
