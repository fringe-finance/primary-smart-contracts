export declare const createCallDataParaswap: (srcToken: string, srcDecimals: number, destToken: string, destDecimals: number, amountTokenBN: string, side: string | undefined, { chainId, account }: {
    chainId: number;
    account: string;
}) => Promise<{
    data: any;
    amount: any;
}>;
