import { BigNumberish } from "ethers";
import { toBN } from "../utils/helpers";
import { createCallDataParaswap } from "./createCallDataParaswap";

export const sellOnParaswap = async (
    tokenIn: string,
    tokenInDecimals: BigNumberish,
    amountIn: BigNumberish,
    tokenOut: string,
    tokenOutDecimals: BigNumberish,
    receiver: string,
    chainId: string
) => {
    const { data, amount } = await createCallDataParaswap(
        tokenIn,
        Number(tokenInDecimals),
        tokenOut,
        Number(tokenOutDecimals),
        amountIn.toString(),
        "SELL",
        {
            chainId: Number(chainId),
            account: receiver
        }
    );

    const amountOut = toBN(amount);
    const buyCallData = data;

    return {
        amountOut,
        buyCallData
    };
};
