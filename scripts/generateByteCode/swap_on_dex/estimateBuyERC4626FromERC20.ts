import { BigNumberish, utils } from "ethers";
import { ERC4626_ABI } from "../abis/ERC4626";
import { Dex } from "../enum/dexType";
import { Pair } from "../enum/pairType";
import { loadContractInstance } from "../utils/loadContract";
import { estimateBuyERC20FromLP } from "./estimateBuyERC20FromLP";
import { toBN } from "../utils/helpers";
import { buyOnDex } from "../dex_common/buyOnDex";
import { ERC20_ABI } from "../abis/ERC20";
import { loadMulticallInstance } from "../utils/loadMulticallInstance";
import { ContractCallContext, ContractCallResults } from "ethereum-multicall";

enum CONTRACT_NAME {
  ERC_4626_TOKEN = "ERC-4626_Token",
  ERC_4626_ASSET = "ERC-4626_Asset",
  ERC20 = "ERC-20_Token"
}

enum METHOD_NAME {
  DECIMALS = "decimals",
  CONVERT_TO_ASSET = "convertToAssets",
}

const decodeTokensInfo = async (erc4626Address: string, erc4626ExpectedAmount: BigNumberish, erc20Address: string, provider: any) => {
    const erc4626Instance = loadContractInstance(erc4626Address, ERC4626_ABI, provider);
    const erc4626Asset = await erc4626Instance.asset();

    const multicall = loadMulticallInstance(provider);
    const requests: ContractCallContext[] = [
      {
        reference: CONTRACT_NAME.ERC_4626_ASSET,
        contractAddress: erc4626Asset,
        abi: ERC20_ABI,
        calls: [
          {
            reference: METHOD_NAME.DECIMALS,
            methodName: METHOD_NAME.DECIMALS,
            methodParameters: []
          },
        ]
      },
      {
        reference: CONTRACT_NAME.ERC20,
        contractAddress: erc20Address,
        abi: ERC20_ABI,
        calls: [
          {
            reference: METHOD_NAME.DECIMALS,
            methodName: METHOD_NAME.DECIMALS,
            methodParameters: []
          },
        ]
      },
      {
        reference: CONTRACT_NAME.ERC_4626_TOKEN,
        contractAddress: erc4626Address,
        abi: ERC4626_ABI,
        calls: [
          {
            reference: METHOD_NAME.CONVERT_TO_ASSET,
            methodName: METHOD_NAME.CONVERT_TO_ASSET,
            methodParameters: [erc4626ExpectedAmount]
          },
        ]
      }
    ];
    const responses: ContractCallResults = await multicall.call(requests);
    const erc20Decimals = responses.results[CONTRACT_NAME.ERC20].callsReturnContext[0].returnValues[0];
    const assetDecimals = responses.results[CONTRACT_NAME.ERC_4626_ASSET].callsReturnContext[0].returnValues[0];
    const erc20AssetExpectedAmount = responses.results[CONTRACT_NAME.ERC_4626_TOKEN].callsReturnContext[0].returnValues[0];
    
    return {
      erc20Decimals,
      erc4626Asset,
      assetDecimals,
      erc20AssetExpectedAmount: toBN(erc20AssetExpectedAmount?.hex || 0),
    }
};

export const estimateBuyERC4626FromERC20 = async (
    erc20Address: string,
    erc4626Address: string,
    erc4626ExpectedAmount: BigNumberish,
    receiver: string,
    maxDiscrepancy: string,
    chainId: string,
    dexType: Dex,
    provider: any
) => {
  const erc4626Instance = loadContractInstance(erc4626Address, ERC4626_ABI, provider);
  const { erc4626Asset, assetDecimals, erc20Decimals, erc20AssetExpectedAmount } = await decodeTokensInfo(erc4626Address, erc4626ExpectedAmount, erc20Address, provider)
  if (erc20Address.toLowerCase() === erc4626Asset.toLowerCase()) {
    const estimateAmountIn = await erc4626Instance.convertToAssets(erc4626ExpectedAmount)
    return {
      tokenIn: erc20Address,
      tokenOut: erc4626Address,
      estimateAmountIn: toBN(estimateAmountIn),
      expectedAmountOut: erc4626ExpectedAmount,
      buyCallData: [],
    }
  } else {
    const estimation = await buyOnDex(
      erc20Address,
      erc20Decimals,
      erc4626Asset,
      assetDecimals,
      erc20AssetExpectedAmount,
      dexType,
      receiver,
      chainId,
      maxDiscrepancy
    );
      
    return {
      tokenIn: erc20Address,
      estimateAmountIn: toBN(estimation.amountIn),
      tokenOut: erc4626Address,
      expectedAmountOut: erc4626ExpectedAmount,
      buyCallData: [estimation.buyCallData],
  };
  }
  
};
