"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMulticallInstance = void 0;
const ethereum_multicall_1 = require("ethereum-multicall");
const loadMulticallInstance = (provider) => {
    const multicall = new ethereum_multicall_1.Multicall({ multicallCustomContractAddress: "0xcA11bde05977b3631167028862bE2a173976CA11", ethersProvider: provider, tryAggregate: true });
    return multicall;
};
exports.loadMulticallInstance = loadMulticallInstance;
