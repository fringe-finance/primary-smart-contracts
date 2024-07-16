import { BigNumberish } from "ethers";
import { Dex } from "../enum/dexType";
import { Pair } from "../enum/pairType";
export declare const estimateSellERC4626ToLP: (tokenInAddress: string, tokenOutAddress: string, pairType: Pair, amountIn: BigNumberish, maxDiscrepancy: string, receiver: string, chainId: string, dexType: Dex, provider: any) => Promise<{
    tokenIn: string;
    amountIn: BigNumberish;
    tokenOut: string;
    estimateAmountOut: import("ethers").BigNumber;
    buyCallData: any[];
}>;
