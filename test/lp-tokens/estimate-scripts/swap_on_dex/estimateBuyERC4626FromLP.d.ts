import { BigNumberish } from "ethers";
import { Dex } from "../enum/dexType";
import { Pair } from "../enum/pairType";
export declare const estimateBuyERC4626FromLP: (lpAddress: string, erc4626Address: string, erc4626ExpectedAmount: BigNumberish, receiver: string, maxDiscrepancy: string, chainId: string, dexType: Dex, pairType: Pair, provider: any) => Promise<{
    tokenIn: string;
    estimateAmountIn: import("ethers").BigNumber;
    tokenOut: string;
    expectedAmountOut: BigNumberish;
    buyCallData: any[];
}>;
