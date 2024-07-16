import { BigNumberish, utils } from "ethers";
import { ERC4626_ABI } from "../abis/ERC4626";
import { Dex } from "../enum/dexType";
import { loadContractInstance } from "../utils/loadContract";
import { toBN } from "../utils/helpers";
import { ERC20_ABI } from "../abis/ERC20";
import { sellOnDex } from "../dex_common/sellOnDex";


export const estimateSellERC20ToERC4626 = async (
    tokenInAddress: string,
    tokenOutAddress: string,
    amountIn: BigNumberish,
    maxDiscrepancy: string,
    receiver: string,
    chainId: string,
    dexType: Dex,
    provider: any
) => {
  const erc20Instance = loadContractInstance(tokenInAddress, ERC20_ABI, provider);
  const erc20Decimals = await erc20Instance.decimals();

  const erc4626Instance = loadContractInstance(tokenOutAddress, ERC4626_ABI, provider);
  const erc4626AssetAddress = await erc4626Instance.asset();

  if (tokenInAddress.toLowerCase() === erc4626AssetAddress.toLowerCase()) {
    const estimateAmountOut = await erc4626Instance.convertToShares(amountIn)
    return {
      tokenIn: tokenInAddress,
      tokenOut: tokenOutAddress,
      estimateAmountOut: toBN(estimateAmountOut),
      amountIn,
      buyCallData: [],
    }
  } else {
    const estimation = await sellOnDex(
      erc20Instance.address,
      erc20Decimals,
      amountIn,
      erc4626AssetAddress,
      dexType,
      maxDiscrepancy,
      receiver,
      chainId,
      provider
    );

    const estimateAmountOut = await erc4626Instance.convertToShares(estimation?.amountOut)
      
    return {
      tokenIn: tokenInAddress,
      tokenOut: tokenOutAddress,
      estimateAmountOut: toBN(estimateAmountOut),
      amountIn,
      buyCallData: [estimation?.buyCallData].filter(data => !!data),
    }
  }
  
};
