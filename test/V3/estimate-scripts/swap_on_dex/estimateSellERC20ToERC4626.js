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
exports.estimateSellERC20ToERC4626 = void 0;
const ERC4626_1 = require("../abis/ERC4626");
const loadContract_1 = require("../utils/loadContract");
const helpers_1 = require("../utils/helpers");
const ERC20_1 = require("../abis/ERC20");
const sellOnDex_1 = require("../dex_common/sellOnDex");
const estimateSellERC20ToERC4626 = (tokenInAddress, tokenOutAddress, amountIn, maxDiscrepancy, receiver, chainId, dexType, provider) => __awaiter(void 0, void 0, void 0, function* () {
    const erc20Instance = (0, loadContract_1.loadContractInstance)(tokenInAddress, ERC20_1.ERC20_ABI, provider);
    const erc20Decimals = yield erc20Instance.decimals();
    const erc4626Instance = (0, loadContract_1.loadContractInstance)(tokenOutAddress, ERC4626_1.ERC4626_ABI, provider);
    const erc4626AssetAddress = yield erc4626Instance.asset();
    if (tokenInAddress.toLowerCase() === erc4626AssetAddress.toLowerCase()) {
        const estimateAmountOut = yield erc4626Instance.convertToShares(amountIn);
        return {
            tokenIn: tokenInAddress,
            tokenOut: tokenOutAddress,
            estimateAmountOut: (0, helpers_1.toBN)(estimateAmountOut),
            amountIn,
            buyCallData: [],
        };
    }
    else {
        const estimation = yield (0, sellOnDex_1.sellOnDex)(erc20Instance.address, erc20Decimals, amountIn, erc4626AssetAddress, dexType, maxDiscrepancy, receiver, chainId, provider);
        const estimateAmountOut = yield erc4626Instance.convertToShares(estimation === null || estimation === void 0 ? void 0 : estimation.amountOut);
        return {
            tokenIn: tokenInAddress,
            tokenOut: tokenOutAddress,
            estimateAmountOut: (0, helpers_1.toBN)(estimateAmountOut),
            amountIn,
            buyCallData: [estimation === null || estimation === void 0 ? void 0 : estimation.buyCallData].filter(data => !!data),
        };
    }
});
exports.estimateSellERC20ToERC4626 = estimateSellERC20ToERC4626;
