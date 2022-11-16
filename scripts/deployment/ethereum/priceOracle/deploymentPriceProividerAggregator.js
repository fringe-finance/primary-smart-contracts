const hre = require("hardhat");
const BN = hre.ethers.BigNumber;
const fs = require("fs");
const path = require("path");
const configGeneralFile = '../../../config/ethereum/config_general.json';
const configGeneral = require(configGeneralFile);
const configFile = '../../../config/ethereum/config.json';
const config = require(configFile);

const toBN = (num) => BN.from(num);

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


    //====================================================
    //initialize deploy parametrs

        ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
        TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
        ChainlinkPriceProvider = await hre.ethers.getContractFactory("ChainlinkPriceProvider");
        BackendPriceProvider = await hre.ethers.getContractFactory("BackendPriceProvider");
        UniswapV2PriceProvider = await hre.ethers.getContractFactory("UniswapV2PriceProvider");
        PriceProviderAggregator = await hre.ethers.getContractFactory("PriceProviderAggregator");
      
        const {
            priceOracle
        } = configGeneral;

        const {
            PRIMARY_PROXY_ADMIN,
            ChainlinkPriceProviderLogic,
            ChainlinkPriceProviderProxy,
            BackendPriceProviderLogic,
            BackendPriceProviderProxy,
            UniswapV2PriceProviderLogic,
            UniswapV2PriceProviderProxy,
            PriceProviderAggregatorLogic,
            PriceProviderAggregatorProxy,
        } = config;

        //contracts addresses
        let proxyAdminAddress = PRIMARY_PROXY_ADMIN;
        let chainlinkPriceProviderAddress = ChainlinkPriceProviderProxy;
        let priceProviderAggregatorAddress = PriceProviderAggregatorProxy;
        let backendPriceProviderAddress = BackendPriceProviderProxy;
        let uniswapV2PriceProviderAddress = UniswapV2PriceProviderProxy;

        let backendPriceProviderLogicAddress = BackendPriceProviderLogic
        let chainlinkPriceProviderLogicAddress = ChainlinkPriceProviderLogic;
        let priceProviderAggregatorLogicAddress = PriceProviderAggregatorLogic;
        let uniswapV2PriceProviderLogicAddress = UniswapV2PriceProviderLogic;

        let tokensUseUniswap = priceOracle.tokensUseUniswap;
        let uniswapPairs = priceOracle.uniswapPairs;
        let tokensUseChainlink = priceOracle.tokensUseChainlink;
        let chainlinkAggregatorV3 = priceOracle.chainlinkAggregatorV3;
        let tokensUseBackendProvider = priceOracle.tokensUseBackendProvider;
    //====================================================
    //deploy proxy admin

        console.log();
        console.log("***** PROXY ADMIN DEPLOYMENT *****");
        if(!proxyAdminAddress){
            proxyAdmin = await ProxyAdmin.connect(deployMaster).deploy();
            await proxyAdmin.deployed().then(function(instance){
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                proxyAdminAddress = instance.address;
                config.PRIMARY_PROXY_ADMIN = proxyAdminAddress;
                fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("ProxyAdmin deployed at: " + proxyAdminAddress);

    //====================================================
    //deploy chainlinkPriceProvider
        console.log();
        console.log("***** CHAINLINK PRICE PROVIDER DEPLOYMENT *****");

        if(!chainlinkPriceProviderLogicAddress) {
            chainlinkPriceProvider = await ChainlinkPriceProvider.connect(deployMaster).deploy();
            await chainlinkPriceProvider.deployed().then(function(instance){
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                chainlinkPriceProviderLogicAddress = instance.address;
                config.ChainlinkPriceProviderLogic = chainlinkPriceProviderLogicAddress;
                fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("ChainlinkPriceProvider masterCopy address: " + chainlinkPriceProviderLogicAddress);

        if(!chainlinkPriceProviderAddress) {
            let chainlinkPriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                chainlinkPriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await chainlinkPriceProviderProxy.deployed().then(function(instance){
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                chainlinkPriceProviderAddress = instance.address;
                config.ChainlinkPriceProviderProxy = chainlinkPriceProviderAddress;
                fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("ChainlinkPriceProvider proxy address: " + chainlinkPriceProviderAddress);

    //====================================================
    //deploy backendPriceProvider
        console.log();
        console.log("***** BACKEND PRICE PROVIDER DEPLOYMENT *****");

        if(!backendPriceProviderLogicAddress){
            backendPriceProvider = await BackendPriceProvider.connect(deployMaster).deploy();
            await backendPriceProvider.deployed().then(function(instance){
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                backendPriceProviderLogicAddress = instance.address;
                config.BackendPriceProviderLogic = backendPriceProviderLogicAddress;
                fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("BackendPriceProvider masterCopy address: " + backendPriceProviderLogicAddress);

        if(!backendPriceProviderAddress){
            let backendPriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                backendPriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await backendPriceProviderProxy.deployed().then(function(instance){
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                backendPriceProviderAddress = instance.address;
                config.BackendPriceProviderProxy = backendPriceProviderAddress;
                fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("BackendPriceProvider proxy address: " + backendPriceProviderAddress);
    //=========================
    //deploy uniswapV2PriceProvider 
        console.log();
        console.log("***** UNISWAPV2 PRICE PROVIDER DEPLOYMENT *****");

        if(!uniswapV2PriceProviderLogicAddress) {
            uniswapV2PriceProvider = await UniswapV2PriceProvider.connect(deployMaster).deploy();
            await uniswapV2PriceProvider.deployed().then(function(instance){
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                uniswapV2PriceProviderLogicAddress = instance.address;
                config.UniswapV2PriceProviderLogic = uniswapV2PriceProviderLogicAddress;
                fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 3));
            });
        }
        console.log("UniswapV2PriceProvider masterCopy address: " + uniswapV2PriceProviderLogicAddress);

        if(!uniswapV2PriceProviderAddress){
            let uniswapV2PriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                uniswapV2PriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await uniswapV2PriceProviderProxy.deployed().then(function(instance){
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                uniswapV2PriceProviderAddress = instance.address;
                config.UniswapV2PriceProviderProxy = uniswapV2PriceProviderAddress;
                fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("UniswapV2PriceProvider proxy address: " + uniswapV2PriceProviderAddress);
    //=========================
    //deploy PriceProviderAggregator
        console.log();
        console.log("***** USB PRICE ORACLE DEPLOYMENT *****");

        if(!priceProviderAggregatorLogicAddress){
            priceProviderAggregator = await PriceProviderAggregator.connect(deployMaster).deploy();
            await priceProviderAggregator.deployed().then(function(instance){
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                priceProviderAggregatorLogicAddress = instance.address;
                config.PriceProviderAggregatorLogic = priceProviderAggregatorLogicAddress;
                fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("PriceProviderAggregator masterCopy address: " + priceProviderAggregatorLogicAddress);

        if(!priceProviderAggregatorAddress){
            let usbPriceOracleProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                priceProviderAggregatorLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await usbPriceOracleProxy.deployed().then(function(instance){
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                priceProviderAggregatorAddress = instance.address;
                config.PriceProviderAggregatorProxy = priceProviderAggregatorAddress;
                fs.writeFileSync(path.join(__dirname, configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PriceProviderAggregator proxy address: " + priceProviderAggregatorAddress);

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
        let usdDecimal = await chainlinkPriceProvider.usdDecimals();
        if(usdDecimal == 0){
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

            for (var i = 0; i < tokensUseChainlink.length; i++) {
                await chainlinkPriceProvider.setTokenAndAggregator(
                    tokensUseChainlink[i],
                    [chainlinkAggregatorV3[i]]
                ).then(function(instance){
                    console.log("\nTransaction hash: " + instance.hash)
                    console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set token with parameters: ")
                    console.log("   token: " + tokensUseChainlink[i])
                    console.log("   aggregator path: " + [chainlinkAggregatorV3[i]]);
                });
            }
        }
        //==============================
        //set backendPriceProvider
        console.log();
        console.log("***** SETTING BACKEND PRICE PROVIDER *****");
        usdDecimal = await backendPriceProvider.usdDecimals();
        if(usdDecimal == 0) {
            await backendPriceProvider.initialize()
            .then(function(instance){
                console.log("BackendPriceProvider " + backendPriceProviderAddress + " initialized at tx hash: " + instance.hash);
            });

            await backendPriceProvider.grandTrustedBackendRole(deployMasterAddress)
            .then(function(instance){
                console.log("BackendPriceProvider " + backendPriceProvider.address + " set trusted backend "+ deployMasterAddress + " at tx hash: " + instance.hash);
            });

            for(var i = 0; i < tokensUseBackendProvider.length; i++){
                await backendPriceProvider.setToken(tokensUseBackendProvider[i]).then(function(instance){
                    console.log("BackendPriceProvider " + backendPriceProvider.address + " set token "+ tokensUseBackendProvider[i] + "at tx hash: " + instance.hash);
                });
            }
        }    

        //==============================
        //set uniswapV2PriceProvider
        console.log();
        console.log("***** SETTING UNISWAPV2 PRICE PROVIDER *****");

        usdDecimal = await uniswapV2PriceProvider.getPriceDecimals();

        if(usdDecimal == 0){
            await uniswapV2PriceProvider.initialize().then(function(instance){
                console.log("UniswapV2PriceProvider initialized at "+ uniswapV2PriceProviderAddress + " at tx hash " + instance.hash);
            });
    
            await uniswapV2PriceProvider.grandModerator(priceProviderAggregatorAddress).then(function(instance){
                console.log("UniswapV2PriceProvider granded moderator "+ priceProviderAggregatorAddress + " at tx hash " + instance.hash);
            });
    
            for (var i = 0; i < tokensUseUniswap.length; i++) {
                await uniswapV2PriceProvider.setTokenAndPair(tokensUseUniswap[i], uniswapPairs[i]).then(function(instance){
                    console.log("UniswapV3PriceProvider  set token " + tokensUseUniswap[i] + " and pair " + uniswapPairs[i] + " at tx hash: " + instance.hash);
                });
            }
        }

        //==============================
        //set priceProviderAggregator
        console.log();
        console.log("***** SETTING USB PRICE ORACLE *****");
        usdDecimal = await priceProviderAggregator.usdDecimals();
        if(usdDecimal == 0) {
            await priceProviderAggregator.initialize().then(function(instance){
                console.log("PriceProviderAggregator initialized at " + priceProviderAggregatorAddress + " at tx hash: " + instance.hash);
            });
    
            await priceProviderAggregator.grandModerator(deployMasterAddress).then(function(instance){
                console.log("PriceProviderAggregator " + priceProviderAggregator.address + " granded moderator " + deployMasterAddress + " at tx hash: " + instance.hash);
            });
    
            for (var i = 0; i < tokensUseChainlink.length; i++) {
                await priceProviderAggregator.setTokenAndPriceProvider(tokensUseChainlink[i], chainlinkPriceProviderAddress, false).then(function(instance){
                    console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ tokensUseChainlink[i] + " with priceOracle " + chainlinkPriceProviderAddress + " at tx hash: " + instance.hash);
                });
            }
    
            for (var i = 0; i < tokensUseUniswap.length; i++) {
                await priceProviderAggregator.setTokenAndPriceProvider(tokensUseUniswap[i], uniswapV2PriceProviderAddress, false).then(function(instance){

                    console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token "+ tokensUseUniswap[i] + " with priceOracle " + uniswapV2PriceProviderAddress + " at tx hash: " + instance.hash);
                });
            }
        }
        
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