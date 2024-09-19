import { BigNumber, BigNumberish, utils } from "ethers";
import { ERC20_ABI } from "../abis/ERC20";
import { Pair } from "../enum/pairType";
import { toBN } from "./helpers";
import { loadContractInstance } from "./loadContract";
import { loadPairInstance } from "./loadPairInstance";
import {
    Multicall,
    ContractCallResults,
    ContractCallContext,
  } from 'ethereum-multicall';
import { loadMulticallInstance } from "./loadMulticallInstance";

enum LP_METHOD_NAME {
    DECIMALS = "decimals",
    GET_RESERVES = "getReserves",
    TOTAL_SUPPLY = "totalSupply",
    TOKEN0 = "token0",
    TOKEN1 = "token1"
}

enum ERC20_METHOD_NAME {
    DECIMALS = "decimals",
    BALANCE_OF = "balanceOf"
}

enum CONTRACT_NAME {
    LP_TOKEN = "LP_Token",
    TOKEN0 = "Token0",
    TOKEN1 = "Token1",
}

const decodeLPTokenInfo = (callResult: ContractCallResults) => {
    const resultContext = callResult.results[CONTRACT_NAME.LP_TOKEN].callsReturnContext;
    const returnedValues: {[key: string] : any} = {};
    [
        LP_METHOD_NAME.DECIMALS,
        LP_METHOD_NAME.GET_RESERVES,
        LP_METHOD_NAME.TOTAL_SUPPLY,
        LP_METHOD_NAME.TOKEN0,
        LP_METHOD_NAME.TOKEN1
    ].forEach(methodName => {
        const response = resultContext.find(result => result.methodName === methodName);
        if (!response) return;
        returnedValues[methodName] = response.returnValues;
    });
    return {
        decimals: returnedValues[LP_METHOD_NAME.DECIMALS]?.[0],
        totalSupply: toBN(returnedValues[LP_METHOD_NAME.TOTAL_SUPPLY]?.[0]?.hex),
        token0: returnedValues[LP_METHOD_NAME.TOKEN0]?.[0],
        token1: returnedValues[LP_METHOD_NAME.TOKEN1]?.[0],
        reserves0: toBN(returnedValues[LP_METHOD_NAME.GET_RESERVES]?.[0]?.hex || 0),
        reserves1: toBN(returnedValues[LP_METHOD_NAME.GET_RESERVES]?.[1]?.hex || 0)
    }
}

const decodeToken0AndToken1Info = (callResult: ContractCallResults) => {
    const token0Result = callResult.results[CONTRACT_NAME.TOKEN0].callsReturnContext;
    const token1Result = callResult.results[CONTRACT_NAME.TOKEN1].callsReturnContext;
    const returnedValues: {
        token0: { [key: string] : any },
        token1: { [key: string] : any }
    } = {
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
        };
        if (token1Response) {
            returnedValues.token1[methodName] = token1Response.returnValues;
        };
    });

    return {
        token0Decimals: returnedValues.token0[ERC20_METHOD_NAME.DECIMALS]?.[0] || 18,
        token1Decimals: returnedValues.token1[ERC20_METHOD_NAME.DECIMALS]?.[0] || 18,
        token0Balance: toBN(returnedValues.token0[ERC20_METHOD_NAME.BALANCE_OF]?.[0]?.hex || 0),
        token1Balance: toBN(returnedValues.token1[ERC20_METHOD_NAME.BALANCE_OF]?.[0]?.hex || 0),
    }
}

export const unwrap = async (pair: string, amount: BigNumberish, pairType: Pair, provider: any) => {
    const pairInstance = loadPairInstance(pair, pairType, provider);
    const multicall = loadMulticallInstance(provider);
    const lpRequests: ContractCallContext[] = [
        {
            reference: CONTRACT_NAME.LP_TOKEN,
            contractAddress: pairInstance.address,
            abi: JSON.parse(pairInstance.interface.format(utils.FormatTypes.json).toString()),
            calls: [
                { reference: LP_METHOD_NAME.TOTAL_SUPPLY, methodName: LP_METHOD_NAME.TOTAL_SUPPLY, methodParameters: [] },
                { reference: LP_METHOD_NAME.TOKEN0, methodName: LP_METHOD_NAME.TOKEN0, methodParameters: [] },
                { reference: LP_METHOD_NAME.TOKEN1, methodName: LP_METHOD_NAME.TOKEN1, methodParameters: [] },
            ]
        }
    ];
    const lpResponse: ContractCallResults = await multicall.call(lpRequests);
    const lpTokenInfo = decodeLPTokenInfo(lpResponse);

    const tokenRequests: ContractCallContext[] = [
        {
            reference: CONTRACT_NAME.TOKEN0,
            contractAddress: lpTokenInfo.token0,
            abi: ERC20_ABI,
            calls: [
                { reference: ERC20_METHOD_NAME.DECIMALS, methodName: ERC20_METHOD_NAME.DECIMALS, methodParameters: [] },
                { reference: ERC20_METHOD_NAME.BALANCE_OF, methodName: ERC20_METHOD_NAME.BALANCE_OF, methodParameters: [pair] },
            ]
        },
        {
            reference: CONTRACT_NAME.TOKEN1,
            contractAddress: lpTokenInfo.token1,
            abi: ERC20_ABI,
            calls: [
                { reference: ERC20_METHOD_NAME.DECIMALS, methodName: ERC20_METHOD_NAME.DECIMALS, methodParameters: [] },
                { reference: ERC20_METHOD_NAME.BALANCE_OF, methodName: ERC20_METHOD_NAME.BALANCE_OF, methodParameters: [pair] },
            ]
        }
    ];
    const tokensResponse: ContractCallResults = await multicall.call(tokenRequests);
    const tokensInfo = decodeToken0AndToken1Info(tokensResponse);

    return {
        token0: lpTokenInfo.token0,
        token0Decimals: tokensInfo.token0Decimals,
        amount0: toBN(amount).mul(tokensInfo.token0Balance).div(lpTokenInfo.totalSupply),
        token1: lpTokenInfo.token1,
        token1Decimals: tokensInfo.token1Decimals,
        amount1: toBN(amount).mul(tokensInfo.token1Balance).div(lpTokenInfo.totalSupply),
    };
};

export const unwrapLP = async (lpAddress: string, pairType: Pair, provider: any) => {
    const multicall = loadMulticallInstance(provider);
    const lpInstance = loadPairInstance(lpAddress, pairType, provider);
    const lpRequests: ContractCallContext[] = [
        {
            reference: CONTRACT_NAME.LP_TOKEN,
            contractAddress: lpInstance.address,
            abi: JSON.parse(lpInstance.interface.format(utils.FormatTypes.json).toString()),
            calls: [
                { reference: LP_METHOD_NAME.DECIMALS, methodName: LP_METHOD_NAME.DECIMALS, methodParameters: [] },
                { reference: LP_METHOD_NAME.GET_RESERVES, methodName: LP_METHOD_NAME.GET_RESERVES, methodParameters: [] },
                { reference: LP_METHOD_NAME.TOTAL_SUPPLY, methodName: LP_METHOD_NAME.TOTAL_SUPPLY, methodParameters: [] },
                { reference: LP_METHOD_NAME.TOKEN0, methodName: LP_METHOD_NAME.TOKEN0, methodParameters: [] },
                { reference: LP_METHOD_NAME.TOKEN1, methodName: LP_METHOD_NAME.TOKEN1, methodParameters: [] },
            ]
        }
    ];

    const lpResponse: ContractCallResults = await multicall.call(lpRequests);
    const lpTokenInfo = decodeLPTokenInfo(lpResponse);

    const tokenRequests: ContractCallContext[] = [
        {
            reference: CONTRACT_NAME.TOKEN0,
            contractAddress: lpTokenInfo.token0,
            abi: ERC20_ABI,
            calls: [
                { reference: ERC20_METHOD_NAME.DECIMALS, methodName: ERC20_METHOD_NAME.DECIMALS, methodParameters: [] },
            ]
        },
        {
            reference: CONTRACT_NAME.TOKEN1,
            contractAddress: lpTokenInfo.token1,
            abi: ERC20_ABI,
            calls: [
                { reference: ERC20_METHOD_NAME.DECIMALS, methodName: ERC20_METHOD_NAME.DECIMALS, methodParameters: [] },
            ]
        }
    ];
    const tokensResponse: ContractCallResults = await multicall.call(tokenRequests);
    const tokensInfo = decodeToken0AndToken1Info(tokensResponse);
    return {
        lpDecimals: Number(lpTokenInfo.decimals),
        lpTotalSupply: BigNumber.from(lpTokenInfo.totalSupply),
        lpToken0Address: lpTokenInfo.token0 as string,
        lpToken0Decimals: Number(tokensInfo.token0Decimals),
        lpToken0Reserve: BigNumber.from(lpTokenInfo.reserves0),
        lpToken1Address: lpTokenInfo.token1 as string,
        lpToken1Decimals: Number(tokensInfo.token1Decimals),
        lpToken1Reserve: BigNumber.from(lpTokenInfo.reserves1),
    };
};
