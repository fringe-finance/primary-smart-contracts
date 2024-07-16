import { BigNumber, BigNumberish } from "ethers";
import { Dex } from "../enum/dexType";
import { Pair } from "../enum/pairType";
export declare const estimateBuyERC20FromLP: (lpAddress: string, erc20Address: string, erc20ExpectedAmount: BigNumberish, receiver: string, maxDiscrepancy: string, chainId: string, dexType: Dex, pairType: Pair, provider: any) => Promise<{
    tokenIn: string;
    estimateAmountIn: BigNumber;
    tokenOut: string;
    expectedAmountOut: BigNumberish;
    buyCallData: any[];
}>;
