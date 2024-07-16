"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateSell = exports.estimateBuy = void 0;
const tokenType_1 = require("./enum/tokenType");
const pairType_1 = require("./enum/pairType");
const estimateBuyLPFromERC20_1 = require("./swap_on_dex/estimateBuyLPFromERC20");
const estimateBuyERC20FromLP_1 = require("./swap_on_dex/estimateBuyERC20FromLP");
const estimateBuyERC4626FromERC20_1 = require("./swap_on_dex/estimateBuyERC4626FromERC20");
const estimateBuyERC20FromERC4626_1 = require("./swap_on_dex/estimateBuyERC20FromERC4626");
const estimateBuyERC4626FromLP_1 = require("./swap_on_dex/estimateBuyERC4626FromLP");
const estimateBuyLPFromERC4626_1 = require("./swap_on_dex/estimateBuyLPFromERC4626");
const estimateBuyERC20FromERC20_1 = require("./swap_on_dex/estimateBuyERC20FromERC20");
const estimateBuyERC4626FromERC4626_1 = require("./swap_on_dex/estimateBuyERC4626FromERC4626");
const estimateSellERC20ToLP_1 = require("./swap_on_dex/estimateSellERC20ToLP");
const estimateSellLPToERC20_1 = require("./swap_on_dex/estimateSellLPToERC20");
const estimateSellERC20ToERC4626_1 = require("./swap_on_dex/estimateSellERC20ToERC4626");
const estimateSellERC4626ToERC20_1 = require("./swap_on_dex/estimateSellERC4626ToERC20");
const estimateSellLPToERC4626_1 = require("./swap_on_dex/estimateSellLPToERC4626");
const estimateSellERC4626ToLP_1 = require("./swap_on_dex/estimateSellERC4626ToLP");
const estimateSellERC4626ToERC4626_1 = require("./swap_on_dex/estimateSellERC4626ToERC4626");
const estimateSellERC20ToERC20_1 = require("./swap_on_dex/estimateSellERC20ToERC20");
;
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
const estimateBuy = (tokenIn, tokenOut, expectedAmountOut, receiver, maxDiscrepancy, chainId, dexType, provider) => {
    var _a, _b, _c, _d;
    if (tokenIn.tokenType === tokenType_1.TokenType.ERC20 && tokenOut.tokenType === tokenType_1.TokenType.LP) {
        return (0, estimateBuyLPFromERC20_1.estimateBuyLPFromERC20)(tokenIn.address, tokenOut.address, expectedAmountOut, receiver, maxDiscrepancy, chainId, dexType, (_a = tokenOut.pairType) !== null && _a !== void 0 ? _a : pairType_1.Pair.Uniswap, provider);
    }
    if (tokenIn.tokenType === tokenType_1.TokenType.LP && tokenOut.tokenType === tokenType_1.TokenType.ERC20) {
        return (0, estimateBuyERC20FromLP_1.estimateBuyERC20FromLP)(tokenIn.address, tokenOut.address, expectedAmountOut, receiver, maxDiscrepancy, chainId, dexType, (_b = tokenIn.pairType) !== null && _b !== void 0 ? _b : pairType_1.Pair.Uniswap, provider);
    }
    if (tokenIn.tokenType === tokenType_1.TokenType.ERC20 && tokenOut.tokenType === tokenType_1.TokenType.ERC4626) {
        return (0, estimateBuyERC4626FromERC20_1.estimateBuyERC4626FromERC20)(tokenIn.address, tokenOut.address, expectedAmountOut, receiver, maxDiscrepancy, chainId, dexType, provider);
    }
    if (tokenIn.tokenType === tokenType_1.TokenType.ERC4626 && tokenOut.tokenType === tokenType_1.TokenType.ERC20) {
        return (0, estimateBuyERC20FromERC4626_1.estimateBuyERC20FromERC4626)(tokenIn.address, tokenOut.address, expectedAmountOut, receiver, maxDiscrepancy, chainId, dexType, provider);
    }
    if (tokenIn.tokenType === tokenType_1.TokenType.LP && tokenOut.tokenType === tokenType_1.TokenType.ERC4626) {
        return (0, estimateBuyERC4626FromLP_1.estimateBuyERC4626FromLP)(tokenIn.address, tokenOut.address, expectedAmountOut, receiver, maxDiscrepancy, chainId, dexType, (_c = tokenIn.pairType) !== null && _c !== void 0 ? _c : pairType_1.Pair.Uniswap, provider);
    }
    if (tokenIn.tokenType === tokenType_1.TokenType.ERC4626 && tokenOut.tokenType === tokenType_1.TokenType.LP) {
        return (0, estimateBuyLPFromERC4626_1.estimateBuyLPFromERC4626)(tokenIn.address, tokenOut.address, expectedAmountOut, receiver, maxDiscrepancy, chainId, dexType, (_d = tokenOut.pairType) !== null && _d !== void 0 ? _d : pairType_1.Pair.Uniswap, provider);
    }
    if (tokenIn.tokenType === tokenType_1.TokenType.ERC4626 && tokenOut.tokenType === tokenType_1.TokenType.ERC4626) {
        return (0, estimateBuyERC4626FromERC4626_1.estimateBuyERC4626FromERC4626)(tokenIn.address, tokenOut.address, expectedAmountOut, receiver, maxDiscrepancy, chainId, dexType, provider);
    }
    if (tokenIn.tokenType === tokenType_1.TokenType.ERC20 && tokenOut.tokenType === tokenType_1.TokenType.ERC20) {
        return (0, estimateBuyERC20FromERC20_1.estimateBuyERC20FromERC20)(tokenIn.address, tokenOut.address, expectedAmountOut, receiver, maxDiscrepancy, chainId, dexType, provider);
    }
    throw new Error("Not implementation");
};
exports.estimateBuy = estimateBuy;
const estimateSell = (tokenIn, tokenOut, amountIn, maxDiscrepancy, receiver, chainId, dexType, provider) => {
    var _a, _b, _c, _d;
    if (tokenIn.tokenType === tokenType_1.TokenType.ERC20 && tokenOut.tokenType === tokenType_1.TokenType.LP) {
        return (0, estimateSellERC20ToLP_1.estimateSellERC20ToLP)(tokenIn.address, tokenOut.address, (_a = tokenOut.pairType) !== null && _a !== void 0 ? _a : pairType_1.Pair.Uniswap, amountIn, maxDiscrepancy, receiver, chainId, dexType, provider);
    }
    if (tokenIn.tokenType === tokenType_1.TokenType.LP && tokenOut.tokenType === tokenType_1.TokenType.ERC20) {
        return (0, estimateSellLPToERC20_1.estimateSellLPToERC20)(tokenIn.address, (_b = tokenIn.pairType) !== null && _b !== void 0 ? _b : pairType_1.Pair.Uniswap, tokenOut.address, amountIn, maxDiscrepancy, receiver, chainId, dexType, provider);
    }
    if (tokenIn.tokenType === tokenType_1.TokenType.ERC20 && tokenOut.tokenType === tokenType_1.TokenType.ERC4626) {
        return (0, estimateSellERC20ToERC4626_1.estimateSellERC20ToERC4626)(tokenIn.address, tokenOut.address, amountIn, maxDiscrepancy, receiver, chainId, dexType, provider);
    }
    if (tokenIn.tokenType === tokenType_1.TokenType.ERC4626 && tokenOut.tokenType === tokenType_1.TokenType.ERC20) {
        return (0, estimateSellERC4626ToERC20_1.estimateSellERC4626ToERC20)(tokenIn.address, tokenOut.address, amountIn, maxDiscrepancy, receiver, chainId, dexType, provider);
    }
    if (tokenIn.tokenType === tokenType_1.TokenType.LP && tokenOut.tokenType === tokenType_1.TokenType.ERC4626) {
        return (0, estimateSellLPToERC4626_1.estimateSellLPToERC4626)(tokenIn.address, (_c = tokenIn.pairType) !== null && _c !== void 0 ? _c : pairType_1.Pair.Uniswap, tokenOut.address, amountIn, maxDiscrepancy, receiver, chainId, dexType, provider);
    }
    if (tokenIn.tokenType === tokenType_1.TokenType.ERC4626 && tokenOut.tokenType === tokenType_1.TokenType.LP) {
        return (0, estimateSellERC4626ToLP_1.estimateSellERC4626ToLP)(tokenIn.address, tokenOut.address, (_d = tokenOut.pairType) !== null && _d !== void 0 ? _d : pairType_1.Pair.Uniswap, amountIn, maxDiscrepancy, receiver, chainId, dexType, provider);
    }
    if (tokenIn.tokenType === tokenType_1.TokenType.ERC4626 && tokenOut.tokenType === tokenType_1.TokenType.ERC4626) {
        return (0, estimateSellERC4626ToERC4626_1.estimateSellERC4626ToERC4626)(tokenIn.address, tokenOut.address, amountIn, maxDiscrepancy, receiver, chainId, dexType, provider);
    }
    if (tokenIn.tokenType === tokenType_1.TokenType.ERC20 && tokenOut.tokenType === tokenType_1.TokenType.ERC20) {
        return (0, estimateSellERC20ToERC20_1.estimateSellERC20ToERC20)(tokenIn.address, tokenOut.address, amountIn, maxDiscrepancy, receiver, chainId, dexType, provider);
    }
    throw new Error("Not implementation");
};
exports.estimateSell = estimateSell;
