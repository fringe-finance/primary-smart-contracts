"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sellExactERC20ForLP = void 0;
const ERC20_1 = require("../abis/ERC20");
const sellOnDex_1 = require("../dex_common/sellOnDex");
const loadContract_1 = require("../utils/loadContract");
const loadPairInstance_1 = require("../utils/loadPairInstance");
// FIXME:
const sellExactERC20ForLP = (tokenIn, amountIn, tokenOut, receiver, maxDiscrepancy, chainId, swapOnDex, pairType, signerOrProvider) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenInInstance = (0, loadContract_1.loadContractInstance)(tokenIn, ERC20_1.ERC20_ABI, signerOrProvider);
    const tokenInDecimals = yield tokenInInstance.decimals();
    const pairInstance = (0, loadPairInstance_1.loadPairInstance)(tokenOut, pairType, signerOrProvider);
    const { _reserve0, _reserve1 } = yield (pairInstance === null || pairInstance === void 0 ? void 0 : pairInstance.getReserves());
    const totalSupply = yield (pairInstance === null || pairInstance === void 0 ? void 0 : pairInstance.totalSupply());
    const token0 = yield (pairInstance === null || pairInstance === void 0 ? void 0 : pairInstance.token0());
    const token1 = yield (pairInstance === null || pairInstance === void 0 ? void 0 : pairInstance.token1());
    const token0Instance = (0, loadContract_1.loadContractInstance)(token0, ERC20_1.ERC20_ABI, signerOrProvider);
    const token0Decimals = yield token0Instance.decimals();
    const balance0 = yield token0Instance.balanceOf(tokenOut);
    const token1Instance = (0, loadContract_1.loadContractInstance)(token1, ERC20_1.ERC20_ABI, signerOrProvider);
    const token1Decimals = yield token1Instance.decimals();
    const balance1 = yield token1Instance.balanceOf(tokenOut);
    const sellData0 = yield (0, sellOnDex_1.sellOnDex)(tokenIn, tokenInDecimals, amountIn, token0, swapOnDex, receiver, chainId, signerOrProvider);
    const sellData1 = yield (0, sellOnDex_1.sellOnDex)(tokenIn, tokenInDecimals, amountIn, token1, swapOnDex, receiver, chainId, signerOrProvider);
});
exports.sellExactERC20ForLP = sellExactERC20ForLP;
