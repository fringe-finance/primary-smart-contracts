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
    }
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

        const txDataBody = {
            ...priceData,
            srcToken,
            destToken,
            slippage: "5",
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
