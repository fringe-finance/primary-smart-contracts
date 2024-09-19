import { BigNumberish, BigNumber } from "ethers";
import { Dex } from "../enum/dexType";
import { buyOnParaswap } from "../paraswap/buyOnParaswap";
import { buyOnOpenOcean } from "../openocean/buyOnOpenOcean";

export const buyOnDex = async (
    tokenSrc: string,
    tokenSrcDecimals: number,
    tokenDest: string,
    tokenDestDecimals: number,
    tokenDestAmount: BigNumberish,
    swapOnDex: Dex,
    receiver: string,
    chainId: string,
    maxDiscrepancy: string = "0.005"
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
        return await buyOnOpenOcean(
            tokenSrc,
            tokenSrcDecimals,
            BigNumber.from(1000).mul(BigNumber.from(10).pow(tokenSrcDecimals)),
            tokenDest,
            tokenDestAmount,
            receiver,
            chainId,
            maxDiscrepancy
        );
    }
};
