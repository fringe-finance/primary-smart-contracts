const { EvmPriceServiceConnection } = require("@pythnetwork/pyth-evm-js");
const axios = require('axios');
const BD = require("js-big-decimal");
const BN = hre.ethers.BigNumber;
const toBN = (num) => BN.from(num);
const OOEJson = require("../artifacts-for-testing/OpenOceanExchange.json");
const ifaceOpenOceanExchange = new hre.ethers.utils.Interface(OOEJson.abi);
const connection = new EvmPriceServiceConnection(
    "https://xc-mainnet.pyth.network"
);
const checkDiscrepancy = (
    expectedAmountOut,
    actualAmountOut,
    maxDiscrepancy
) => {
    let discrepancy = actualAmountOut.sub(expectedAmountOut);
    let maxDiscrepancyLen = maxDiscrepancy.length;
    let numerator = (Number(maxDiscrepancy) * 10 ** (maxDiscrepancyLen - 2) + 10 ** (maxDiscrepancyLen - 2)).toString();
    let denominator = (10 ** (maxDiscrepancyLen - 2)).toString();
    return (
        discrepancy.gte(toBN(0)) &&
        discrepancy.lte(
            (
                (expectedAmountOut.mul(toBN(numerator))).div(toBN(denominator))
                    .sub(expectedAmountOut)
            )
        )
    );
}
async function getSwapData(
    chain,
    inTokenAddress,
    outTokenAddress,
    amount,
    gasPrice,
    slippage,
    account
) {
    try {
        const res = await axios.get(`https://open-api.openocean.finance/v3/${chain}/swap_quote`, {
            params: {
                chain: chain,
                inTokenAddress: inTokenAddress,
                outTokenAddress: outTokenAddress,
                amount: amount,
                gasPrice: gasPrice,
                slippage: slippage,
                account: account
            }
        });
        let decodeData;
        let encodeData;
        let guaranteedAmount;
        try {
            encodeData = res.data.data.data;
            decodeData = ifaceOpenOceanExchange.decodeFunctionData("swap", encodeData);
            guaranteedAmount = decodeData.desc.guaranteedAmount;
        } catch (error) {
            guaranteedAmount = toBN(0);
        }

        return { guaranteedAmount, decodeData, encodeData };

    } catch (error) {
        throw new Error(error);
    }
}
async function swapEstimateAmountIn (
    chain,
    inTokenAddress,
    outTokenAddress,
    amountIn,
    inTokenDecimal,
    expectedAmountOut,
    gasPrice,
    slippage,
    account,
    preActualAmountOut,
    maxDiscrepancy
) {
    let { guaranteedAmount, decodeData, encodeData } = await getSwapData(
        chain,
        inTokenAddress,
        outTokenAddress,
        ethers.utils.formatUnits(amountIn, inTokenDecimal),
        gasPrice,
        slippage,
        account
    );
    if (guaranteedAmount.eq(toBN(0))) {
        return { decodeData, encodeData };
    }
    if (
        preActualAmountOut.eq(toBN(0)) &&
        guaranteedAmount.lt(expectedAmountOut)
    ) {
        return { decodeData, encodeData };
    }

    if (checkDiscrepancy(
        expectedAmountOut,
        guaranteedAmount,
        maxDiscrepancy
    )) {
        return { decodeData, encodeData };
    }
    else {
        let newAmountIn = expectedAmountOut.mul(decodeData.desc.amount).div(guaranteedAmount);
        return await swapEstimateAmountIn(
            chain,
            inTokenAddress,
            outTokenAddress,
            newAmountIn,
            inTokenDecimal,
            expectedAmountOut,
            gasPrice,
            slippage,
            account,
            guaranteedAmount,
            maxDiscrepancy
        );
    }
}
async function getPriceFeedsUpdateData(priceIds) {
    let updateData = await connection.getPriceFeedsUpdateData(priceIds);
    if (updateData.length != priceIds.length) {
        updateData = [];
        for (const priceId of priceIds) {
            updateData.push((await connection.getPriceFeedsUpdateData([priceId]))[0]);
        }
        return updateData;
    }
    return updateData;
}
module.exports = {
    getSwapData,
    swapEstimateAmountIn,
    getPriceFeedsUpdateData
};
