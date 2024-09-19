import { BigNumberish } from "ethers";
import { TokenType } from "./enum/tokenType";
import { Dex } from "./enum/dexType";
import { Pair } from "./enum/pairType";
interface Token {
    address: string;
    tokenType: TokenType;
    pairType?: Pair;
}
export declare const estimate: (tokenIn: Token, tokenOut: Token, expectedAmountOut: BigNumberish, receiver: string, maxDiscrepancy: string, chainId: string, dexType: Dex, provider: any) => Promise<{
    tokenIn: string;
    estimateAmountIn: any;
    tokenOut: string;
    expectedAmountOut: BigNumberish;
    buyCallData: any[];
}>;
export {};
