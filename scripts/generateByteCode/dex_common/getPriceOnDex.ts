import { BigNumber, BigNumberish } from "ethers";
import { Dex } from "../enum/dexType";
import { sellOnOpenOcean } from "../openocean/sellOnOpenOcean";
import { getPriceOnParaswap } from "../paraswap/getPriceOnParaswap";

export const getPriceOnDex = async (
    tokenIn: string,
    tokenInDecimals: number,
    tokenInAmount: BigNumberish,
    tokenOut: string,
    tokenOutDecimals: number,
    dex: Dex,
    chainId: string
): Promise<BigNumber> => {
    if (dex === Dex.Paraswap) {
        const result = await getPriceOnParaswap(
            tokenIn,
            tokenInDecimals,
            tokenOut,
            tokenOutDecimals,
            tokenInAmount.toString(),
            "SELL",
            Number(chainId)
        );
        return BigNumber.from(result.priceRoute.destAmount);
    } else if (dex === Dex.OpenOcean) {
        const { amountOut } = await sellOnOpenOcean(
            tokenIn,
            tokenInDecimals,
            tokenInAmount,
            tokenOut,
            "0x0000000000000000000000000000000000000000",
            chainId,
            "10"
        );
        return amountOut;
    } else return BigNumber.from(0);
};
