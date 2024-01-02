"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDataLeverageBorrow = exports.createDataRepayAtomic = void 0;
const estimateBuyERC20FromLP_1 = require("./swap_on_dex/estimateBuyERC20FromLP");
const estimateBuyLPFromERC20_1 = require("./swap_on_dex/estimateBuyLPFromERC20");
const sellExactERC20ForLP_1 = require("./swap_on_dex/sellExactERC20ForLP");
const sellExactLPForERC20_1 = require("./swap_on_dex/sellExactLPForERC20");
exports.createDataRepayAtomic = {
    buy_erc20_from_lp: estimateBuyERC20FromLP_1.estimateBuyERC20FromLP,
    buy_lp_from_erc20: estimateBuyLPFromERC20_1.estimateBuyLPFromERC20,
};
exports.createDataLeverageBorrow = {
    sell_exact_lp_for_erc20: sellExactLPForERC20_1.sellExactLPForERC20,
    sell_exact_erc20_for_lp: sellExactERC20ForLP_1.sellExactERC20ForLP,
};
