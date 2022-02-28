const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

module.exports = {
   
    deploymentAndSettingPriceProividerAggregator : async function (input_proxyAdminAddress) {

    //====================================================
    //declare parametrs

        let network = await hre.network;
        console.log("Network name: " + network.name);
       
        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];

        let deployMasterAddress = deployMaster.address;
        
        console.log("DeployMaster: " + deployMasterAddress);

        // Contracts ABI
        let PrimaryLendingPlatformProxyAdmin;
        let TransparentUpgradeableProxy;
        let ChainlinkPriceProvider;
        let BackendPriceProvider;
        let UniswapV2PriceProvider;
        let PriceProviderAggregator;
 

        //instances of contracts
        let primaryLendingPlatformProxyAdmin;
        let chainlinkPriceProvider;
        let backendPriceProvider;
        let uniswapV2PriceProvider;
        let priceProviderAggregator;

        //contracts addresses
        let primaryLendingPlatformProxyAdminAddress;
        let chainlinkPriceProviderAddress;
        let backendPriceProviderAddress;
        let uniswapV2PriceProviderAddress;
        let priceProviderAggregatorAddress;


    //====================================================
    //initialize deploy parametrs

        PrimaryLendingPlatformProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
        TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
        ChainlinkPriceProvider = await hre.ethers.getContractFactory("ChainlinkPriceProvider");
        BackendPriceProvider = await hre.ethers.getContractFactory("BackendPriceProvider");
        UniswapV2PriceProvider = await hre.ethers.getContractFactory("UniswapV2PriceProvider");
        PriceProviderAggregator = await hre.ethers.getContractFactory("PriceProviderAggregator");
      
        const {
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
        
            chainlinkAggregatorV3_LINKmainnet,
            chainlinkAggregatorV3_RENmainnet,
            chainlinkAggregatorV3_MATICmainnet, 
        } = require('../config.js');

    //====================================================
    //deploy proxy admin

        console.log();
        console.log("***** PRIMARY LENDING PLATFORM PROXY ADMIN DEPLOYMENT *****");
        if(input_proxyAdminAddress == undefined){
            primaryLendingPlatformProxyAdmin = await PrimaryLendingPlatformProxyAdmin.connect(deployMaster).deploy();
            await primaryLendingPlatformProxyAdmin.deployed().then(function(instance){
                console.log("\nTransaction hash: " + instance.deployTransaction.hash);
            });
            primaryLendingPlatformProxyAdminAddress = primaryLendingPlatformProxyAdmin.address;
            console.log("PrimaryLendingPlatformProxyAdmin deployed at: " + primaryLendingPlatformProxyAdminAddress);
        }else{
            console.log("PrimaryLendingPlatformProxyAdmin is deployed at: " + input_proxyAdminAddress);
            primaryLendingPlatformProxyAdminAddress = input_proxyAdminAddress;
        }

    //====================================================
    //deploy chainlinkPriceProvider
        console.log();
        console.log("***** CHAINLINK PRICE PROVIDER DEPLOYMENT *****");

        chainlinkPriceProvider = await ChainlinkPriceProvider.connect(deployMaster).deploy();
        await chainlinkPriceProvider.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash);
        });;
        let chainlinkPriceProviderMasterCopyAddress = chainlinkPriceProvider.address;
        console.log("ChainlinkPriceProvider masterCopy address: " + chainlinkPriceProviderMasterCopyAddress);

        let chainlinkPriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            chainlinkPriceProviderMasterCopyAddress,
            primaryLendingPlatformProxyAdminAddress,
            "0x"
        );
        await chainlinkPriceProviderProxy.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash);
        });
        let chainlinkPriceProviderProxyAddress = chainlinkPriceProviderProxy.address;
        console.log("ChainlinkPriceProvider proxy address: " + chainlinkPriceProviderProxyAddress);
        chainlinkPriceProviderAddress = chainlinkPriceProviderProxyAddress;

    //====================================================
    //deploy backendPriceProvider
        console.log();
        console.log("***** BACKEND PRICE PROVIDER DEPLOYMENT *****");

        backendPriceProvider = await BackendPriceProvider.connect(deployMaster).deploy();
        await backendPriceProvider.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash);
        });
        let backendPriceProviderMasterCopyAddress = backendPriceProvider.address;
        console.log("BackendPriceProvider masterCopy address: " + backendPriceProviderMasterCopyAddress);

        let backendPriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            backendPriceProviderMasterCopyAddress,
            primaryLendingPlatformProxyAdminAddress,
            "0x"
        );
        await backendPriceProviderProxy.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash);
        });
        let backendPriceProviderProxyAddress = backendPriceProviderProxy.address;
        console.log("BackendPriceProvider proxy address: " + backendPriceProviderProxyAddress);
        backendPriceProviderAddress = backendPriceProviderProxyAddress;


    //=========================
    //deploy PriceProviderAggregator
        console.log();
        console.log("***** PRICE PROVIDER AGGREGATOR DEPLOYMENT *****");
    
        priceProviderAggregator = await PriceProviderAggregator.connect(deployMaster).deploy();
        await priceProviderAggregator.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash);
        });
        let usbPriceOracleMasterCopyAddress = priceProviderAggregator.address;
        console.log("PriceProviderAggregator masterCopy address: "+usbPriceOracleMasterCopyAddress);

        let usbPriceOracleProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            usbPriceOracleMasterCopyAddress,
            primaryLendingPlatformProxyAdminAddress,
            "0x"
        );
        await usbPriceOracleProxy.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash);
        });
        let usbPriceOracleProxyAddress = usbPriceOracleProxy.address;
        console.log("PriceProviderAggregator proxy address: "+usbPriceOracleProxyAddress);
        priceProviderAggregatorAddress = usbPriceOracleProxyAddress;

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
            console.log("\nTransaction hash: " + instance.hash);
            console.log("ChainlinkPriceProvider initialized at " + chainlinkPriceProviderAddress);
           
        });

        await chainlinkPriceProvider.grandModerator(priceProviderAggregatorAddress)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("ChainlinkPriceProvider granded moderator "+priceProviderAggregatorAddress);
        });

        await chainlinkPriceProvider.setTokenAndAggregator(LINK, chainlinkAggregatorV3_LINKmainnet)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("ChainlinkPriceProvider set token "+ LINK +" and price provider " + chainlinkAggregatorV3_LINKmainnet);
        });

        await chainlinkPriceProvider.setTokenAndAggregator(REN, chainlinkAggregatorV3_RENmainnet)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("ChainlinkPriceProvider set token "+ REN +" and price provider  " + chainlinkAggregatorV3_RENmainnet);
        });

        await chainlinkPriceProvider.setTokenAndAggregator(MATIC, chainlinkAggregatorV3_MATICmainnet)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("ChainlinkPriceProvider set token "+ MATIC +" and price provider  " + chainlinkAggregatorV3_MATICmainnet);
        });

        //==============================
        //set backendPriceProvider
        console.log();
        console.log("***** SETTING BACKEND PRICE PROVIDER *****");

        await backendPriceProvider.initialize()
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("BackendPriceProvider initialized at " + backendPriceProviderAddress);
        });

        await backendPriceProvider.grandTrustedBackendRole(deployMasterAddress)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("BackendPriceProvider set trusted backend "+ deployMasterAddress);
        });

        await backendPriceProvider.setToken(BOND)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("BackendPriceProvider set token "+ BOND)
        });

        await backendPriceProvider.setToken(OGN)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("BackendPriceProvider set token "+ OGN)
        });

        await backendPriceProvider.setToken(UNN)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("BackendPriceProvider set token "+ UNN)
        });

        await backendPriceProvider.setToken(PROS)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("BackendPriceProvider set token "+ PROS)
        });

        await backendPriceProvider.setToken(IOTX)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("BackendPriceProvider set token "+ IOTX)
        });
        
        await backendPriceProvider.setToken(STAK)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("BackendPriceProvider set token "+ STAK)
        });
        
        await backendPriceProvider.setToken(KAMPAY)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("BackendPriceProvider set token "+ KAMPAY)
        });

        await backendPriceProvider.setToken(TOMO)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("BackendPriceProvider set token "+ TOMO)
        });

        await backendPriceProvider.setToken(GLCH)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("BackendPriceProvider set token "+ GLCH)
        });

        await backendPriceProvider.setToken(GTON)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("BackendPriceProvider set token "+ GTON)
        });

        await backendPriceProvider.setToken(DFYN)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("BackendPriceProvider set token "+ DFYN)
        });
      

        //==============================
        //set priceProviderAggregator
        console.log();
        console.log("***** SETTING PRICE PROVIDER AGGREGATOR *****");

        await priceProviderAggregator.initialize()
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PriceProviderAggregator initialized at " + priceProviderAggregatorAddress);
        });

        await priceProviderAggregator.grandModerator(deployMasterAddress)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PriceProviderAggregator granded moderator " + deployMasterAddress);
        });

        let hasFunctionWithSign;

        hasFunctionWithSign = false;
        await priceProviderAggregator.setTokenAndPriceProvider(LINK, chainlinkPriceProviderAddress, hasFunctionWithSign)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PriceProviderAggregator set token "+ LINK + " with priceOracle " + chainlinkPriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(REN, chainlinkPriceProviderAddress, hasFunctionWithSign)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PriceProviderAggregator set token "+ REN + " with priceOracle " + chainlinkPriceProviderAddress);
        });

        await priceProviderAggregator.setTokenAndPriceProvider(MATIC, chainlinkPriceProviderAddress, hasFunctionWithSign)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PriceProviderAggregator set token "+ MATIC + " with priceOracle " + chainlinkPriceProviderAddress);
        });

        hasFunctionWithSign = true;
        await priceProviderAggregator.setTokenAndPriceProvider(BOND, backendPriceProviderAddress, hasFunctionWithSign)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PriceProviderAggregator set token "+ BOND + " with priceOracle " + backendPriceProviderAddress);
        });

        hasFunctionWithSign = true;
        await priceProviderAggregator.setTokenAndPriceProvider(OGN, backendPriceProviderAddress, hasFunctionWithSign)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PriceProviderAggregator set token "+ OGN + " with priceOracle " + backendPriceProviderAddress);
        });

        hasFunctionWithSign = true;
        await priceProviderAggregator.setTokenAndPriceProvider(UNN, backendPriceProviderAddress, hasFunctionWithSign)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PriceProviderAggregator set token "+ UNN + " with priceOracle " + backendPriceProviderAddress);
        });

        hasFunctionWithSign = true;
        await priceProviderAggregator.setTokenAndPriceProvider(PROS, backendPriceProviderAddress, hasFunctionWithSign)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PriceProviderAggregator set token "+ PROS + " with priceOracle " + backendPriceProviderAddress);
        });

        hasFunctionWithSign = true;
        await priceProviderAggregator.setTokenAndPriceProvider(IOTX, backendPriceProviderAddress, hasFunctionWithSign)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PriceProviderAggregator set token "+ IOTX + " with priceOracle " + backendPriceProviderAddress);
        });
        
        hasFunctionWithSign = true;
        await priceProviderAggregator.setTokenAndPriceProvider(STAK, backendPriceProviderAddress, hasFunctionWithSign)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PriceProviderAggregator set token "+ STAK + " with priceOracle " + backendPriceProviderAddress);
        });

        hasFunctionWithSign = true;
        await priceProviderAggregator.setTokenAndPriceProvider(KAMPAY, backendPriceProviderAddress, hasFunctionWithSign)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PriceProviderAggregator set token "+ KAMPAY + " with priceOracle " + backendPriceProviderAddress);
        });

        hasFunctionWithSign = true;
        await priceProviderAggregator.setTokenAndPriceProvider(TOMO, backendPriceProviderAddress, hasFunctionWithSign)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PriceProviderAggregator set token "+ TOMO + " with priceOracle " + backendPriceProviderAddress);
        });

        hasFunctionWithSign = true;
        await priceProviderAggregator.setTokenAndPriceProvider(GLCH, backendPriceProviderAddress, hasFunctionWithSign)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PriceProviderAggregator set token "+ GLCH + " with priceOracle " + backendPriceProviderAddress);
        });

        hasFunctionWithSign = true;
        await priceProviderAggregator.setTokenAndPriceProvider(GTON, backendPriceProviderAddress, hasFunctionWithSign)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PriceProviderAggregator set token "+ GTON + " with priceOracle " + backendPriceProviderAddress);
        });

        hasFunctionWithSign = true;
        await priceProviderAggregator.setTokenAndPriceProvider(DFYN, backendPriceProviderAddress, hasFunctionWithSign)
        .then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PriceProviderAggregator set token "+ DFYN + " with priceOracle " + backendPriceProviderAddress);
        });

        let addresses = {
            primaryLendingPlatformProxyAdminAddress : primaryLendingPlatformProxyAdminAddress,
            chainlinkPriceProviderAddress : chainlinkPriceProviderAddress,
            backendPriceProviderAddress : backendPriceProviderAddress,
            priceProviderAggregatorAddress : priceProviderAggregatorAddress,
        }
        
        console.log(addresses);

        return addresses;
    }


};
