import { BigNumber, BigNumberish } from "ethers";
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
    lpBalanceAmount: BigNumberish,
    erc20Address: string,
    erc20ExpectedAmount: BigNumberish,
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
        lpDecimals,
        // token 0
        lpToken0Address,
        lpToken0Decimals,
        lpToken0Reserve,
        // token 1
        lpToken1Address,
        lpToken1Decimals,
        lpToken1Reserve
    } = await unwrapLP(lpAddress, pairType, signerOrProvider);

    const erc20AcceptableAmount = getMaxDiscrepancyAmount(toBN(erc20ExpectedAmount), maxDiscrepancy);
    let erc20EstimatedAmountForToken0 = BigNumber.from(erc20AcceptableAmount).div(2);
    let lpToken0EstimatedAmount = await getPriceOnDex(
        erc20Address,
        erc20Decimals,
        erc20EstimatedAmountForToken0,
        lpToken0Address,
        lpToken0Decimals,
        dexType,
        chainId
    );
    let lpToken1EstimatedAmount = lpToken0EstimatedAmount.mul(lpToken1Reserve).div(lpToken0Reserve);
    let erc20EstimatedAmountForToken1 = await getPriceOnDex(
        lpToken1Address,
        lpToken1Decimals,
        lpToken1EstimatedAmount,
        erc20Address,
        erc20Decimals,
        dexType,
        chainId
    );
    let erc20EstimatedAmount = erc20EstimatedAmountForToken0.add(erc20EstimatedAmountForToken1);

    erc20EstimatedAmountForToken0 = erc20EstimatedAmountForToken0
        .mul(erc20ExpectedAmount)
        .div(erc20EstimatedAmount);

    erc20EstimatedAmountForToken1 = erc20EstimatedAmountForToken1
        .mul(erc20ExpectedAmount)
        .div(erc20EstimatedAmount);

    const lpToken0BuyData = await buyOnDex(
        lpToken0Address,
        lpToken0Decimals,
        erc20Address,
        erc20Decimals,
        erc20EstimatedAmountForToken0,
        dexType,
        receiver,
        chainId
    );

    const lpToken1BuyData = await buyOnDex(
        lpToken1Address,
        lpToken1Decimals,
        erc20Address,
        erc20Decimals,
        erc20EstimatedAmountForToken1,
        dexType,
        receiver,
        chainId
    );

    lpToken0EstimatedAmount =
        lpToken0BuyData?.amountIn.mul(lpTotalSupply).div(lpToken0Reserve) ?? BigNumber.from(0);
    lpToken1EstimatedAmount =
        lpToken1BuyData?.amountIn.mul(lpTotalSupply).div(lpToken1Reserve) ?? BigNumber.from(0);
    const lpEstimatedAmountForToken0 = lpToken0EstimatedAmount.mul(lpTotalSupply).div(lpToken0Reserve);
    const lpEstimatedAmountForToken1 = lpToken1EstimatedAmount.mul(lpTotalSupply).div(lpToken1Reserve);
    const lpEstimatedAmount = lpEstimatedAmountForToken0.add(lpEstimatedAmountForToken1);

    console.log(lpToken0Address, lpToken0Reserve?.toString());
    console.log(lpToken1Address, lpToken1Reserve?.toString());
    return {
        tokenIn: lpAddress,
        tokenInDecimals: lpDecimals,
        estimateAmountIn: lpEstimatedAmount,

        token0Decimals: lpToken0Decimals,
        estimateAmountInBuyToken0: lpToken0BuyData?.amountIn,
        token1Decimals: lpToken1Decimals,
        estimateAmountInBuyToken1: lpToken1BuyData?.amountIn,
        tokenOut: erc20Address,
        tokenOutDecimals: erc20Decimals,
        expectedAmountOut: erc20ExpectedAmount,
        actualAmountOut: erc20AcceptableAmount,
        buyCallData: [lpToken0BuyData?.buyCallData, lpToken1BuyData?.buyCallData],
        status: toBN(lpBalanceAmount).gte(lpEstimatedAmount)
    };
};
