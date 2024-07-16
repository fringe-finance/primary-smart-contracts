import { BigNumberish } from "ethers";
import { ERC4626_ABI } from "../abis/ERC4626";
import { Dex } from "../enum/dexType";
import { Pair } from "../enum/pairType";
import { loadContractInstance } from "../utils/loadContract";
import { estimateBuyERC20FromLP } from "./estimateBuyERC20FromLP";
import { toBN } from "../utils/helpers";
import { estimateSellERC20ToLP } from "./estimateSellERC20ToLP";

export const estimateSellERC4626ToLP = async (
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
  const erc4626SrcInstance = loadContractInstance(tokenInAddress, ERC4626_ABI, provider);
  const erc4626SrcAsset = await erc4626SrcInstance.asset();
  const estimateAssetAmountIn = await erc4626SrcInstance.convertToAssets(amountIn)
  
  const estimation = await estimateSellERC20ToLP(
    erc4626SrcAsset,
    tokenOutAddress,
    pairType,
    estimateAssetAmountIn,
    maxDiscrepancy,
    receiver,
    chainId,
    dexType,
    provider
  );

  return {
    tokenIn: tokenInAddress,
    amountIn: amountIn,       
    tokenOut: tokenOutAddress,
    estimateAmountOut: toBN(estimation.estimateAmountOut),
    buyCallData: estimation.buyCallData,
  };
};
