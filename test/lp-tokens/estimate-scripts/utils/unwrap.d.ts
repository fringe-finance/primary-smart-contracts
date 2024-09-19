import { BigNumber, BigNumberish } from "ethers";
import { Pair } from "../enum/pairType";
export declare const unwrap: (pair: string, amount: BigNumberish, pairType: Pair, provider: any) => Promise<{
    token0: any;
    token0Decimals: any;
    amount0: BigNumber;
    token1: any;
    token1Decimals: any;
    amount1: BigNumber;
}>;
export declare const unwrapLP: (lpAddress: string, pairType: Pair, provider: any) => Promise<{
    lpDecimals: number;
    lpTotalSupply: BigNumber;
    lpToken0Address: string;
    lpToken0Decimals: number;
    lpToken0Reserve: BigNumber;
    lpToken1Address: string;
    lpToken1Decimals: number;
    lpToken1Reserve: BigNumber;
}>;
