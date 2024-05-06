import { BigNumber } from "ethers";

export const estimateBuyLPAmountDesired = (
    reserve0: BigNumber,
    reserve1: BigNumber,
    totalSupply: BigNumber,
    expectedAmountOut: BigNumber
) => {
    const amount0Desired = expectedAmountOut
        .mul(reserve0)
        .div(totalSupply);
    const amount1Desired = expectedAmountOut
        .mul(reserve1)
        .div(totalSupply);
    return {
        amount0Desired,
        amount1Desired
    };
};
