import { BigNumberish } from "ethers";
import { Dex } from "../enum/dexType";
export declare const estimateBuyERC4626FromERC20: (erc20Address: string, erc4626Address: string, erc4626ExpectedAmount: BigNumberish, receiver: string, maxDiscrepancy: string, chainId: string, dexType: Dex, provider: any) => Promise<{
    tokenIn: string;
    estimateAmountIn: import("ethers").BigNumber;
    tokenOut: string;
    expectedAmountOut: BigNumberish;
    buyCallData: any[];
}>;
