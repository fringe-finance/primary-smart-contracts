const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

module.exports = {
   
    deploymentPriceOracle : async function (input_proxyAdminAddress) {

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

            WETH,
            chainlinkAggregatorV3_WETH_USD,

            LINK,
            chainlinkAggregatorV3_LINK_USD,
        
            MATIC,
            chainlinkAggregatorV3_MATIC_USD,

            WBTC,
            chainlinkAggregatorV3_WBTC_WETH
        
        } = require('../config.js');


    //====================================================
    //deploy proxy admin

        console.log();
        console.log("***** PROXY ADMIN DEPLOYMENT *****");
        if(input_proxyAdminAddress == undefined){
            proxyAdmin = await ProxyAdmin.connect(deployMaster).deploy();
            await proxyAdmin.deployed().then(function(instance){
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                console.log("ProxyAdmin deployed at: " + instance.address);
            });
            proxyAdminAddress = proxyAdmin.address;
        }else{
            console.log("ProxyAdmin is deployed at: " + input_proxyAdminAddress);
            proxyAdminAddress = input_proxyAdminAddress;
        }

    //====================================================
    //deploy chainlinkPriceProvider
        console.log();
        console.log("***** CHAINLINK PRICE PROVIDER DEPLOYMENT *****");

        chainlinkPriceProvider = await ChainlinkPriceProvider.connect(deployMaster).deploy();
        await chainlinkPriceProvider.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash)
            console.log("ChainlinkPriceProvider masterCopy address: " + instance.address)
        });
        let chainlinkPriceProviderMasterCopyAddress = chainlinkPriceProvider.address;
        
        let chainlinkPriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            chainlinkPriceProviderMasterCopyAddress,
            proxyAdminAddress,
            "0x"
        );
        await chainlinkPriceProviderProxy.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash)
            console.log("ChainlinkPriceProvider proxy address: " + instance.address);

        });
        let chainlinkPriceProviderProxyAddress = chainlinkPriceProviderProxy.address;
        chainlinkPriceProviderAddress = chainlinkPriceProviderProxyAddress;

    //====================================================
    //deploy backendPriceProvider
        console.log();
        console.log("***** BACKEND PRICE PROVIDER DEPLOYMENT *****");

        backendPriceProvider = await BackendPriceProvider.connect(deployMaster).deploy();
        await backendPriceProvider.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash)
            console.log("BackendPriceProvider masterCopy address: " + instance.address);
        });
        let backendPriceProviderMasterCopyAddress = backendPriceProvider.address;
       
        let backendPriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            backendPriceProviderMasterCopyAddress,
            proxyAdminAddress,
            "0x"
        );
        await backendPriceProviderProxy.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash)
            console.log("BackendPriceProvider proxy address: " + instance.address);
        });
        let backendPriceProviderProxyAddress = backendPriceProviderProxy.address;
        backendPriceProviderAddress = backendPriceProviderProxyAddress;

    //=========================
    //deploy uniswapV2PriceProvider 
        console.log();
        console.log("***** UNISWAPV2 PRICE PROVIDER DEPLOYMENT *****");

        uniswapV2PriceProvider = await UniswapV2PriceProvider.connect(deployMaster).deploy();
        await uniswapV2PriceProvider.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash)
            console.log("UniswapV2PriceProvider masterCopy address: " + instance.address);
        });
        let uniswapV2PriceProviderMasterCopyAddress = uniswapV2PriceProvider.address;

        let uniswapV2PriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            uniswapV2PriceProviderMasterCopyAddress,
            proxyAdminAddress,
            "0x"
        );
        await uniswapV2PriceProviderProxy.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash)
            console.log("UniswapV2PriceProvider proxy address: " + instance.address);
        });
        let uniswapV2PriceProviderProxyAddress = uniswapV2PriceProviderProxy.address;
        uniswapV2PriceProviderAddress = uniswapV2PriceProviderProxyAddress;

    //=========================
    //deploy PriceProviderAggregator
        console.log();
        console.log("***** USB PRICE ORACLE DEPLOYMENT *****");
    
        priceProviderAggregator = await PriceProviderAggregator.connect(deployMaster).deploy();
        await priceProviderAggregator.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash)
            console.log("PriceProviderAggregator masterCopy address: " + instance.address);
        });
        let usbPriceOracleMasterCopyAddress = priceProviderAggregator.address;

        let usbPriceOracleProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            usbPriceOracleMasterCopyAddress,
            proxyAdminAddress,
            "0x"
        );
        await usbPriceOracleProxy.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash)
            console.log("PriceProviderAggregator proxy address: " + instance.address);
        });
        let usbPriceOracleProxyAddress = usbPriceOracleProxy.address;
        priceProviderAggregatorAddress = usbPriceOracleProxyAddress;

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
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("ChainlinkPriceProvider initialized at " + chainlinkPriceProviderAddress);
        });

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
        //set backendPriceProvider
        console.log();
        console.log("***** SETTING BACKEND PRICE PROVIDER *****");

        await backendPriceProvider.initialize()
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("BackendPriceProvider initialized at " + backendPriceProviderAddress);
        });

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
        //set uniswapV2PriceProvider
        console.log();
        console.log("***** SETTING UNISWAPV2 PRICE PROVIDER *****");

        await uniswapV2PriceProvider.initialize().then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("UniswapV2PriceProvider initialized at "+ uniswapV2PriceProviderAddress);
        });

        await uniswapV2PriceProvider.grandModerator(priceProviderAggregatorAddress).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("UniswapV2PriceProvider granded moderator "+priceProviderAggregatorAddress);
        });

        await uniswapV2PriceProvider.setTokenAndPair(prj1Address, uniswapPairPrj1Address).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("UniswapV2PriceProvider set token "+ prj1Address + " and pair "+ uniswapPairPrj1Address);
        });

        await uniswapV2PriceProvider.setTokenAndPair(prj2Address, uniswapPairPrj2Address).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("UniswapV2PriceProvider set token "+ prj2Address+" and pair "+ uniswapPairPrj2Address);
        });

        await uniswapV2PriceProvider.setTokenAndPair(prj3Address, uniswapPairPrj3Address).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("UniswapV2PriceProvider set token "+ prj3Address+" and pair "+ uniswapPairPrj3Address);
        });

        await uniswapV2PriceProvider.setTokenAndPair(prj4Address, uniswapPairPrj4Address).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("UniswapV2PriceProvider set token "+ prj4Address+" and pair "+ uniswapPairPrj4Address);
        });

        await uniswapV2PriceProvider.setTokenAndPair(prj5Address, uniswapPairPrj5Address).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("UniswapV2PriceProvider set token "+ prj5Address+" and pair "+ uniswapPairPrj5Address);
        });

        await uniswapV2PriceProvider.setTokenAndPair(prj6Address, uniswapPairPrj6Address).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("UniswapV2PriceProvider set token "+ prj6Address+" and pair "+ uniswapPairPrj6Address);
        });

        //==============================
        //set priceProviderAggregator
        console.log();
        console.log("***** SETTING USB PRICE ORACLE *****");

        await priceProviderAggregator.initialize().then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator initialized at " + priceProviderAggregatorAddress);
        });

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

        await priceProviderAggregator.setTokenAndPriceProvider(prj1Address, uniswapV2PriceProviderAddress, false).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ prj1Address + " with priceOracle " + uniswapV2PriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(prj2Address, uniswapV2PriceProviderAddress, false).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ prj2Address + " with priceOracle " + uniswapV2PriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(prj3Address, uniswapV2PriceProviderAddress, false).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ prj3Address + " with priceOracle " + uniswapV2PriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(prj4Address, uniswapV2PriceProviderAddress, false).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ prj4Address + " with priceOracle " + uniswapV2PriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(prj5Address, uniswapV2PriceProviderAddress, false).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ prj5Address + " with priceOracle " + uniswapV2PriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(prj6Address, uniswapV2PriceProviderAddress, false).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ prj6Address + " with priceOracle " + uniswapV2PriceProviderAddress);
        });
        
        let addresses = {
            proxyAdminAddress : proxyAdminAddress,
            chainlinkPriceProviderAddress : chainlinkPriceProviderAddress,
            backendPriceProviderAddress : backendPriceProviderAddress,
            uniswapV2PriceProviderAddress : uniswapV2PriceProviderAddress,
            priceProviderAggregatorAddress : priceProviderAggregatorAddress,
        }

        console.log(addresses);

        return addresses;
    }


};
