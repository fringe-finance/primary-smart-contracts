import { BigNumberish } from "ethers";
import { ERC20_ABI } from "../abis/ERC20";
import { buyOrEstimateSellOnDex } from "../dex_common/buyOrEstimateSellOnDex";
import { getPriceOnDex } from "../dex_common/getPriceOnDex";
import { Dex } from "../enum/dexType";
import { Pair } from "../enum/pairType";
import { estimateBuyLPAmountDesired } from "../utils/estimateAmountDesired";
import { getMaxDiscrepancyAmount } from "../utils/getMaxDiscrepancyAmount";
import { toBN } from "../utils/helpers";
import { loadContractInstance } from "../utils/loadContract";
import { unwrapLP } from "../utils/unwrap";

export const estimateBuyLPFromERC20 = async (
    erc20Address: string,
    erc20BalanceAmount: BigNumberish,
    lpAddress: string,
    lpExpectedAmount: BigNumberish,
    receiver: string,
    maxDiscrepancy: string,
    chainId: string,
    dexType: Dex,
    pairType: Pair,
    signerOrProvider: any
) => {
    const erc20Instance = loadContractInstance(erc20Address, ERC20_ABI, signerOrProvider);
    const erc20Decimals = await erc20Instance.decimals();

    // Unwrap LP token to token 0 & token 1
    const {
        lpTotalSupply,
        // token 0
        lpToken0Address,
        lpToken0Decimals,
        lpToken0Reserve,
        lpToken0Liquidity,
        // token 1
        lpToken1Address,
        lpToken1Decimals,
        lpToken1Reserve,
        lpToken1Liquidity
    } = await unwrapLP(lpAddress, pairType, signerOrProvider);

    const lpAcceptableAmount = getMaxDiscrepancyAmount(toBN(lpExpectedAmount), maxDiscrepancy);
    const { amount0Desired: lpToken0DesiredAmount, amount1Desired: lpToken1DesiredAmount } =
        estimateBuyLPAmountDesired(
            lpToken0Reserve,
            lpToken1Reserve,
            lpToken0Liquidity,
            lpToken1Liquidity,
            lpTotalSupply,
            lpAcceptableAmount
        );

    const { buyOrSellData0: lpToken0BuyData, buyOrSellData1: lpToken1BuyData } = await buyOrEstimateSellOnDex(
        erc20Address,
        erc20Decimals,
        erc20BalanceAmount,
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

    const lpToken0ActualAmount = await getPriceOnDex(
        erc20Address,
        erc20Decimals,
        lpToken0BuyData.amountIn,
        lpToken0Address,
        lpToken0Decimals,
        dexType,
        chainId
    );
    const lpActualAmount = lpToken0ActualAmount.mul(lpTotalSupply).div(lpToken0Reserve);

    return {
        tokenIn: erc20Address,
        tokenInDecimals: erc20Decimals,
        estimateAmountIn: erc20AmountEstimated,
        estimateAmountInBuyToken0: lpToken0BuyData.amountIn,
        estimateAmountInBuyToken1: lpToken1BuyData.amountIn,
        tokenOut: lpAddress,
        expectedAmountOut: lpExpectedAmount,
        actualAmountOut: lpActualAmount.toString(),
        buyCallData: [lpToken0BuyData.buyCallData, lpToken1BuyData.buyCallData],
        status: toBN(erc20BalanceAmount).gte(erc20AmountEstimated)
    };
};
