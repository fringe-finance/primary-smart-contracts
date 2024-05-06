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
exports.unwrapLP = exports.unwrap = void 0;
const ethers_1 = require("ethers");
const ERC20_1 = require("../abis/ERC20");
const helpers_1 = require("./helpers");
const loadPairInstance_1 = require("./loadPairInstance");
const loadMulticallInstance_1 = require("./loadMulticallInstance");
var LP_METHOD_NAME;
(function (LP_METHOD_NAME) {
    LP_METHOD_NAME["DECIMALS"] = "decimals";
    LP_METHOD_NAME["GET_RESERVES"] = "getReserves";
    LP_METHOD_NAME["TOTAL_SUPPLY"] = "totalSupply";
    LP_METHOD_NAME["TOKEN0"] = "token0";
    LP_METHOD_NAME["TOKEN1"] = "token1";
})(LP_METHOD_NAME || (LP_METHOD_NAME = {}));
var ERC20_METHOD_NAME;
(function (ERC20_METHOD_NAME) {
    ERC20_METHOD_NAME["DECIMALS"] = "decimals";
    ERC20_METHOD_NAME["BALANCE_OF"] = "balanceOf";
})(ERC20_METHOD_NAME || (ERC20_METHOD_NAME = {}));
var CONTRACT_NAME;
(function (CONTRACT_NAME) {
    CONTRACT_NAME["LP_TOKEN"] = "LP_Token";
    CONTRACT_NAME["TOKEN0"] = "Token0";
    CONTRACT_NAME["TOKEN1"] = "Token1";
})(CONTRACT_NAME || (CONTRACT_NAME = {}));
const decodeLPTokenInfo = (callResult) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const resultContext = callResult.results[CONTRACT_NAME.LP_TOKEN].callsReturnContext;
    const returnedValues = {};
    [
        LP_METHOD_NAME.DECIMALS,
        LP_METHOD_NAME.GET_RESERVES,
        LP_METHOD_NAME.TOTAL_SUPPLY,
        LP_METHOD_NAME.TOKEN0,
        LP_METHOD_NAME.TOKEN1
    ].forEach(methodName => {
        const response = resultContext.find(result => result.methodName === methodName);
        if (!response)
            return;
        returnedValues[methodName] = response.returnValues;
    });
    return {
        decimals: (_a = returnedValues[LP_METHOD_NAME.DECIMALS]) === null || _a === void 0 ? void 0 : _a[0],
        totalSupply: (0, helpers_1.toBN)((_c = (_b = returnedValues[LP_METHOD_NAME.TOTAL_SUPPLY]) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.hex),
        token0: (_d = returnedValues[LP_METHOD_NAME.TOKEN0]) === null || _d === void 0 ? void 0 : _d[0],
        token1: (_e = returnedValues[LP_METHOD_NAME.TOKEN1]) === null || _e === void 0 ? void 0 : _e[0],
        reserves0: (0, helpers_1.toBN)(((_g = (_f = returnedValues[LP_METHOD_NAME.GET_RESERVES]) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.hex) || 0),
        reserves1: (0, helpers_1.toBN)(((_j = (_h = returnedValues[LP_METHOD_NAME.GET_RESERVES]) === null || _h === void 0 ? void 0 : _h[1]) === null || _j === void 0 ? void 0 : _j.hex) || 0)
    };
};
const decodeToken0AndToken1Info = (callResult) => {
    var _a, _b, _c, _d, _e, _f;
    const token0Result = callResult.results[CONTRACT_NAME.TOKEN0].callsReturnContext;
    const token1Result = callResult.results[CONTRACT_NAME.TOKEN1].callsReturnContext;
    const returnedValues = {
        token0: {}, token1: {}
    };
    [
        ERC20_METHOD_NAME.DECIMALS,
        ERC20_METHOD_NAME.BALANCE_OF
    ].forEach(methodName => {
        const token0Response = token0Result.find(result => result.methodName === methodName);
        const token1Response = token1Result.find(result => result.methodName === methodName);
        if (token0Response) {
            returnedValues.token0[methodName] = token0Response.returnValues;
        }
        ;
        if (token1Response) {
            returnedValues.token1[methodName] = token1Response.returnValues;
        }
        ;
    });
    return {
        token0Decimals: ((_a = returnedValues.token0[ERC20_METHOD_NAME.DECIMALS]) === null || _a === void 0 ? void 0 : _a[0]) || 18,
        token1Decimals: ((_b = returnedValues.token1[ERC20_METHOD_NAME.DECIMALS]) === null || _b === void 0 ? void 0 : _b[0]) || 18,
        token0Balance: (0, helpers_1.toBN)(((_d = (_c = returnedValues.token0[ERC20_METHOD_NAME.BALANCE_OF]) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.hex) || 0),
        token1Balance: (0, helpers_1.toBN)(((_f = (_e = returnedValues.token1[ERC20_METHOD_NAME.BALANCE_OF]) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.hex) || 0),
    };
};
const unwrap = (pair, amount, pairType, provider) => __awaiter(void 0, void 0, void 0, function* () {
    const pairInstance = (0, loadPairInstance_1.loadPairInstance)(pair, pairType, provider);
    const multicall = (0, loadMulticallInstance_1.loadMulticallInstance)(provider);
    const lpRequests = [
        {
            reference: CONTRACT_NAME.LP_TOKEN,
            contractAddress: pairInstance.address,
            abi: JSON.parse(pairInstance.interface.format(ethers_1.utils.FormatTypes.json).toString()),
            calls: [
                { reference: LP_METHOD_NAME.TOTAL_SUPPLY, methodName: LP_METHOD_NAME.TOTAL_SUPPLY, methodParameters: [] },
                { reference: LP_METHOD_NAME.TOKEN0, methodName: LP_METHOD_NAME.TOKEN0, methodParameters: [] },
                { reference: LP_METHOD_NAME.TOKEN1, methodName: LP_METHOD_NAME.TOKEN1, methodParameters: [] },
            ]
        }
    ];
    const lpResponse = yield multicall.call(lpRequests);
    const lpTokenInfo = decodeLPTokenInfo(lpResponse);
    const tokenRequests = [
        {
            reference: CONTRACT_NAME.TOKEN0,
            contractAddress: lpTokenInfo.token0,
            abi: ERC20_1.ERC20_ABI,
            calls: [
                { reference: ERC20_METHOD_NAME.DECIMALS, methodName: ERC20_METHOD_NAME.DECIMALS, methodParameters: [] },
                { reference: ERC20_METHOD_NAME.BALANCE_OF, methodName: ERC20_METHOD_NAME.BALANCE_OF, methodParameters: [pair] },
            ]
        },
        {
            reference: CONTRACT_NAME.TOKEN1,
            contractAddress: lpTokenInfo.token1,
            abi: ERC20_1.ERC20_ABI,
            calls: [
                { reference: ERC20_METHOD_NAME.DECIMALS, methodName: ERC20_METHOD_NAME.DECIMALS, methodParameters: [] },
                { reference: ERC20_METHOD_NAME.BALANCE_OF, methodName: ERC20_METHOD_NAME.BALANCE_OF, methodParameters: [pair] },
            ]
        }
    ];
    const tokensResponse = yield multicall.call(tokenRequests);
    const tokensInfo = decodeToken0AndToken1Info(tokensResponse);
    return {
        token0: lpTokenInfo.token0,
        token0Decimals: tokensInfo.token0Decimals,
        amount0: (0, helpers_1.toBN)(amount).mul(tokensInfo.token0Balance).div(lpTokenInfo.totalSupply),
        token1: lpTokenInfo.token1,
        token1Decimals: tokensInfo.token1Decimals,
        amount1: (0, helpers_1.toBN)(amount).mul(tokensInfo.token1Balance).div(lpTokenInfo.totalSupply),
    };
});
exports.unwrap = unwrap;
const unwrapLP = (lpAddress, pairType, provider) => __awaiter(void 0, void 0, void 0, function* () {
    const multicall = (0, loadMulticallInstance_1.loadMulticallInstance)(provider);
    const lpInstance = (0, loadPairInstance_1.loadPairInstance)(lpAddress, pairType, provider);
    const lpRequests = [
        {
            reference: CONTRACT_NAME.LP_TOKEN,
            contractAddress: lpInstance.address,
            abi: JSON.parse(lpInstance.interface.format(ethers_1.utils.FormatTypes.json).toString()),
            calls: [
                { reference: LP_METHOD_NAME.DECIMALS, methodName: LP_METHOD_NAME.DECIMALS, methodParameters: [] },
                { reference: LP_METHOD_NAME.GET_RESERVES, methodName: LP_METHOD_NAME.GET_RESERVES, methodParameters: [] },
                { reference: LP_METHOD_NAME.TOTAL_SUPPLY, methodName: LP_METHOD_NAME.TOTAL_SUPPLY, methodParameters: [] },
                { reference: LP_METHOD_NAME.TOKEN0, methodName: LP_METHOD_NAME.TOKEN0, methodParameters: [] },
                { reference: LP_METHOD_NAME.TOKEN1, methodName: LP_METHOD_NAME.TOKEN1, methodParameters: [] },
            ]
        }
    ];
    const lpResponse = yield multicall.call(lpRequests);
    const lpTokenInfo = decodeLPTokenInfo(lpResponse);
    const tokenRequests = [
        {
            reference: CONTRACT_NAME.TOKEN0,
            contractAddress: lpTokenInfo.token0,
            abi: ERC20_1.ERC20_ABI,
            calls: [
                { reference: ERC20_METHOD_NAME.DECIMALS, methodName: ERC20_METHOD_NAME.DECIMALS, methodParameters: [] },
            ]
        },
        {
            reference: CONTRACT_NAME.TOKEN1,
            contractAddress: lpTokenInfo.token1,
            abi: ERC20_1.ERC20_ABI,
            calls: [
                { reference: ERC20_METHOD_NAME.DECIMALS, methodName: ERC20_METHOD_NAME.DECIMALS, methodParameters: [] },
            ]
        }
    ];
    const tokensResponse = yield multicall.call(tokenRequests);
    const tokensInfo = decodeToken0AndToken1Info(tokensResponse);
    return {
        lpDecimals: Number(lpTokenInfo.decimals),
        lpTotalSupply: ethers_1.BigNumber.from(lpTokenInfo.totalSupply),
        lpToken0Address: lpTokenInfo.token0,
        lpToken0Decimals: Number(tokensInfo.token0Decimals),
        lpToken0Reserve: ethers_1.BigNumber.from(lpTokenInfo.reserves0),
        lpToken1Address: lpTokenInfo.token1,
        lpToken1Decimals: Number(tokensInfo.token1Decimals),
        lpToken1Reserve: ethers_1.BigNumber.from(lpTokenInfo.reserves1),
    };
});
exports.unwrapLP = unwrapLP;
