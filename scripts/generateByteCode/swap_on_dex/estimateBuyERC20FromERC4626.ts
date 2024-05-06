import { BigNumberish, utils } from "ethers";
import { ERC4626_ABI } from "../abis/ERC4626";
import { Dex } from "../enum/dexType";
import { loadContractInstance } from "../utils/loadContract";
import { toBN } from "../utils/helpers";
import { buyOnDex } from "../dex_common/buyOnDex";
import { ERC20_ABI } from "../abis/ERC20";
import { getMaxDiscrepancyAmount } from "../utils/getMaxDiscrepancyAmount";


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
  const erc20Instance = loadContractInstance(erc20Address, ERC20_ABI, provider);
  const erc20Decimals = await erc20Instance.decimals();

  const erc4626Instance = loadContractInstance(erc4626Address, ERC4626_ABI, provider);
  const erc4626AssetAddress = await erc4626Instance.asset();
  const assetInstance = loadContractInstance(erc4626AssetAddress, ERC20_ABI, provider);
  const assetDecimals = await assetInstance.decimals();

  const erc20AcceptableAmount = getMaxDiscrepancyAmount(toBN(erc20ExpectedAmount), maxDiscrepancy);
  if (erc20Address.toLowerCase() === erc4626AssetAddress.toLowerCase()) {
    const estimateAmountIn = await erc4626Instance.convertToShares(erc20AcceptableAmount)
    return {
      tokenIn: erc20Address,
      tokenOut: erc4626Address,
      estimateAmountIn: toBN(estimateAmountIn),
      expectedAmountOut: erc20ExpectedAmount,
      buyCallData: [],
    }
  } else {
    const estimation = await buyOnDex(
      erc4626AssetAddress,
      assetDecimals,
      erc20Address,
      erc20Decimals,
      erc20AcceptableAmount,
      dexType,
      receiver,
      chainId,
      maxDiscrepancy
    );

    const estimateAmountIn = await erc4626Instance.convertToShares(estimation.amountIn)
      
    return {
      tokenIn: erc20Address,
      estimateAmountIn: toBN(estimateAmountIn),
      tokenOut: erc4626Address,
      expectedAmountOut: erc20ExpectedAmount,
      buyCallData: [estimation.buyCallData],
    };
  }
  
};
