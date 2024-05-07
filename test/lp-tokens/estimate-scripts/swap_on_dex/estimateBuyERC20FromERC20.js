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
exports.estimateBuyERC20FromERC20 = void 0;
const ERC20_1 = require("../abis/ERC20");
const getMaxDiscrepancyAmount_1 = require("../utils/getMaxDiscrepancyAmount");
const helpers_1 = require("../utils/helpers");
const loadContract_1 = require("../utils/loadContract");
const buyOnDex_1 = require("../dex_common/buyOnDex");
const estimateBuyERC20FromERC20 = (tokenInAddress, tokenOutAddress, expectedAmountOut, receiver, maxDiscrepancy, chainId, dexType, provider) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenInInstance = (0, loadContract_1.loadContractInstance)(tokenInAddress, ERC20_1.ERC20_ABI, provider);
    const tokenOutInstance = (0, loadContract_1.loadContractInstance)(tokenOutAddress, ERC20_1.ERC20_ABI, provider);
    const [tokenInDecimals, tokenOutDecimals] = yield Promise.all([
        tokenInInstance.decimals(),
        tokenOutInstance.decimals(),
    ]);
    const acceptableAmountOut = (0, getMaxDiscrepancyAmount_1.getMaxDiscrepancyAmount)((0, helpers_1.toBN)(expectedAmountOut), maxDiscrepancy);
    const buyOrSellData = tokenInAddress.toLowerCase() === tokenOutAddress.toLowerCase()
        ? { amountIn: expectedAmountOut, buyCallData: null }
        : yield (0, buyOnDex_1.buyOnDex)(tokenInAddress, tokenInDecimals, tokenOutAddress, tokenOutDecimals, acceptableAmountOut, dexType, receiver, chainId, maxDiscrepancy);
    return {
        tokenIn: tokenInAddress,
        estimateAmountIn: buyOrSellData.amountIn,
        tokenOut: tokenOutAddress,
        expectedAmountOut,
        buyCallData: [buyOrSellData.buyCallData].filter(data => !!data),
    };
});
exports.estimateBuyERC20FromERC20 = estimateBuyERC20FromERC20;
