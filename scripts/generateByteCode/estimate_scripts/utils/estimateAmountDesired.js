"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateAmountDesired = void 0;
const estimateAmountDesired = (reserve0, reserve1, balance0, balance1, totalSupply, expectedAmountOut) => {
    const amount0Desired = ((expectedAmountOut.mul(reserve0).mul(reserve1)).add(reserve0.mul(reserve1).mul(totalSupply)).sub(reserve0.mul(balance1).mul(totalSupply))).div(reserve1.mul(totalSupply));
    const amount1Desired = ((expectedAmountOut.mul(reserve0).mul(reserve1)).add(reserve0.mul(reserve1).mul(totalSupply)).sub(reserve1.mul(balance0).mul(totalSupply))).div(reserve0.mul(totalSupply));
    return {
        amount0Desired,
        amount1Desired
    };
};
exports.estimateAmountDesired = estimateAmountDesired;
