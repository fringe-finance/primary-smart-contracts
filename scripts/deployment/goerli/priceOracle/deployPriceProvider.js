const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../../config/config.json';
const config = require(configFile);

let {
    PRIMARY_PROXY_ADMIN, 
    ChainlinkPriceProviderLogic,
    ChainlinkPriceProviderProxy, 
    BackendPriceProviderLogic,
    BackendPriceProviderProxy,
    UniswapV2PriceProviderProxy, 
    PriceProviderAggregatorLogic,
    PriceProviderAggregatorProxy,
    UniswapV3PriceProviderLogic,
    UniswapV3PriceProviderProxy,
    Factory,
    Fee,
    USDCTest 
} = config;

let backendPriceProviderLogicAddress = BackendPriceProviderLogic
let chainlinkPriceProviderLogicAddress = ChainlinkPriceProviderLogic;
let priceProviderAggregatorLogicAddress = PriceProviderAggregatorLogic;
let uniswapV3PriceProviderLogicAddress = UniswapV3PriceProviderLogic;

async function verify(contractAddress, constructor) {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructor,
    }).catch((err) => console.log(err.message));
    console.log("Contract verified at: ", contractAddress);
}

async function main() {

    //====================================================
    //declare parametrs

    let network = await hre.network;
    console.log("Network name: "+network.name);
    
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];

    console.log("DeployMaster: "+deployMaster.address);

    // Contracts ABI
    let TransparentUpgradeableProxy;
    let ChainlinkPriceProvider;
    let BackendPriceProvider;
    let UniswapV2PriceProvider;
    let PriceProviderAggregator;
    let UniswapV3PriceProvider;


    //instances of contracts
    let chainlinkPriceProvider;
    let backendPriceProvider;
    let uniswapV2PriceProvider;
    let priceProviderAggregator;
    let uniswapV3PriceProvider;

    //contracts addresses
    let proxyAdminAddress = PRIMARY_PROXY_ADMIN;
    let chainlinkPriceProviderAddress = ChainlinkPriceProviderProxy;
    let uniswapV2PriceProviderAddress = UniswapV2PriceProviderProxy;
    let priceProviderAggregatorAddress = PriceProviderAggregatorProxy;
    let backendPriceProviderAddress = BackendPriceProviderProxy;
    let uniswapV3PriceProviderAddress = UniswapV3PriceProviderProxy;
    

    let usdDecimal;

    //====================================================
    //initialize deploy parametrs

    ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
    TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
    ChainlinkPriceProvider = await hre.ethers.getContractFactory("ChainlinkPriceProvider");
    BackendPriceProvider = await hre.ethers.getContractFactory("BackendPriceProvider");
    UniswapV2PriceProvider = await hre.ethers.getContractFactory("UniswapV2PriceProvider");
    PriceProviderAggregator = await hre.ethers.getContractFactory("PriceProviderAggregator");
    UniswapV3PriceProvider = await hre.ethers.getContractFactory("UniswapV3PriceProvider");

    //====================================================
    //deploy chainlinkPriceProvider
    console.log();
    console.log("***** CHAINLINK PRICE PROVIDER DEPLOYMENT *****");

    if(!chainlinkPriceProviderLogicAddress) {
        chainlinkPriceProvider = await ChainlinkPriceProvider.connect(deployMaster).deploy();
        await chainlinkPriceProvider.deployed().then(function(instance){
            console.log("ChainlinkPriceProvider masterCopy address: " + instance.address)
            chainlinkPriceProviderLogicAddress = instance.address;
            config.ChainlinkPriceProviderLogic = chainlinkPriceProviderLogicAddress;
            fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
        });
        await verify(chainlinkPriceProviderLogicAddress, []);
    }

    if(!chainlinkPriceProviderAddress) {
        let chainlinkPriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            chainlinkPriceProviderLogicAddress,
            proxyAdminAddress,
            "0x"
        );
        await chainlinkPriceProviderProxy.deployed().then(function(instance){
            console.log("ChainlinkPriceProvider proxy address: " + instance.address);
            chainlinkPriceProviderAddress = instance.address;
            config.ChainlinkPriceProviderProxy = chainlinkPriceProviderAddress;
            fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
        });
        await verify(chainlinkPriceProviderAddress, [chainlinkPriceProviderLogicAddress, proxyAdminAddress, "0x"]);
    }
    //
    chainlinkPriceProvider = await ChainlinkPriceProvider.attach(chainlinkPriceProviderAddress).connect(deployMaster);
    //==============================
    //initialize
    console.log();
    console.log("***** SETTING CHAINLINK PRICE PROVIDER *****");
    usdDecimal = await chainlinkPriceProvider.usdDecimals();
    if(usdDecimal == 0) {
        await chainlinkPriceProvider.initialize()
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("ChainlinkPriceProvider initialized at " + chainlinkPriceProviderAddress);
        });
    }
    //====================================================
    //deploy backendPriceProvider
    console.log();
    console.log("***** BACKEND PRICE PROVIDER DEPLOYMENT *****");
    if(!backendPriceProviderLogicAddress) {
        backendPriceProvider = await BackendPriceProvider.connect(deployMaster).deploy();
        await backendPriceProvider.deployed().then(function(instance){
            console.log("ChainlinkPriceProvider masterCopy address: " + instance.address)
            backendPriceProviderLogicAddress = instance.address;
            config.BackendPriceProviderLogic = backendPriceProviderLogicAddress;
            fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
        });
        await verify(backendPriceProviderLogicAddress, []);
    }
    
    if(!backendPriceProviderAddress) {
        let backendPriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            backendPriceProviderLogicAddress,
            proxyAdminAddress,
            "0x"
        );
        await backendPriceProviderProxy.deployed().then(function(instance){
            console.log("BackendPriceProvider proxy address: " + instance.address);
            backendPriceProviderAddress = instance.address;
            config.BackendPriceProviderProxy = backendPriceProviderAddress;
            fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
        });
        await verify(backendPriceProviderAddress, [backendPriceProviderLogicAddress, proxyAdminAddress, "0x"]);
    }
    backendPriceProvider = await BackendPriceProvider.attach(backendPriceProviderAddress).connect(deployMaster);
    //==============================
    //initialize
    console.log();
    console.log("***** SETTING BACKEND PRICE PROVIDER *****");
    usdDecimal = await backendPriceProvider.usdDecimals();
    if(usdDecimal == 0) {
        await backendPriceProvider.initialize()
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("backendPriceProvider initialized at " + backendPriceProviderAddress);
        });
    }
    //===========================
    console.log();
    console.log("***** UNISWAPV3 PRICE PROVIDER DEPLOYMENT *****");

    if(!uniswapV3PriceProviderLogicAddress) {
        uniswapV3PriceProvider = await UniswapV3PriceProvider.connect(deployMaster).deploy();
        await uniswapV3PriceProvider.deployed().then(function(instance){
            console.log("UniswapV3PriceProvider masterCopy address: " + instance.address);
            uniswapV3PriceProviderLogicAddress = instance.address;
            config.UniswapV3PriceProviderLogic = uniswapV3PriceProviderLogicAddress;
            fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 3));
        });
        await verify(uniswapV3PriceProviderLogicAddress, []);
    }
    if(!uniswapV3PriceProviderAddress) {
        let uniswapV3PriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            uniswapV3PriceProviderLogicAddress,
            proxyAdminAddress,
            "0x"
        );
        await uniswapV3PriceProviderProxy.deployed().then(function(instance){
            console.log("UniswapV3PriceProvider proxy address: " + instance.address);
            uniswapV3PriceProviderAddress = instance.address;
            config.UniswapV3PriceProviderProxy = uniswapV3PriceProviderAddress;
            fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(config, null, 2));
        });
        await verify(uniswapV3PriceProviderAddress, [uniswapV3PriceProviderLogicAddress, proxyAdminAddress, "0x"]);
    }

    uniswapV3PriceProvider = await UniswapV3PriceProvider.attach(uniswapV3PriceProviderAddress).connect(deployMaster);

    //==============================
    //initialize
    console.log();
    console.log("***** SETTING UNISWAPV3 PRICE PROVIDER *****");
    usdDecimal = await uniswapV3PriceProvider.getPriceDecimals();
    if(usdDecimal == 0) {
        await uniswapV3PriceProvider.initialize(Factory)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("uniswapv3 initialized at " + uniswapV3PriceProviderAddress);
        });
    }

    //=========================
    //deploy PriceProviderAggregator
    console.log();
    console.log("***** USB PRICE ORACLE DEPLOYMENT *****");

    if(!priceProviderAggregatorLogicAddress) {
        priceProviderAggregator = await PriceProviderAggregator.connect(deployMaster).deploy();
        await priceProviderAggregator.deployed().then(function(instance){
            console.log("PriceProviderAggregator masterCopy address: " + instance.address);
            priceProviderAggregatorLogicAddress = instance.address;
            config.PriceProviderAggregatorLogic = priceProviderAggregatorLogicAddress;
            fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(config, null, 2));
        });
        await verify(priceProviderAggregatorLogicAddress, []);
    }

    if(!priceProviderAggregatorAddress) {
        let usbPriceOracleProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            priceProviderAggregatorLogicAddress,
            proxyAdminAddress,
            "0x"
        );
        await usbPriceOracleProxy.deployed().then(function(instance){
            console.log("PriceProviderAggregator proxy address: " + instance.address);
            priceProviderAggregatorAddress = instance.address;
            config.PriceProviderAggregatorProxy = priceProviderAggregatorAddress;
            fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(config, null, 2));
        });
        await verify(priceProviderAggregatorAddress, [priceProviderAggregatorLogicAddress, proxyAdminAddress, "0x"]);
    }
    
    priceProviderAggregator = await PriceProviderAggregator.attach(priceProviderAggregatorAddress).connect(deployMaster);

    //==============================
    //initialize
    console.log();
    console.log("***** SETTING PRICE PROVIDER *****");
    usdDecimal = await priceProviderAggregator.usdDecimals();
    if(usdDecimal == 0) {
        await priceProviderAggregator.initialize()
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("usbPriceProvider initialized at " + priceProviderAggregatorAddress);
        });
    }
};

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
