import { BigNumberish } from "ethers";
import { sellOnOpenOcean } from "../openocean/sellOnOpenOcean";
import { checkDiscrepancy } from "../utils/checkDiscrepancy";
import { toBN } from "../utils/helpers";

export const estimateSellOnDex = async (
    tokenIn: string,
    tokenInDecimals: BigNumberish,
    tokenInAmount: BigNumberish,
    tokenOut: string,
    expectedAmountOut: BigNumberish,
    receiver: string,
    chainId: string,
    maxDiscrepancy: string
): Promise<any> => {
    const sellData = await sellOnOpenOcean(
        tokenIn,
        tokenInDecimals,
        tokenInAmount,
        tokenOut,
        receiver,
        chainId,
        "10"
    );

    if (
        sellData.amountOut.lt(expectedAmountOut) ||
        checkDiscrepancy(toBN(expectedAmountOut), sellData.amountOut, maxDiscrepancy)
    ) {
        return {
            amountIn: tokenInAmount,
            buyCallData: sellData.buyCallData
        };
    } else {
        return await estimateSellOnDex(
            tokenIn,
            tokenInDecimals,
            toBN(tokenInAmount).mul(expectedAmountOut).div(sellData.amountOut),
            tokenOut,
            expectedAmountOut,
            receiver,
            chainId,
            maxDiscrepancy
        );
    }
};
