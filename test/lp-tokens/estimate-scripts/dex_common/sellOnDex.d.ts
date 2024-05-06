import { BigNumberish } from "ethers";
import { Dex } from "../enum/dexType";
export declare const sellOnDex: (tokenIn: string, tokenInDecimals: BigNumberish, tokenInAmount: BigNumberish, tokenOut: string, swapOnDex: Dex, receiver: string, chainId: string, signerOrProvider: any) => Promise<{
    amountOut: import("ethers").BigNumber;
    buyCallData: any;
} | undefined>;
