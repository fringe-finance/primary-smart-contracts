const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const BN = hre.ethers.BigNumber;
const fs = require("fs");
const path = require("path");
const configGeneralFile = path.join(__dirname, `../../config/${network}/config_general.json`);
const configGeneral = require(configGeneralFile);
const configFile = path.join(__dirname, `../../config/${network}/config.json`);
const config = require(configFile);
const verifyFilePath = path.join(__dirname, `../../config/${network}/verify.json`);
const verifyFile = require(verifyFilePath);

const toBN = (num) => BN.from(num);

const verify = async (address, constructorArguments, keyInConfig) => {
    console.log("Verifying " + address);
    if (!verifyFile[keyInConfig]) {
        await hre.run(`verify:verify`, {
            address,
            constructorArguments,
        });
        verifyFile[keyInConfig] = true;
        fs.writeFileSync(path.join(verifyFilePath), JSON.stringify(verifyFile, null, 2));
    }
    console.log("Verified " + address);
}

module.exports = {

    deploymentPriceOracle: async function () {

        //====================================================
        //declare parameters

        let network = await hre.network;
        console.log("Network name: " + network.name);

        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];

        console.log("DeployMaster: " + deployMaster.address);

        let deployMasterAddress = deployMaster.address;

        // Contracts ABI
        let ProxyAdmin;
        let TransparentUpgradeableProxy;
        let ChainlinkPriceProvider;
        let BackendPriceProvider;
        let UniswapV2PriceProvider;
        let PriceProviderAggregator;
        let LPPriceProvider;
        let WstETHPriceProvider;


        //instances of contracts
        let proxyAdmin;
        let chainlinkPriceProvider;
        let backendPriceProvider;
        let uniswapV2PriceProvider;
        let priceProviderAggregator;
        let lpPriceProvider;
        let wstETHPriceProvider;


        //====================================================
        //initialize deploy parametrs

        ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
        TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
        ChainlinkPriceProvider = await hre.ethers.getContractFactory("ChainlinkPriceProvider");
        BackendPriceProvider = await hre.ethers.getContractFactory("BackendPriceProvider");
        UniswapV2PriceProvider = await hre.ethers.getContractFactory("UniswapV2PriceProvider");
        PriceProviderAggregator = await hre.ethers.getContractFactory("PriceProviderAggregator");
        LPPriceProvider = await hre.ethers.getContractFactory("LPPriceProvider");
        WstETHPriceProvider = await hre.ethers.getContractFactory("wstETHPriceProvider");

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
            LPPriceProviderLogic,
            LPPriceProviderProxy,
            wstETHPriceProviderLogic,
            wstETHPriceProviderProxy
        } = config;

        //contracts addresses
        let proxyAdminAddress = PRIMARY_PROXY_ADMIN;
        let chainlinkPriceProviderAddress = ChainlinkPriceProviderProxy;
        let priceProviderAggregatorAddress = PriceProviderAggregatorProxy;
        let backendPriceProviderAddress = BackendPriceProviderProxy;
        let uniswapV2PriceProviderAddress = UniswapV2PriceProviderProxy;
        let lpPriceProviderAddress = LPPriceProviderProxy;
        let wstETHPriceProviderAddress = wstETHPriceProviderProxy;


        let backendPriceProviderLogicAddress = BackendPriceProviderLogic
        let chainlinkPriceProviderLogicAddress = ChainlinkPriceProviderLogic;
        let priceProviderAggregatorLogicAddress = PriceProviderAggregatorLogic;
        let uniswapV2PriceProviderLogicAddress = UniswapV2PriceProviderLogic;
        let lpPriceProviderLogicAddress = LPPriceProviderLogic;
        let wstETHPriceProviderLogicAddress = wstETHPriceProviderLogic;

        let tokensUseUniswap = priceOracle.tokensUseUniswap;
        let uniswapPairs = priceOracle.uniswapPairs;
        let tokensUseChainlink = priceOracle.tokensUseChainlink;
        let chainlinkAggregatorV3 = priceOracle.chainlinkAggregatorV3;
        let tokensUseBackendProvider = priceOracle.tokensUseBackendProvider;
        let tokensUseLPProvider = priceOracle.tokensUseLPProvider;
        let wstETH = priceOracle.wstETH;
        let wstETHAggregatorPath = priceOracle.wstETHAggregatorPath;

        //====================================================
        //deploy proxy admin

        console.log();
        console.log("***** PROXY ADMIN DEPLOYMENT *****");
        if (!proxyAdminAddress) {
            proxyAdmin = await ProxyAdmin.connect(deployMaster).deploy();
            await proxyAdmin.deployed().then(function (instance) {
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                proxyAdminAddress = instance.address;
                config.PRIMARY_PROXY_ADMIN = proxyAdminAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("ProxyAdmin deployed at: " + proxyAdminAddress);

        await verify(proxyAdminAddress, [], "PRIMARY_PROXY_ADMIN");

        //====================================================
        //deploy chainlinkPriceProvider
        console.log();
        console.log("***** CHAINLINK PRICE PROVIDER DEPLOYMENT *****");

        if (!chainlinkPriceProviderLogicAddress) {
            chainlinkPriceProvider = await ChainlinkPriceProvider.connect(deployMaster).deploy();
            await chainlinkPriceProvider.deployed().then(function (instance) {
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                chainlinkPriceProviderLogicAddress = instance.address;
                config.ChainlinkPriceProviderLogic = chainlinkPriceProviderLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("ChainlinkPriceProvider masterCopy address: " + chainlinkPriceProviderLogicAddress);
        await verify(chainlinkPriceProviderLogicAddress, [], "ChainlinkPriceProviderLogic");

        if (!chainlinkPriceProviderAddress) {
            let chainlinkPriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                chainlinkPriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await chainlinkPriceProviderProxy.deployed().then(function (instance) {
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                chainlinkPriceProviderAddress = instance.address;
                config.ChainlinkPriceProviderProxy = chainlinkPriceProviderAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("ChainlinkPriceProvider proxy address: " + chainlinkPriceProviderAddress);
        await verify(chainlinkPriceProviderAddress, [
            chainlinkPriceProviderLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "ChainlinkPriceProviderProxy");

        //====================================================
        //deploy backendPriceProvider
        console.log();
        console.log("***** BACKEND PRICE PROVIDER DEPLOYMENT *****");

        if (!backendPriceProviderLogicAddress) {
            backendPriceProvider = await BackendPriceProvider.connect(deployMaster).deploy();
            await backendPriceProvider.deployed().then(function (instance) {
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                backendPriceProviderLogicAddress = instance.address;
                config.BackendPriceProviderLogic = backendPriceProviderLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("BackendPriceProvider masterCopy address: " + backendPriceProviderLogicAddress);
        await verify(backendPriceProviderLogicAddress, [], "BackendPriceProviderLogic");

        if (!backendPriceProviderAddress) {
            let backendPriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                backendPriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await backendPriceProviderProxy.deployed().then(function (instance) {
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                backendPriceProviderAddress = instance.address;
                config.BackendPriceProviderProxy = backendPriceProviderAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("BackendPriceProvider proxy address: " + backendPriceProviderAddress);
        await verify(backendPriceProviderAddress, [
            backendPriceProviderLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "BackendPriceProviderProxy");

        //=========================
        //deploy uniswapV2PriceProvider
        console.log();
        console.log("***** UNISWAPV2 PRICE PROVIDER DEPLOYMENT *****");

        if (!uniswapV2PriceProviderLogicAddress) {
            uniswapV2PriceProvider = await UniswapV2PriceProvider.connect(deployMaster).deploy();
            await uniswapV2PriceProvider.deployed().then(function (instance) {
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                uniswapV2PriceProviderLogicAddress = instance.address;
                config.UniswapV2PriceProviderLogic = uniswapV2PriceProviderLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 3));
            });
        }
        console.log("UniswapV2PriceProvider masterCopy address: " + uniswapV2PriceProviderLogicAddress);
        await verify(uniswapV2PriceProviderLogicAddress, [], "UniswapV2PriceProviderLogic");

        if (!uniswapV2PriceProviderAddress) {
            let uniswapV2PriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                uniswapV2PriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await uniswapV2PriceProviderProxy.deployed().then(function (instance) {
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                uniswapV2PriceProviderAddress = instance.address;
                config.UniswapV2PriceProviderProxy = uniswapV2PriceProviderAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("UniswapV2PriceProvider proxy address: " + uniswapV2PriceProviderAddress);
        await verify(uniswapV2PriceProviderAddress, [
            uniswapV2PriceProviderLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "UniswapV2PriceProviderProxy");

        //=========================
        //deploy LPPriceProvider
        console.log();
        console.log("***** LP PRICE PROVIDER DEPLOYMENT *****");

        if (!lpPriceProviderLogicAddress) {
            lpPriceProvider = await LPPriceProvider.connect(deployMaster).deploy();
            await lpPriceProvider.deployed().then(function (instance) {
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                lpPriceProviderLogicAddress = instance.address;
                config.LPPriceProviderLogic = lpPriceProviderLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 3));
            });
        }
        console.log("lpPriceProvider masterCopy address: " + lpPriceProviderLogicAddress);
        await verify(lpPriceProviderLogicAddress, [], "LPPriceProviderLogic");

        if (!lpPriceProviderAddress) {
            let lpPriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                lpPriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await lpPriceProviderProxy.deployed().then(function (instance) {
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                lpPriceProviderAddress = instance.address;
                config.LPPriceProviderProxy = lpPriceProviderAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("lpPriceProvider proxy address: " + lpPriceProviderAddress);
        await verify(lpPriceProviderAddress, [
            lpPriceProviderLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "LPPriceProviderProxy");

        //=========================
        //deploy wstETHPriceProvider
        console.log();
        console.log("***** WSTETH PRICE PROVIDER DEPLOYMENT *****");

        if (!wstETHPriceProviderLogicAddress) {
            wstETHPriceProvider = await WstETHPriceProvider.connect(deployMaster).deploy();
            await wstETHPriceProvider.deployed().then(function (instance) {
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                wstETHPriceProviderLogicAddress = instance.address;
                config.wstETHPriceProviderLogic = wstETHPriceProviderLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 3));
            });
        }
        console.log("wstETHPriceProvider masterCopy address: " + wstETHPriceProviderLogicAddress);
        await verify(wstETHPriceProviderLogicAddress, [], "wstETHPriceProviderLogic");

        if (!wstETHPriceProviderAddress) {
            let wstETHPriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                wstETHPriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await wstETHPriceProviderProxy.deployed().then(function (instance) {
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                wstETHPriceProviderAddress = instance.address;
                config.wstETHPriceProviderProxy = wstETHPriceProviderAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("wstETHPriceProvider proxy address: " + wstETHPriceProviderAddress);
        await verify(wstETHPriceProviderAddress, [
            wstETHPriceProviderLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "wstETHPriceProviderProxy")

        //=========================
        //deploy PriceProviderAggregator
        console.log();
        console.log("***** USB PRICE ORACLE DEPLOYMENT *****");

        if (!priceProviderAggregatorLogicAddress) {
            priceProviderAggregator = await PriceProviderAggregator.connect(deployMaster).deploy();
            await priceProviderAggregator.deployed().then(function (instance) {
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                priceProviderAggregatorLogicAddress = instance.address;
                config.PriceProviderAggregatorLogic = priceProviderAggregatorLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("PriceProviderAggregator masterCopy address: " + priceProviderAggregatorLogicAddress);
        await verify(priceProviderAggregatorLogicAddress, [], "PriceProviderAggregatorLogic");

        if (!priceProviderAggregatorAddress) {
            let usbPriceOracleProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                priceProviderAggregatorLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await usbPriceOracleProxy.deployed().then(function (instance) {
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                priceProviderAggregatorAddress = instance.address;
                config.PriceProviderAggregatorProxy = priceProviderAggregatorAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PriceProviderAggregator proxy address: " + priceProviderAggregatorAddress);
        await verify(priceProviderAggregatorAddress, [
            priceProviderAggregatorLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PriceProviderAggregatorProxy");

        //====================================================
        //setting params

        chainlinkPriceProvider = await ChainlinkPriceProvider.attach(chainlinkPriceProviderAddress).connect(deployMaster);
        backendPriceProvider = await BackendPriceProvider.attach(backendPriceProviderAddress).connect(deployMaster);
        uniswapV2PriceProvider = await UniswapV2PriceProvider.attach(uniswapV2PriceProviderAddress).connect(deployMaster);
        lpPriceProvider = await LPPriceProvider.attach(lpPriceProviderAddress).connect(deployMaster);
        wstETHPriceProvider = await WstETHPriceProvider.attach(wstETHPriceProviderAddress).connect(deployMaster);
        priceProviderAggregator = await PriceProviderAggregator.attach(priceProviderAggregatorAddress).connect(deployMaster);

        //==============================
        //set chainlinkPriceProvider
        console.log();
        console.log("***** SETTING CHAINLINK PRICE PROVIDER *****");
        let usdDecimal = await chainlinkPriceProvider.usdDecimals();
        if (usdDecimal == 0) {
            await chainlinkPriceProvider.initialize()
            .then(function(instance){
                console.log("\nTransaction hash: " + instance.hash)
                console.log("ChainlinkPriceProvider initialized at " + chainlinkPriceProviderAddress);
            });
        }

        {
            let moderatorRole = await chainlinkPriceProvider.MODERATOR_ROLE();
            let isModeratorRole = await chainlinkPriceProvider.hasRole(moderatorRole, priceProviderAggregatorAddress);
            if (!isModeratorRole) {
                await chainlinkPriceProvider.grandModerator(priceProviderAggregatorAddress)
                    .then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash)
                        console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " granded moderator " + priceProviderAggregatorAddress);
                    });
            }
        }

        for (var i = 0; i < tokensUseChainlink.length; i++) {
            let chainlinkMetadata = await chainlinkPriceProvider.chainlinkMetadata(tokensUseChainlink[i]);
            if (chainlinkMetadata.isActive == false) {
                await chainlinkPriceProvider.setTokenAndAggregator(
                    tokensUseChainlink[i],
                    [chainlinkAggregatorV3[i]]
                ).then(function (instance) {
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
        if (usdDecimal == 0) {
            await backendPriceProvider.initialize()
                .then(function (instance) {
                    console.log("BackendPriceProvider " + backendPriceProviderAddress + " initialized at tx hash: " + instance.hash);
                });
        }

        {
            let moderatorRole = await backendPriceProvider.TRUSTED_BACKEND_ROLE();
            let isModeratorRole = await backendPriceProvider.hasRole(moderatorRole, deployMasterAddress);
            if (!isModeratorRole) {
                await backendPriceProvider.grandTrustedBackendRole(deployMasterAddress)
                    .then(function (instance) {
                        console.log("BackendPriceProvider " + backendPriceProvider.address + " set trusted backend " + deployMasterAddress + " at tx hash: " + instance.hash);
                    });
            }
        }


        for (var i = 0; i < tokensUseBackendProvider.length; i++) {
            let backendMetadata = await backendPriceProvider.backendMetadata(tokensUseBackendProvider[i]);
            if (backendMetadata.isListed == false || backendMetadata.isActive == false) {
                await backendPriceProvider.setToken(tokensUseBackendProvider[i]).then(function (instance) {
                    console.log("BackendPriceProvider " + backendPriceProvider.address + " set token " + tokensUseBackendProvider[i] + "at tx hash: " + instance.hash);
                });
            }
        }

        //==============================
        //set uniswapV2PriceProvider
        console.log();
        console.log("***** SETTING UNISWAPV2 PRICE PROVIDER *****");

        usdDecimal = await uniswapV2PriceProvider.getPriceDecimals();

        if (usdDecimal == 0) {
            await uniswapV2PriceProvider.initialize().then(function (instance) {
                console.log("UniswapV2PriceProvider initialized at " + uniswapV2PriceProviderAddress + " at tx hash " + instance.hash);
            });
        }

        {
            let moderatorRole = await uniswapV2PriceProvider.MODERATOR_ROLE();
            let isModeratorRole = await uniswapV2PriceProvider.hasRole(moderatorRole, priceProviderAggregatorAddress);
            if (!isModeratorRole) {
                await uniswapV2PriceProvider.grandModerator(priceProviderAggregatorAddress).then(function (instance) {
                    console.log("UniswapV2PriceProvider granded moderator " + priceProviderAggregatorAddress + " at tx hash " + instance.hash);
                });
            }
        }

        for (var i = 0; i < tokensUseUniswap.length; i++) {
            let uniswapV2Metadata = await uniswapV2PriceProvider.uniswapV2Metadata(tokensUseUniswap[i]);
            if (uniswapV2Metadata.isActive == false || uniswapV2Metadata.pair != uniswapPairs[i]) {
                await uniswapV2PriceProvider.setTokenAndPair(tokensUseUniswap[i], uniswapPairs[i]).then(function (instance) {
                    console.log("UniswapV2PriceProvider  set token " + tokensUseUniswap[i] + " and pair " + uniswapPairs[i] + " at tx hash: " + instance.hash);
                });
            }
        }

        //==============================
        //set lpPriceProvider
        console.log();
        console.log("***** SETTING LP PRICE PROVIDER *****");

        usdDecimal = await lpPriceProvider.getPriceDecimals();

        if (usdDecimal == 0) {
            await lpPriceProvider.initialize().then(function (instance) {
                console.log("lpPriceProvider initialized at " + lpPriceProviderAddress + " at tx hash " + instance.hash);
            });
        }

        {
            let moderatorRole = await lpPriceProvider.MODERATOR_ROLE();
            let isModeratorRole = await lpPriceProvider.hasRole(moderatorRole, priceProviderAggregatorAddress);
            if (!isModeratorRole) {
                await lpPriceProvider.grandModerator(priceProviderAggregatorAddress).then(function (instance) {
                    console.log("lpPriceProvider granded moderator " + priceProviderAggregatorAddress + " at tx hash " + instance.hash);
                });
            }
        }

        for (var i = 0; i < tokensUseLPProvider.length; i++) {
            let lpMetadata = await lpPriceProvider.lpMetadata(tokensUseLPProvider[i]);
            if (lpMetadata.isActive == false || lpMetadata.base != priceProviderAggregatorAddress) {
                await lpPriceProvider.setLPTokenAndProvider(tokensUseLPProvider[i], priceProviderAggregatorAddress).then(function (instance) {
                    console.log("LPPriceProvider  set token " + tokensUseLPProvider[i] + " and pair " + priceProviderAggregatorAddress + " at tx hash: " + instance.hash);
                });
            }
        }

        //==============================
        //set wstETHPriceProvider
        console.log();
        console.log("***** SETTING WSTETH PRICE PROVIDER *****");

        usdDecimal = await wstETHPriceProvider.getPriceDecimals();
        if (usdDecimal == 0) {
            await wstETHPriceProvider.initialize(wstETH, wstETHAggregatorPath).then(function(instance){
                console.log("wstETHPriceProvider initialized at "+ wstETHPriceProviderAddress + " at tx hash " + instance.hash);
            });
        }

        {
            let moderatorRole = await wstETHPriceProvider.MODERATOR_ROLE();
            let isModeratorRole = await wstETHPriceProvider.hasRole(moderatorRole, priceProviderAggregatorAddress);
            if (!isModeratorRole) {
                await wstETHPriceProvider.grandModerator(priceProviderAggregatorAddress).then(function (instance) {
                    console.log("wstETHPriceProvider granded moderator " + priceProviderAggregatorAddress + " at tx hash " + instance.hash);
                });
            }
        }


        //==============================
        //set priceProviderAggregator
        console.log();
        console.log("***** SETTING USB PRICE ORACLE *****");
        usdDecimal = await priceProviderAggregator.usdDecimals();
        if (usdDecimal == 0) {
            await priceProviderAggregator.initialize().then(function(instance){
                console.log("PriceProviderAggregator initialized at " + priceProviderAggregatorAddress + " at tx hash: " + instance.hash);
            });
        }

        {
            let moderatorRole = await priceProviderAggregator.MODERATOR_ROLE();
            let isModeratorRole = await priceProviderAggregator.hasRole(moderatorRole, deployMasterAddress);
            if (!isModeratorRole) {
                await priceProviderAggregator.grandModerator(deployMasterAddress).then(function (instance) {
                    console.log("PriceProviderAggregator " + priceProviderAggregator.address + " granded moderator " + deployMasterAddress + " at tx hash: " + instance.hash);
                });
            }
        }

        for (var i = 0; i < tokensUseChainlink.length; i++) {
            let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(tokensUseChainlink[i]);
            if (tokenPriceProvider.priceProvider !=  chainlinkPriceProviderAddress) {
                await priceProviderAggregator.setTokenAndPriceProvider(tokensUseChainlink[i], chainlinkPriceProviderAddress, false).then(function (instance) {
                    console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUseChainlink[i] + " with priceOracle " + chainlinkPriceProviderAddress + " at tx hash: " + instance.hash);
                });
            }
        }

        for (var i = 0; i < tokensUseUniswap.length; i++) {
            let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(tokensUseUniswap[i]);
            if (tokenPriceProvider.priceProvider !=  uniswapV2PriceProviderAddress) {
                await priceProviderAggregator.setTokenAndPriceProvider(tokensUseUniswap[i], uniswapV2PriceProviderAddress, false).then(function (instance) {
                    console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUseUniswap[i] + " with priceOracle " + uniswapV2PriceProviderAddress + " at tx hash: " + instance.hash);
                });
            }
        }

        for (var i = 0; i < tokensUseLPProvider.length; i++) {
            let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(tokensUseLPProvider[i]);
            if (tokenPriceProvider.priceProvider !=  lpPriceProviderAddress) {
                await priceProviderAggregator.setTokenAndPriceProvider(tokensUseLPProvider[i], lpPriceProviderAddress, false).then(function (instance) {
                    console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUseLPProvider[i] + " with priceOracle " + lpPriceProviderAddress + " at tx hash: " + instance.hash);
                });
            }
        }

        let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(wstETH);
        if (tokenPriceProvider.priceProvider !=  wstETHPriceProviderAddress) {
            await priceProviderAggregator.setTokenAndPriceProvider(wstETH, wstETHPriceProviderAddress, false).then(function (instance) {
                console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + wstETH + " with priceOracle " + wstETHPriceProviderAddress + " at tx hash: " + instance.hash);
            });
        }

        let addresses = {
            proxyAdminAddress: proxyAdminAddress,
            chainlinkPriceProviderAddress: chainlinkPriceProviderAddress,
            backendPriceProviderAddress: backendPriceProviderAddress,
            uniswapV2PriceProviderAddress: uniswapV2PriceProviderAddress,
            lpPriceProviderAddress: lpPriceProviderAddress,
            wstETHPriceProvider: wstETHPriceProviderAddress,
            priceProviderAggregatorAddress: priceProviderAggregatorAddress,
        }
        return addresses;
    }

};