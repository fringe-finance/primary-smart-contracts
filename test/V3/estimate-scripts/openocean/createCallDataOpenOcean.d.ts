import { BigNumberish } from "ethers";
export declare const createCallDataOpenOcean: (srcToken: string, srcDecimals: BigNumberish, srcAmount: BigNumberish, destToken: string, { chainId, account }: {
    chainId: string;
    account: string;
}, gasPriceInGWei: string) => Promise<{
    data: string;
    amount: number;
}>;
