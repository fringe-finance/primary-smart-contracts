import { BigNumber } from "ethers";
export declare const estimateBuyLPAmountDesired: (reserve0: BigNumber, reserve1: BigNumber, totalSupply: BigNumber, expectedAmountOut: BigNumber) => {
    amount0Desired: BigNumber;
    amount1Desired: BigNumber;
};
