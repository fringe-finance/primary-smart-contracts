"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signer = exports.provider = void 0;
require("dotenv/config");
const ethers_1 = require("ethers");
exports.provider = new ethers_1.ethers.providers.JsonRpcProvider(process.env.RPC);
exports.signer = new ethers_1.ethers.Wallet(process.env.PRIVATE_KEY, exports.provider);
