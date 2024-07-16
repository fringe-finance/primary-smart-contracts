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
exports.estimateBuyLPFromERC4626 = void 0;
const ERC4626_1 = require("../abis/ERC4626");
const loadContract_1 = require("../utils/loadContract");
const estimateBuyLPFromERC20_1 = require("./estimateBuyLPFromERC20");
const helpers_1 = require("../utils/helpers");
const estimateBuyLPFromERC4626 = (erc4626Address, lpAddress, lpExpectedAmount, receiver, maxDiscrepancy, chainId, dexType, pairType, provider) => __awaiter(void 0, void 0, void 0, function* () {
    const erc4626Instance = (0, loadContract_1.loadContractInstance)(erc4626Address, ERC4626_1.ERC4626_ABI, provider);
    const erc20Address = yield erc4626Instance.asset();
    const estimation = yield (0, estimateBuyLPFromERC20_1.estimateBuyLPFromERC20)(erc20Address, lpAddress, lpExpectedAmount, receiver, maxDiscrepancy, chainId, dexType, pairType, provider);
    const estimateAmountIn = yield erc4626Instance.convertToShares(estimation.estimateAmountIn);
    return {
        tokenIn: erc4626Address,
        estimateAmountIn: (0, helpers_1.toBN)(estimateAmountIn),
        tokenOut: lpAddress,
        expectedAmountOut: lpExpectedAmount,
        buyCallData: estimation.buyCallData,
    };
});
exports.estimateBuyLPFromERC4626 = estimateBuyLPFromERC4626;
