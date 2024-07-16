import { BigNumberish, utils } from "ethers";
import { ERC4626_ABI } from "../abis/ERC4626";
import { Dex } from "../enum/dexType";
import { loadContractInstance } from "../utils/loadContract";
import { toBN } from "../utils/helpers";
import { estimateSellERC20ToERC4626 } from "./estimateSellERC20ToERC4626";


export const estimateSellERC4626ToERC4626 = async (
  tokenInAddress: string,
  tokenOutAddress: string,
  amountIn: BigNumberish,
  maxDiscrepancy: string,
  receiver: string,
  chainId: string,
  dexType: Dex,
  provider: any
) => {
  const erc4626SrcInstance = loadContractInstance(tokenInAddress, ERC4626_ABI, provider);
  const erc4626SrcAsset = await erc4626SrcInstance.asset();
  const estimateAssetAmountIn = await erc4626SrcInstance.convertToAssets(amountIn);

  const estimation = await estimateSellERC20ToERC4626(
    erc4626SrcAsset,
    tokenOutAddress,
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
