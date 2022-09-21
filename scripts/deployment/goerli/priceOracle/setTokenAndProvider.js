const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../../../config/config.json';
const config = require(configFile);

let {
    ChainlinkPriceProviderProxy, 
    BackendPriceProviderProxy,
    UniswapV3PriceProviderProxy, 
    PriceProviderAggregatorProxy,

    PRJsAddresses,
    uniswapPairAddresses,

    uniswapPairPrj1Address,
    uniswapPairPrj2Address,
    uniswapPairPrj3Address,
    uniswapPairPrj4Address,
    uniswapPairPrj5Address,
    uniswapPairPrj6Address,
    Pool_Fee,

    WETH,
    chainlinkAggregatorV3_WETH_USD,

    LINK,
    chainlinkAggregatorV3_LINK_USD,

    MATIC,
    chainlinkAggregatorV3_MATIC_USD,

    WBTC,
    chainlinkAggregatorV3_WBTC_WETH,
    TWAPPeriods,
    TWAP_Period_PRJ1,
    TWAP_Period_PRJ2,
    TWAP_Period_PRJ3,
    TWAP_Period_PRJ4,
    TWAP_Period_PRJ5,
    TWAP_Period_PRJ6
} = config;

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
    await chainlinkPriceProvider.grandModerator(priceProviderAggregatorAddress)
    .then(function(instance){
        console.log("\nTransaction hash: " + instance.hash)
        console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " granded moderator " + priceProviderAggregatorAddress);
    });

    await chainlinkPriceProvider.setTokenAndAggregator(
        WETH,
        [chainlinkAggregatorV3_WETH_USD]
    ).then(function(instance){
        console.log("\nTransaction hash: " + instance.hash)
        console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set token with parameters: ")
        console.log("   token: " + WETH)
        console.log("   aggregator path: " + [chainlinkAggregatorV3_WETH_USD]);
    });

    await chainlinkPriceProvider.setTokenAndAggregator(
        LINK,
        [chainlinkAggregatorV3_LINK_USD]
    ).then(function(instance){
        console.log("\nTransaction hash: " + instance.hash)
        console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set token with parameters: ")
        console.log("   token: " + LINK)
        console.log("   aggregator path: " + [chainlinkAggregatorV3_LINK_USD]);
    });

    await chainlinkPriceProvider.setTokenAndAggregator(
        MATIC,
        [chainlinkAggregatorV3_MATIC_USD]
    ).then(function(instance){
        console.log("\nTransaction hash: " + instance.hash)
        console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set token with parameters: ")
        console.log("   token: " + MATIC)
        console.log("   aggregator path: " + [chainlinkAggregatorV3_MATIC_USD]);
    });

    await chainlinkPriceProvider.setTokenAndAggregator(
        WBTC,
        [chainlinkAggregatorV3_WBTC_WETH, chainlinkAggregatorV3_WETH_USD]
    ).then(function(instance){
        console.log("\nTransaction hash: " + instance.hash)
        console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set token with parameters: ")
        console.log("   token: " + WBTC)
        console.log("   aggregator path: " + [chainlinkAggregatorV3_WBTC_WETH, chainlinkAggregatorV3_WETH_USD]);
    });
    //==============================
    //initialize
    console.log();
    console.log("***** SETTING BACKEND PRICE PROVIDER *****");
    await backendPriceProvider.grandTrustedBackendRole(deployMasterAddress)
    .then(function(instance){
        console.log("\nTransaction hash: " + instance.hash) 
        console.log("BackendPriceProvider " + backendPriceProvider.address + " set trusted backend "+ deployMasterAddress);
    });

    await backendPriceProvider.setToken(WETH).then(function(instance){
        console.log("\nTransaction hash: " + instance.hash)
        console.log("BackendPriceProvider " + backendPriceProvider.address + " set token "+ WETH)
    });
    //==============================
    //initialize
    console.log();
    console.log("***** SETTING UNISWAPV3 PRICE PROVIDER *****");
    await uniswapV3PriceProvider.grandModerator(priceProviderAggregatorAddress).then(function(instance){
        console.log("\nTransaction hash: " + instance.hash)
        console.log("UniswapV3PriceProvider granded moderator "+priceProviderAggregatorAddress);
    });

    for(var i = 0; i < PRJsAddresses.length; i++){
        await uniswapV3PriceProvider.setTokenAndPair(PRJsAddresses[i], uniswapPairAddresses[i], TWAPPeriods[i]).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("UniswapV3PriceProvider  set token " + PRJsAddresses[i] + " and pair " + uniswapPairAddresses[i] + " with period " + TWAPPeriods[i]);
        });

    }

    //==============================
    //initialize
    console.log();
    console.log("***** SETTING PRICE PROVIDER *****");
    await priceProviderAggregator.grandModerator(deployMasterAddress).then(function(instance){
        console.log("\nTransaction hash: " + instance.hash)
        console.log("PriceProviderAggregator " + priceProviderAggregator.address + " granded moderator " + deployMasterAddress);
    });

    await priceProviderAggregator.setTokenAndPriceProvider(WETH, chainlinkPriceProviderAddress, false).then(function(instance){
        console.log("\nTransaction hash: " + instance.hash)
        console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ WETH + " with priceOracle " + chainlinkPriceProviderAddress);
    });

    await priceProviderAggregator.setTokenAndPriceProvider(LINK, chainlinkPriceProviderAddress, false).then(function(instance){
        console.log("\nTransaction hash: " + instance.hash)
        console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ LINK + " with priceOracle " + chainlinkPriceProviderAddress);
    });

    await priceProviderAggregator.setTokenAndPriceProvider(MATIC, chainlinkPriceProviderAddress, false).then(function(instance){
        console.log("\nTransaction hash: " + instance.hash)
        console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ MATIC + " with priceOracle " + chainlinkPriceProviderAddress);
    });

    await priceProviderAggregator.setTokenAndPriceProvider(WBTC, chainlinkPriceProviderAddress, false).then(function(instance){
        console.log("\nTransaction hash: " + instance.hash)
        console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ WBTC + " with priceOracle " + chainlinkPriceProviderAddress);
    });

    for(var i = 0; i < PRJsAddresses.length; i++){
        await priceProviderAggregator.setTokenAndPriceProvider(PRJsAddresses[i], uniswapPairAddresses[i], false).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ PRJsAddresses[i] + " with priceOracle " + uniswapPairAddresses);
        });

    }
};

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
