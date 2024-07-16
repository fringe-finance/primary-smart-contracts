import { BigNumberish } from "ethers";
import { Dex } from "../enum/dexType";
import { Pair } from "../enum/pairType";
import { BigNumber } from "ethers";
export declare const estimateSellLPToERC20: (tokenInAddress: string, pairType: Pair, tokenOutAddress: string, amountIn: BigNumberish, maxDiscrepancy: string, receiver: string, chainId: string, dexType: Dex, provider: any) => Promise<{
    tokenIn: string;
    amountIn: BigNumberish;
    tokenOut: string;
    estimateAmountOut: BigNumber | undefined;
    buyCallData: any[];
}>;
