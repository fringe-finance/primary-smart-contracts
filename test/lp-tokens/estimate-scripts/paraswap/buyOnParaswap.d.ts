import { BigNumberish } from "ethers";
export declare const buyOnParaswap: (tokenSrc: string, tokenSrcDecimals: number, tokenDest: string, tokenDestDecimals: number, tokenDestAmount: BigNumberish, receiver: string, chainId: string) => Promise<{
    amountIn: import("ethers").BigNumber;
    buyCallData: any;
}>;
