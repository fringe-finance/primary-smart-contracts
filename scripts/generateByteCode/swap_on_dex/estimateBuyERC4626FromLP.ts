import { BigNumberish } from "ethers";
import { ERC4626_ABI } from "../abis/ERC4626";
import { Dex } from "../enum/dexType";
import { Pair } from "../enum/pairType";
import { loadContractInstance } from "../utils/loadContract";
import { estimateBuyERC20FromLP } from "./estimateBuyERC20FromLP";
import { toBN } from "../utils/helpers";

export const estimateBuyERC4626FromLP = async (
    lpAddress: string,
    erc4626Address: string,
    erc4626ExpectedAmount: BigNumberish,
    receiver: string,
    maxDiscrepancy: string,
    chainId: string,
    dexType: Dex,
    pairType: Pair,
    provider: any
) => {
    const erc4626Instance = loadContractInstance(erc4626Address, ERC4626_ABI, provider);
    const erc20Address = await erc4626Instance.asset();
    const erc20ExpectedAmount = await erc4626Instance.convertToAssets(erc4626ExpectedAmount);
    
    return estimateBuyERC20FromLP(
      lpAddress,
      erc20Address,
      toBN(erc20ExpectedAmount),
      receiver,
      maxDiscrepancy,
      chainId,
      dexType,
      pairType,
      provider
    )
};
