import { BigNumberish } from "ethers";
import { Dex } from "../enum/dexType";
import { Pair } from "../enum/pairType";
import { unwrap } from "../utils/unwrap";
import { sellLPOnDex } from "./sellLPOnDex";

export const unwrapAndSellLPOnDex = async (
    tokenIn: string,
    amountIn: BigNumberish,
    tokenOut: string,
    receiver: string,
    chainId: string,
    swapOnDex: Dex,
    pairType: Pair,
    signerOrProvider: any
) => {
    const unwrapData = await unwrap(tokenIn, amountIn, pairType, signerOrProvider);
    const { sellData0, sellData1 } = await sellLPOnDex(
        unwrapData,
        tokenOut,
        swapOnDex,
        receiver,
        chainId,
        signerOrProvider
    );
    return {
        sellData0,
        sellData1
    };
};
