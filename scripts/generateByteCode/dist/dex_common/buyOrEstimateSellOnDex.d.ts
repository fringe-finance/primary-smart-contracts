import { BigNumberish, BigNumber } from "ethers";
import { Dex } from "../enum/dexType";
export declare const buyOrEstimateSellOnDex: (tokenIn: string, tokenInDecimals: number, token0: string, token0Decimals: number, amount0Desired: BigNumberish, token1: string, token1Decimals: number, amount1Desired: BigNumberish, receiver: string, swapOnDex: Dex, chainId: string, maxDiscrepancy?: string) => Promise<{
    buyOrSellData0: {
        amountIn: BigNumber;
        buyCallData: any;
    };
    buyOrSellData1: {
        amountIn: BigNumberish;
        buyCallData: any;
    };
}>;
