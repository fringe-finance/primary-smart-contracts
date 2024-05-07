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
exports.estimateBuyLPFromERC20 = void 0;
const ERC20_1 = require("../abis/ERC20");
const buyOrEstimateSellOnDex_1 = require("../dex_common/buyOrEstimateSellOnDex");
const estimateAmountDesired_1 = require("../utils/estimateAmountDesired");
const getMaxDiscrepancyAmount_1 = require("../utils/getMaxDiscrepancyAmount");
const helpers_1 = require("../utils/helpers");
const loadContract_1 = require("../utils/loadContract");
const unwrap_1 = require("../utils/unwrap");
const estimateBuyLPFromERC20 = (erc20Address, lpAddress, lpExpectedAmount, receiver, maxDiscrepancy, chainId, dexType, pairType, provider) => __awaiter(void 0, void 0, void 0, function* () {
    const erc20Instance = (0, loadContract_1.loadContractInstance)(erc20Address, ERC20_1.ERC20_ABI, provider);
    const erc20Decimals = yield erc20Instance.decimals();
    // Unwrap LP token to token 0 & token 1
    const { lpTotalSupply, 
    // token 0
    lpToken0Address, lpToken0Decimals, lpToken0Reserve, 
    // token 1
    lpToken1Address, lpToken1Decimals, lpToken1Reserve, } = yield (0, unwrap_1.unwrapLP)(lpAddress, pairType, provider);
    const lpAcceptableAmount = (0, getMaxDiscrepancyAmount_1.getMaxDiscrepancyAmount)((0, helpers_1.toBN)(lpExpectedAmount), maxDiscrepancy);
    const { amount0Desired: lpToken0DesiredAmount, amount1Desired: lpToken1DesiredAmount } = (0, estimateAmountDesired_1.estimateBuyLPAmountDesired)(lpToken0Reserve, lpToken1Reserve, lpTotalSupply, lpAcceptableAmount);
    console.log(`
        Need ${lpToken0DesiredAmount} ${lpToken0Address}
        And ${lpToken1DesiredAmount} ${lpToken1Address}
        to add liquidate to get 
        ${lpAcceptableAmount} LP token ${lpAddress}
    `);
    const { buyOrSellData0: lpToken0BuyData, buyOrSellData1: lpToken1BuyData } = yield (0, buyOrEstimateSellOnDex_1.buyOrEstimateSellOnDex)(erc20Address, erc20Decimals, lpToken0Address, lpToken0Decimals, lpToken0DesiredAmount, lpToken1Address, lpToken1Decimals, lpToken1DesiredAmount, receiver, dexType, chainId, maxDiscrepancy);
    const erc20AmountEstimated = lpToken0BuyData.amountIn.add(lpToken1BuyData.amountIn);
    return {
        tokenIn: erc20Address,
        estimateAmountIn: erc20AmountEstimated,
        tokenOut: lpAddress,
        expectedAmountOut: lpExpectedAmount,
        buyCallData: [lpToken0BuyData.buyCallData, lpToken1BuyData.buyCallData].filter(data => !!data),
    };
});
exports.estimateBuyLPFromERC20 = estimateBuyLPFromERC20;
