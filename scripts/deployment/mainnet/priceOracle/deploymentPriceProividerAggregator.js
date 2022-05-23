const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

module.exports = {
   
    deploymentPriceProividerAggregator : async function (input_primaryLendingPlatformProxyAdminAddress) {

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
        let PriceProviderAggregator;
 

        //instances of contracts
        let proxyAdmin;
        let chainlinkPriceProvider;
        let backendPriceProvider;
        let priceProviderAggregator;

        //contracts addresses
        let proxyAdminAddress;
        let chainlinkPriceProviderAddress;
        let priceProviderAggregatorAddress;


    //====================================================
    //initialize deploy parametrs

        ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
        PrimaryLendingPlatformProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
        TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
        ChainlinkPriceProvider = await hre.ethers.getContractFactory("ChainlinkPriceProvider");
        BackendPriceProvider = await hre.ethers.getContractFactory("BackendPriceProvider");
        PriceProviderAggregator = await hre.ethers.getContractFactory("PriceProviderAggregator");
      
        const {

            USDC,
            
            BOND,
            LINK,
            REN,
            MATIC,
            OGN,
            UNN,
        
            PROS,
            IOTX,
        
            STAK,
            KAMPAY,
            TOMO,
        
            GLCH,
            GTON,
            DFYN,
        
            chainlinkAggregatorV3_LINK_USD,
            chainlinkAggregatorV3_REN_USD,
            chainlinkAggregatorV3_MATIC_USD,
            chainlinkAggregatorV3_OGN_ETH,
            chainlinkAggregatorV3_ETH_USD,
            chainlinkAggregatorV3_USDC_USD,
        
        } = require('../config.js');


    //====================================================
    //deploy proxy admin

        // console.log();
        // console.log("***** PROXY ADMIN DEPLOYMENT *****");
        // if(input_proxyAdminAddress == undefined){
        //     proxyAdmin = await ProxyAdmin.connect(deployMaster).deploy();
        //     await proxyAdmin.deployed().then(function(instance){
        //         console.log("\nTransaction hash: " + instance.deployTransaction.hash)
        //         console.log("ProxyAdmin deployed at: " + instance.address);
        //     });
        //     proxyAdminAddress = proxyAdmin.address;
        // }else{
        //     console.log("ProxyAdmin is deployed at: " + input_proxyAdminAddress);
        //     proxyAdminAddress = input_proxyAdminAddress;
        // }

    //====================================================
    //deploy primary lending platform proxy admin

        console.log();
        console.log("***** PRIMARY LENDING PLATFORM PROXY ADMIN DEPLOYMENT *****");
        if(input_primaryLendingPlatformProxyAdminAddress == undefined){
            primaryLendingPlatformProxyAdmin = await PrimaryLendingPlatformProxyAdmin.connect(deployMaster).deploy();
            await primaryLendingPlatformProxyAdmin.deployed()
            .then(function(instance){
                console.log("\nTransaction hash: " + instance.deployTransaction.hash);
                console.log("PrimaryLendingPlatformProxyAdmin deployed at: " + instance.address);
            });
            proxyAdminAddress = primaryLendingPlatformProxyAdmin.address;
            
        }else{
            console.log("PrimaryLendingPlatformProxyAdmin is deployed at: " + input_primaryLendingPlatformProxyAdminAddress);
            proxyAdminAddress = input_primaryLendingPlatformProxyAdminAddress
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
    //deploy PriceProviderAggregator
        console.log();
        console.log("***** USB PRICE ORACLE DEPLOYMENT *****");

        priceProviderAggregator = await PriceProviderAggregator.connect(deployMaster).deploy();
        await priceProviderAggregator.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash)
            console.log("PriceProviderAggregator masterCopy address: " + instance.address);
        });
        let priceProviderAggregatorMasterCopyAddress = priceProviderAggregator.address;

        let priceProviderAggregatorProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            priceProviderAggregatorMasterCopyAddress,
            proxyAdminAddress,
            "0x"
        );
        await priceProviderAggregatorProxy.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash)
            console.log("PriceProviderAggregator proxy address: " + instance.address);
        });
        let priceProviderAggregatorProxyAddress = priceProviderAggregatorProxy.address;
        priceProviderAggregatorAddress = priceProviderAggregatorProxyAddress;

    //====================================================
    //setting params

        chainlinkPriceProvider = await ChainlinkPriceProvider.attach(chainlinkPriceProviderAddress).connect(deployMaster);
        backendPriceProvider = await BackendPriceProvider.attach(backendPriceProviderAddress).connect(deployMaster);
        //uniswapV2PriceProvider = await UniswapV2PriceProvider.attach(uniswapV2PriceProviderAddress).connect(deployMaster);
        priceProviderAggregator = await PriceProviderAggregator.attach(priceProviderAggregatorAddress).connect(deployMaster);
    
        //==============================
        //set chainlinkPriceProvider
        console.log();
        console.log("***** SETTING CHAINLINK PRICE PROVIDER *****");

        await chainlinkPriceProvider.initialize()
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("ChainlinkPriceProvider "+ chainlinkPriceProvider.address + " call initialize");
        });

        await chainlinkPriceProvider.grandModerator(priceProviderAggregatorAddress).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " granded moderator " + priceProviderAggregatorAddress);
        });

        await chainlinkPriceProvider.setTokenAndAggregator(
            USDC,
            [chainlinkAggregatorV3_USDC_USD]
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set token "+ USDC +" and aggregator " + [chainlinkAggregatorV3_USDC_USD]);
        });

        await chainlinkPriceProvider.setTokenAndAggregator(
            LINK, 
            [chainlinkAggregatorV3_LINK_USD]
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set token "+ LINK +" and aggregator " + [chainlinkAggregatorV3_LINK_USD]);
        });

        await chainlinkPriceProvider.setTokenAndAggregator(
            REN,
            [chainlinkAggregatorV3_REN_USD]
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set token "+ REN +" and aggregator " + [chainlinkAggregatorV3_REN_USD]);
        });

        await chainlinkPriceProvider.setTokenAndAggregator(
            MATIC, 
            [chainlinkAggregatorV3_MATIC_USD]
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set token "+ MATIC +" and aggregator " + [chainlinkAggregatorV3_MATIC_USD]);
        });

        await chainlinkPriceProvider.setTokenAndAggregator(
            OGN, 
            [chainlinkAggregatorV3_OGN_ETH, chainlinkAggregatorV3_ETH_USD]
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set token "+ OGN +" and aggregator " + [chainlinkAggregatorV3_OGN_ETH, chainlinkAggregatorV3_ETH_USD]);
        });

        //==============================
        //set backendPriceProvider
        console.log();
        console.log("***** SETTING BACKEND PRICE PROVIDER *****");

        await backendPriceProvider.initialize().then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("BackendPriceProvider initialized at " + backendPriceProviderAddress);
        });

        await backendPriceProvider.grandTrustedBackendRole(deployMasterAddress).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("BackendPriceProvider set trusted backend " + deployMasterAddress);
        });

        await backendPriceProvider.setToken(BOND).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("BackendPriceProvider set token "+ BOND)
        });

        await backendPriceProvider.setToken(UNN).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("BackendPriceProvider set token "+ UNN)
        });

        await backendPriceProvider.setToken(PROS).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("BackendPriceProvider set token "+ PROS)
        });

        await backendPriceProvider.setToken(IOTX).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("BackendPriceProvider set token "+ IOTX)
        });
        
        await backendPriceProvider.setToken(STAK).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("BackendPriceProvider set token "+ STAK)
        });
        
        await backendPriceProvider.setToken(KAMPAY).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("BackendPriceProvider set token "+ KAMPAY)
        });

        await backendPriceProvider.setToken(TOMO).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("BackendPriceProvider set token "+ TOMO)
        });

        await backendPriceProvider.setToken(GLCH).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("BackendPriceProvider set token "+ GLCH)
        });

        await backendPriceProvider.setToken(GTON).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("BackendPriceProvider set token "+ GTON)
        });

        await backendPriceProvider.setToken(DFYN).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("BackendPriceProvider set token "+ DFYN)
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
            console.log("PriceProviderAggregator granded moderator " + deployMasterAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(
            USDC, 
            chainlinkPriceProviderAddress, 
            false
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator set token "+ USDC + " with priceOracle " + chainlinkPriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(
            LINK, 
            chainlinkPriceProviderAddress, 
            false
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator set token "+ LINK + " with priceOracle " + chainlinkPriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(
            REN, 
            chainlinkPriceProviderAddress, 
            false
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator set token "+ REN + " with priceOracle " + chainlinkPriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(
            MATIC, 
            chainlinkPriceProviderAddress, 
            false
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator set token "+ MATIC + " with priceOracle " + chainlinkPriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(
            OGN, 
            chainlinkPriceProviderAddress, 
            false
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator set token "+ OGN + " with priceOracle " + chainlinkPriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(
            BOND, 
            backendPriceProviderAddress, 
            true
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator set token "+ BOND + " with priceOracle " + backendPriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(
            UNN, 
            backendPriceProviderAddress, 
            true
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator set token "+ UNN + " with priceOracle " + backendPriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(
            PROS, 
            backendPriceProviderAddress, 
            true
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator set token "+ PROS + " with priceOracle " + backendPriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(
            IOTX, 
            backendPriceProviderAddress, 
            true
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator set token "+ IOTX + " with priceOracle " + backendPriceProviderAddress);
        });
        
        await priceProviderAggregator.setTokenAndPriceProvider(
            STAK, 
            backendPriceProviderAddress, 
            true
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator set token "+ STAK + " with priceOracle " + backendPriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(
            KAMPAY,
            backendPriceProviderAddress, 
            true
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator set token "+ KAMPAY + " with priceOracle " + backendPriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(
            TOMO,
            backendPriceProviderAddress, 
            true
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator set token "+ TOMO + " with priceOracle " + backendPriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(
            GLCH,
            backendPriceProviderAddress, 
            true
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator set token "+ GLCH + " with priceOracle " + backendPriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(
            GTON, 
            backendPriceProviderAddress, 
            true
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator set token "+ GTON + " with priceOracle " + backendPriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(
            DFYN,
            backendPriceProviderAddress, 
            true
        ).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash)
            console.log("PriceProviderAggregator set token "+ DFYN + " with priceOracle " + backendPriceProviderAddress);
        });

        let addresses = {
            proxyAdminAddress : proxyAdminAddress,
            chainlinkPriceProviderAddress : chainlinkPriceProviderAddress,
            backendPriceProviderAddress : backendPriceProviderAddress,
            priceProviderAggregatorAddress : priceProviderAggregatorAddress,
        }

        console.log(addresses)

        return addresses
    }


};
