"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateSellLPAmountDesired = exports.estimateBuyLPAmountDesired = void 0;
const estimateBuyLPAmountDesired = (reserve0, reserve1, totalSupply, expectedAmountOut) => {
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
exports.estimateBuyLPAmountDesired = estimateBuyLPAmountDesired;
const estimateSellLPAmountDesired = (reserve0, reserve1, totalSupply, amountIn) => {
    const amount0Desired = amountIn
        .mul(reserve0)
        .div(totalSupply);
    const amount1Desired = amountIn
        .mul(reserve1)
        .div(totalSupply);
    return {
        amount0Desired,
        amount1Desired
    };
};
exports.estimateSellLPAmountDesired = estimateSellLPAmountDesired;
