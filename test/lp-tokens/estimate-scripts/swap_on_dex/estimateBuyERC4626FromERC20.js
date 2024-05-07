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
exports.estimateBuyERC4626FromERC20 = void 0;
const ERC4626_1 = require("../abis/ERC4626");
const loadContract_1 = require("../utils/loadContract");
const helpers_1 = require("../utils/helpers");
const buyOnDex_1 = require("../dex_common/buyOnDex");
const ERC20_1 = require("../abis/ERC20");
const loadMulticallInstance_1 = require("../utils/loadMulticallInstance");
const getMaxDiscrepancyAmount_1 = require("../utils/getMaxDiscrepancyAmount");
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
const decodeTokensInfo = (erc4626Address, erc4626ExpectedAmount, erc20Address, provider) => __awaiter(void 0, void 0, void 0, function* () {
    const erc4626Instance = (0, loadContract_1.loadContractInstance)(erc4626Address, ERC4626_1.ERC4626_ABI, provider);
    const erc4626Asset = yield erc4626Instance.asset();
    const multicall = (0, loadMulticallInstance_1.loadMulticallInstance)(provider);
    const requests = [
        {
            reference: CONTRACT_NAME.ERC_4626_ASSET,
            contractAddress: erc4626Asset,
            abi: ERC20_1.ERC20_ABI,
            calls: [
                {
                    reference: METHOD_NAME.DECIMALS,
                    methodName: METHOD_NAME.DECIMALS,
                    methodParameters: []
                },
            ]
        },
        {
            reference: CONTRACT_NAME.ERC20,
            contractAddress: erc20Address,
            abi: ERC20_1.ERC20_ABI,
            calls: [
                {
                    reference: METHOD_NAME.DECIMALS,
                    methodName: METHOD_NAME.DECIMALS,
                    methodParameters: []
                },
            ]
        },
        {
            reference: CONTRACT_NAME.ERC_4626_TOKEN,
            contractAddress: erc4626Address,
            abi: ERC4626_1.ERC4626_ABI,
            calls: [
                {
                    reference: METHOD_NAME.CONVERT_TO_ASSET,
                    methodName: METHOD_NAME.CONVERT_TO_ASSET,
                    methodParameters: [erc4626ExpectedAmount]
                },
            ]
        }
    ];
    const responses = yield multicall.call(requests);
    const erc20Decimals = responses.results[CONTRACT_NAME.ERC20].callsReturnContext[0].returnValues[0];
    const assetDecimals = responses.results[CONTRACT_NAME.ERC_4626_ASSET].callsReturnContext[0].returnValues[0];
    const erc20AssetExpectedAmount = responses.results[CONTRACT_NAME.ERC_4626_TOKEN].callsReturnContext[0].returnValues[0];
    return {
        erc20Decimals,
        erc4626Asset,
        assetDecimals,
        erc20AssetExpectedAmount: (0, helpers_1.toBN)((erc20AssetExpectedAmount === null || erc20AssetExpectedAmount === void 0 ? void 0 : erc20AssetExpectedAmount.hex) || 0),
    };
});
const estimateBuyERC4626FromERC20 = (erc20Address, erc4626Address, erc4626ExpectedAmount, receiver, maxDiscrepancy, chainId, dexType, provider) => __awaiter(void 0, void 0, void 0, function* () {
    const erc4626Instance = (0, loadContract_1.loadContractInstance)(erc4626Address, ERC4626_1.ERC4626_ABI, provider);
    const { erc4626Asset, assetDecimals, erc20Decimals, erc20AssetExpectedAmount } = yield decodeTokensInfo(erc4626Address, erc4626ExpectedAmount, erc20Address, provider);
    if (erc20Address.toLowerCase() === erc4626Asset.toLowerCase()) {
        const erc4626AcceptableAmount = (0, getMaxDiscrepancyAmount_1.getMaxDiscrepancyAmount)((0, helpers_1.toBN)(erc4626ExpectedAmount), maxDiscrepancy);
        const estimateAmountIn = yield erc4626Instance.convertToAssets(erc4626AcceptableAmount);
        return {
            tokenIn: erc20Address,
            tokenOut: erc4626Address,
            estimateAmountIn: (0, helpers_1.toBN)(estimateAmountIn),
            expectedAmountOut: erc4626ExpectedAmount,
            buyCallData: [],
        };
    }
    else {
        const erc20AssetAcceptableAmount = (0, getMaxDiscrepancyAmount_1.getMaxDiscrepancyAmount)((0, helpers_1.toBN)(erc20AssetExpectedAmount), maxDiscrepancy);
        const estimation = yield (0, buyOnDex_1.buyOnDex)(erc20Address, erc20Decimals, erc4626Asset, assetDecimals, erc20AssetAcceptableAmount, dexType, receiver, chainId, maxDiscrepancy);
        return {
            tokenIn: erc20Address,
            estimateAmountIn: (0, helpers_1.toBN)(estimation.amountIn),
            tokenOut: erc4626Address,
            expectedAmountOut: erc4626ExpectedAmount,
            buyCallData: [estimation.buyCallData],
        };
    }
});
exports.estimateBuyERC4626FromERC20 = estimateBuyERC4626FromERC20;
