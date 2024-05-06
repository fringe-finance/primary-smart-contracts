import { BigNumberish } from "ethers";
import { ERC20_ABI } from "../abis/ERC20";
import { Dex } from "../enum/dexType";
import { getMaxDiscrepancyAmount } from "../utils/getMaxDiscrepancyAmount";
import { toBN } from "../utils/helpers";
import { loadContractInstance } from "../utils/loadContract";
import { buyOnDex } from "../dex_common/buyOnDex";

export const estimateBuyERC20FromERC20 = async (
    tokenInAddress: string,
    tokenOutAddress: string,
    expectedAmountOut: BigNumberish,
    receiver: string,
    maxDiscrepancy: string,
    chainId: string,
    dexType: Dex,
    provider: any
) => {
    const tokenInInstance = loadContractInstance(tokenInAddress, ERC20_ABI, provider);
    const tokenOutInstance = loadContractInstance(tokenOutAddress, ERC20_ABI, provider);
    const [ tokenInDecimals, tokenOutDecimals ] = await Promise.all([
      tokenInInstance.decimals(),
      tokenOutInstance.decimals(),
    ])


    const acceptableAmountOut = getMaxDiscrepancyAmount(toBN(expectedAmountOut), maxDiscrepancy);

    const buyOrSellData = tokenInAddress.toLowerCase() === tokenOutAddress.toLowerCase()
    ? { amountIn: expectedAmountOut, buyCallData: null }
    : await buyOnDex(
      tokenInAddress,
      tokenInDecimals,
      tokenOutAddress,
      tokenOutDecimals,
      acceptableAmountOut,
      dexType,
      receiver,
      chainId,
      maxDiscrepancy
    );

    return {
        tokenIn: tokenInAddress,
        estimateAmountIn: buyOrSellData.amountIn,       
        tokenOut: tokenOutAddress,
        expectedAmountOut,
        buyCallData: [buyOrSellData.buyCallData].filter(data => !!data),
    };
};
