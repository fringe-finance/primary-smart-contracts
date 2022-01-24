const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

module.exports = {
   
    deploymentAllToRinkeby : async function () {

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


    //====================================================
    //initialize deploy parametrs

   

    //====================================================
    //deploy proxy admin
        
        console.log();
        console.log("***** PROXY ADMIN DEPLOYMENT *****");
        proxyAdmin = await ProxyAdmin.connect(deployMaster).deploy();
        await proxyAdmin.deployed();
        proxyAdminAddress = proxyAdmin.address;
        console.log("ProxyAdmin deployed at: "+proxyAdminAddress);

    //====================================================================
    //deploy all system of PriceProviderAggregator
    
        // const { deploymentAndSettingPriceOracle } = require("./deploymentPriceOracle/deploymentAndSettingPriceOracle.js");
        // let priceOracleAddresses = await deploymentAndSettingPriceOracle(proxyAdminAddress);
        // console.log(priceOracleAddresses);

        // chainlinkPriceProviderAddress = priceOracleAddresses.chainlinkPriceProviderAddress;
        // backendPriceProviderAddress = priceOracleAddresses.backendPriceProviderAddress;
        // uniswapV2PriceProviderAddress = priceOracleAddresses.uniswapV2PriceProviderAddress;
        // priceProviderAggregatorAddress = priceOracleAddresses.priceProviderAggregatorAddress;

        priceProviderAggregatorAddress = '0xB7D77809d1Ef631FCaeA6b151d6453dBA727F6EC';

    //====================================================================
    //deploy all system of USBPlatform
    
        const { deploymentAndSettingPrimaryLendingPlatform } = require("./deploymentPrimaryLendingPlatform/deploymentAndSettingPrimaryLendingPlatform.js");
        let primaryLendingPlatformAddresses = await deploymentAndSettingPrimaryLendingPlatform(proxyAdminAddress, priceProviderAggregatorAddress);

        console.log(primaryLendingPlatformAddresses);
        bondtrollerAddress = primaryLendingPlatformAddresses.bondtrollerAddress;
        busdcAddress = primaryLendingPlatformAddresses.busdcAddress;
        pitAddress = primaryLendingPlatformAddresses.pitAddress;

    //====================================================
    //return uses for tests
    
        return {
            proxyAdminAddress : proxyAdminAddress,
            chainlinkPriceProviderAddress : chainlinkPriceProviderAddress,
            uniswapV2PriceProviderAddress : uniswapV2PriceProviderAddress,
            priceProviderAggregatorAddress : priceProviderAggregatorAddress,
            bondtrollerAddress: bondtrollerAddress,
            busdcAddress: busdcAddress,
            pitAddress: pitAddress,
        }
    }


};
