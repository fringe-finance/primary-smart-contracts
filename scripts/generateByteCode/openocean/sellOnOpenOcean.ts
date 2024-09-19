import { BigNumberish } from "ethers";
import { createCallDataOpenOcean } from "./createCallDataOpenOcean";
import { toBN } from "../utils/helpers";

export const sellOnOpenOcean = async (
    tokenIn: string,
    tokenInDecimals: BigNumberish,
    amountIn: BigNumberish,
    tokenOut: string,
    receiver: string,
    chainId: string,
    gasPriceInGWei: string
) => {
    const { data, amount } = await createCallDataOpenOcean(
        tokenIn,
        Number(tokenInDecimals),
        amountIn.toString(),
        tokenOut,
        {
            chainId,
            account: receiver
        },
        gasPriceInGWei
    );

    const amountOut = toBN(amount);
    const buyCallData = data;

    return {
        amountOut,
        buyCallData
    };
}