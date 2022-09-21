const hre = require("hardhat");
const BN = hre.ethers.BigNumber;
const fs = require("fs");
const path = require("path");
const configFile = '../../config/config.json';
const config = require(configFile);
const toBN = (num) => BN.from(num);

module.exports = {
   
    deploymentRinkeby : async function () {

    //====================================================
    //declare parametrs

        let network = await hre.network;
        console.log("Network name: "+network.name);

        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];

        console.log("DeployMaster: "+deployMaster.address);

        let deployMasterAddress = deployMaster.address;

        // Contracts ABI
        let ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
        let TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
    
        //instances of contracts
        let proxyAdmin;
        
        //contracts addresses
        let proxyAdminAddress;
        let backendPriceProviderAddress;
        let chainlinkPriceProviderAddress;
        let uniswapV2PriceProviderAddress;
        let priceProviderAggregatorAddress;

        let bondtrollerAddress;
        let busdcAddress;
        let pitAddress;

        let {
            ChainlinkPriceProviderLogic, 
            ChainlinkPriceProviderProxy, 
            BackendPriceProviderLogic, 
            BackendPriceProviderProxy, 
            UniswapV2PriceProviderLogic, 
            UniswapV2PriceProviderProxy, 
            PriceProviderAggregatorLogic
        } = config;


    //====================================================
    //initialize deploy parametrs

   


    //====================================================================
    //deploy all system of PriceProviderAggregator
    
        const { deploymentPriceOracle } = require("./priceOracle/deploymentPriceOracle.js");
        let priceOracleAddresses = await deploymentPriceOracle(proxyAdminAddress);
        console.log(priceOracleAddresses);

        chainlinkPriceProviderAddress = priceOracleAddresses.chainlinkPriceProviderAddress;
        backendPriceProviderAddress = priceOracleAddresses.backendPriceProviderAddress;
        uniswapV2PriceProviderAddress = priceOracleAddresses.uniswapV2PriceProviderAddress;
        priceProviderAggregatorAddress = priceOracleAddresses.priceProviderAggregatorAddress;

    //====================================================================
    //deploy all system of USBPlatform
    
        const { deploymentPrimaryLendingPlatform } = require("./primaryLendingPlatform/deploymentPrimaryLendingPlatform.js");
        let primaryLendingPlatformAddresses = await deploymentPrimaryLendingPlatform(proxyAdminAddress, priceProviderAggregatorAddress);

        console.log(primaryLendingPlatformAddresses);
        bondtrollerAddress = primaryLendingPlatformAddresses.bondtrollerAddress;
        busdcAddress = primaryLendingPlatformAddresses.busdcAddress;
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
