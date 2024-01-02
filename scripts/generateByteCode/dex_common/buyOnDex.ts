import { BigNumberish } from "ethers";
import { Dex } from "../enum/dexType";
import { buyOnParaswap } from "../paraswap/buyOnParaswap";

export const buyOnDex = async (
    tokenSrc: string,
    tokenSrcDecimals: number,
    tokenDest: string,
    tokenDestDecimals: number,
    tokenDestAmount: BigNumberish,
    swapOnDex: Dex,
    receiver: string,
    chainId: string
) => {
    if (swapOnDex === Dex.Paraswap) {
        return await buyOnParaswap(
            tokenSrc,
            tokenSrcDecimals,
            tokenDest,
            tokenDestDecimals,
            tokenDestAmount,
            receiver,
            chainId
        );
    } else if (swapOnDex === Dex.OpenOcean) {
        throw new Error("Not implemented");
    }
};
