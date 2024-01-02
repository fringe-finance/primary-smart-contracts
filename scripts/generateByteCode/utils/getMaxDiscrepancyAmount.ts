import { BigNumber } from "ethers";
import { toBN } from "./helpers";

export const getMaxDiscrepancyAmount = (actualAmountOut: BigNumber, maxDiscrepancy: string): BigNumber => {
    let maxDiscrepancyLen = maxDiscrepancy.length;
    let numerator = (
        Number(maxDiscrepancy) * 10 ** (maxDiscrepancyLen - 2) +
        10 ** (maxDiscrepancyLen - 2)
    ).toString();
    let denominator = (10 ** (maxDiscrepancyLen - 2)).toString();
    return actualAmountOut.add(
        actualAmountOut.mul(toBN(numerator)).div(toBN(denominator)).sub(actualAmountOut)
    );
};
