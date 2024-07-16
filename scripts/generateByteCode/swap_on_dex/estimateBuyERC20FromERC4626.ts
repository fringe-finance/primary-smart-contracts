import { BigNumberish, utils } from "ethers";
import { ERC4626_ABI } from "../abis/ERC4626";
import { Dex } from "../enum/dexType";
import { loadContractInstance } from "../utils/loadContract";
import { toBN } from "../utils/helpers";
import { buyOnDex } from "../dex_common/buyOnDex";
import { ERC20_ABI } from "../abis/ERC20";
import { getMaxDiscrepancyAmount } from "../utils/getMaxDiscrepancyAmount";
import { estimateBuyERC20FromERC20 } from "./estimateBuyERC20FromERC20";


export const estimateBuyERC20FromERC4626 = async (
    erc4626Address: string,
    erc20Address: string,
    erc20ExpectedAmount: BigNumberish,
    receiver: string,
    maxDiscrepancy: string,
    chainId: string,
    dexType: Dex,
    provider: any
) => {
  const erc4626Instance = loadContractInstance(erc4626Address, ERC4626_ABI, provider);
  const erc4626AssetAddress = await erc4626Instance.asset();
  
  const estimation = await estimateBuyERC20FromERC20(
    erc4626AssetAddress,
    erc20Address,
    erc20ExpectedAmount,
    receiver,
    maxDiscrepancy,
    chainId,
    dexType,
    provider
  )
  const estimateAmountIn = await erc4626Instance.convertToShares(estimation.estimateAmountIn)
  
  return {
    tokenIn: erc4626Address,
    estimateAmountIn: toBN(estimateAmountIn),
    tokenOut: erc20Address,
    expectedAmountOut: erc20ExpectedAmount,
    buyCallData: estimation.buyCallData,
  };
  
};
