import { BigNumberish } from "ethers";
import { toBN } from "../utils/helpers";
import { createCallDataParaswap } from "./createCallDataParaswap";

export const buyOnParaswap = async (
    tokenSrc: string,
    tokenSrcDecimals: number,
    tokenDest: string,
    tokenDestDecimals: number,
    tokenDestAmount: BigNumberish,
    receiver: string,
    chainId: string
) => {
    const { data, amount } = await createCallDataParaswap(
        tokenSrc,
        tokenSrcDecimals,
        tokenDest,
        tokenDestDecimals,
        tokenDestAmount.toString(),
        "BUY",
        {
            chainId: Number(chainId),
            account: receiver
        }
    );

    const amountIn = toBN(amount);
    const buyCallData = data;
    return {
        amountIn,
        buyCallData
    };
};
