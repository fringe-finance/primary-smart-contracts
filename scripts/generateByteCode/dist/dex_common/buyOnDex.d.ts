import { BigNumberish } from "ethers";
import { Dex } from "../enum/dexType";
export declare const buyOnDex: (tokenSrc: string, tokenSrcDecimals: number, tokenDest: string, tokenDestDecimals: number, tokenDestAmount: BigNumberish, swapOnDex: Dex, receiver: string, chainId: string, maxDiscrepancy?: string) => Promise<any>;
