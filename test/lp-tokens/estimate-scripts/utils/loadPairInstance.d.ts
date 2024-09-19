import { Contract } from "ethers";
import { Pair } from "../enum/pairType";
export declare const loadPairInstance: (pair: string, type: Pair, signerOrProvider: any) => Contract;
