require("dotenv").config();
const isTesting = Object.keys(process.env).includes('TESTING');



module.exports = {

    deployment: async function () {

        //====================================================

        //contracts addresses
        let proxyAdminAddress;
        let backendPriceProviderAddress;
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
        console.log({ priceOracleAddresses });
        proxyAdminAddress = priceOracleAddresses.proxyAdminAddress;
        priceOracleAddress = priceOracleAddresses.priceOracleAddress;
        chainlinkPriceProviderAddress = priceOracleAddresses.chainlinkPriceProviderAddress;
        backendPriceProviderAddress = priceOracleAddresses.backendPriceProviderAddress;
        uniswapV3PriceProviderAddress = priceOracleAddresses.uniswapV3PriceProviderAddress;
        uniswapV2PriceProviderMockAddress = priceOracleAddresses.uniswapV2PriceProviderMockAddress;
        pythPriceProviderAddress = priceOracleAddresses.pythPriceProviderAddress;
        priceProviderAggregatorAddress = priceOracleAddresses.priceProviderAggregatorAddress;

        console.log();
        console.log();
        console.log();

        //====================================================================
        //deploy all system of USBPlatform

        const { deploymentPrimaryLendingPlatform } = require("./primaryLendingPlatform/deploymentPrimaryLendingPlatform.js");
        let primaryLendingPlatformAddresses = await deploymentPrimaryLendingPlatform();

        console.log({ primaryLendingPlatformAddresses });
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
            backendPriceProviderAddress: backendPriceProviderAddress,
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
            console.log(addresses);
            console.log("<========================== DONE! ==========================>");
        }
    }


};