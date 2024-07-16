import { BigNumberish } from "ethers";
import { ERC4626_ABI } from "../abis/ERC4626";
import { Dex } from "../enum/dexType";
import { Pair } from "../enum/pairType";
import { loadContractInstance } from "../utils/loadContract";
import { estimateBuyLPFromERC20 } from "./estimateBuyLPFromERC20";
import { toBN } from "../utils/helpers";
import { estimateSellLPToERC20 } from "./estimateSellLPToERC20";

export const estimateSellLPToERC4626 = async (
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
    const erc4626Instance = loadContractInstance(tokenOutAddress, ERC4626_ABI, provider);
    const assetAddress = await erc4626Instance.asset();

    const estimation = await estimateSellLPToERC20(
        tokenInAddress,
        pairType,
        assetAddress,
        amountIn,
        maxDiscrepancy,
        receiver,
        chainId,
        dexType,
        provider
    );

    const estimateAmountOut = await erc4626Instance.convertToShares(estimation.estimateAmountOut);

    return {
        tokenIn: tokenInAddress,
        amountIn: amountIn,       
        tokenOut: tokenOutAddress,
        estimateAmountOut: toBN(estimateAmountOut),
        buyCallData: estimation.buyCallData,
    };
};
