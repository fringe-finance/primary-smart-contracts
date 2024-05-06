import { BigNumber, BigNumberish, ethers } from "ethers";
import { ERC20_ABI } from "../abis/ERC20";
import { buyOnDex } from "../dex_common/buyOnDex";
import { getPriceOnDex } from "../dex_common/getPriceOnDex";
import { Dex } from "../enum/dexType";
import { Pair } from "../enum/pairType";
import { getMaxDiscrepancyAmount } from "../utils/getMaxDiscrepancyAmount";
import { toBN } from "../utils/helpers";
import { loadContractInstance } from "../utils/loadContract";
import { unwrapLP } from "../utils/unwrap";

export const estimateBuyERC20FromLP = async (
    lpAddress: string,
    erc20Address: string,
    erc20ExpectedAmount: BigNumberish,
    receiver: string,
    maxDiscrepancy: string,
    chainId: string,
    dexType: Dex,
    pairType: Pair,
    provider: any
) => {
    const erc20Instance = loadContractInstance(erc20Address, ERC20_ABI, provider);
    const erc20Decimals = await erc20Instance.decimals();

    // Unwrap LP token to token 0 & token 1

    const {
        lpTotalSupply,
        lpDecimals,
        // token 0
        lpToken0Address,
        lpToken0Decimals,
        lpToken0Reserve,
        // token 1
        lpToken1Address,
        lpToken1Decimals,
        lpToken1Reserve
    } = await unwrapLP(lpAddress, pairType, provider);

    const erc20AcceptableAmount = getMaxDiscrepancyAmount(toBN(erc20ExpectedAmount), maxDiscrepancy);
    const erc20EstimatedAmountForToken0 = BigNumber.from(erc20AcceptableAmount).div(2);
    const erc20EstimatedAmountForToken1 = BigNumber.from(erc20AcceptableAmount).div(2);

    let lpToken0BuyData: {amountIn: BigNumber; buyCallData: any;};
    let lpToken1BuyData: {amountIn: BigNumber; buyCallData: any;};
    if (lpToken0Address.toLowerCase() !== erc20Address.toLowerCase()) {
        lpToken0BuyData = await buyOnDex(
            lpToken0Address,
            lpToken0Decimals,
            erc20Address,
            erc20Decimals,
            erc20EstimatedAmountForToken0,
            dexType,
            receiver,
            chainId,
            maxDiscrepancy
        );
    } else {
        lpToken0BuyData = {
            amountIn: toBN(erc20EstimatedAmountForToken0),
            buyCallData: null
        }
    }
    
    if (lpToken1Address.toLowerCase() !== erc20Address.toLowerCase()) {
        lpToken1BuyData = await buyOnDex(
            lpToken1Address,
            lpToken1Decimals,
            erc20Address,
            erc20Decimals,
            erc20EstimatedAmountForToken1,
            dexType,
            receiver,
            chainId
        );
    } else {
        lpToken1BuyData = {
            amountIn: toBN(erc20EstimatedAmountForToken1),
            buyCallData: null
        }
    }

    const lpToken0EstimatedAmount = lpToken0BuyData.amountIn;
    const lpToken1EstimatedAmount = lpToken1BuyData.amountIn;
    const lpEstimatedAmountWithToken0 = lpToken0EstimatedAmount.mul(lpTotalSupply).div(lpToken0Reserve);
    const lpEstimatedAmountWithToken1 = lpToken1EstimatedAmount.mul(lpTotalSupply).div(lpToken1Reserve);
    const lpEstimatedAmount = 
        lpEstimatedAmountWithToken0.gt(lpEstimatedAmountWithToken1) 
        ? lpEstimatedAmountWithToken0
        : lpEstimatedAmountWithToken1;
    return {
        tokenIn: lpAddress,
        estimateAmountIn: lpEstimatedAmount,
        tokenOut: erc20Address,
        expectedAmountOut: erc20ExpectedAmount,
        buyCallData: [lpToken0BuyData?.buyCallData, lpToken1BuyData?.buyCallData].filter(data => !!data),
    };
};
