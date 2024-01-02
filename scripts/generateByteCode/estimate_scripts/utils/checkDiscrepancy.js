"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDiscrepancy = void 0;
const helpers_1 = require("./helpers");
const checkDiscrepancy = (expectedAmountOut, actualAmountOut, maxDiscrepancy) => {
    let discrepancy = actualAmountOut.sub(expectedAmountOut);
    let maxDiscrepancyLen = maxDiscrepancy.length;
    let numerator = (Number(maxDiscrepancy) * 10 ** (maxDiscrepancyLen - 2) + 10 ** (maxDiscrepancyLen - 2)).toString();
    let denominator = (10 ** (maxDiscrepancyLen - 2)).toString();
    return (discrepancy.gte((0, helpers_1.toBN)(0)) &&
        discrepancy.lte(((expectedAmountOut.mul((0, helpers_1.toBN)(numerator))).div((0, helpers_1.toBN)(denominator))
            .sub(expectedAmountOut))));
};
exports.checkDiscrepancy = checkDiscrepancy;
