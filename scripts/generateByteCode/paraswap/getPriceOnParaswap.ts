import axios from "axios";

const baseURL = "https://apiv5.paraswap.io";

export const getPriceOnParaswap = async (
    srcToken: string,
    srcDecimals: number,
    destToken: string,
    destDecimals: number,
    amountTokenBN: string,
    side = "BUY",
    chainId: number
) => {
    try {
        const { data: priceData } = await axios.get(`${baseURL}/prices/`, {
            params: {
                srcToken,
                srcDecimals,
                destToken,
                destDecimals,
                amount: amountTokenBN,
                side,
                network: +chainId
            }
        });
        return priceData;
    } catch (error: any) {
        if (error?.response?.data?.error) throw new Error(error.response.data.error);
        throw error;
    }
};
