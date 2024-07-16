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
exports.estimateSellERC4626ToLP = void 0;
const ERC4626_1 = require("../abis/ERC4626");
const loadContract_1 = require("../utils/loadContract");
const helpers_1 = require("../utils/helpers");
const estimateSellERC20ToLP_1 = require("./estimateSellERC20ToLP");
const estimateSellERC4626ToLP = (tokenInAddress, tokenOutAddress, pairType, amountIn, maxDiscrepancy, receiver, chainId, dexType, provider) => __awaiter(void 0, void 0, void 0, function* () {
    const erc4626SrcInstance = (0, loadContract_1.loadContractInstance)(tokenInAddress, ERC4626_1.ERC4626_ABI, provider);
    const erc4626SrcAsset = yield erc4626SrcInstance.asset();
    const estimateAssetAmountIn = yield erc4626SrcInstance.convertToAssets(amountIn);
    const estimation = yield (0, estimateSellERC20ToLP_1.estimateSellERC20ToLP)(erc4626SrcAsset, tokenOutAddress, pairType, estimateAssetAmountIn, maxDiscrepancy, receiver, chainId, dexType, provider);
    return {
        tokenIn: tokenInAddress,
        amountIn: amountIn,
        tokenOut: tokenOutAddress,
        estimateAmountOut: (0, helpers_1.toBN)(estimation.estimateAmountOut),
        buyCallData: estimation.buyCallData,
    };
});
exports.estimateSellERC4626ToLP = estimateSellERC4626ToLP;
