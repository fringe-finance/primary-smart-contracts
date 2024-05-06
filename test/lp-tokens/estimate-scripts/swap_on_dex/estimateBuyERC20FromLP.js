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
exports.estimateBuyERC20FromLP = void 0;
const ethers_1 = require("ethers");
const ERC20_1 = require("../abis/ERC20");
const buyOnDex_1 = require("../dex_common/buyOnDex");
const getMaxDiscrepancyAmount_1 = require("../utils/getMaxDiscrepancyAmount");
const helpers_1 = require("../utils/helpers");
const loadContract_1 = require("../utils/loadContract");
const unwrap_1 = require("../utils/unwrap");
const estimateBuyERC20FromLP = (lpAddress, erc20Address, erc20ExpectedAmount, receiver, maxDiscrepancy, chainId, dexType, pairType, provider) => __awaiter(void 0, void 0, void 0, function* () {
    const erc20Instance = (0, loadContract_1.loadContractInstance)(erc20Address, ERC20_1.ERC20_ABI, provider);
    const erc20Decimals = yield erc20Instance.decimals();
    // Unwrap LP token to token 0 & token 1
    const { lpTotalSupply, lpDecimals, 
    // token 0
    lpToken0Address, lpToken0Decimals, lpToken0Reserve, 
    // token 1
    lpToken1Address, lpToken1Decimals, lpToken1Reserve } = yield (0, unwrap_1.unwrapLP)(lpAddress, pairType, provider);
    const erc20AcceptableAmount = (0, getMaxDiscrepancyAmount_1.getMaxDiscrepancyAmount)((0, helpers_1.toBN)(erc20ExpectedAmount), maxDiscrepancy);
    const erc20EstimatedAmountForToken0 = ethers_1.BigNumber.from(erc20AcceptableAmount).div(2);
    const erc20EstimatedAmountForToken1 = ethers_1.BigNumber.from(erc20AcceptableAmount).div(2);
    let lpToken0BuyData;
    let lpToken1BuyData;
    if (lpToken0Address.toLowerCase() !== erc20Address.toLowerCase()) {
        lpToken0BuyData = yield (0, buyOnDex_1.buyOnDex)(lpToken0Address, lpToken0Decimals, erc20Address, erc20Decimals, erc20EstimatedAmountForToken0, dexType, receiver, chainId, maxDiscrepancy);
    }
    else {
        lpToken0BuyData = {
            amountIn: (0, helpers_1.toBN)(erc20EstimatedAmountForToken0),
            buyCallData: null
        };
    }
    if (lpToken1Address.toLowerCase() !== erc20Address.toLowerCase()) {
        lpToken1BuyData = yield (0, buyOnDex_1.buyOnDex)(lpToken1Address, lpToken1Decimals, erc20Address, erc20Decimals, erc20EstimatedAmountForToken1, dexType, receiver, chainId);
    }
    else {
        lpToken1BuyData = {
            amountIn: (0, helpers_1.toBN)(erc20EstimatedAmountForToken1),
            buyCallData: null
        };
    }
    const lpToken0EstimatedAmount = lpToken0BuyData.amountIn;
    const lpToken1EstimatedAmount = lpToken1BuyData.amountIn;
    const lpEstimatedAmountWithToken0 = lpToken0EstimatedAmount.mul(lpTotalSupply).div(lpToken0Reserve);
    const lpEstimatedAmountWithToken1 = lpToken1EstimatedAmount.mul(lpTotalSupply).div(lpToken1Reserve);
    const lpEstimatedAmount = lpEstimatedAmountWithToken0.gt(lpEstimatedAmountWithToken1)
        ? lpEstimatedAmountWithToken0
        : lpEstimatedAmountWithToken1;
    return {
        tokenIn: lpAddress,
        estimateAmountIn: lpEstimatedAmount,
        tokenOut: erc20Address,
        expectedAmountOut: erc20ExpectedAmount,
        buyCallData: [lpToken0BuyData === null || lpToken0BuyData === void 0 ? void 0 : lpToken0BuyData.buyCallData, lpToken1BuyData === null || lpToken1BuyData === void 0 ? void 0 : lpToken1BuyData.buyCallData].filter(data => !!data),
    };
});
exports.estimateBuyERC20FromLP = estimateBuyERC20FromLP;
