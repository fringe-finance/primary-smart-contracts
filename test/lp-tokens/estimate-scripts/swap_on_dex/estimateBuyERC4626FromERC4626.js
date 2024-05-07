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
exports.estimateBuyERC4626FromERC4626 = void 0;
const ERC4626_1 = require("../abis/ERC4626");
const loadContract_1 = require("../utils/loadContract");
const helpers_1 = require("../utils/helpers");
const estimateBuyERC4626FromERC20_1 = require("./estimateBuyERC4626FromERC20");
const estimateBuyERC4626FromERC4626 = (erc4626SrcAddress, erc4626DestAddress, expectedAmountOut, receiver, maxDiscrepancy, chainId, dexType, provider) => __awaiter(void 0, void 0, void 0, function* () {
    const erc4626SrcInstance = (0, loadContract_1.loadContractInstance)(erc4626SrcAddress, ERC4626_1.ERC4626_ABI, provider);
    const erc4626SrcAsset = yield erc4626SrcInstance.asset();
    const estimation = yield (0, estimateBuyERC4626FromERC20_1.estimateBuyERC4626FromERC20)(erc4626SrcAsset, erc4626DestAddress, expectedAmountOut, receiver, maxDiscrepancy, chainId, dexType, provider);
    const estimateAmountIn = yield erc4626SrcInstance.convertToShares(estimation.estimateAmountIn);
    return {
        tokenIn: erc4626SrcAddress,
        estimateAmountIn: (0, helpers_1.toBN)(estimateAmountIn),
        tokenOut: erc4626DestAddress,
        expectedAmountOut: expectedAmountOut,
        buyCallData: estimation.buyCallData,
    };
});
exports.estimateBuyERC4626FromERC4626 = estimateBuyERC4626FromERC4626;
