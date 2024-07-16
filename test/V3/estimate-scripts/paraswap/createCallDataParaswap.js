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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCallDataParaswap = void 0;
const axios_1 = __importDefault(require("axios"));
const getPriceOnParaswap_1 = require("./getPriceOnParaswap");
const baseURL = "https://apiv5.paraswap.io";
const createCallDataParaswap = (srcToken_1, srcDecimals_1, destToken_1, destDecimals_1, amountTokenBN_1, ...args_1) => __awaiter(void 0, [srcToken_1, srcDecimals_1, destToken_1, destDecimals_1, amountTokenBN_1, ...args_1], void 0, function* (srcToken, srcDecimals, destToken, destDecimals, amountTokenBN, side = "BUY", { chainId = 1, account }, maxDiscrepancy = "0.05") {
    var _a, _b;
    try {
        const priceData = yield (0, getPriceOnParaswap_1.getPriceOnParaswap)(srcToken, srcDecimals, destToken, destDecimals, amountTokenBN, side, +chainId);
        const slippage = Math.round(Number(maxDiscrepancy) * 10000);
        const txDataBody = Object.assign(Object.assign({}, priceData), { srcToken,
            destToken,
            slippage, [side === "BUY" ? `destAmount` : `srcAmount`]: amountTokenBN, userAddress: account });
        const { data: txData } = yield axios_1.default.post(`${baseURL}/transactions/${+chainId}/`, txDataBody, {
            params: { ignoreChecks: true }
        });
        const amount = side === "SELL" ? priceData.priceRoute.destAmount : priceData.priceRoute.srcAmount;
        return {
            data: txData.data ? txData.data : "",
            amount: amount ? amount : 0
        };
    }
    catch (error) {
        if ((_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error)
            throw new Error(error.response.data.error);
        throw error;
    }
});
exports.createCallDataParaswap = createCallDataParaswap;
