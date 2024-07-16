import { BigNumberish } from "ethers";
import { Dex } from "../enum/dexType";
export declare const estimateBuyERC20FromERC4626: (erc4626Address: string, erc20Address: string, erc20ExpectedAmount: BigNumberish, receiver: string, maxDiscrepancy: string, chainId: string, dexType: Dex, provider: any) => Promise<{
    tokenIn: string;
    estimateAmountIn: import("ethers").BigNumber;
    tokenOut: string;
    expectedAmountOut: BigNumberish;
    buyCallData: any[];
}>;
