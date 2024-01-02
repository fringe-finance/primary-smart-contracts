import { Contract } from "ethers";
import { MuteSwitchPairDynamic_ABI } from "../abis/MuteSwitchPairDynamic";
import { UniswapV2Pair_ABI } from "../abis/UniswapV2Pair";
import { Pair } from "../enum/pairType";
import { loadContractInstance } from "./loadContract";

export const loadPairInstance = (pair: string, type: Pair, signerOrProvider: any): Contract | undefined => {
    if (type === Pair.Uniswap) {
        return loadContractInstance(pair, UniswapV2Pair_ABI, signerOrProvider);
    } else if (type === Pair.Mute) {
        return loadContractInstance(pair, MuteSwitchPairDynamic_ABI, signerOrProvider);
    }
};
