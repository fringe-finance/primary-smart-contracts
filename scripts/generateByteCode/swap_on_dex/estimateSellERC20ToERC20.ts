import { BigNumberish } from "ethers";
import { ERC20_ABI } from "../abis/ERC20";
import { Dex } from "../enum/dexType";
import { loadContractInstance } from "../utils/loadContract";
import { sellOnDex } from "../dex_common/sellOnDex";
import { toBN } from "../utils/helpers";

export const estimateSellERC20ToERC20 = async (
    tokenInAddress: string,
    tokenOutAddress: string,
    amountIn: BigNumberish,
    maxDiscrepancy: string,
    receiver: string,
    chainId: string,
    dexType: Dex,
    provider: any
) => {
    const tokenInInstance = loadContractInstance(tokenInAddress, ERC20_ABI, provider);
    const tokenInDecimals = await tokenInInstance.decimals();

    const estimation = tokenInAddress.toLowerCase() === tokenOutAddress.toLowerCase()
    ? { amountOut: amountIn, buyCallData: null }
    : await sellOnDex(
      tokenInAddress,
      tokenInDecimals,
      amountIn,
      tokenOutAddress,
      dexType,
      maxDiscrepancy,
      receiver,
      chainId,
      provider
    );

    return {
        tokenIn: tokenInAddress,
        amountIn: amountIn,       
        tokenOut: tokenOutAddress,
        estimateAmountOut: toBN(estimation?.amountOut || "0"),
        buyCallData: [estimation?.buyCallData].filter(data => !!data),
    };
};
