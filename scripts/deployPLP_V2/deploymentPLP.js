const hre = require("hardhat");
const BN = hre.ethers.BigNumber;
require("dotenv").config();
const chainConfigs = require('../../chain.config');
const chainConfig = chainConfigs[chainConfigs.chain];
const isTesting = chainConfig.isTesting;


module.exports = {

    deployment: async function () {

        //====================================================

        //contracts addresses
        let proxyAdminAddress;
        let backendPriceProviderAddress;
        let chainlinkPriceProviderAddress;
        let uniswapV2PriceProviderAddress;
        let uniswapV2PriceProviderMockAddress;
        let priceProviderAggregatorAddress;

        let bondtrollerAddress;
        let busdcAddress;
        let plpAddress;

        //====================================================================
        //deploy all system of PriceProviderAggregator

        const { deploymentPriceOracle } = require("./priceOracle/deploymentPriceProividerAggregator.js");
        let priceOracleAddresses = await deploymentPriceOracle();
        console.log({ priceOracleAddresses });
        proxyAdminAddress = priceOracleAddresses.proxyAdminAddress;
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
            chainlinkPriceProviderAddress: chainlinkPriceProviderAddress,
            backendPriceProviderAddress: backendPriceProviderAddress,
            uniswapV2PriceProviderAddress: uniswapV2PriceProviderAddress,
            uniswapV2PriceProviderMockAddress: uniswapV2PriceProviderMockAddress,
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
        }
    }


};