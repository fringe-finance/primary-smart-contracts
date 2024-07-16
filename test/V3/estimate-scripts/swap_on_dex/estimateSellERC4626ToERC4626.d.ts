import { BigNumberish } from "ethers";
import { Dex } from "../enum/dexType";
export declare const estimateSellERC4626ToERC4626: (tokenInAddress: string, tokenOutAddress: string, amountIn: BigNumberish, maxDiscrepancy: string, receiver: string, chainId: string, dexType: Dex, provider: any) => Promise<{
    tokenIn: string;
    amountIn: BigNumberish;
    tokenOut: string;
    estimateAmountOut: import("ethers").BigNumber;
    buyCallData: any[];
}>;
