require("dotenv").config();
const chainConfigs = require('../chain.config');
const { deploymentMockToken } = require("./deploymentMockToken");
const chainConfig = chainConfigs[chainConfigs.chain];
const isTesting = chainConfig.isTesting;


module.exports = {

    deployment: async function () {

        //====================================================

        if (isTesting) {
            await deploymentMockToken();
        }

        //contracts addresses
        let proxyAdminAddress;
        let backendPriceProviderAddress;
        let chainlinkPriceProviderAddress;
        let uniswapV2PriceProviderAddress;
        let uniswapV2PriceProviderMockAddress;
        let priceProviderAggregatorAddress;

        let bondtrollerAddress;
        let blendingAddress;
        let plpAddress;

        //====================================================================
        //deploy all system of PriceProviderAggregator

        const { deploymentPriceProviderAggregator } = require("./priceOracle/deploymentPriceProviderAggregator.js");
        let priceOracleAddresses = await deploymentPriceProviderAggregator();
        console.log({ priceOracleAddresses });
        proxyAdminAddress = priceOracleAddresses.proxyAdminAddress;
        pythPriceProviderAddress = priceOracleAddresses.pythPriceProviderAddress,
        chainlinkPriceProviderAddress = priceOracleAddresses.chainlinkPriceProviderAddress;
        backendPriceProviderAddress = priceOracleAddresses.backendPriceProviderAddress;
        uniswapV2PriceProviderAddress = priceOracleAddresses.uniswapV2PriceProviderAddress;
        uniswapV2PriceProviderMockAddress = priceOracleAddresses.uniswapV2PriceProviderMockAddress;
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
        blendingAddress = primaryLendingPlatformAddresses.blendingAddress;
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
            pythPriceProviderAddress: pythPriceProviderAddress,
            chainlinkPriceProviderAddress: chainlinkPriceProviderAddress,
            backendPriceProviderAddress: backendPriceProviderAddress,
            uniswapV2PriceProviderAddress: uniswapV2PriceProviderAddress,
            uniswapV2PriceProviderMockAddress: uniswapV2PriceProviderMockAddress,
            priceProviderAggregatorAddress: priceProviderAggregatorAddress,
            bondtrollerAddress: bondtrollerAddress,
            blendingAddress: blendingAddress,
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
        return addresses;
        if (isTesting) {
            return addresses;
        } else {
            console.log(addresses);
        }
    }
};