import { BigNumberish } from "ethers";
export declare const sellOnOpenOcean: (tokenIn: string, tokenInDecimals: BigNumberish, amountIn: BigNumberish, tokenOut: string, receiver: string, chainId: string, gasPriceInGWei: string) => Promise<{
    amountOut: import("ethers").BigNumber;
    buyCallData: string;
}>;
