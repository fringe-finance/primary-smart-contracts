import axios from "axios";
import { BigNumberish, ethers } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import { OOE_ABI } from "../abis/OpenOceanExchange";
import { tryDecodeFuncData } from "../utils/tryDecodeFuncData";

const baseURL = "https://open-api.openocean.finance/v3";
const ifaceOpenOceanExchange = new ethers.utils.Interface(OOE_ABI);

export const createCallDataOpenOcean = async (
    srcToken: string,
    srcDecimals: BigNumberish,
    srcAmount: BigNumberish,
    destToken: string,
    {
        chainId = "1",
        account
    }: {
        chainId: string;
        account: string;
    },
    gasPriceInGWei: string
) => {
    const { data: priceData } = await axios.get(`${baseURL}/${chainId}/swap_quote`, {
        params: {
            chain: chainId,
            inTokenAddress: srcToken,
            outTokenAddress: destToken,
            amount: formatUnits(srcAmount, srcDecimals),
            gasPrice: gasPriceInGWei,
            slippage: "5",
            account: account
        }
    });
    let data = "";
    let amount = 0;
    console.log({
        priceData
    });

    if (priceData?.data?.data) {
        data = priceData.data.data;
        amount = tryDecodeFuncData(data, OOE_ABI, ifaceOpenOceanExchange);
    }
    return {
        data,
        amount
    };
};
