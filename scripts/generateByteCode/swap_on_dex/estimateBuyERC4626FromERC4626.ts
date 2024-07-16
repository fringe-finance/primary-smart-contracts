import { BigNumberish, utils } from "ethers";
import { ERC4626_ABI } from "../abis/ERC4626";
import { Dex } from "../enum/dexType";
import { loadContractInstance } from "../utils/loadContract";
import { toBN } from "../utils/helpers";
import { buyOnDex } from "../dex_common/buyOnDex";
import { ERC20_ABI } from "../abis/ERC20";
import { estimateBuyERC4626FromERC20 } from "./estimateBuyERC4626FromERC20";


export const estimateBuyERC4626FromERC4626 = async (
    erc4626SrcAddress: string,
    erc4626DestAddress: string,
    expectedAmountOut: BigNumberish,
    receiver: string,
    maxDiscrepancy: string,
    chainId: string,
    dexType: Dex,
    provider: any
) => {
  const erc4626SrcInstance = loadContractInstance(erc4626SrcAddress, ERC4626_ABI, provider);
  const erc4626SrcAsset = await erc4626SrcInstance.asset();

  const estimation = await estimateBuyERC4626FromERC20(
    erc4626SrcAsset,
    erc4626DestAddress,
    expectedAmountOut,
    receiver,
    maxDiscrepancy,
    chainId,
    dexType,
    provider
  );

  const estimateAmountIn = await erc4626SrcInstance.convertToShares(estimation.estimateAmountIn);
  return {
    tokenIn: erc4626SrcAddress,
    estimateAmountIn: toBN(estimateAmountIn),
    tokenOut: erc4626DestAddress,
    expectedAmountOut: expectedAmountOut,
    buyCallData: estimation.buyCallData,
  };
};
