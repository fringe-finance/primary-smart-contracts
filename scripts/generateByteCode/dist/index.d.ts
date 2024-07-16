import { BigNumberish } from "ethers";
import { TokenType } from "./enum/tokenType";
import { Dex } from "./enum/dexType";
import { Pair } from "./enum/pairType";
interface Token {
    address: string;
    tokenType: TokenType;
    pairType?: Pair;
}
/**
 * The `estimate` function calculates the estimated amount of a token output
 * @param {Token} tokenIn - `tokenIn` is the token being swapped from. It is of type `Token`.
 * @param {Token} tokenOut - The `tokenOut` is the token that will be received as output from
 * the trade. It is of type `Token` and is one of the input parameters for estimating a trade.
 * @param {BigNumberish} expectedAmountOut - The `expectedAmountOut` is the amount of the
 * `tokenOut` that you expect to receive in the trade.
 * @param {string} receiver - The `receiver` is the address of the recipient who will receive the
 * output tokens after the swap is executed.
 * @param {string} maxDiscrepancy - The `maxDiscrepancy` is used to specify the maximum allowed
 * difference between the expected output amount and the actual output amount during the estimation
 * process. It helps in handling slippage and ensuring that the estimated trade is within an acceptable
 * range of deviation from the
 * @param {string} chainId - The `chainId` is used to specify the blockchain network ID in integer on
 * which the transaction will be executed. Such as Ethereum Mainnet (chainId: "1")
 * @param {Dex} dexType - The `dexType` is the type of decentralized exchange (DEX) that will be used for
 * the token swap.
 * @param {any} provider - The `provider is used to specify the provider for interacting with the blockchain.
 */
export declare const estimateBuy: (tokenIn: Token, tokenOut: Token, expectedAmountOut: BigNumberish, receiver: string, maxDiscrepancy: string, chainId: string, dexType: Dex, provider: any) => Promise<{
    tokenIn: string;
    estimateAmountIn: any;
    tokenOut: string;
    expectedAmountOut: BigNumberish;
    buyCallData: any[];
}>;
export declare const estimateSell: (tokenIn: Token, tokenOut: Token, amountIn: BigNumberish, maxDiscrepancy: string, receiver: string, chainId: string, dexType: Dex, provider: any) => Promise<{
    tokenIn: string;
    amountIn: BigNumberish;
    tokenOut: string;
    estimateAmountOut: import("ethers").BigNumber | undefined;
    buyCallData: any[];
}>;
export {};
