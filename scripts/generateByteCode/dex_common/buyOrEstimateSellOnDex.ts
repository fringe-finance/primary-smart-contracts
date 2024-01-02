import { BigNumberish } from "ethers";
import { Dex } from "../enum/dexType";
import { buyOnParaswap } from "../paraswap/buyOnParaswap";
import { estimateSellOnDex } from "./estimateSellOnDex";

export const buyOrEstimateSellOnDex = async (
    tokenIn: string,
    tokenInDecimals: number,
    tokenInAmount: BigNumberish,
    token0: string,
    token0Decimals: number,
    amount0Desired: BigNumberish,
    token1: string,
    token1Decimals: number,
    amount1Desired: BigNumberish,
    receiver: string,
    swapOnDex: Dex,
    chainId: string,
    maxDiscrepancy?: string
) => {
    let buyOrSellData0;
    let buyOrSellData1;
    if (swapOnDex === Dex.Paraswap) {
        buyOrSellData0 = await buyOnParaswap(
            tokenIn,
            tokenInDecimals,
            token0,
            token0Decimals,
            amount0Desired,
            receiver,
            chainId
        );
        buyOrSellData1 = await buyOnParaswap(
            tokenIn,
            tokenInDecimals,
            token1,
            token1Decimals,
            amount1Desired,
            receiver,
            chainId
        );
    } else if (swapOnDex === Dex.OpenOcean) {
        buyOrSellData0 =
            maxDiscrepancy &&
            (await estimateSellOnDex(
                tokenIn,
                tokenInDecimals,
                tokenInAmount,
                token0,
                amount0Desired,
                receiver,
                chainId,
                maxDiscrepancy
            ));
        buyOrSellData1 =
            maxDiscrepancy &&
            (await estimateSellOnDex(
                tokenIn,
                tokenInDecimals,
                tokenInAmount,
                token1,
                amount1Desired,
                receiver,
                chainId,
                maxDiscrepancy
            ));
    }
    return {
        buyOrSellData0,
        buyOrSellData1
    };
};
