import { BigNumberish } from "ethers";
import { ERC4626_ABI } from "../abis/ERC4626";
import { Dex } from "../enum/dexType";
import { loadContractInstance } from "../utils/loadContract";
import { toBN } from "../utils/helpers";
import { ERC20_ABI } from "../abis/ERC20";
import { sellOnDex } from "../dex_common/sellOnDex";

enum CONTRACT_NAME {
  ERC_4626_TOKEN = "ERC-4626_Token",
  ERC_4626_ASSET = "ERC-4626_Asset",
  ERC20 = "ERC-20_Token"
}

enum METHOD_NAME {
  DECIMALS = "decimals",
  CONVERT_TO_ASSET = "convertToAssets",
}


export const estimateSellERC4626ToERC20 = async (
  tokenInAddress: string,
  tokenOutAddress: string,
  amountIn: BigNumberish,
  maxDiscrepancy: string,
  receiver: string,
  chainId: string,
  dexType: Dex,
  provider: any
) => {
  const erc4626Instance = loadContractInstance(tokenInAddress, ERC4626_ABI, provider);
  const erc4626Asset = await erc4626Instance.asset();
  const assetInstance = loadContractInstance(erc4626Asset, ERC20_ABI, provider);
  const assetDecimals = await assetInstance.decimals();

  const estimateAmountIn = await erc4626Instance.convertToAssets(amountIn)
  if (tokenOutAddress.toLowerCase() === erc4626Asset.toLowerCase()) {
    return {
      tokenIn: tokenInAddress,
      amountIn: amountIn,       
      tokenOut: tokenOutAddress,
      estimateAmountOut: toBN(estimateAmountIn),
      buyCallData: [],
    }
  } else {
    const estimation = await sellOnDex(
      erc4626Asset,
      assetDecimals,
      estimateAmountIn,
      tokenOutAddress,
      dexType,
      maxDiscrepancy,
      receiver,
      chainId,
      provider
    );
      
    return {
      tokenIn: tokenInAddress,
      amountIn: amountIn,       
      tokenOut: tokenOutAddress,
      estimateAmountOut: toBN(estimation?.amountOut || "0"),
      buyCallData: [estimation?.buyCallData].filter(data => !!data),
  };
  }
  
};
