"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimate = void 0;
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
;
const estimate = (tokenIn, tokenOut, expectedAmountOut, receiver, maxDiscrepancy, chainId, dexType, provider) => {
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
exports.estimate = estimate;
