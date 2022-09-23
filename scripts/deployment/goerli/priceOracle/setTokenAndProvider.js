const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../../config/config.json';
const configProviderFile = '../../../config_PriceProvider.example';
const config = require(configFile);
const configProvider = require(configProviderFile);

let {
    ChainlinkPriceProviderProxy, 
    BackendPriceProviderProxy,
    UniswapV3PriceProviderProxy, 
    PriceProviderAggregatorProxy,
} = config;

let {
    PRJsAddresses,
    uniswapPairAddresses,
    WETH,
    chainlinkAggregatorV3_WETH_USD,
    LINK,
    chainlinkAggregatorV3_LINK_USD,
    MATIC,
    chainlinkAggregatorV3_MATIC_USD,
    WBTC,
    chainlinkAggregatorV3_WBTC_WETH,
    TWAPPeriods,
} = configProvider;

async function main() {

    //====================================================
    //declare parametrs

    let network = await hre.network;
    console.log("Network name: "+network.name);
    
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];

    console.log("DeployMaster: "+deployMaster.address);
    let deployMasterAddress = deployMaster.address;

    // Contracts ABI
    let ChainlinkPriceProvider;
    let BackendPriceProvider;
    let UniswapV3PriceProvider;
    let PriceProviderAggregator;

    //contracts addresses
    let chainlinkPriceProviderAddress = ChainlinkPriceProviderProxy;
    let uniswapV3PriceProviderAddress = UniswapV3PriceProviderProxy;
    let priceProviderAggregatorAddress = PriceProviderAggregatorProxy;
    let backendPriceProviderAddress = BackendPriceProviderProxy;

    let usdDecimal;

    //====================================================
    //initialize deploy parametrs
    ChainlinkPriceProvider = await hre.ethers.getContractFactory("ChainlinkPriceProvider");
    BackendPriceProvider = await hre.ethers.getContractFactory("BackendPriceProvider");
    UniswapV3PriceProvider = await hre.ethers.getContractFactory("UniswapV3PriceProvider");
    PriceProviderAggregator = await hre.ethers.getContractFactory("PriceProviderAggregator");

    //instances of contracts
    let chainlinkPriceProvider = await ChainlinkPriceProvider.attach(chainlinkPriceProviderAddress).connect(deployMaster);
    let backendPriceProvider = await BackendPriceProvider.attach(backendPriceProviderAddress).connect(deployMaster);;
    let uniswapV3PriceProvider = await UniswapV3PriceProvider.attach(uniswapV3PriceProviderAddress).connect(deployMaster);
    let priceProviderAggregator = await PriceProviderAggregator.attach(priceProviderAggregatorAddress).connect(deployMaster);

    //==============================
    //initialize
    console.log();
    console.log("***** SETTING CHAINLINK PRICE PROVIDER *****");

    usdDecimal = await chainlinkPriceProvider.usdDecimals();

    if(usdDecimal == 0) {
        await chainlinkPriceProvider.initialize()
        .then(function(instance){
            console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " initialized at tx hash: " + instance.hash);
        });
    }

    await chainlinkPriceProvider.grandModerator(priceProviderAggregatorAddress)
    .then(function(instance){
        console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " granded moderator " + priceProviderAggregatorAddress + " at tx hash: " + instance.hash);
    });

    await chainlinkPriceProvider.setTokenAndAggregator(
        WETH,
        [chainlinkAggregatorV3_WETH_USD]
    ).then(function(instance){
        console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set token with parameters: ")
        console.log("   token: " + WETH)
        console.log("   aggregator path: " + [chainlinkAggregatorV3_WETH_USD]);
        console.log(" at tx hash: " + instance.hash)
    });

    await chainlinkPriceProvider.setTokenAndAggregator(
        LINK,
        [chainlinkAggregatorV3_LINK_USD]
    ).then(function(instance){
        console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set token with parameters: ")
        console.log("   token: " + LINK)
        console.log("   aggregator path: " + [chainlinkAggregatorV3_LINK_USD]);
        console.log(" at tx hash: " + instance.hash)
    });

    await chainlinkPriceProvider.setTokenAndAggregator(
        MATIC,
        [chainlinkAggregatorV3_MATIC_USD]
    ).then(function(instance){
        console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set token with parameters: ")
        console.log("   token: " + MATIC)
        console.log("   aggregator path: " + [chainlinkAggregatorV3_MATIC_USD]);
        console.log(" at tx hash: " + instance.hash)
    });

    await chainlinkPriceProvider.setTokenAndAggregator(
        WBTC,
        [chainlinkAggregatorV3_WBTC_WETH, chainlinkAggregatorV3_WETH_USD]
    ).then(function(instance){
        console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set token with parameters: ")
        console.log("   token: " + WBTC)
        console.log("   aggregator path: " + [chainlinkAggregatorV3_WBTC_WETH, chainlinkAggregatorV3_WETH_USD]);
        console.log(" at tx hash: " + instance.hash)
    });
    //==============================
    //initialize
    console.log();
    console.log("***** SETTING BACKEND PRICE PROVIDER *****");
    usdDecimal = await backendPriceProvider.usdDecimals();
    if(usdDecimal == 0) {
        await backendPriceProvider.initialize()
        .then(function(instance){
            console.log("backendPriceProvider " + backendPriceProviderAddress + " initialized at tx hash: " + instance.hash);
        });
    }

    await backendPriceProvider.grandTrustedBackendRole(deployMasterAddress)
    .then(function(instance){
        console.log("BackendPriceProvider " + backendPriceProvider.address + " set trusted backend "+ deployMasterAddress + " at tx hash: " + instance.hash);
    });

    await backendPriceProvider.setToken(WETH).then(function(instance){
        console.log("BackendPriceProvider " + backendPriceProvider.address + " set token "+ WETH + "at tx hash: " + instance.hash);
    });
    //==============================
    //initialize
    console.log();
    console.log("***** SETTING UNISWAPV3 PRICE PROVIDER *****");

    usdDecimal = await uniswapV3PriceProvider.getPriceDecimals();
    if(usdDecimal == 0) {
        await uniswapV3PriceProvider.initialize(Factory)
        .then(function(instance){
            console.log("uniswapv3 " + uniswapV3PriceProviderAddress + " initialized at tx hash: " + instance.hash);
        });
    }

    await uniswapV3PriceProvider.grandModerator(priceProviderAggregatorAddress).then(function(instance){
        console.log("UniswapV3PriceProvider granded moderator " + priceProviderAggregatorAddress + " at tx hash: " + instance.hash);
    });

    for(var i = 0; i < PRJsAddresses.length; i++){
        await uniswapV3PriceProvider.setTokenAndPair(PRJsAddresses[i], uniswapPairAddresses[i], TWAPPeriods[i]).then(function(instance){
            console.log("UniswapV3PriceProvider  set token " + PRJsAddresses[i] + " and pair " + uniswapPairAddresses[i] + " with period " + TWAPPeriods[i] + " at tx hash: " + instance.hash);
        });

    }

    //==============================
    //initialize
    console.log();
    console.log("***** SETTING PRICE PROVIDER *****");
    usdDecimal = await priceProviderAggregator.usdDecimals();
    if(usdDecimal == 0) {
        await priceProviderAggregator.initialize()
        .then(function(instance){
            console.log("usbPriceProvider " + priceProviderAggregatorAddress + " initialized at tx hash: "  + instance.hash);
        });
    }
    await priceProviderAggregator.grandModerator(deployMasterAddress).then(function(instance){
        console.log("PriceProviderAggregator " + priceProviderAggregator.address + " granded moderator " + deployMasterAddress + " at tx hash: " + instance.hash);
    });

    await priceProviderAggregator.setTokenAndPriceProvider(WETH, chainlinkPriceProviderAddress, false).then(function(instance){
        console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ WETH + " with priceOracle " + chainlinkPriceProviderAddress + " at tx hash: " + instance.hash);
    });

    await priceProviderAggregator.setTokenAndPriceProvider(LINK, chainlinkPriceProviderAddress, false).then(function(instance){
        console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ LINK + " with priceOracle " + chainlinkPriceProviderAddress  + " at tx hash: " + instance.hash);
    });

    await priceProviderAggregator.setTokenAndPriceProvider(MATIC, chainlinkPriceProviderAddress, false).then(function(instance){
        console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ MATIC + " with priceOracle " + chainlinkPriceProviderAddress + " at tx hash: " + instance.hash);
    });

    await priceProviderAggregator.setTokenAndPriceProvider(WBTC, chainlinkPriceProviderAddress, false).then(function(instance){
        console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ WBTC + " with priceOracle " + chainlinkPriceProviderAddress + " at tx hash: " + instance.hash);
    });

    for(var i = 0; i < PRJsAddresses.length; i++){
        await priceProviderAggregator.setTokenAndPriceProvider(PRJsAddresses[i], uniswapPairAddresses[i], false).then(function(instance){

            console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ PRJsAddresses[i] + " with priceOracle " + uniswapPairAddresses + " at tx hash: " + instance.hash);
        });

    }
};

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});