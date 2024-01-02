import { BigNumber, BigNumberish } from "ethers";
import { ERC20_ABI } from "../abis/ERC20";
import { Pair } from "../enum/pairType";
import { toBN } from "./helpers";
import { loadContractInstance } from "./loadContract";
import { loadPairInstance } from "./loadPairInstance";

export const unwrap = async (pair: string, amount: BigNumberish, pairType: Pair, signerOrProvider: any) => {
    const pairInstance = loadPairInstance(pair, pairType, signerOrProvider);

    const token0 = await pairInstance?.token0();
    const token1 = await pairInstance?.token1();
    const totalSupply = await pairInstance?.totalSupply();

    const token0Instance = loadContractInstance(token0, ERC20_ABI, signerOrProvider);
    const balance0 = await token0Instance.balanceOf(pair);
    const token0Decimals = await token0Instance.decimals();

    const token1Instance = loadContractInstance(token1, ERC20_ABI, signerOrProvider);
    const balance1 = await token1Instance.balanceOf(pair);
    const token1Decimals = await token1Instance.decimals();

    return {
        token0,
        token0Decimals,
        amount0: toBN(amount).mul(balance0).div(totalSupply),
        token1,
        token1Decimals,
        amount1: toBN(amount).mul(balance1).div(totalSupply)
    };
};

export const unwrapLP = async (lpAddress: string, pairType: Pair, signerOrProvider: any) => {
    const lpInstance = loadPairInstance(lpAddress, pairType, signerOrProvider);
    const lpDecimals = await lpInstance?.decimals();
    const { _reserve0: lpToken0Reserve, _reserve1: lpToken1Reserve } = await lpInstance?.getReserves();
    const lpTotalSupply = await lpInstance?.totalSupply();
    const lpToken0Address = await lpInstance?.token0();
    const lpToken1Address = await lpInstance?.token1();

    const lpToken0Instance = loadContractInstance(lpToken0Address, ERC20_ABI, signerOrProvider);
    const lpToken0Decimals = await lpToken0Instance.decimals();
    const lpToken0Liquidity = await lpToken0Instance.balanceOf(lpAddress);

    const lpToken1Instance = loadContractInstance(lpToken1Address, ERC20_ABI, signerOrProvider);
    const lpToken1Decimals = await lpToken1Instance.decimals();
    const lpToken1Liquidity = await lpToken1Instance.balanceOf(lpAddress);

    return {
        lpDecimals: Number(lpDecimals),
        lpTotalSupply: BigNumber.from(lpTotalSupply),
        lpToken0Address: lpToken0Address as string,
        lpToken0Decimals: Number(lpToken0Decimals),
        lpToken0Reserve: BigNumber.from(lpToken0Reserve),
        lpToken0Liquidity: BigNumber.from(lpToken0Liquidity),
        lpToken1Address: lpToken1Address as string,
        lpToken1Decimals: Number(lpToken1Decimals),
        lpToken1Reserve: BigNumber.from(lpToken1Reserve),
        lpToken1Liquidity: BigNumber.from(lpToken1Liquidity)
    };
};
