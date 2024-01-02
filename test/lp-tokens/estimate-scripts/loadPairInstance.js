"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPairInstance = void 0;
const pairType_1 = require("./pairType");
const loadContract_1 = require("./loadContract");
const UniswapV2Pair_1 = require("./abis/UniswapV2Pair");
const MuteSwitchPairDynamic_1 = require("./abis/MuteSwitchPairDynamic");
const loadPairInstance = (pair, type, signer) => {
    if (type === pairType_1.Pair.Uniswap) {
        return (0, loadContract_1.loadContractInstance)(pair, UniswapV2Pair_1.UniswapV2Pair_ABI, signer);
    }
    else if (type === pairType_1.Pair.Mute) {
        return (0, loadContract_1.loadContractInstance)(pair, MuteSwitchPairDynamic_1.MuteSwitchPairDynamic_ABI, signer);
    }
};
exports.loadPairInstance = loadPairInstance;
