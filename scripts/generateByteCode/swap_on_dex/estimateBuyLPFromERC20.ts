import { BigNumberish } from "ethers";
import { ERC20_ABI } from "../abis/ERC20";
import { buyOrEstimateSellOnDex } from "../dex_common/buyOrEstimateSellOnDex";
import { Dex } from "../enum/dexType";
import { Pair } from "../enum/pairType";
import { estimateBuyLPAmountDesired } from "../utils/estimateAmountDesired";
import { getMaxDiscrepancyAmount } from "../utils/getMaxDiscrepancyAmount";
import { toBN } from "../utils/helpers";
import { loadContractInstance } from "../utils/loadContract";
import { unwrapLP } from "../utils/unwrap";

export const estimateBuyLPFromERC20 = async (
    erc20Address: string,
    lpAddress: string,
    lpExpectedAmount: BigNumberish,
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
        // token 0
        lpToken0Address,
        lpToken0Decimals,
        lpToken0Reserve,
        // token 1
        lpToken1Address,
        lpToken1Decimals,
        lpToken1Reserve,
    } = await unwrapLP(lpAddress, pairType, provider);

    const lpAcceptableAmount = getMaxDiscrepancyAmount(toBN(lpExpectedAmount), maxDiscrepancy);
    const { amount0Desired: lpToken0DesiredAmount, amount1Desired: lpToken1DesiredAmount } =
        estimateBuyLPAmountDesired(
            lpToken0Reserve,
            lpToken1Reserve,
            lpTotalSupply,
            lpAcceptableAmount
        );
    
    console.log(`
        Need ${lpToken0DesiredAmount} ${lpToken0Address}
        And ${lpToken1DesiredAmount} ${lpToken1Address}
        to add liquidate to get 
        ${lpAcceptableAmount} LP token ${lpAddress}
    `)
    const { buyOrSellData0: lpToken0BuyData, buyOrSellData1: lpToken1BuyData } = await buyOrEstimateSellOnDex(
        erc20Address,
        erc20Decimals,
        lpToken0Address,
        lpToken0Decimals,
        lpToken0DesiredAmount,
        lpToken1Address,
        lpToken1Decimals,
        lpToken1DesiredAmount,
        receiver,
        dexType,
        chainId,
        maxDiscrepancy
    );
    const erc20AmountEstimated = lpToken0BuyData.amountIn.add(lpToken1BuyData.amountIn);

    return {
        tokenIn: erc20Address,
        estimateAmountIn: erc20AmountEstimated,
        tokenOut: lpAddress,
        expectedAmountOut: lpExpectedAmount,
        buyCallData: [lpToken0BuyData.buyCallData, lpToken1BuyData.buyCallData].filter(data => !!data),
    };
};
