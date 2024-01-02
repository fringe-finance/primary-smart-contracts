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
exports.createCallDataOpenOcean = void 0;
const axios_1 = __importDefault(require("axios"));
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const OpenOceanExchange_1 = require("../abis/OpenOceanExchange");
const tryDecodeFuncData_1 = require("../utils/tryDecodeFuncData");
const baseURL = "https://open-api.openocean.finance/v3";
const ifaceOpenOceanExchange = new ethers_1.ethers.utils.Interface(OpenOceanExchange_1.OOE_ABI);
const createCallDataOpenOcean = (srcToken, srcDecimals, srcAmount, destToken, { chainId = "1", account }, gasPriceInGWei) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { data: priceData } = yield axios_1.default.get(`${baseURL}/${chainId}/swap_quote`, {
        params: {
            chain: chainId,
            inTokenAddress: srcToken,
            outTokenAddress: destToken,
            amount: (0, utils_1.formatUnits)(srcAmount, srcDecimals),
            gasPrice: gasPriceInGWei,
            slippage: "5",
            account: account
        },
    });
    let data = "";
    let amount = 0;
    console.log({
        priceData
    });
    if ((_a = priceData === null || priceData === void 0 ? void 0 : priceData.data) === null || _a === void 0 ? void 0 : _a.data) {
        data = priceData.data.data;
        amount = (0, tryDecodeFuncData_1.tryDecodeFuncData)(data, OpenOceanExchange_1.OOE_ABI, ifaceOpenOceanExchange);
    }
    return {
        data,
        amount
    };
});
exports.createCallDataOpenOcean = createCallDataOpenOcean;
