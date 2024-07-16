import axios from "axios";
import { getPriceOnParaswap } from "./getPriceOnParaswap";

const baseURL = "https://apiv5.paraswap.io";

export const createCallDataParaswap = async (
    srcToken: string,
    srcDecimals: number,
    destToken: string,
    destDecimals: number,
    amountTokenBN: string,
    side = "BUY",
    {
        chainId = 1,
        account
    }: {
        chainId: number;
        account: string;
    },
    maxDiscrepancy: string = "0.05"
) => {
    try {
        const priceData = await getPriceOnParaswap(
            srcToken,
            srcDecimals,
            destToken,
            destDecimals,
            amountTokenBN,
            side,
            +chainId
        );
        const slippage = Math.round(Number(maxDiscrepancy) * 10000);
        const txDataBody = {
            ...priceData,
            srcToken,
            destToken,
            slippage,
            [side === "BUY" ? `destAmount` : `srcAmount`]: amountTokenBN,
            userAddress: account
        };

        const { data: txData } = await axios.post(`${baseURL}/transactions/${+chainId}/`, txDataBody, {
            params: { ignoreChecks: true }
        });
        const amount = side === "SELL" ? priceData.priceRoute.destAmount : priceData.priceRoute.srcAmount;
        return {
            data: txData.data ? txData.data : "",
            amount: amount ? amount : 0
        };
    } catch (error: any) {
        if (error?.response?.data?.error) throw new Error(error.response.data.error);

        throw error;
    }
};
