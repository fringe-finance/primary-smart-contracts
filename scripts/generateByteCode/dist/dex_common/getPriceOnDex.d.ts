import { BigNumber, BigNumberish } from "ethers";
import { Dex } from "../enum/dexType";
export declare const getPriceOnDex: (tokenIn: string, tokenInDecimals: number, tokenInAmount: BigNumberish, tokenOut: string, tokenOutDecimals: number, dex: Dex, chainId: string) => Promise<BigNumber>;
