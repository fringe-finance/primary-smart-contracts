import { Dex } from "../enum/dexType";
export declare const sellLPOnDex: (unwrapData: any, tokenOut: string, swapOnDex: Dex, maxDiscrepancy: string, receiver: string, chainId: string, signerOrProvider: any) => Promise<{
    sellData0: {
        amountOut: import("ethers").BigNumber;
        buyCallData: any;
    } | undefined;
    sellData1: {
        amountOut: import("ethers").BigNumber;
        buyCallData: any;
    } | undefined;
}>;
