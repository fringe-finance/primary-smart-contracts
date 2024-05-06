import { BigNumberish, BigNumber } from "ethers";
import { toBN } from "../utils/helpers";
import { sellOnOpenOcean } from "./sellOnOpenOcean";

export const buyOnOpenOcean = async (
  tokenIn: string,
  tokenInDecimals: BigNumberish,
  tokenInAmount: BigNumberish,  // Only to estimate amount in
  tokenOut: string,
  expectedAmountOut: BigNumberish,
  receiver: string,
  chainId: string,
  maxDiscrepancy: string
): Promise<any> => {
  if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) {
      return {
          amountIn: BigNumber.from(expectedAmountOut),
          buyCallData: undefined
      }; 
  }

  const sellData = await sellOnOpenOcean(
      tokenIn,
      tokenInDecimals,
      tokenInAmount,
      tokenOut,
      receiver,
      chainId,
      "10"
  );
  
  if (
      sellData.amountOut.gte(expectedAmountOut) &&
      sellData.amountOut.lte(BigNumber.from(expectedAmountOut).mul(110).div(100))
  ) {
      return {
          amountIn: toBN(tokenInAmount),
          buyCallData: sellData.buyCallData
      };
  } else {
      const newTokenInAmount = sellData.amountOut.gte(expectedAmountOut) ?
        toBN(tokenInAmount).mul(expectedAmountOut).div(sellData.amountOut) :
        toBN(tokenInAmount).mul(expectedAmountOut).div(sellData.amountOut).mul(110).div(100)
      return await buyOnOpenOcean(
          tokenIn,
          tokenInDecimals,
          newTokenInAmount,
          tokenOut,
          expectedAmountOut,
          receiver,
          chainId,
          maxDiscrepancy
      );
  }
};
