import { BigNumberish } from "ethers";
export declare const sellOnParaswap: (tokenIn: string, tokenInDecimals: BigNumberish, amountIn: BigNumberish, tokenOut: string, tokenOutDecimals: BigNumberish, receiver: string, chainId: string) => Promise<{
    amountOut: import("ethers").BigNumber;
    buyCallData: any;
}>;
