import { BigNumberish } from "ethers";
import { ERC20_ABI } from "../abis/ERC20";
import { Dex } from "../enum/dexType";
import { sellOnOpenOcean } from "../openocean/sellOnOpenOcean";
import { sellOnParaswap } from "../paraswap/sellOnParaswap";
import { loadContractInstance } from "../utils/loadContract";

export const sellOnDex = async (
    tokenIn: string,
    tokenInDecimals: BigNumberish,
    tokenInAmount: BigNumberish,
    tokenOut: string,
    swapOnDex: Dex,
    receiver: string,
    chainId: string,
    signerOrProvider: any
) => {
    if (swapOnDex === Dex.Paraswap) {
        const tokenOutInstance = loadContractInstance(tokenOut, ERC20_ABI, signerOrProvider);
        const tokenOutDecimals = await tokenOutInstance.decimals();
        return await sellOnParaswap(
            tokenIn,
            tokenInDecimals,
            tokenInAmount,
            tokenOut,
            tokenOutDecimals,
            receiver,
            chainId
        );
    } else if (swapOnDex === Dex.OpenOcean) {
        return await sellOnOpenOcean(
            tokenIn,
            tokenInDecimals,
            tokenInAmount,
            tokenOut,
            receiver,
            chainId,
            "10"
        );
    }
};
