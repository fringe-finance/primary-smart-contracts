"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMaxDiscrepancyAmount = void 0;
const helpers_1 = require("./helpers");
const getMaxDiscrepancyAmount = (actualAmountOut, maxDiscrepancy) => {
    let maxDiscrepancyLen = maxDiscrepancy.length;
    let numerator = (Number(maxDiscrepancy) * 10 ** (maxDiscrepancyLen - 2) +
        10 ** (maxDiscrepancyLen - 2)).toString();
    let denominator = (10 ** (maxDiscrepancyLen - 2)).toString();
    return actualAmountOut.add(actualAmountOut.mul((0, helpers_1.toBN)(numerator)).div((0, helpers_1.toBN)(denominator)).sub(actualAmountOut));
};
exports.getMaxDiscrepancyAmount = getMaxDiscrepancyAmount;
