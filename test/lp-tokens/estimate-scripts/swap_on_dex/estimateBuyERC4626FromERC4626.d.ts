import { BigNumberish } from "ethers";
import { Dex } from "../enum/dexType";
export declare const estimateBuyERC4626FromERC4626: (erc4626SrcAddress: string, erc4626DestAddress: string, expectedAmountOut: BigNumberish, receiver: string, maxDiscrepancy: string, chainId: string, dexType: Dex, provider: any) => Promise<{
    tokenIn: string;
    estimateAmountIn: import("ethers").BigNumber;
    tokenOut: string;
    expectedAmountOut: BigNumberish;
    buyCallData: any[];
}>;
