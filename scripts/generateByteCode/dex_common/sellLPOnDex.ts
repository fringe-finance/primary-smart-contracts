import { Dex } from "../enum/dexType";
import { sellOnDex } from "./sellOnDex";

export const sellLPOnDex = async (
    unwrapData: any,
    tokenOut: string,
    swapOnDex: Dex,
    receiver: string,
    chainId: string,
    signerOrProvider: any
) => {
    let sellData0 = await sellOnDex(
        unwrapData.token0,
        unwrapData.token0Decimals,
        unwrapData.amount0,
        tokenOut,
        swapOnDex,
        receiver,
        chainId,
        signerOrProvider
    );
    let sellData1 = await sellOnDex(
        unwrapData.token0,
        unwrapData.token0Decimals,
        unwrapData.amount0,
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
