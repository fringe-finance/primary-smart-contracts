import { BigNumberish } from "ethers";
import { Dex } from "../enum/dexType";
import { Pair } from "../enum/pairType";
import { estimateSellLPAmountDesired } from "../utils/estimateAmountDesired";
import { toBN } from "../utils/helpers";
import { unwrapLP } from "../utils/unwrap";
import { sellOnDex } from "../dex_common/sellOnDex";
import { BigNumber } from "ethers";

export const estimateSellLPToERC20 = async (
    tokenInAddress: string,
    pairType: Pair,
    tokenOutAddress: string,
    amountIn: BigNumberish,
    maxDiscrepancy: string,
    receiver: string,
    chainId: string,
    dexType: Dex,
    provider: any
) => {
    // Unwrap LP token to token 0 & token 1
    const {
        lpTotalSupply,
        // token 0
        lpToken0Address,
        lpToken0Decimals,
        lpToken0Reserve,
        // token 1
        lpToken1Address,
        lpToken1Decimals,
        lpToken1Reserve
    } = await unwrapLP(tokenInAddress, pairType, provider);

    const { amount0Desired: lpToken0DesiredAmount, amount1Desired: lpToken1DesiredAmount } =
        estimateSellLPAmountDesired(lpToken0Reserve, lpToken1Reserve, lpTotalSupply, toBN(amountIn));
    
    let estimate0: { amountOut: BigNumber, buyCallData: any} | undefined;
    let estimate1: { amountOut: BigNumber, buyCallData: any} | undefined;
    if (lpToken0Address.toLowerCase() === tokenOutAddress.toLowerCase()) {
        estimate0 = {
            amountOut: lpToken0DesiredAmount,
            buyCallData: undefined
        }
    } else {
        estimate0 = await sellOnDex(
            lpToken0Address,
            lpToken0Decimals,
            lpToken0DesiredAmount,
            tokenOutAddress,
            dexType,
            maxDiscrepancy,
            receiver,
            chainId,
            provider
        );
    }

    if (lpToken1Address.toLowerCase() === tokenOutAddress.toLowerCase()) {
        estimate1 = {
            amountOut: lpToken1DesiredAmount,
            buyCallData: null
        }
    } else {
        estimate1 = await sellOnDex(
            lpToken1Address,
            lpToken1Decimals,
            lpToken1DesiredAmount,
            tokenOutAddress,
            dexType,
            maxDiscrepancy,
            receiver,
            chainId,
            provider
        );
    }

    return {
        tokenIn: tokenInAddress,
        amountIn: amountIn,       
        tokenOut: tokenOutAddress,
        estimateAmountOut: estimate0?.amountOut.add(estimate1?.amountOut || "0"),
        buyCallData: [estimate0?.buyCallData, estimate1?.buyCallData].filter(data => !!data),
    };
};
