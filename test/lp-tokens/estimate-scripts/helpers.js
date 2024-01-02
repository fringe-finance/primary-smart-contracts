"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateAmountDesired = exports.getDiscrepancyAmount = exports.checkDiscrepancy = exports.toBN = void 0;
const ethers_1 = require("ethers");
exports.toBN = ethers_1.BigNumber.from;
const checkDiscrepancy = (expectedAmountOut, actualAmountOut, maxDiscrepancy) => {
    let discrepancy = actualAmountOut.sub(expectedAmountOut);
    let maxDiscrepancyLen = maxDiscrepancy.length;
    let numerator = (Number(maxDiscrepancy) * 10 ** (maxDiscrepancyLen - 2) + 10 ** (maxDiscrepancyLen - 2)).toString();
    let denominator = (10 ** (maxDiscrepancyLen - 2)).toString();
    return (discrepancy.gte((0, exports.toBN)(0)) &&
        discrepancy.lte(((expectedAmountOut.mul((0, exports.toBN)(numerator))).div((0, exports.toBN)(denominator))
            .sub(expectedAmountOut))));
};
exports.checkDiscrepancy = checkDiscrepancy;
const getDiscrepancyAmount = (actualAmountOut, maxDiscrepancy) => {
    let maxDiscrepancyLen = maxDiscrepancy.length;
    let numerator = (Number(maxDiscrepancy) * 10 ** (maxDiscrepancyLen - 2) + 10 ** (maxDiscrepancyLen - 2)).toString();
    let denominator = (10 ** (maxDiscrepancyLen - 2)).toString();
    return actualAmountOut.add((actualAmountOut.mul((0, exports.toBN)(numerator))).div((0, exports.toBN)(denominator)).sub(actualAmountOut));
};
exports.getDiscrepancyAmount = getDiscrepancyAmount;
const estimateAmountDesired = (reserve0, reserve1, balance0, balance1, totalSupply, expectedAmountOut) => {
    const amount0Desired = ((expectedAmountOut.mul(reserve0).mul(reserve1)).add(reserve0.mul(reserve1).mul(totalSupply)).sub(reserve0.mul(balance1).mul(totalSupply))).div(reserve1.mul(totalSupply));
    const amount1Desired = ((expectedAmountOut.mul(reserve0).mul(reserve1)).add(reserve0.mul(reserve1).mul(totalSupply)).sub(reserve1.mul(balance0).mul(totalSupply))).div(reserve0.mul(totalSupply));
    return {
        amount0Desired,
        amount1Desired
    };
};
exports.estimateAmountDesired = estimateAmountDesired;
