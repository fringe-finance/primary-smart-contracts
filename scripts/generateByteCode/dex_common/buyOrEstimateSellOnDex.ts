import { BigNumberish, BigNumber, ethers } from "ethers";
import { Dex } from "../enum/dexType";
import { buyOnDex } from "./buyOnDex";
import { toBN } from "../utils/helpers";

export const buyOrEstimateSellOnDex = async (
    tokenIn: string,
    tokenInDecimals: number,
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
    let buyOrSellData0: { amountIn: BigNumber, buyCallData: any } = { amountIn: BigNumber.from(0), buyCallData: "" };
    let buyOrSellData1: { amountIn: BigNumberish, buyCallData: any } = { amountIn: BigNumber.from(0), buyCallData: "" };
    if (tokenIn.toLowerCase() !== token0.toLowerCase()) {
        buyOrSellData0 = await buyOnDex(
            tokenIn,
            tokenInDecimals,
            token0,
            token0Decimals,
            amount0Desired,
            swapOnDex,
            receiver,
            chainId,
            maxDiscrepancy
        );
    } else {
        buyOrSellData0 = {
            amountIn: toBN(amount0Desired),
            buyCallData: null,
        }
    }
    if (tokenIn.toLowerCase() !== token1.toLowerCase()) {
        buyOrSellData1 = await buyOnDex(
            tokenIn,
            tokenInDecimals,
            token1,
            token1Decimals,
            amount1Desired,
            swapOnDex,
            receiver,
            chainId,
            maxDiscrepancy
        );
    } else {
        buyOrSellData1 = {
            amountIn: toBN(amount1Desired),
            buyCallData: null,
        }
    }

    return {
        buyOrSellData0,
        buyOrSellData1
    };
};
