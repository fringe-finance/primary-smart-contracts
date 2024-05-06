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
exports.estimateBuyERC20FromERC4626 = void 0;
const ERC4626_1 = require("../abis/ERC4626");
const loadContract_1 = require("../utils/loadContract");
const helpers_1 = require("../utils/helpers");
const buyOnDex_1 = require("../dex_common/buyOnDex");
const ERC20_1 = require("../abis/ERC20");
const getMaxDiscrepancyAmount_1 = require("../utils/getMaxDiscrepancyAmount");
const estimateBuyERC20FromERC4626 = (erc4626Address, erc20Address, erc20ExpectedAmount, receiver, maxDiscrepancy, chainId, dexType, provider) => __awaiter(void 0, void 0, void 0, function* () {
    const erc20Instance = (0, loadContract_1.loadContractInstance)(erc20Address, ERC20_1.ERC20_ABI, provider);
    const erc20Decimals = yield erc20Instance.decimals();
    const erc4626Instance = (0, loadContract_1.loadContractInstance)(erc4626Address, ERC4626_1.ERC4626_ABI, provider);
    const erc4626AssetAddress = yield erc4626Instance.asset();
    const assetInstance = (0, loadContract_1.loadContractInstance)(erc4626AssetAddress, ERC20_1.ERC20_ABI, provider);
    const assetDecimals = yield assetInstance.decimals();
    const erc20AcceptableAmount = (0, getMaxDiscrepancyAmount_1.getMaxDiscrepancyAmount)((0, helpers_1.toBN)(erc20ExpectedAmount), maxDiscrepancy);
    if (erc20Address.toLowerCase() === erc4626AssetAddress.toLowerCase()) {
        const estimateAmountIn = yield erc4626Instance.convertToShares(erc20AcceptableAmount);
        return {
            tokenIn: erc20Address,
            tokenOut: erc4626Address,
            estimateAmountIn: (0, helpers_1.toBN)(estimateAmountIn),
            expectedAmountOut: erc20ExpectedAmount,
            buyCallData: [],
        };
    }
    else {
        const estimation = yield (0, buyOnDex_1.buyOnDex)(erc4626AssetAddress, assetDecimals, erc20Address, erc20Decimals, erc20AcceptableAmount, dexType, receiver, chainId, maxDiscrepancy);
        const estimateAmountIn = yield erc4626Instance.convertToShares(estimation.amountIn);
        return {
            tokenIn: erc20Address,
            estimateAmountIn: (0, helpers_1.toBN)(estimateAmountIn),
            tokenOut: erc4626Address,
            expectedAmountOut: erc20ExpectedAmount,
            buyCallData: [estimation.buyCallData],
        };
    }
});
exports.estimateBuyERC20FromERC4626 = estimateBuyERC20FromERC4626;
