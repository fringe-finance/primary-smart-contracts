const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

module.exports = {
   
    deployment : async function () {

    //====================================================
    //declare parameters

        let network = await hre.network;
        console.log("Network name: "+network.name);

        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];

        console.log("DeployMaster: "+deployMaster.address);
        
        //contracts addresses
        let proxyAdminAddress;
        let backendPriceProviderAddress;
        let chainlinkPriceProviderAddress;
        let uniswapV2PriceProviderAddress;
        let priceProviderAggregatorAddress;

        let bondtrollerAddress;
        let busdcAddress;
        let pitAddress;

    //====================================================================
    //deploy all system of PriceProviderAggregator
    
        const { deploymentPriceOracle } = require("./priceOracle/deploymentPriceProividerAggregator.js");
        let priceOracleAddresses = await deploymentPriceOracle();
        console.log(priceOracleAddresses);
        proxyAdminAddress = priceOracleAddresses.proxyAdminAddress;
        chainlinkPriceProviderAddress = priceOracleAddresses.chainlinkPriceProviderAddress;
        backendPriceProviderAddress = priceOracleAddresses.backendPriceProviderAddress;
        uniswapV2PriceProviderAddress = priceOracleAddresses.uniswapV2PriceProviderAddress;
        priceProviderAggregatorAddress = priceOracleAddresses.priceProviderAggregatorAddress;

        console.log();
        console.log();
        console.log();

    //====================================================================
    //deploy all system of USBPlatform
    
        const { deploymentPrimaryLendingPlatform } = require("./primaryLendingPlatform/deploymentPrimaryLendingPlatform.js");
        let primaryLendingPlatformAddresses = await deploymentPrimaryLendingPlatform();

        console.log(primaryLendingPlatformAddresses);
        bondtrollerAddress = primaryLendingPlatformAddresses.bondtrollerAddress;
        busdcAddress = primaryLendingPlatformAddresses.blendingAddress;
        pitAddress = primaryLendingPlatformAddresses.pitAddress;

    //====================================================
    //return uses for tests
    
        let addresses = {
            proxyAdminAddress : proxyAdminAddress,
            chainlinkPriceProviderAddress : chainlinkPriceProviderAddress,
            backendPriceProviderAddress : backendPriceProviderAddress,
            uniswapV2PriceProviderAddress : uniswapV2PriceProviderAddress,
            priceProviderAggregatorAddress : priceProviderAggregatorAddress,
            bondtrollerAddress: bondtrollerAddress,
            busdcAddress: busdcAddress,
            pitAddress: pitAddress,
        }

        console.log(addresses)
        
        return addresses
    }


};