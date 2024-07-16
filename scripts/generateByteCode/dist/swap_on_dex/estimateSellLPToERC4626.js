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
exports.estimateSellLPToERC4626 = void 0;
const ERC4626_1 = require("../abis/ERC4626");
const loadContract_1 = require("../utils/loadContract");
const helpers_1 = require("../utils/helpers");
const estimateSellLPToERC20_1 = require("./estimateSellLPToERC20");
const estimateSellLPToERC4626 = (tokenInAddress, pairType, tokenOutAddress, amountIn, maxDiscrepancy, receiver, chainId, dexType, provider) => __awaiter(void 0, void 0, void 0, function* () {
    const erc4626Instance = (0, loadContract_1.loadContractInstance)(tokenOutAddress, ERC4626_1.ERC4626_ABI, provider);
    const assetAddress = yield erc4626Instance.asset();
    const estimation = yield (0, estimateSellLPToERC20_1.estimateSellLPToERC20)(tokenInAddress, pairType, assetAddress, amountIn, maxDiscrepancy, receiver, chainId, dexType, provider);
    const estimateAmountOut = yield erc4626Instance.convertToShares(estimation.estimateAmountOut);
    return {
        tokenIn: tokenInAddress,
        amountIn: amountIn,
        tokenOut: tokenOutAddress,
        estimateAmountOut: (0, helpers_1.toBN)(estimateAmountOut),
        buyCallData: estimation.buyCallData,
    };
});
exports.estimateSellLPToERC4626 = estimateSellLPToERC4626;
