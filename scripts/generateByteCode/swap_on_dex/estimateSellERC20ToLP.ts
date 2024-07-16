import { BigNumber, BigNumberish } from "ethers";
import { Dex } from "../enum/dexType";
import { Pair } from "../enum/pairType";
import { toBN } from "../utils/helpers";
import { unwrapLP } from "../utils/unwrap";
import { estimateSellERC20ToERC20 } from "./estimateSellERC20ToERC20";

export const estimateSellERC20ToLP = async (
    tokenInAddress: string,
    tokenOutAddress: string,
    pairType: Pair,
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
        lpToken1Reserve,
    } = await unwrapLP(tokenOutAddress, pairType, provider);
    let estimate0: { estimateAmountOut: BigNumber, buyCallData: any} | undefined;
    let estimate1: { estimateAmountOut: BigNumber, buyCallData: any} | undefined;
    
    if (lpToken0Address.toLowerCase() === tokenInAddress.toLowerCase()) {
        estimate0 = {
            estimateAmountOut: toBN(amountIn).div(2),
            buyCallData: undefined
        }
    } else {
        const { estimateAmountOut, buyCallData } = await estimateSellERC20ToERC20(
            tokenInAddress,
            lpToken0Address,
            toBN(amountIn).div(2),
            maxDiscrepancy,
            receiver,
            chainId,
            dexType,
            provider
        );
        estimate0 = { estimateAmountOut, buyCallData }
    }

    if (lpToken1Address.toLowerCase() === tokenInAddress.toLowerCase()) {
        estimate1 = {
            estimateAmountOut: toBN(amountIn).div(2),
            buyCallData: undefined
        }
    } else {
        const { estimateAmountOut, buyCallData } = await estimateSellERC20ToERC20(
            tokenInAddress,
            lpToken1Address,
            toBN(amountIn).div(2),
            maxDiscrepancy,
            receiver,
            chainId,
            dexType,
            provider
        );
        estimate1 = { estimateAmountOut, buyCallData }
    }

    const amountOutBasedOn0 = estimate0.estimateAmountOut.mul(toBN(lpTotalSupply)).div(toBN(lpToken0Reserve));
    const amountOutBasedOn1 = estimate1.estimateAmountOut.mul(toBN(lpTotalSupply)).div(toBN(lpToken1Reserve));

    return {
        tokenIn: tokenInAddress,
        amountIn: amountIn,       
        tokenOut: tokenOutAddress,
        estimateAmountOut: amountOutBasedOn0.gt(amountOutBasedOn1) ? amountOutBasedOn1 : amountOutBasedOn0,
        buyCallData: [estimate0?.buyCallData?.[0], estimate1?.buyCallData?.[0]].filter(data => !!data),
    };
};
