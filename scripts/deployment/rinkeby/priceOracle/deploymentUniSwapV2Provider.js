const hre = require("hardhat");
const BN = hre.ethers.BigNumber;
const fs = require("fs");
const path = require("path");
const configFile = '../../../config/config_rinkeby.json';
const config = require(configFile);
const toBN = (num) => BN.from(num);
const { ethers, run} = require('hardhat');

module.exports = {
   
    deploymentPriceOracle : async function () {

    //====================================================
    //declare parametrs

        let network = await hre.network;
        console.log("Network name: "+network.name);
       
        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];

        console.log("DeployMaster: "+deployMaster.address);

        let deployMasterAddress = deployMaster.address;

        // Contracts ABI
        let UniswapV2ProviderLogicAbi;
        let TransparentUpgradeableProxyAbi
 
        //instances of contracts
        let uniswapV2ProviderLogicInstances;
        let uniswapV2ProviderProxyInstances;
 

        let {
            PRIMARY_PROXY_ADMIN,
            UniswapV2PriceProviderLogic, 
            UniswapV2PriceProviderProxy, 
            PriceProviderAggregatorProxy,

            prj1Address,
            prj2Address,
            prj3Address,
            prj4Address,
            prj5Address,
            prj6Address,

            uniswapPairPrj1Address,
            uniswapPairPrj2Address,
            uniswapPairPrj3Address,
            uniswapPairPrj4Address,
            uniswapPairPrj5Address,
            uniswapPairPrj6Address,

            TWAP_Period_PRJ1,
            TWAP_Period_PRJ2,
            TWAP_Period_PRJ3,
            TWAP_Period_PRJ4,
            TWAP_Period_PRJ5,
            TWAP_Period_PRJ6
        } = config;

        //contracts addresses
        let uniswapV2ProviderLogicAddress = UniswapV2PriceProviderLogic;
        let uniswapV2ProviderProxyAddress = UniswapV2PriceProviderProxy;
        let proxyAdminAddress = PRIMARY_PROXY_ADMIN;
        let priceProviderAggregatorProxyAddress = PriceProviderAggregatorProxy;


    //====================================================
    //initialize deploy parametrs

        ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
        TransparentUpgradeableProxyAbi = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
        UniswapV2ProviderLogicAbi = await hre.ethers.getContractFactory("UniswapV2PriceProvider");
        PriceProviderAggregatorAbi = await hre.ethers.getContractFactory("PriceProviderAggregator");

    //=========================
    //deploy uniswapV2PriceProvider 
        console.log();
        console.log("***** UNISWAPV2 PRICE PROVIDER DEPLOYMENT *****");

        if(!uniswapV2ProviderLogicAddress) {
            uniswapV2ProviderLogicInstances = await UniswapV2ProviderLogicAbi.connect(deployMaster).deploy();
            await uniswapV2ProviderLogicInstances.deployed().then(async function(instance){
                uniswapV2ProviderLogicAddress = instance.address
                config.UniswapV2PriceProviderLogic = uniswapV2ProviderLogicAddress;
                fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("UniswapV2Provider logic deployed at: ", uniswapV2ProviderLogicAddress);
        // await sleep(30000);
        // await run("verify:verify", {
        //     address: uniswapV2ProviderLogicAddress,
        //     constructorArguments: [],
        // }).catch((err) => console.log(err.message));

        if (!uniswapV2ProviderProxyAddress) {
            uniswapV2ProviderProxyInstances = await TransparentUpgradeableProxyAbi.connect(deployMaster).deploy(
                uniswapV2ProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await uniswapV2ProviderProxyInstances.deployed().then(function(instance){
                uniswapV2ProviderProxyAddress = instance.address
                config.UniswapV2PriceProviderProxy = uniswapV2ProviderProxyAddress;
                fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
            });
        }

        await sleep(30000);
        await run("verify:verify", {
            address: uniswapV2ProviderProxyAddress,
            constructorArguments: [uniswapV2ProviderLogicAddress, proxyAdminAddress, "0x"],
        }).catch((err) => console.log(err.message));
    //====================================================
    // //setting params
        uniswapV2PriceProvider = await UniswapV2ProviderLogicAbi.attach(uniswapV2ProviderProxyAddress).connect(deployMaster);
        priceProviderAggregator = await PriceProviderAggregatorAbi.attach(priceProviderAggregatorProxyAddress).connect(deployMaster);

        //==============================
        //set uniswapV2PriceProvider
        console.log();
        console.log("***** SETTING UNISWAPV2 PRICE PROVIDER *****");
        let usdDecimals = await uniswapV2PriceProvider.usdDecimals();
        if(usdDecimals != 0) {
            await uniswapV2PriceProvider.initialize().then(function(instance){
                console.log("UniswapV2PriceProvider initialized at "+ uniswapV2ProviderProxyAddress);
            });
        }

        await uniswapV2PriceProvider.initialize().then(function(instance){
            console.log("UniswapV2PriceProvider initialized at "+ uniswapV2ProviderProxyAddress);
        });

        await uniswapV2PriceProvider.grandModerator(priceProviderAggregatorProxyAddress).then(function(instance){
            console.log("UniswapV2PriceProvider granded moderator "+priceProviderAggregatorProxyAddress);
        });

        await uniswapV2PriceProvider.setTokenAndPair(prj1Address, uniswapPairPrj1Address, TWAP_Period_PRJ1).then(function(instance){
            console.log("UniswapV2PriceProvider set token "+ prj1Address + " and pair "+ uniswapPairPrj1Address);
        });

        await uniswapV2PriceProvider.setTokenAndPair(prj2Address, uniswapPairPrj2Address, TWAP_Period_PRJ2).then(function(instance){
            console.log("UniswapV2PriceProvider set token "+ prj2Address+" and pair "+ uniswapPairPrj2Address);
        });

        await uniswapV2PriceProvider.setTokenAndPair(prj3Address, uniswapPairPrj3Address, TWAP_Period_PRJ3).then(function(instance){
            console.log("UniswapV2PriceProvider set token "+ prj3Address+" and pair "+ uniswapPairPrj3Address);
        });

        await uniswapV2PriceProvider.setTokenAndPair(prj4Address, uniswapPairPrj4Address, TWAP_Period_PRJ4).then(function(instance){
            console.log("UniswapV2PriceProvider set token "+ prj4Address+" and pair "+ uniswapPairPrj4Address);
        });

        await uniswapV2PriceProvider.setTokenAndPair(prj5Address, uniswapPairPrj5Address, TWAP_Period_PRJ5).then(function(instance){
            console.log("UniswapV2PriceProvider set token "+ prj5Address+" and pair "+ uniswapPairPrj5Address);
        });

        await uniswapV2PriceProvider.setTokenAndPair(prj6Address, uniswapPairPrj6Address, TWAP_Period_PRJ6).then(function(instance){
            console.log("UniswapV2PriceProvider set token "+ prj6Address+" and pair "+ uniswapPairPrj6Address);
        });

        console.log("Done - setTokenAndPair");

        //==============================
        //set priceProviderAggregator
        console.log();
        console.log("***** SETTING USB PRICE ORACLE *****");

        // await priceProviderAggregator.initialize().then(function(instance){
        //     console.log("\nTransaction hash: " + instance.hash)
        //     console.log("PriceProviderAggregator initialized at " + priceProviderAggregatorAddress);
        // });

        // await priceProviderAggregator.grandModerator(deployMasterAddress).then(function(instance){
        //     console.log("\nTransaction hash: " + instance.hash)
        //     console.log("PriceProviderAggregator " + priceProviderAggregator.address + " granded moderator " + deployMasterAddress);
        // });

        // await priceProviderAggregator.setTokenAndPriceProvider(WETH, chainlinkPriceProviderAddress, false).then(function(instance){
        //     console.log("\nTransaction hash: " + instance.hash)
        //     console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ WETH + " with priceOracle " + chainlinkPriceProviderAddress);
        // });

        // await priceProviderAggregator.setTokenAndPriceProvider(LINK, chainlinkPriceProviderAddress, false).then(function(instance){
        //     console.log("\nTransaction hash: " + instance.hash)
        //     console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ LINK + " with priceOracle " + chainlinkPriceProviderAddress);
        // });

        // await priceProviderAggregator.setTokenAndPriceProvider(MATIC, chainlinkPriceProviderAddress, false).then(function(instance){
        //     console.log("\nTransaction hash: " + instance.hash)
        //     console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ MATIC + " with priceOracle " + chainlinkPriceProviderAddress);
        // });

        // await priceProviderAggregator.setTokenAndPriceProvider(WBTC, chainlinkPriceProviderAddress, false).then(function(instance){
        //     console.log("\nTransaction hash: " + instance.hash)
        //     console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ WBTC + " with priceOracle " + chainlinkPriceProviderAddress);
        // });

        await priceProviderAggregator.setTokenAndPriceProvider(prj1Address, uniswapV2ProviderProxyAddress, false).then(function(instance){
            console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ prj1Address + " with priceOracle " + uniswapV2ProviderProxyAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(prj2Address, uniswapV2ProviderProxyAddress, false).then(function(instance){
            console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ prj2Address + " with priceOracle " + uniswapV2ProviderProxyAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(prj3Address, uniswapV2ProviderProxyAddress, false).then(function(instance){
            console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ prj3Address + " with priceOracle " + uniswapV2ProviderProxyAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(prj4Address, uniswapV2ProviderProxyAddress, false).then(function(instance){
            console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ prj4Address + " with priceOracle " + uniswapV2ProviderProxyAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(prj5Address, uniswapV2ProviderProxyAddress, false).then(function(instance){
            console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ prj5Address + " with priceOracle " + uniswapV2ProviderProxyAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(prj6Address, uniswapV2ProviderProxyAddress, false).then(function(instance){
            console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ prj6Address + " with priceOracle " + uniswapV2ProviderProxyAddress);
        });

        console.log("Done - setTokenAndPriceProvider");

    }


};
