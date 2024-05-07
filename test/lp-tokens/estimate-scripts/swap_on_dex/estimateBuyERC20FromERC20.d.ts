import { BigNumberish } from "ethers";
import { Dex } from "../enum/dexType";
export declare const estimateBuyERC20FromERC20: (tokenInAddress: string, tokenOutAddress: string, expectedAmountOut: BigNumberish, receiver: string, maxDiscrepancy: string, chainId: string, dexType: Dex, provider: any) => Promise<{
    tokenIn: string;
    estimateAmountIn: any;
    tokenOut: string;
    expectedAmountOut: BigNumberish;
    buyCallData: any[];
}>;
