require("dotenv").config();
const hre = require("hardhat");
const network = hre.hardhatArguments.network;

const isTesting = Object.keys(process.env).includes('TESTING');
const isTestingForZksync = Object.keys(process.env).includes('TESTING_FOR_ZKSYNC');
let chain = process.env.CHAIN && network == 'hardhat' ? "_" + process.env.CHAIN : "";
const isLayer2 = Object.keys(process.env).includes('LAYER2');
if (isTestingForZksync) chain = "_zksync_on_polygon_mainnet";

const fs = require("fs");
const path = require("path");
const configGeneralFile = path.join(__dirname, `../../config/${network}${chain}/config_general.json`);
const configGeneral = require(configGeneralFile);
const configFile = path.join(__dirname, `../../config/${network}${chain}/config.json`);
let config = require(configFile);
const verifyFilePath = path.join(__dirname, `../../config/${network}${chain}/verify.json`);
const verifyFile = require(verifyFilePath);

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
};

const upgrade = async (proxyAdmin, implementationInstance, proxyInstance) => {
    const currentImplementation = await proxyAdmin.getProxyImplementation(proxyInstance.address);
    console.log("Current proxy: " + proxyInstance.address);
    console.log("Current implementation: " + currentImplementation);
    console.log("Expected implementation: " + implementationInstance.address);
    console.log();
    if (currentImplementation != implementationInstance.address) {
        const upgradeData = await proxyAdmin.upgradeData(proxyInstance.address);
        const appendTimestamp = Number(upgradeData.appendTimestamp);
        if (appendTimestamp == 0) {
            await proxyAdmin.appendUpgrade(proxyInstance.address, implementationInstance.address)
                .then(function (instance) {
                    console.log("[Appending upgrade] ");
                    console.log("Transaction hash: " + instance.hash);
                    console.log("ProxyAdmin appendUpgrade implementation " + implementationInstance.address + " to proxy " + proxyInstance.address);
                });
        } else {
            let timeStamp = (await hre.ethers.provider.getBlock("latest")).timestamp;
            let delayPeriod = Number(upgradeData.delayPeriod);
            if (timeStamp >= appendTimestamp + delayPeriod) {
                await proxyAdmin.upgrade(proxyInstance.address, implementationInstance.address)
                    .then(function (instance) {
                        if (upgradeData.newImplementation != implementationInstance.address) {
                            console.log("[Canceling upgrade]");
                            console.log("Upgrade implementation in queue " + upgradeData.newImplementation + " is different from expected implementation " + implementationInstance.address);
                            console.log("Transaction hash: " + instance.hash);
                            console.log("ProxyAdmin canceled upgrade implementation " + upgradeData.newImplementation + " to proxy " + proxyInstance.address);
                        } else {
                            console.log("[Upgrading] ");
                            console.log("ProxyAdmin upgraded implementation " + upgradeData.newImplementation + " to proxy " + proxyInstance.address);
                        }
                    });
            } else {
                console.log("[Delaying upgrade]");
                console.log("In delay period to upgrade implementation " + upgradeData.newImplementation + " to proxy " + proxyInstance.address);
                console.log("AppendTimestamp: ", appendTimestamp);
                console.log("Delay time: ", delayPeriod);
                console.log("Current: ", timeStamp);
                console.log("Can upgrade at: ", appendTimestamp + delayPeriod);
                console.log("Need to wait another: " + (appendTimestamp + delayPeriod - timeStamp) + "seconds");
                console.log();
            }
        }
    } else {
        console.log("Current implementation is synced with expected implementation " + implementationInstance.address);
    }
};

module.exports = {

    deploymentPriceOracle: async function () {

        //====================================================
        //declare parameters

        let network = hre.network;
        let signers = await hre.ethers.getSigners();

        let deployMaster = signers[0];
        let deployMasterAddress = deployMaster.address;

        // Contracts ABI
        let ProxyAdmin;
        let TransparentUpgradeableProxy;
        let PythPriceProvider;
        let ChainlinkPriceProvider;
        let BackendPriceProvider;
        let UniswapV2PriceProvider;
        let UniswapV2PriceProviderMock;
        let PriceProviderAggregator;
        let LPPriceProvider;
        let WstETHPriceProvider;


        //instances of contracts
        let proxyAdmin;
        let pythPriceProvider;
        let chainlinkPriceProvider;
        let backendPriceProvider;
        let uniswapV2PriceProvider;
        let uniswapV2PriceProviderMock;
        let priceProviderAggregator;
        let lpPriceProvider;
        let wstETHPriceProvider;

        let pythPriceProviderImplementation;
        let chainlinkPriceProviderImplementation;
        let backendPriceProviderImplementation;
        let uniswapV2PriceProviderImplementation;
        let priceProviderAggregatorImplementation;
        let lpPriceProviderImplementation;
        let wstETHPriceProviderImplementation;


        //====================================================
        //initialize deploy parametrs

        const {
            priceOracle
        } = configGeneral;

        const {
            Pyth,
            Chainlink,
            Uniswap,
            BackendProvider,
            LPProvider,
            wstETHProvider,
            wstETH
        } = priceOracle;

        let pythOracle = Pyth.pythOracle;
        let tokensUsePyth = Pyth.tokensUsePyth;
        let priceIdPath = Pyth.priceIdPath;
        let sequencerUptimeFeed = Chainlink.sequencerUptimeFeed;
        let gracePeriodTime = Chainlink.gracePeriodTime;
        let tokensUseChainlink = Chainlink.tokensUseChainlink;
        let chainlinkAggregatorV3 = Chainlink.chainlinkAggregatorV3;
        let timeOuts = Chainlink.timeOuts;
        let tokensUseUniswap = Uniswap.tokensUseUniswap;
        let uniswapPairs = Uniswap.uniswapPairs;
        let tokensUseBackendProvider = BackendProvider.tokensUseBackendProvider;
        let tokensUseLPProvider = LPProvider.tokensUseLPProvider;
        let wstETHAggregatorPath = wstETHProvider.wstETHAggregatorPath;
        let timeOutsWstETHAggregatorPath = wstETHProvider.timeOuts;

        const {
            PRIMARY_PROXY_ADMIN,
            PythPriceProviderLogic,
            PythPriceProviderProxy,
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
        let proxyAdminAddress = isTesting ? "" : PRIMARY_PROXY_ADMIN;
        let pythPriceProviderAddress = isTesting ? "" : PythPriceProviderProxy;
        let chainlinkPriceProviderAddress = isTesting ? "" : ChainlinkPriceProviderProxy;
        let priceProviderAggregatorAddress = isTesting ? "" : PriceProviderAggregatorProxy;
        let backendPriceProviderAddress = isTesting ? "" : BackendPriceProviderProxy;
        let uniswapV2PriceProviderAddress = isTesting ? "" : UniswapV2PriceProviderProxy;
        let uniswapV2PriceProviderMockAddress = "";
        let lpPriceProviderAddress = isTesting ? "" : LPPriceProviderProxy;
        let wstETHPriceProviderAddress = isTesting ? "" : wstETHPriceProviderProxy;

        let backendPriceProviderLogicAddress = isTesting ? "" : BackendPriceProviderLogic;
        let pythPriceProviderLogicAddress = isTesting ? "" : PythPriceProviderLogic;
        let chainlinkPriceProviderLogicAddress = isTesting ? "" : ChainlinkPriceProviderLogic;
        let priceProviderAggregatorLogicAddress = isTesting ? "" : PriceProviderAggregatorLogic;
        let uniswapV2PriceProviderLogicAddress = isTesting ? "" : UniswapV2PriceProviderLogic;
        let uniswapV2PriceProviderMockLogicAddress = "";
        let lpPriceProviderLogicAddress = isTesting ? "" : LPPriceProviderLogic;
        let wstETHPriceProviderLogicAddress = isTesting ? "" : wstETHPriceProviderLogic;

        ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
        TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
        PythPriceProvider = await hre.ethers.getContractFactory("PythPriceProvider");
        ChainlinkPriceProvider = isLayer2 ? await hre.ethers.getContractFactory("ChainlinkPriceProviderL2")
            : await hre.ethers.getContractFactory("ChainlinkPriceProvider");
        BackendPriceProvider = await hre.ethers.getContractFactory("BackendPriceProvider");
        UniswapV2PriceProvider = await hre.ethers.getContractFactory("UniswapV2PriceProvider");
        UniswapV2PriceProviderMock = await hre.ethers.getContractFactory("UniswapV2PriceProviderMock");
        PriceProviderAggregator = await hre.ethers.getContractFactory("PriceProviderAggregatorPyth");
        LPPriceProvider = await hre.ethers.getContractFactory("LPPriceProvider");
        WstETHPriceProvider = isLayer2 ? await hre.ethers.getContractFactory("wstETHPriceProviderL2") : await hre.ethers.getContractFactory("wstETHPriceProvider");

        if (isTesting) {
            console.log = function () { };
            fs.writeFileSync = function () { };
        }

        console.log("Network name: " + network.name);
        console.log("DeployMaster: " + deployMaster.address);
        //====================================================
        //deploy proxy admin

        console.log();
        console.log("***** PROXY ADMIN DEPLOYMENT *****");
        if (!proxyAdminAddress) {
            proxyAdmin = await ProxyAdmin.connect(deployMaster).deploy();
            await proxyAdmin.deployed().then(function (instance) {
                console.log("\nTransaction hash: " + instance.deployTransaction.hash);
                proxyAdminAddress = instance.address;
                config.PRIMARY_PROXY_ADMIN = proxyAdminAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("ProxyAdmin deployed at: " + proxyAdminAddress);

        await verify(proxyAdminAddress, [], "PRIMARY_PROXY_ADMIN");


        //====================== deploy pythPriceProvider =============================
        if (tokensUsePyth.length > 0) {
            console.log();
            console.log("***** PYTH PRICE PROVIDER DEPLOYMENT *****");

            if (!pythPriceProviderLogicAddress) {
                pythPriceProvider = await PythPriceProvider.connect(deployMaster).deploy();
                config.PythPriceProviderLogic = pythPriceProviderLogicAddress = pythPriceProvider.address;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
                await pythPriceProvider.deployed().then(function (instance) {
                    console.log("\nTransaction hash: " + instance.deployTransaction.hash);
                    config.PythPriceProviderLogic = pythPriceProviderLogicAddress = instance.address;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
                });
            }
            console.log(`PythPriceProvider masterCopy was deployed at: ${pythPriceProviderLogicAddress}`);
            await verify(pythPriceProviderLogicAddress, [], "PythPriceProviderLogic");

            if (!pythPriceProviderAddress) {
                const pythPriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                    pythPriceProviderLogicAddress,
                    proxyAdminAddress,
                    "0x"
                );
                await pythPriceProviderProxy.deployed().then(function (instance) {
                    console.log("\nTransaction hash: " + instance.deployTransaction.hash);
                    config.PythPriceProviderProxy = pythPriceProviderAddress = instance.address;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
                });
            }
            console.log(`\nPythPriceProvider was deployed at: ${pythPriceProviderAddress}`);
            await verify(pythPriceProviderAddress, [
                pythPriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "PythPriceProviderProxy");
        }
        //====================================================
        //deploy chainlinkPriceProvider or chainlinkPriceProviderL2
        if (tokensUseChainlink.length > 0) {
            console.log();
            console.log("***** CHAINLINK PRICE PROVIDER DEPLOYMENT *****");

            if (!chainlinkPriceProviderLogicAddress) {
                chainlinkPriceProvider = await ChainlinkPriceProvider.connect(deployMaster).deploy();
                await chainlinkPriceProvider.deployed().then(function (instance) {
                    console.log("\nTransaction hash: " + instance.deployTransaction.hash);
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
                    console.log("\nTransaction hash: " + instance.deployTransaction.hash);
                    chainlinkPriceProviderAddress = instance.address;
                    config.ChainlinkPriceProviderProxy = chainlinkPriceProviderAddress;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
                });
            }

            console.log("\nChainlinkPriceProvider proxy address: " + chainlinkPriceProviderAddress);
            await verify(chainlinkPriceProviderAddress, [
                chainlinkPriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "ChainlinkPriceProviderProxy");
        }
        //====================================================
        //deploy backendPriceProvider
        if (tokensUseBackendProvider.length > 0) {
            console.log();
            console.log("***** BACKEND PRICE PROVIDER DEPLOYMENT *****");

            if (!backendPriceProviderLogicAddress) {
                backendPriceProvider = await BackendPriceProvider.connect(deployMaster).deploy();
                await backendPriceProvider.deployed().then(function (instance) {
                    console.log("\nTransaction hash: " + instance.deployTransaction.hash);
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
                    console.log("\nTransaction hash: " + instance.deployTransaction.hash);
                    backendPriceProviderAddress = instance.address;
                    config.BackendPriceProviderProxy = backendPriceProviderAddress;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
                });
            }
            console.log("\nBackendPriceProvider proxy address: " + backendPriceProviderAddress);
            await verify(backendPriceProviderAddress, [
                backendPriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "BackendPriceProviderProxy");
        }
        //=========================
        //deploy uniswapV2PriceProvider
        if (tokensUseUniswap.length > 0) {
            console.log();
            console.log("***** UNISWAPV2 PRICE PROVIDER DEPLOYMENT *****");

            if (!uniswapV2PriceProviderLogicAddress) {
                uniswapV2PriceProvider = await UniswapV2PriceProvider.connect(deployMaster).deploy();
                await uniswapV2PriceProvider.deployed().then(function (instance) {
                    console.log("\nTransaction hash: " + instance.deployTransaction.hash);
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
                    console.log("\nTransaction hash: " + instance.deployTransaction.hash);
                    uniswapV2PriceProviderAddress = instance.address;
                    config.UniswapV2PriceProviderProxy = uniswapV2PriceProviderAddress;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
                });
            }
            console.log("\nUniswapV2PriceProvider proxy address: " + uniswapV2PriceProviderAddress);
            await verify(uniswapV2PriceProviderAddress, [
                uniswapV2PriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "UniswapV2PriceProviderProxy");
        }
        //=========================
        //deploy LPPriceProvider
        if (tokensUseLPProvider.length > 0) {
            console.log();
            console.log("***** LP PRICE PROVIDER DEPLOYMENT *****");

            if (!lpPriceProviderLogicAddress) {
                lpPriceProvider = await LPPriceProvider.connect(deployMaster).deploy();
                await lpPriceProvider.deployed().then(function (instance) {
                    console.log("\nTransaction hash: " + instance.deployTransaction.hash);
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
                    console.log("\nTransaction hash: " + instance.deployTransaction.hash);
                    lpPriceProviderAddress = instance.address;
                    config.LPPriceProviderProxy = lpPriceProviderAddress;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
                });
            }
            console.log("\nlpPriceProvider proxy address: " + lpPriceProviderAddress);
            await verify(lpPriceProviderAddress, [
                lpPriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "LPPriceProviderProxy");
        }

        //=========================
        //deploy wstETHPriceProvider
        if (wstETHAggregatorPath.length > 0) {
            console.log();
            console.log("***** WSTETH PRICE PROVIDER DEPLOYMENT *****");

            if (!wstETHPriceProviderLogicAddress) {
                wstETHPriceProvider = await WstETHPriceProvider.connect(deployMaster).deploy();
                await wstETHPriceProvider.deployed().then(function (instance) {
                    console.log("\nTransaction hash: " + instance.deployTransaction.hash);
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
                    console.log("\nTransaction hash: " + instance.deployTransaction.hash);
                    wstETHPriceProviderAddress = instance.address;
                    config.wstETHPriceProviderProxy = wstETHPriceProviderAddress;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
                });
            }
            console.log("\nwstETHPriceProvider proxy address: " + wstETHPriceProviderAddress);
            await verify(wstETHPriceProviderAddress, [
                wstETHPriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "wstETHPriceProviderProxy");
        }
        //=========================
        //deploy PriceProviderAggregator
        console.log();
        console.log("***** PRICE PROVIDER AGGREGATOR DEPLOYMENT *****");

        if (!priceProviderAggregatorLogicAddress) {
            priceProviderAggregator = await PriceProviderAggregator.connect(deployMaster).deploy();
            await priceProviderAggregator.deployed().then(function (instance) {
                console.log("\nTransaction hash: " + instance.deployTransaction.hash);
                priceProviderAggregatorLogicAddress = instance.address;
                config.PriceProviderAggregatorLogic = priceProviderAggregatorLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("PriceProviderAggregator masterCopy address: " + priceProviderAggregatorLogicAddress);
        await verify(priceProviderAggregatorLogicAddress, [], "PriceProviderAggregatorLogic");

        if (!priceProviderAggregatorAddress) {
            let priceProviderAggregatorProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                priceProviderAggregatorLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await priceProviderAggregatorProxy.deployed().then(function (instance) {
                console.log("\nTransaction hash: " + instance.deployTransaction.hash);
                priceProviderAggregatorAddress = instance.address;
                config.PriceProviderAggregatorProxy = priceProviderAggregatorAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("\nPriceProviderAggregator proxy address: " + priceProviderAggregatorAddress);
        await verify(priceProviderAggregatorAddress, [
            priceProviderAggregatorLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PriceProviderAggregatorProxy");
        //====================================================
        //deploy and setting uniswapPriceProviderMock
        if (isTesting) {
            console.log();
            console.log("***** UNISWAPV2 PRICE PROVIDER MOCK DEPLOYMENT *****");

            if (!uniswapV2PriceProviderMockLogicAddress) {
                uniswapV2PriceProviderMock = await UniswapV2PriceProviderMock.connect(deployMaster).deploy();
                await uniswapV2PriceProviderMock.deployed().then(function (instance) {
                    uniswapV2PriceProviderMockLogicAddress = instance.address;
                });
            }
            if (!uniswapV2PriceProviderMockAddress) {
                let uniswapV2PriceProviderMockProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                    uniswapV2PriceProviderMockLogicAddress,
                    proxyAdminAddress,
                    "0x"
                );
                await uniswapV2PriceProviderMockProxy.deployed().then(function (instance) {
                    uniswapV2PriceProviderMockAddress = instance.address;
                });
            }
            uniswapV2PriceProviderMock = UniswapV2PriceProviderMock.attach(uniswapV2PriceProviderMockAddress).connect(deployMaster);
            {
                let usdDecimal = await uniswapV2PriceProviderMock.getPriceDecimals();
                if (usdDecimal == 0) {
                    await uniswapV2PriceProviderMock.initialize();
                }
            }

            {
                let moderatorRole = await uniswapV2PriceProviderMock.MODERATOR_ROLE();
                let isModeratorRole = await uniswapV2PriceProviderMock.hasRole(moderatorRole, priceProviderAggregatorAddress);
                if (!isModeratorRole) {
                    await uniswapV2PriceProviderMock.grantModerator(priceProviderAggregatorAddress);
                }
            }
        }
        //====================================================
        //setting params

        proxyAdmin = ProxyAdmin.attach(proxyAdminAddress).connect(deployMaster);
        pythPriceProvider = PythPriceProvider.attach(pythPriceProviderAddress).connect(deployMaster);
        chainlinkPriceProvider = ChainlinkPriceProvider.attach(chainlinkPriceProviderAddress).connect(deployMaster);
        backendPriceProvider = BackendPriceProvider.attach(backendPriceProviderAddress).connect(deployMaster);
        uniswapV2PriceProvider = UniswapV2PriceProvider.attach(uniswapV2PriceProviderAddress).connect(deployMaster);
        lpPriceProvider = LPPriceProvider.attach(lpPriceProviderAddress).connect(deployMaster);
        wstETHPriceProvider = WstETHPriceProvider.attach(wstETHPriceProviderAddress).connect(deployMaster);
        priceProviderAggregator = PriceProviderAggregator.attach(priceProviderAggregatorAddress).connect(deployMaster);

        pythPriceProviderImplementation = PythPriceProvider.attach(pythPriceProviderLogicAddress).connect(deployMaster);
        chainlinkPriceProviderImplementation = ChainlinkPriceProvider.attach(chainlinkPriceProviderLogicAddress).connect(deployMaster);
        backendPriceProviderImplementation = BackendPriceProvider.attach(backendPriceProviderLogicAddress).connect(deployMaster);
        uniswapV2PriceProviderImplementation = UniswapV2PriceProvider.attach(uniswapV2PriceProviderLogicAddress).connect(deployMaster);
        lpPriceProviderImplementation = LPPriceProvider.attach(lpPriceProviderLogicAddress).connect(deployMaster);
        wstETHPriceProviderImplementation = WstETHPriceProvider.attach(wstETHPriceProviderLogicAddress).connect(deployMaster);
        priceProviderAggregatorImplementation = PriceProviderAggregator.attach(priceProviderAggregatorLogicAddress).connect(deployMaster);

        //==============================
        // ====================== upgrade pythPriceProvider =============================
        if (pythPriceProviderAddress) {
            console.log();
            console.log("***** UPGRADING PYTH PRICE PROVIDER *****");
            await upgrade(proxyAdmin, pythPriceProviderImplementation, pythPriceProvider);
        }

        // ====================== upgrade chainlinkPriceProvider =============================
        if (chainlinkPriceProviderAddress) {
            console.log();
            console.log("***** UPGRADING CHAINLINK PRICE PROVIDER *****");
            await upgrade(proxyAdmin, chainlinkPriceProviderImplementation, chainlinkPriceProvider);
        }

        // ====================== upgrade backendPriceProvider =============================
        if (backendPriceProviderAddress) {
            console.log();
            console.log("***** UPGRADING BACKEND PRICE PROVIDER *****");
            await upgrade(proxyAdmin, backendPriceProviderImplementation, backendPriceProvider);
        }

        // ====================== upgrade uniswapV2PriceProvider =============================
        if (uniswapV2PriceProviderAddress) {
            console.log();
            console.log("***** UPGRADING UNISWAPV2 PRICE PROVIDER *****");
            await upgrade(proxyAdmin, uniswapV2PriceProviderImplementation, uniswapV2PriceProvider);
        }

        // ====================== upgrade lpPriceProvider =============================
        if (lpPriceProviderAddress) {
            console.log();
            console.log("***** UPGRADING LP PRICE PROVIDER *****");
            await upgrade(proxyAdmin, lpPriceProviderImplementation, lpPriceProvider);
        }

        // ====================== upgrade wstETHPriceProvider =============================
        if (wstETHPriceProviderAddress) {
            console.log();
            console.log("***** UPGRADING WSTETH PRICE PROVIDER *****");
            await upgrade(proxyAdmin, wstETHPriceProviderImplementation, wstETHPriceProvider);
        }

        // ====================== upgrade priceProviderAggregator =============================
        if (priceProviderAggregatorAddress) {
            console.log();
            console.log("***** UPGRADING PRICE PROVIDER AGGREGATOR *****");
            await upgrade(proxyAdmin, priceProviderAggregatorImplementation, priceProviderAggregator);
        }

        //==============================
        // ====================== set pythPriceProvider =============================
        if (pythPriceProviderAddress) {
            console.log();
            console.log("***** SETTING PYTH PRICE PROVIDER *****");

            {
                let tokenDecimal = await pythPriceProviderImplementation.tokenDecimals();
                if (tokenDecimal == 0) {
                    await pythPriceProviderImplementation.initialize()
                        .then(function (instance) {
                            console.log("Transaction hash: " + instance.hash);
                            console.log("PythPriceProvider Implementation initialized at " + pythPriceProviderLogicAddress);
                        });
                }
            }

            {
                let tokenDecimal = await pythPriceProvider.tokenDecimals();
                if (tokenDecimal == 0) {
                    await pythPriceProvider.initialize()
                        .then(function (instance) {
                            console.log("\nTransaction hash: " + instance.hash);
                            console.log("PythPriceProvider initialized at " + pythPriceProviderAddress);
                        });
                }
            }

            {
                let moderatorRole = await pythPriceProvider.MODERATOR_ROLE();
                let isModeratorRole = await pythPriceProvider.hasRole(moderatorRole, priceProviderAggregatorAddress);
                if (!isModeratorRole) {
                    await pythPriceProvider.grantModerator(priceProviderAggregatorAddress)
                        .then(function (instance) {
                            console.log("\nTransaction hash: " + instance.hash);
                            console.log("PythPriceProvider " + pythPriceProvider.address + " granted moderator " + priceProviderAggregatorAddress);
                        });
                }
            }
            {
                let currentPythOracle = await pythPriceProvider.pythOracle();
                if (currentPythOracle != pythOracle) {
                    await pythPriceProvider.setPythOracle(pythOracle)
                        .then(function (instance) {
                            console.log("\nTransaction hash: " + instance.hash);
                            console.log("PythPriceProvider" + pythPriceProvider.address + " set pythOracle: " + pythOracle);
                        });
                }
            }
            {
                for (var i = 0; i < tokensUsePyth.length; i++) {
                    let pythMetadata = await pythPriceProvider.getPythMetadata(tokensUsePyth[i]);
                    const currentPriceIdPath = pythMetadata.priceIdPath;
                    for (let j = 0; j < priceIdPath.length; j++) {
                        if (currentPriceIdPath[j] != priceIdPath[i][j]) {
                            await pythPriceProvider.setTokenAndPriceIdPath(
                                tokensUsePyth[i],
                                priceIdPath[i]
                            ).then(function (instance) {
                                console.log("\nTransaction hash: " + instance.hash);
                                console.log("PythPriceProvider " + pythPriceProvider.address + " set token with parameters: ");
                                console.log("   token: " + tokensUsePyth[i]);
                                console.log("   priceId path: " + priceIdPath[i]);
                            });
                            break;
                        }
                    }
                }
            }
        }
        //==============================
        //set chainlinkPriceProvider or chainlinkPriceProviderL2
        if (chainlinkPriceProviderAddress) {
            console.log();
            console.log("***** SETTING CHAINLINK PRICE PROVIDER *****");

            {
                let usdDecimal = await chainlinkPriceProviderImplementation.usdDecimals();
                if (usdDecimal == 0) {
                    await chainlinkPriceProviderImplementation.initialize()
                        .then(function (instance) {
                            console.log("Transaction hash: " + instance.hash);
                            console.log("ChainlinkPriceProvider Implementation initialized at " + chainlinkPriceProviderLogicAddress);
                        });
                }
            }

            {
                let usdDecimal = await chainlinkPriceProvider.usdDecimals();
                if (usdDecimal == 0) {
                    await chainlinkPriceProvider.initialize()
                        .then(function (instance) {
                            console.log("\nTransaction hash: " + instance.hash);
                            console.log("ChainlinkPriceProvider initialized at " + chainlinkPriceProviderAddress);
                        });
                }
            }

            {
                let moderatorRole = await chainlinkPriceProvider.MODERATOR_ROLE();
                let isModeratorRole = await chainlinkPriceProvider.hasRole(moderatorRole, priceProviderAggregatorAddress);
                if (!isModeratorRole) {
                    await chainlinkPriceProvider.grantModerator(priceProviderAggregatorAddress)
                        .then(function (instance) {
                            console.log("\nTransaction hash: " + instance.hash);
                            console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " granted moderator " + priceProviderAggregatorAddress);
                        });
                }
            }

            if (sequencerUptimeFeed) {
                let currentSequencerUptimeFeed = await chainlinkPriceProvider.sequencerUptimeFeed();
                if (sequencerUptimeFeed != currentSequencerUptimeFeed) {
                    await chainlinkPriceProvider.setSequencerUptimeFeed(
                        sequencerUptimeFeed
                    ).then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set sequencerUptimeFeed: " + sequencerUptimeFeed);
                    });
                }
                let currentGracePeriodTime = await chainlinkPriceProvider.gracePeriodTime();
                if (gracePeriodTime != currentGracePeriodTime) {
                    await chainlinkPriceProvider.setGracePeriodTime(
                        gracePeriodTime
                    ).then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set gracePeriodTime: " + gracePeriodTime);
                    });
                }
            }

            for (var i = 0; i < tokensUseChainlink.length; i++) {
                let chainlinkMetadata = await chainlinkPriceProvider.getChainlinkMetadata(tokensUseChainlink[i]);
                const aggregatorPath = chainlinkMetadata.aggregatorPath;
                for (let j = 0; j < aggregatorPath.length; j++) {
                    if (aggregatorPath[j] != chainlinkAggregatorV3[i][j]) {
                        await chainlinkPriceProvider.setTokenAndAggregator(
                            tokensUseChainlink[i],
                            chainlinkAggregatorV3[i]
                        ).then(function (instance) {
                            console.log("\nTransaction hash: " + instance.hash);
                            console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set token with parameters: ");
                            console.log("   token: " + tokensUseChainlink[i]);
                            console.log("   aggregator path: " + chainlinkAggregatorV3[i]);
                        });
                        break;
                    }
                }
                for (var j = 0; j < chainlinkAggregatorV3[i].length; j++) {
                    let timeOut = await chainlinkPriceProvider.timeOuts(chainlinkAggregatorV3[i][j]);
                    if (timeOut != timeOuts[i][j]) {
                        await chainlinkPriceProvider.setTimeOut(
                            chainlinkAggregatorV3[i][j],
                            timeOuts[i][j]
                        ).then(function (instance) {
                            console.log("\nTransaction hash: " + instance.hash);
                            console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set timeout with parameters: ");
                            console.log("   aggregator: " + chainlinkAggregatorV3[i][j]);
                            console.log("   timeout: " + timeOuts[i][j]);
                        });
                    }
                }
            }
        }

        //==============================
        //set backendPriceProvider
        if (backendPriceProviderAddress) {
            console.log();
            console.log("***** SETTING BACKEND PRICE PROVIDER *****");

            {
                let usdDecimal = await backendPriceProviderImplementation.usdDecimals();
                if (usdDecimal == 0) {
                    await backendPriceProviderImplementation.initialize()
                        .then(function (instance) {
                            console.log("Transaction hash: " + instance.hash);
                            console.log("BackendPriceProvider Implementation initialized at: " + backendPriceProviderLogicAddress);
                        });
                }
            }

            {
                let usdDecimal = await backendPriceProvider.usdDecimals();
                if (usdDecimal == 0) {
                    await backendPriceProvider.initialize()
                        .then(function (instance) {
                            console.log("\nTransaction hash: " + instance.hash);
                            console.log("BackendPriceProvider initialized at: " + backendPriceProviderAddress);
                        });
                }
            }

            {
                let moderatorRole = await backendPriceProvider.TRUSTED_BACKEND_ROLE();
                let isModeratorRole = await backendPriceProvider.hasRole(moderatorRole, deployMasterAddress);
                if (!isModeratorRole) {
                    await backendPriceProvider.grantTrustedBackendRole(deployMasterAddress)
                        .then(function (instance) {
                            console.log("\nTransaction hash: " + instance.hash);
                            console.log("BackendPriceProvider set trusted backend at " + backendPriceProvider.address);
                        });
                }
            }


            for (var i = 0; i < tokensUseBackendProvider.length; i++) {
                let backendMetadata = await backendPriceProvider.backendMetadata(tokensUseBackendProvider[i]);
                if (backendMetadata.isListed == false || backendMetadata.isActive == false) {
                    await backendPriceProvider.setToken(tokensUseBackendProvider[i]).then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("BackendPriceProvider " + backendPriceProvider.address + " set token " + tokensUseBackendProvider[i]);
                    });
                }
            }
        }

        //==============================
        //set uniswapV2PriceProvider
        if (uniswapV2PriceProviderAddress) {
            console.log();
            console.log("***** SETTING UNISWAPV2 PRICE PROVIDER *****");

            {
                let usdDecimal = await uniswapV2PriceProviderImplementation.getPriceDecimals();
                if (usdDecimal == 0) {
                    await uniswapV2PriceProviderImplementation.initialize().then(function (instance) {
                        console.log("Transaction hash: " + instance.hash);
                        console.log("UniswapV2PriceProvider Implementation initialized at " + uniswapV2PriceProviderLogicAddress);
                    });
                }
            }

            {
                let usdDecimal = await uniswapV2PriceProvider.getPriceDecimals();
                if (usdDecimal == 0) {
                    await uniswapV2PriceProvider.initialize().then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("UniswapV2PriceProvider initialized at " + uniswapV2PriceProviderAddress);
                    });
                }
            }

            {
                let moderatorRole = await uniswapV2PriceProvider.MODERATOR_ROLE();
                let isModeratorRole = await uniswapV2PriceProvider.hasRole(moderatorRole, priceProviderAggregatorAddress);
                if (!isModeratorRole) {
                    await uniswapV2PriceProvider.grantModerator(priceProviderAggregatorAddress).then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("UniswapV2PriceProvider granted moderator at " + priceProviderAggregatorAddress);
                    });
                }
            }

            for (var i = 0; i < tokensUseUniswap.length; i++) {
                let uniswapV2Metadata = await uniswapV2PriceProvider.uniswapV2Metadata(tokensUseUniswap[i]);
                if (uniswapV2Metadata.isActive == false || uniswapV2Metadata.pair != uniswapPairs[i]) {
                    await uniswapV2PriceProvider.setTokenAndPair(tokensUseUniswap[i], uniswapPairs[i]).then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("UniswapV2PriceProvider set token " + tokensUseUniswap[i] + " and pair " + uniswapPairs[i]);
                    });
                }
            }
        }

        //==============================
        //set lpPriceProvider
        if (lpPriceProviderAddress) {
            console.log();
            console.log("***** SETTING LP PRICE PROVIDER *****");

            {
                let usdDecimal = await lpPriceProviderImplementation.getPriceDecimals();
                if (usdDecimal == 0) {
                    await lpPriceProviderImplementation.initialize().then(function (instance) {
                        console.log("Transaction hash: " + instance.hash);
                        console.log("lpPriceProvider Implementation initialized at " + lpPriceProviderLogicAddress);
                    });
                }
            }

            {
                let usdDecimal = await lpPriceProvider.getPriceDecimals();
                if (usdDecimal == 0) {
                    await lpPriceProvider.initialize().then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("lpPriceProvider initialized at " + lpPriceProviderAddress);
                    });
                }
            }

            {
                let moderatorRole = await lpPriceProvider.MODERATOR_ROLE();
                let isModeratorRole = await lpPriceProvider.hasRole(moderatorRole, priceProviderAggregatorAddress);
                if (!isModeratorRole) {
                    await lpPriceProvider.grantModerator(priceProviderAggregatorAddress).then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("lpPriceProvider granted moderator " + priceProviderAggregatorAddress);
                    });
                }
            }

            for (var i = 0; i < tokensUseLPProvider.length; i++) {
                let lpMetadata = await lpPriceProvider.lpMetadata(tokensUseLPProvider[i]);
                if (lpMetadata.isActive == false || lpMetadata.base != priceProviderAggregatorAddress) {
                    await lpPriceProvider.setLPTokenAndProvider(tokensUseLPProvider[i], priceProviderAggregatorAddress).then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("LPPriceProvider  set token " + tokensUseLPProvider[i] + " and pair " + priceProviderAggregatorAddress);
                    });
                }
            }
        }

        //==============================
        //set wstETHPriceProvider
        if (wstETHPriceProviderAddress) {
            console.log();
            console.log("***** SETTING WSTETH PRICE PROVIDER *****");

            {
                let usdDecimal = await wstETHPriceProviderImplementation.getPriceDecimals();
                if (usdDecimal == 0) {
                    await wstETHPriceProviderImplementation.initialize(wstETH, wstETHAggregatorPath).then(function (instance) {
                        console.log("Transaction hash: " + instance.hash);
                        console.log("wstETHPriceProvider Implementation initialized at " + wstETHPriceProviderLogicAddress);
                    });
                }
            }

            {
                let usdDecimal = await wstETHPriceProvider.getPriceDecimals();
                if (usdDecimal == 0) {
                    await wstETHPriceProvider.initialize(wstETH, wstETHAggregatorPath).then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("wstETHPriceProvider initialized at " + wstETHPriceProviderAddress);
                    });
                }
            }

            {
                let moderatorRole = await wstETHPriceProvider.MODERATOR_ROLE();
                let isModeratorRole = await wstETHPriceProvider.hasRole(moderatorRole, priceProviderAggregatorAddress);
                if (!isModeratorRole) {
                    await wstETHPriceProvider.grantModerator(priceProviderAggregatorAddress).then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("wstETHPriceProvider granted moderator " + priceProviderAggregatorAddress);
                    });
                }
            }
            {
                let checkUpdateWstETHAggregatorPath = false;
                for (let i = 0; i < wstETHAggregatorPath.length; i++) {
                    let aggregator;
                    try {
                        aggregator = await wstETHAggregatorPath.aggregatorPath(i);
                    } catch (error) {
                        checkUpdateWstETHAggregatorPath = true;
                        break;
                    }
                    if (aggregator != wstETHAggregatorPath[i]) {
                        checkUpdateWstETHAggregatorPath = true;
                        break;
                    }
                }
                try {
                    await wstETHAggregatorPath.aggregatorPath(wstETHAggregatorPath.length);
                    checkUpdateWstETHAggregatorPath = true;
                } catch (error) {
                    checkUpdateWstETHAggregatorPath = false;
                }
                if (checkUpdateWstETHAggregatorPath) {
                    await wstETHPriceProvider.addAggregatorPath(wstETHAggregatorPath).then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("wstETHPriceProvider add AggregatorPath: " + wstETHAggregatorPath);
                    });
                }
            }

            if (sequencerUptimeFeed) {
                let currentSequencerUptimeFeed = await wstETHPriceProvider.sequencerUptimeFeed();
                if (sequencerUptimeFeed != currentSequencerUptimeFeed) {
                    await wstETHPriceProvider.setSequencerUptimeFeed(
                        sequencerUptimeFeed
                    ).then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("wstETHPriceProvider " + wstETHPriceProvider.address + " set sequencerUptimeFeed: " + sequencerUptimeFeed);
                    });
                }
                let currentGracePeriodTime = await wstETHPriceProvider.gracePeriodTime();
                if (gracePeriodTime != currentGracePeriodTime) {
                    await wstETHPriceProvider.setGracePeriodTime(
                        gracePeriodTime
                    ).then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("wstETHPriceProvider " + wstETHPriceProvider.address + " set gracePeriodTime: " + gracePeriodTime);
                    });
                }
            }

            for (var i = 0; i < wstETHAggregatorPath.length; i++) {
                let timeOut = await wstETHPriceProvider.timeOuts(wstETHAggregatorPath[i]);
                if (timeOut != timeOutsWstETHAggregatorPath[i]) {
                    await wstETHPriceProvider.setTimeOut(
                        wstETHAggregatorPath[i],
                        timeOutsWstETHAggregatorPath[i]
                    ).then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("wstETHPriceProvider " + wstETHPriceProvider.address + " set timeout with parameters: ");
                        console.log("   aggregator: " + wstETHAggregatorPath[i]);
                        console.log("   timeout: " + timeOutsWstETHAggregatorPath[i]);
                    });
                }
            }
        }


        //==============================
        //set priceProviderAggregator
        console.log();
        console.log("***** SETTING PROVIDER AGGREGATOR *****");

        {
            let usdDecimal = await priceProviderAggregatorImplementation.usdDecimals();
            if (usdDecimal == 0) {
                await priceProviderAggregatorImplementation.initialize().then(function (instance) {
                    console.log("Transaction hash: " + instance.hash);
                    console.log("PriceProviderAggregator Implementation initialized at " + priceProviderAggregatorLogicAddress);
                });
            }
        }

        {
            let usdDecimal = await priceProviderAggregator.usdDecimals();
            if (usdDecimal == 0) {
                await priceProviderAggregator.initialize().then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PriceProviderAggregator initialized at " + priceProviderAggregatorAddress);
                });
            }
        }

        {
            let moderatorRole = await priceProviderAggregator.MODERATOR_ROLE();
            let isModeratorRole = await priceProviderAggregator.hasRole(moderatorRole, deployMasterAddress);
            if (!isModeratorRole) {
                await priceProviderAggregator.grantModerator(deployMasterAddress).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PriceProviderAggregator " + priceProviderAggregator.address + " granted moderator " + deployMasterAddress);
                });
            }
        }
        {
            if (pythPriceProviderAddress) {
                const currentImplementation = await proxyAdmin.getProxyImplementation(priceProviderAggregator.address);
                if (currentImplementation == priceProviderAggregatorLogicAddress) {
                    let currentPythPriceProvider = await priceProviderAggregator.pythPriceProvider();
                    if (currentPythPriceProvider != pythPriceProviderAddress) {
                        await priceProviderAggregator.setPythPriceProvider(pythPriceProviderAddress).then(function (instance) {
                            console.log("\nTransaction hash: " + instance.hash);
                            console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set pythPriceProviderAddress " + pythPriceProviderAddress);
                        });
                    }
                }
            }
        }
        for (var i = 0; i < tokensUseChainlink.length; i++) {
            let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(tokensUseChainlink[i]);
            if (tokenPriceProvider.priceProvider != chainlinkPriceProviderAddress) {
                await priceProviderAggregator.setTokenAndPriceProvider(tokensUseChainlink[i], chainlinkPriceProviderAddress, false).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUseChainlink[i] + " with priceOracle " + chainlinkPriceProviderAddress);
                });
            }
        }

        for (var i = 0; i < tokensUseUniswap.length; i++) {
            let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(tokensUseUniswap[i]);
            if (tokenPriceProvider.priceProvider != uniswapV2PriceProviderAddress) {
                await priceProviderAggregator.setTokenAndPriceProvider(tokensUseUniswap[i], uniswapV2PriceProviderAddress, false).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUseUniswap[i] + " with priceOracle " + uniswapV2PriceProviderAddress);
                });
            }
        }

        for (var i = 0; i < tokensUseLPProvider.length; i++) {
            let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(tokensUseLPProvider[i]);
            if (tokenPriceProvider.priceProvider != lpPriceProviderAddress) {
                await priceProviderAggregator.setTokenAndPriceProvider(tokensUseLPProvider[i], lpPriceProviderAddress, false).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUseLPProvider[i] + " with priceOracle " + lpPriceProviderAddress);
                });
            }
        }

        for (var i = 0; i < tokensUsePyth.length; i++) {
            let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(tokensUsePyth[i]);
            if (tokenPriceProvider.priceProvider != pythPriceProviderAddress) {
                await priceProviderAggregator.setTokenAndPriceProvider(tokensUsePyth[i], pythPriceProviderAddress, false).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUsePyth[i] + " with priceOracle " + pythPriceProviderAddress);
                });
            }
        }

        if (wstETHPriceProviderAddress) {
            let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(wstETH);
            if (tokenPriceProvider.priceProvider != wstETHPriceProviderAddress) {
                await priceProviderAggregator.setTokenAndPriceProvider(wstETH, wstETHPriceProviderAddress, false).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + wstETH + " with priceOracle " + wstETHPriceProviderAddress);
                });
            }
        }

        let addresses = {
            proxyAdminAddress: proxyAdminAddress,
            pythPriceProviderAddress: pythPriceProviderAddress,
            chainlinkPriceProviderAddress: chainlinkPriceProviderAddress,
            backendPriceProviderAddress: backendPriceProviderAddress,
            uniswapV2PriceProviderAddress: uniswapV2PriceProviderAddress,
            uniswapV2PriceProviderMockAddress: uniswapV2PriceProviderMockAddress,
            lpPriceProviderAddress: lpPriceProviderAddress,
            wstETHPriceProvider: wstETHPriceProviderAddress,
            priceProviderAggregatorAddress: priceProviderAggregatorAddress
        };

        return addresses;
    }

};