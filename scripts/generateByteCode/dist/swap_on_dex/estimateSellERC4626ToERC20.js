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
exports.estimateSellERC4626ToERC20 = void 0;
const ERC4626_1 = require("../abis/ERC4626");
const loadContract_1 = require("../utils/loadContract");
const helpers_1 = require("../utils/helpers");
const ERC20_1 = require("../abis/ERC20");
const sellOnDex_1 = require("../dex_common/sellOnDex");
var CONTRACT_NAME;
(function (CONTRACT_NAME) {
    CONTRACT_NAME["ERC_4626_TOKEN"] = "ERC-4626_Token";
    CONTRACT_NAME["ERC_4626_ASSET"] = "ERC-4626_Asset";
    CONTRACT_NAME["ERC20"] = "ERC-20_Token";
})(CONTRACT_NAME || (CONTRACT_NAME = {}));
var METHOD_NAME;
(function (METHOD_NAME) {
    METHOD_NAME["DECIMALS"] = "decimals";
    METHOD_NAME["CONVERT_TO_ASSET"] = "convertToAssets";
})(METHOD_NAME || (METHOD_NAME = {}));
const estimateSellERC4626ToERC20 = (tokenInAddress, tokenOutAddress, amountIn, maxDiscrepancy, receiver, chainId, dexType, provider) => __awaiter(void 0, void 0, void 0, function* () {
    const erc4626Instance = (0, loadContract_1.loadContractInstance)(tokenInAddress, ERC4626_1.ERC4626_ABI, provider);
    const erc4626Asset = yield erc4626Instance.asset();
    const assetInstance = (0, loadContract_1.loadContractInstance)(erc4626Asset, ERC20_1.ERC20_ABI, provider);
    const assetDecimals = yield assetInstance.decimals();
    const estimateAmountIn = yield erc4626Instance.convertToAssets(amountIn);
    if (tokenOutAddress.toLowerCase() === erc4626Asset.toLowerCase()) {
        return {
            tokenIn: tokenInAddress,
            amountIn: amountIn,
            tokenOut: tokenOutAddress,
            estimateAmountOut: (0, helpers_1.toBN)(estimateAmountIn),
            buyCallData: [],
        };
    }
    else {
        const estimation = yield (0, sellOnDex_1.sellOnDex)(erc4626Asset, assetDecimals, estimateAmountIn, tokenOutAddress, dexType, maxDiscrepancy, receiver, chainId, provider);
        return {
            tokenIn: tokenInAddress,
            amountIn: amountIn,
            tokenOut: tokenOutAddress,
            estimateAmountOut: (0, helpers_1.toBN)((estimation === null || estimation === void 0 ? void 0 : estimation.amountOut) || "0"),
            buyCallData: [estimation === null || estimation === void 0 ? void 0 : estimation.buyCallData].filter(data => !!data),
        };
    }
});
exports.estimateSellERC4626ToERC20 = estimateSellERC4626ToERC20;
