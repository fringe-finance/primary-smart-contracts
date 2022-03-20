const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

module.exports = {
   
    deploymentAndSettingPriceOracle : async function (input_proxyAdminAddress) {

    //====================================================
    //declare parametrs

        let network = await hre.network;
        console.log("Network name: "+network.name);
       
        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];

        console.log("DeployMaster: "+deployMaster.address);

        let deployMasterAddress = deployMaster.address;

        // Contracts ABI
        let ProxyAdmin;
        let TransparentUpgradeableProxy;
        let ChainlinkPriceProvider;
        let BackendPriceProvider;
        let UniswapV2PriceProvider;
        let PriceProviderAggregator;
 

        //instances of contracts
        let proxyAdmin;
        let chainlinkPriceProvider;
        let backendPriceProvider;
        let uniswapV2PriceProvider;
        let priceProviderAggregator;

        //contracts addresses
        let proxyAdminAddress;
        let chainlinkPriceProviderAddress;
        let uniswapV2PriceProviderAddress;
        let priceProviderAggregatorAddress;


    //====================================================
    //initialize deploy parametrs

        ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
        TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
        ChainlinkPriceProvider = await hre.ethers.getContractFactory("ChainlinkPriceProvider");
        BackendPriceProvider = await hre.ethers.getContractFactory("BackendPriceProvider");
        UniswapV2PriceProvider = await hre.ethers.getContractFactory("UniswapV2PriceProvider");
        PriceProviderAggregator = await hre.ethers.getContractFactory("PriceProviderAggregator");
      
        const {
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

            WETHrinkeby,
            chainlinkAggregatorV3_WETHrinkeby,

        } = require('../config.js');


    //====================================================
    //deploy proxy admin

        console.log();
        console.log("***** PROXY ADMIN DEPLOYMENT *****");
        if(input_proxyAdminAddress == undefined){
            proxyAdmin = await ProxyAdmin.connect(deployMaster).deploy();
            await proxyAdmin.deployed();
            proxyAdminAddress = proxyAdmin.address;
            console.log("ProxyAdmin deployed at: " + proxyAdminAddress);
        }else{
            console.log("ProxyAdmin is deployed at: " + input_proxyAdminAddress);
            proxyAdminAddress = input_proxyAdminAddress;
        }

    //====================================================
    //deploy chainlinkPriceProvider
    
        console.log();
        console.log("***** CHAINLINK PRICE PROVIDER DEPLOYMENT *****");

        chainlinkPriceProvider = await ChainlinkPriceProvider.connect(deployMaster).deploy();
        await chainlinkPriceProvider.deployed();
        let chainlinkPriceProviderMasterCopyAddress = chainlinkPriceProvider.address;
        console.log("ChainlinkPriceProvider masterCopy address: " + chainlinkPriceProviderMasterCopyAddress);

        let chainlinkPriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            chainlinkPriceProviderMasterCopyAddress,
            proxyAdminAddress,
            "0x"
        );
        await chainlinkPriceProviderProxy.deployed();
        let chainlinkPriceProviderProxyAddress = chainlinkPriceProviderProxy.address;
        console.log("ChainlinkPriceProvider proxy address: " + chainlinkPriceProviderProxyAddress);
        chainlinkPriceProviderAddress = chainlinkPriceProviderProxyAddress;

    //====================================================
    //deploy backendPriceProvider
        console.log();
        console.log("***** BACKEND PRICE PROVIDER DEPLOYMENT *****");

        backendPriceProvider = await BackendPriceProvider.connect(deployMaster).deploy();
        await backendPriceProvider.deployed();
        let backendPriceProviderMasterCopyAddress = backendPriceProvider.address;
        console.log("BackendPriceProvider masterCopy address: " + backendPriceProviderMasterCopyAddress);

        let backendPriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            backendPriceProviderMasterCopyAddress,
            proxyAdminAddress,
            "0x"
        );
        await backendPriceProviderProxy.deployed();
        let backendPriceProviderProxyAddress = backendPriceProviderProxy.address;
        console.log("BackendPriceProvider proxy address: " + backendPriceProviderProxyAddress);
        backendPriceProviderAddress = backendPriceProviderProxyAddress;


    //=========================
    //deploy uniswapV2PriceProvider 
        console.log();
        console.log("***** UNISWAPV2 PRICE PROVIDER DEPLOYMENT *****");

        uniswapV2PriceProvider = await UniswapV2PriceProvider.connect(deployMaster).deploy();
        await uniswapV2PriceProvider.deployed();
        let uniswapV2PriceProviderMasterCopyAddress = uniswapV2PriceProvider.address;
        console.log("UniswapV2PriceProvider masterCopy address: " + uniswapV2PriceProviderMasterCopyAddress);

        let uniswapV2PriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            uniswapV2PriceProviderMasterCopyAddress,
            proxyAdminAddress,
            "0x"
        );
        await uniswapV2PriceProviderProxy.deployed();
        let uniswapV2PriceProviderProxyAddress = uniswapV2PriceProviderProxy.address;
        console.log("UniswapV2PriceProvider proxy address: " + uniswapV2PriceProviderProxyAddress);
        uniswapV2PriceProviderAddress = uniswapV2PriceProviderProxyAddress;

    //=========================
    //deploy PriceProviderAggregator
        console.log();
        console.log("***** PRICE PROVIDER AGGREGATOR DEPLOYMENT *****");
    
        priceProviderAggregator = await PriceProviderAggregator.connect(deployMaster).deploy();
        await priceProviderAggregator.deployed();
        let priceProviderAggregatorMasterCopyAddress = priceProviderAggregator.address;
        console.log("PriceProviderAggregator masterCopy address: "+priceProviderAggregatorMasterCopyAddress);

        let priceProviderAggregatorProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            priceProviderAggregatorMasterCopyAddress,
            proxyAdminAddress,
            "0x"
        );
        await priceProviderAggregatorProxy.deployed();
        let priceProviderAggregatorProxyAddress = priceProviderAggregatorProxy.address;
        console.log("PriceProviderAggregator proxy address: " + priceProviderAggregatorProxyAddress);
        priceProviderAggregatorAddress = priceProviderAggregatorProxyAddress;

    //====================================================
    //setting params

        chainlinkPriceProvider = await ChainlinkPriceProvider.attach(chainlinkPriceProviderAddress).connect(deployMaster);
        backendPriceProvider = await BackendPriceProvider.attach(backendPriceProviderAddress).connect(deployMaster);
        uniswapV2PriceProvider = await UniswapV2PriceProvider.attach(uniswapV2PriceProviderAddress).connect(deployMaster);
        priceProviderAggregator = await PriceProviderAggregator.attach(priceProviderAggregatorAddress).connect(deployMaster);
    
        //==============================
        //set chainlinkPriceProvider
        console.log();
        console.log("***** SETTING CHAINLINK PRICE PROVIDER *****");

        await chainlinkPriceProvider.initialize()
        .then(function(){
            console.log("ChainlinkPriceProvider initialized at " + chainlinkPriceProviderAddress);
        });

        await chainlinkPriceProvider.grandModerator(priceProviderAggregatorAddress)
        .then(function(){
            console.log("ChainlinkPriceProvider granded moderator "+priceProviderAggregatorAddress);
        });

        await chainlinkPriceProvider.setTokenAndAggregator(WETHrinkeby, chainlinkAggregatorV3_WETHrinkeby)
        .then(function(){
            console.log("ChainlinkPriceProvider set token "+ WETHrinkeby +" and aggregator " + chainlinkAggregatorV3_WETHrinkeby);
        });

        // add another prjs


        //==============================
        //set backendPriceProvider
        console.log();
        console.log("***** SETTING BACKEND PRICE PROVIDER *****");

        await backendPriceProvider.initialize()
        .then(function(){
            console.log("BackendPriceProvider initialized at " + backendPriceProviderAddress);
        });

        await backendPriceProvider.grandTrustedBackendRole(deployMasterAddress)
        .then(function(){
            console.log("BackendPriceProvider set trusted backend "+ deployMasterAddress);
        });

        let backendToken1 = WETHrinkeby;
        await backendPriceProvider.setToken(backendToken1)
        .then(function(){
            console.log("BackendPriceProvider set token "+ backendToken1)
        });

        //==============================
        //set uniswapV2PriceProvider
        console.log();
        console.log("***** SETTING UNISWAPV2 PRICE PROVIDER *****");

        await uniswapV2PriceProvider.initialize()
        .then(function(){
            console.log("UniswapV2PriceProvider initialized at "+ uniswapV2PriceProviderAddress);
        });

        await uniswapV2PriceProvider.grandModerator(priceProviderAggregatorAddress)
        .then(function(){
            console.log("UniswapV2PriceProvider granded moderator "+priceProviderAggregatorAddress);
        });

        await uniswapV2PriceProvider.setTokenAndPair(prj1Address, uniswapPairPrj1Address)
        .then(function(){
            console.log("UniswapV2PriceProvider set token "+ prj1Address + " and pair "+ uniswapPairPrj1Address);
        });

        await uniswapV2PriceProvider.setTokenAndPair(prj2Address, uniswapPairPrj2Address)
        .then(function(){
            console.log("UniswapV2PriceProvider set token "+ prj2Address+" and pair "+ uniswapPairPrj2Address);
        });

        await uniswapV2PriceProvider.setTokenAndPair(prj3Address, uniswapPairPrj3Address)
        .then(function(){
            console.log("UniswapV2PriceProvider set token "+ prj3Address+" and pair "+ uniswapPairPrj3Address);
        });

        await uniswapV2PriceProvider.setTokenAndPair(prj4Address, uniswapPairPrj4Address)
        .then(function(){
            console.log("UniswapV2PriceProvider set token "+ prj4Address+" and pair "+ uniswapPairPrj4Address);
        });

        await uniswapV2PriceProvider.setTokenAndPair(prj5Address, uniswapPairPrj5Address)
        .then(function(){
            console.log("UniswapV2PriceProvider set token "+ prj5Address+" and pair "+ uniswapPairPrj5Address);
        });

        await uniswapV2PriceProvider.setTokenAndPair(prj6Address, uniswapPairPrj6Address)
        .then(function(){
            console.log("UniswapV2PriceProvider set token "+ prj6Address+" and pair "+ uniswapPairPrj6Address);
        });

        //==============================
        //set priceProviderAggregator
        console.log();
        console.log("***** SETTING USB PRICE ORACLE *****");

        await priceProviderAggregator.initialize()
        .then(function(){
            console.log("PriceProviderAggregator initialized at " + priceProviderAggregatorAddress);
        });

        await priceProviderAggregator.grandModerator(deployMasterAddress)
        .then(function(){
            console.log("PriceProviderAggregator granded moderator " + deployMasterAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(WETHrinkeby, chainlinkPriceProviderAddress, false)
        .then(function(){
            console.log("PriceProviderAggregator set token "+ WETHrinkeby + " with priceOracle " + chainlinkPriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(prj1Address, uniswapV2PriceProviderAddress, false)
        .then(function(){
            console.log("PriceProviderAggregator set token "+ prj1Address + " with priceOracle " + uniswapV2PriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(prj2Address, uniswapV2PriceProviderAddress, false)
        .then(function(){
            console.log("PriceProviderAggregator set token "+ prj2Address + " with priceOracle " + uniswapV2PriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(prj3Address, uniswapV2PriceProviderAddress, false)
        .then(function(){
            console.log("PriceProviderAggregator set token "+ prj3Address + " with priceOracle " + uniswapV2PriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(prj4Address, uniswapV2PriceProviderAddress, false)
        .then(function(){
            console.log("PriceProviderAggregator set token "+ prj4Address + " with priceOracle " + uniswapV2PriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(prj5Address, uniswapV2PriceProviderAddress, false)
        .then(function(){
            console.log("PriceProviderAggregator set token "+ prj5Address + " with priceOracle " + uniswapV2PriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(prj6Address, uniswapV2PriceProviderAddress, false)
        .then(function(){
            console.log("PriceProviderAggregator set token "+ prj6Address + " with priceOracle " + uniswapV2PriceProviderAddress);
        });
 
        return {
            proxyAdminAddress : proxyAdminAddress,
            chainlinkPriceProviderAddress : chainlinkPriceProviderAddress,
            backendPriceProviderAddress : backendPriceProviderAddress,
            uniswapV2PriceProviderAddress : uniswapV2PriceProviderAddress,
            priceProviderAggregatorAddress : priceProviderAggregatorAddress,
        }
    }


};
