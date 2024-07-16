import { BigNumberish } from "ethers";
import { Dex } from "../enum/dexType";
export declare const estimateSellERC20ToERC4626: (tokenInAddress: string, tokenOutAddress: string, amountIn: BigNumberish, maxDiscrepancy: string, receiver: string, chainId: string, dexType: Dex, provider: any) => Promise<{
    tokenIn: string;
    tokenOut: string;
    estimateAmountOut: import("ethers").BigNumber;
    amountIn: BigNumberish;
    buyCallData: any[];
}>;
