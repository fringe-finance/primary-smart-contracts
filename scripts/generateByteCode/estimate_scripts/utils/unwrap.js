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
exports.unwrap = void 0;
const loadContract_1 = require("./loadContract");
const ERC20_1 = require("../abis/ERC20");
const helpers_1 = require("./helpers");
const loadPairInstance_1 = require("./loadPairInstance");
const unwrap = (pair, amount, pairType, signerOrProvider) => __awaiter(void 0, void 0, void 0, function* () {
    const pairInstance = (0, loadPairInstance_1.loadPairInstance)(pair, pairType, signerOrProvider);
    const token0 = yield (pairInstance === null || pairInstance === void 0 ? void 0 : pairInstance.token0());
    const token1 = yield (pairInstance === null || pairInstance === void 0 ? void 0 : pairInstance.token1());
    const totalSupply = yield (pairInstance === null || pairInstance === void 0 ? void 0 : pairInstance.totalSupply());
    const token0Instance = (0, loadContract_1.loadContractInstance)(token0, ERC20_1.ERC20_ABI, signerOrProvider);
    const balance0 = yield token0Instance.balanceOf(pair);
    const token1Instance = (0, loadContract_1.loadContractInstance)(token1, ERC20_1.ERC20_ABI, signerOrProvider);
    const balance1 = yield token1Instance.balanceOf(pair);
    const token0Decimals = yield token0Instance.decimals();
    const token1Decimals = yield token1Instance.decimals();
    return {
        token0,
        token0Decimals,
        amount0: (0, helpers_1.toBN)(amount).mul(balance0).div(totalSupply),
        token1,
        token1Decimals,
        amount1: (0, helpers_1.toBN)(amount).mul(balance1).div(totalSupply)
    };
});
exports.unwrap = unwrap;
