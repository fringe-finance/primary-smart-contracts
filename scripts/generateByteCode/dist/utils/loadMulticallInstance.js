"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMulticallInstance = void 0;
const ethereum_multicall_1 = require("ethereum-multicall");
const loadMulticallInstance = (provider) => {
    try {
        const multicall = new ethereum_multicall_1.Multicall({ ethersProvider: provider, tryAggregate: true });
        return multicall;
    }
    catch (_a) {
        const multicall = new ethereum_multicall_1.Multicall({ ethersProvider: provider, tryAggregate: true, multicallCustomContractAddress: "0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441" });
        return multicall;
    }
};
exports.loadMulticallInstance = loadMulticallInstance;
