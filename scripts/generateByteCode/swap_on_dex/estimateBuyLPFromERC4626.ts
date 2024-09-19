import { BigNumberish } from "ethers";
import { ERC4626_ABI } from "../abis/ERC4626";
import { Dex } from "../enum/dexType";
import { Pair } from "../enum/pairType";
import { loadContractInstance } from "../utils/loadContract";
import { estimateBuyLPFromERC20 } from "./estimateBuyLPFromERC20";
import { toBN } from "../utils/helpers";

export const estimateBuyLPFromERC4626 = async (
    erc4626Address: string,
    lpAddress: string,
    lpExpectedAmount: BigNumberish,
    receiver: string,
    maxDiscrepancy: string,
    chainId: string,
    dexType: Dex,
    pairType: Pair,
    provider: any
) => {
    const erc4626Instance = loadContractInstance(erc4626Address, ERC4626_ABI, provider);
    const erc20Address = await erc4626Instance.asset();

    const estimation = await estimateBuyLPFromERC20(
        erc20Address,
        lpAddress,
        lpExpectedAmount,
        receiver,
        maxDiscrepancy,
        chainId,
        dexType,
        pairType,
        provider
    );

    const estimateAmountIn = await erc4626Instance.convertToShares(estimation.estimateAmountIn);

    return {
        tokenIn: erc4626Address,
        estimateAmountIn: toBN(estimateAmountIn),
        tokenOut: lpAddress,
        expectedAmountOut: lpExpectedAmount,
        buyCallData: estimation.buyCallData,
    };
};
