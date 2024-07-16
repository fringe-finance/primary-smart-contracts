import { BigNumberish } from "ethers";
export declare const estimateSellOnDex: (tokenIn: string, tokenInDecimals: BigNumberish, tokenInAmount: BigNumberish, tokenOut: string, expectedAmountOut: BigNumberish, receiver: string, chainId: string, maxDiscrepancy: string) => Promise<any>;
