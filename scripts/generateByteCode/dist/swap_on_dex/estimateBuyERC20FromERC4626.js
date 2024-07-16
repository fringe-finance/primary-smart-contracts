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
const estimateBuyERC20FromERC20_1 = require("./estimateBuyERC20FromERC20");
const estimateBuyERC20FromERC4626 = (erc4626Address, erc20Address, erc20ExpectedAmount, receiver, maxDiscrepancy, chainId, dexType, provider) => __awaiter(void 0, void 0, void 0, function* () {
    const erc4626Instance = (0, loadContract_1.loadContractInstance)(erc4626Address, ERC4626_1.ERC4626_ABI, provider);
    const erc4626AssetAddress = yield erc4626Instance.asset();
    const estimation = yield (0, estimateBuyERC20FromERC20_1.estimateBuyERC20FromERC20)(erc4626AssetAddress, erc20Address, erc20ExpectedAmount, receiver, maxDiscrepancy, chainId, dexType, provider);
    const estimateAmountIn = yield erc4626Instance.convertToShares(estimation.estimateAmountIn);
    return {
        tokenIn: erc4626Address,
        estimateAmountIn: (0, helpers_1.toBN)(estimateAmountIn),
        tokenOut: erc20Address,
        expectedAmountOut: erc20ExpectedAmount,
        buyCallData: estimation.buyCallData,
    };
});
exports.estimateBuyERC20FromERC4626 = estimateBuyERC20FromERC4626;
