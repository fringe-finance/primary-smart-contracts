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
const baseURL = "https://apiv5.paraswap.io";
const createCallDataParaswap = (srcToken, srcDecimals, destToken, destDecimals, amountTokenBN, side = "BUY", { chainId = 1, account }) => __awaiter(void 0, void 0, void 0, function* () {
    const { data: priceData } = yield axios_1.default.get(`${baseURL}/prices/`, {
        params: {
            srcToken,
            srcDecimals,
            destDecimals,
            amount: amountTokenBN,
            destToken,
            side,
            network: +chainId,
        },
    });
    const txDataBody = Object.assign(Object.assign({}, priceData), { srcToken,
        destToken, slippage: "5", [side === "BUY" ? `destAmount` : `srcAmount`]: amountTokenBN, userAddress: account });
    const { data: txData } = yield axios_1.default.post(`${baseURL}/transactions/${+chainId}/`, txDataBody, {
        params: { ignoreChecks: true },
    });
    const amount = side === "SELL" ? priceData.priceRoute.destAmount : priceData.priceRoute.srcAmount;
    return {
        data: txData.data ? txData.data : "",
        amount: amount ? amount : 0
    };
});
exports.createCallDataParaswap = createCallDataParaswap;
