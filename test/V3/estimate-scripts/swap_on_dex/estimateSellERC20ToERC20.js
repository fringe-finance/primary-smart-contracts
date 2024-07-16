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
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateSellERC20ToERC20 = void 0;
const ERC20_1 = require("../abis/ERC20");
const loadContract_1 = require("../utils/loadContract");
const sellOnDex_1 = require("../dex_common/sellOnDex");
const helpers_1 = require("../utils/helpers");
const estimateSellERC20ToERC20 = (tokenInAddress, tokenOutAddress, amountIn, maxDiscrepancy, receiver, chainId, dexType, provider) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenInInstance = (0, loadContract_1.loadContractInstance)(tokenInAddress, ERC20_1.ERC20_ABI, provider);
    const tokenInDecimals = yield tokenInInstance.decimals();
    const estimation = tokenInAddress.toLowerCase() === tokenOutAddress.toLowerCase()
        ? { amountOut: amountIn, buyCallData: null }
        : yield (0, sellOnDex_1.sellOnDex)(tokenInAddress, tokenInDecimals, amountIn, tokenOutAddress, dexType, maxDiscrepancy, receiver, chainId, provider);
    return {
        tokenIn: tokenInAddress,
        amountIn: amountIn,
        tokenOut: tokenOutAddress,
        estimateAmountOut: (0, helpers_1.toBN)((estimation === null || estimation === void 0 ? void 0 : estimation.amountOut) || "0"),
        buyCallData: [estimation === null || estimation === void 0 ? void 0 : estimation.buyCallData].filter(data => !!data),
    };
});
exports.estimateSellERC20ToERC20 = estimateSellERC20ToERC20;
