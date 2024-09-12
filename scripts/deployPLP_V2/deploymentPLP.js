require("dotenv").config();
const isTesting = process.env.TESTING === "true";

const log = (...args) => {
    if (isTesting) {
        return
    } else {
        console.log(...args);
    }
}

module.exports = {

    deployment: async function () {

        //====================================================

        //contracts addresses
        let proxyAdminAddress;
        let chainlinkPriceProviderAddress;
        let uniswapV3PriceProviderAddress;
        let uniswapV2PriceProviderMockAddress;
        let priceProviderAggregatorAddress;

        let bondtrollerAddress;
        let busdcAddress;
        let plpAddress;

        //====================================================================
        //deploy all system of PriceProviderAggregator

        const { deploymentPriceOracle } = require("./priceOracle/deploymentPriceProviderAggregator.js");
        let priceOracleAddresses = await deploymentPriceOracle();
        proxyAdminAddress = priceOracleAddresses.proxyAdminAddress;
        priceOracleAddress = priceOracleAddresses.priceOracleAddress;
        chainlinkPriceProviderAddress = priceOracleAddresses.chainlinkPriceProviderAddress;
        uniswapV3PriceProviderAddress = priceOracleAddresses.uniswapV3PriceProviderAddress;
        uniswapV2PriceProviderMockAddress = priceOracleAddresses.uniswapV2PriceProviderMockAddress;
        pythPriceProviderAddress = priceOracleAddresses.pythPriceProviderAddress;
        priceProviderAggregatorAddress = priceOracleAddresses.priceProviderAggregatorAddress;

        log();
        log();
        log();

        //====================================================================
        //deploy all system of USBPlatform

        const { deploymentPrimaryLendingPlatform } = require("./primaryLendingPlatform/deploymentPrimaryLendingPlatform.js");
        let primaryLendingPlatformAddresses = await deploymentPrimaryLendingPlatform();

        log({ primaryLendingPlatformAddresses });
        bondtrollerAddress = primaryLendingPlatformAddresses.bondtrollerAddress;
        busdcAddress = primaryLendingPlatformAddresses.blendingAddress;
        plpAddress = primaryLendingPlatformAddresses.plpAddress;
        plpLiquidationAddress = primaryLendingPlatformAddresses.plpLiquidationAddress;
        plpAtomicRepaymentAddress = primaryLendingPlatformAddresses.plpAtomicRepaymentAddress;
        plpLeverageAddress = primaryLendingPlatformAddresses.plpLeverageAddress;
        plpWrappedTokenGateway = primaryLendingPlatformAddresses.plpWrappedTokenGateway;
        plpModerator = primaryLendingPlatformAddresses.plpModerator;
        projectTokens = primaryLendingPlatformAddresses.projectTokens;
        lendingTokens = primaryLendingPlatformAddresses.lendingTokens;
        jumpRateModelAddress = primaryLendingPlatformAddresses.jumpRateModelAddress;

        //====================================================
        //return uses for tests

        let addresses = {
            proxyAdminAddress: proxyAdminAddress,
            priceOracleAddress: priceOracleAddress,
            chainlinkPriceProviderAddress: chainlinkPriceProviderAddress,
            uniswapV3PriceProviderAddress: uniswapV3PriceProviderAddress,
            uniswapV2PriceProviderMockAddress: uniswapV2PriceProviderMockAddress,
            pythPriceProviderAddress: pythPriceProviderAddress,
            priceProviderAggregatorAddress: priceProviderAggregatorAddress,
            bondtrollerAddress: bondtrollerAddress,
            busdcAddress: busdcAddress,
            plpAddress: plpAddress,
            plpLiquidationAddress: plpLiquidationAddress,
            plpAtomicRepaymentAddress: plpAtomicRepaymentAddress,
            plpLeverageAddress: plpLeverageAddress,
            plpWrappedTokenGateway: plpWrappedTokenGateway,
            plpModerator: plpModerator,
            projectTokens: projectTokens,
            lendingTokens: lendingTokens,
            jumpRateModelAddress: jumpRateModelAddress
        };
        if (isTesting) {
            return addresses;
        } else {
            log(addresses);
            log("<========================== DONE! ==========================>");
            return addresses;
        }
    }


};