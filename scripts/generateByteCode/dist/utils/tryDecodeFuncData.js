"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryDecodeFuncData = void 0;
const tryDecodeFuncData = (data, abi, iface) => {
    for (let i = 0; i < abi.length; i++) {
        try {
            return iface.decodeFunctionData(abi[i].name, data).desc.guaranteedAmount;
        }
        catch (error) {
            continue;
        }
    }
    return 0;
};
exports.tryDecodeFuncData = tryDecodeFuncData;
