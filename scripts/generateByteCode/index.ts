import { BigNumberish } from "ethers";
import { TokenType } from "./enum/tokenType";
import { Dex } from "./enum/dexType";
import { Pair } from "./enum/pairType";
import { estimateBuyLPFromERC20 } from "./swap_on_dex/estimateBuyLPFromERC20";
import { estimateBuyERC20FromLP } from "./swap_on_dex/estimateBuyERC20FromLP";
import { estimateBuyERC4626FromERC20 } from "./swap_on_dex/estimateBuyERC4626FromERC20";
import { estimateBuyERC20FromERC4626 } from "./swap_on_dex/estimateBuyERC20FromERC4626";
import { estimateBuyERC4626FromLP } from "./swap_on_dex/estimateBuyERC4626FromLP";
import { estimateBuyLPFromERC4626 } from "./swap_on_dex/estimateBuyLPFromERC4626";
import { estimateBuyERC20FromERC20 } from "./swap_on_dex/estimateBuyERC20FromERC20";
import { estimateBuyERC4626FromERC4626 } from "./swap_on_dex/estimateBuyERC4626FromERC4626";

interface Token { address: string, tokenType: TokenType, pairType?: Pair };

/**
 * The `estimate` function calculates the estimated amount of a token output
 * @param {Token} tokenIn - `tokenIn` is the token being swapped from. It is of type `Token`.
 * @param {Token} tokenOut - The `tokenOut` is the token that will be received as output from
 * the trade. It is of type `Token` and is one of the input parameters for estimating a trade.
 * @param {BigNumberish} expectedAmountOut - The `expectedAmountOut` is the amount of the
 * `tokenOut` that you expect to receive in the trade.
 * @param {string} receiver - The `receiver` is the address of the recipient who will receive the
 * output tokens after the swap is executed.
 * @param {string} maxDiscrepancy - The `maxDiscrepancy` is used to specify the maximum allowed
 * difference between the expected output amount and the actual output amount during the estimation
 * process. It helps in handling slippage and ensuring that the estimated trade is within an acceptable
 * range of deviation from the
 * @param {string} chainId - The `chainId` is used to specify the blockchain network ID in integer on
 * which the transaction will be executed. Such as Ethereum Mainnet (chainId: "1")
 * @param {Dex} dexType - The `dexType` is the type of decentralized exchange (DEX) that will be used for
 * the token swap.
 * @param {any} provider - The `provider is used to specify the provider for interacting with the blockchain.
 */
export const estimate = (
  tokenIn: Token,
  tokenOut: Token,
  expectedAmountOut: BigNumberish,
  receiver: string,
  maxDiscrepancy: string,
  chainId: string,
  dexType: Dex,
  provider: any
) => {
  if (tokenIn.tokenType === TokenType.ERC20 && tokenOut.tokenType === TokenType.LP) {
    return estimateBuyLPFromERC20(
      tokenIn.address,
      tokenOut.address,
      expectedAmountOut,
      receiver,
      maxDiscrepancy,
      chainId,
      dexType,
      tokenOut.pairType ?? Pair.Uniswap,
      provider
    )
  }
  if (tokenIn.tokenType === TokenType.LP && tokenOut.tokenType === TokenType.ERC20) {
    return estimateBuyERC20FromLP(
      tokenIn.address,
      tokenOut.address,
      expectedAmountOut,
      receiver,
      maxDiscrepancy,
      chainId,
      dexType,
      tokenIn.pairType ?? Pair.Uniswap,
      provider
    )
  }
  if (tokenIn.tokenType === TokenType.ERC20 && tokenOut.tokenType === TokenType.ERC4626) {
    return estimateBuyERC4626FromERC20(
      tokenIn.address,
      tokenOut.address,
      expectedAmountOut,
      receiver,
      maxDiscrepancy,
      chainId,
      dexType,
      provider
    )
  }
  if (tokenIn.tokenType === TokenType.ERC4626 && tokenOut.tokenType === TokenType.ERC20) {
    return estimateBuyERC20FromERC4626(
      tokenIn.address,
      tokenOut.address,
      expectedAmountOut,
      receiver,
      maxDiscrepancy,
      chainId,
      dexType,
      provider
    )
  }
  if (tokenIn.tokenType === TokenType.LP && tokenOut.tokenType === TokenType.ERC4626) {
    return estimateBuyERC4626FromLP(
      tokenIn.address,
      tokenOut.address,
      expectedAmountOut,
      receiver,
      maxDiscrepancy,
      chainId,
      dexType,
      tokenIn.pairType ?? Pair.Uniswap,
      provider
    )
  }
  if (tokenIn.tokenType === TokenType.ERC4626 && tokenOut.tokenType === TokenType.LP) {
    return estimateBuyLPFromERC4626(
      tokenIn.address,
      tokenOut.address,
      expectedAmountOut,
      receiver,
      maxDiscrepancy,
      chainId,
      dexType,
      tokenOut.pairType ?? Pair.Uniswap,
      provider
    )
  }
  if (tokenIn.tokenType === TokenType.ERC4626 && tokenOut.tokenType === TokenType.ERC4626) {
    return estimateBuyERC4626FromERC4626(
      tokenIn.address,
      tokenOut.address,
      expectedAmountOut,
      receiver,
      maxDiscrepancy,
      chainId,
      dexType,
      provider
    )
  }
  if (tokenIn.tokenType === TokenType.ERC20 && tokenOut.tokenType === TokenType.ERC20) {
    return estimateBuyERC20FromERC20(
      tokenIn.address,
      tokenOut.address,
      expectedAmountOut,
      receiver,
      maxDiscrepancy,
      chainId,
      dexType,
      provider
    )
  }
  
  throw new Error("Not implementation")
}