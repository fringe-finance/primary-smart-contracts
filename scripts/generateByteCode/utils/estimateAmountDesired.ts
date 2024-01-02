import { BigNumber } from "ethers";

export const estimateBuyLPAmountDesired = (
    reserve0: BigNumber,
    reserve1: BigNumber,
    balance0: BigNumber,
    balance1: BigNumber,
    totalSupply: BigNumber,
    expectedAmountOut: BigNumber
) => {
    const amount0Desired = expectedAmountOut
        .mul(reserve0)
        .mul(reserve1)
        .add(reserve0.mul(reserve1).mul(totalSupply))
        .sub(reserve0.mul(balance1).mul(totalSupply))
        .div(reserve1.mul(totalSupply));
    const amount1Desired = expectedAmountOut
        .mul(reserve0)
        .mul(reserve1)
        .add(reserve0.mul(reserve1).mul(totalSupply))
        .sub(reserve1.mul(balance0).mul(totalSupply))
        .div(reserve0.mul(totalSupply));
    return {
        amount0Desired,
        amount1Desired
    };
};
