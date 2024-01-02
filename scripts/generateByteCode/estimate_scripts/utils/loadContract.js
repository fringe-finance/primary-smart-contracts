"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadContractInstance = void 0;
const ethers_1 = require("ethers");
const loadContractInstance = (address, abi, signerOrProvider) => {
    return new ethers_1.ethers.Contract(address, new ethers_1.ethers.utils.Interface(abi), signerOrProvider);
};
exports.loadContractInstance = loadContractInstance;
