require("dotenv").config();
const hre = require("hardhat");
const network = hre.hardhatArguments.network;

const isTesting = process.env.TESTING === "true";
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
const { EvmPriceServiceConnection } = require('@pythnetwork/pyth-evm-js');

const log = (...args) => {
    if (isTesting) {
        return
    } else {
        console.log(args);
    }
}

const verify = async (address, constructorArguments, keyInConfig) => {
    log("Verifying " + address);
    if (!verifyFile[keyInConfig]) {
        await hre.run(`verify:verify`, {
            address,
            constructorArguments,
        });
        verifyFile[keyInConfig] = true;
        fs.writeFileSync(path.join(verifyFilePath), JSON.stringify(verifyFile, null, 2));
    }
    log("Verified " + address);
};

const upgrade = async (proxyAdmin, implementationInstance, proxyInstance) => {
    const currentImplementation = await proxyAdmin.getProxyImplementation(proxyInstance.address);
    log("Current proxy: " + proxyInstance.address);
    log("Current implementation: " + currentImplementation);
    log("Expected implementation: " + implementationInstance.address);
    log();
    if (currentImplementation.toLowerCase() != implementationInstance.address.toLowerCase()) {
        const upgradeData = await proxyAdmin.upgradeData(proxyInstance.address);
        const appendTimestamp = Number(upgradeData.appendTimestamp);
        if (appendTimestamp == 0) {
            await proxyAdmin.appendUpgrade(proxyInstance.address, implementationInstance.address)
                .then(function (instance) {
                    log("[Appending upgrade] ");
                    log("Transaction hash: " + instance.hash);
                    log("ProxyAdmin appendUpgrade implementation " + implementationInstance.address + " to proxy " + proxyInstance.address);
                });
        } else {
            let timeStamp = (await hre.ethers.provider.getBlock("latest")).timestamp;
            let delayPeriod = Number(upgradeData.delayPeriod);
            if (timeStamp >= appendTimestamp + delayPeriod) {
                await proxyAdmin.upgrade(proxyInstance.address, implementationInstance.address)
                    .then(function (instance) {
                        if (upgradeData.newImplementation.toLowerCase() != implementationInstance.address.toLowerCase()) {
                            log("[Canceling upgrade]");
                            log("Upgrade implementation in queue " + upgradeData.newImplementation + " is different from expected implementation " + implementationInstance.address);
                            log("Transaction hash: " + instance.hash);
                            log("ProxyAdmin canceled upgrade implementation " + upgradeData.newImplementation + " to proxy " + proxyInstance.address);
                        } else {
                            log("[Upgrading] ");
                            log("ProxyAdmin upgraded implementation " + upgradeData.newImplementation + " to proxy " + proxyInstance.address);
                        }
                    });
            } else {
                log("[Delaying upgrade]");
                log("In delay period to upgrade implementation " + upgradeData.newImplementation + " to proxy " + proxyInstance.address);
                log("AppendTimestamp: ", appendTimestamp);
                log("Delay time: ", delayPeriod);
                log("Current: ", timeStamp);
                log("Can upgrade at: ", appendTimestamp + delayPeriod);
                log("Need to wait another: " + (appendTimestamp + delayPeriod - timeStamp) + "seconds");
                log();
            }
        }
    } else {
        log("Current implementation is synced with expected implementation " + implementationInstance.address);
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
        let PriceOracle;
        let PythPriceProvider;
        let ChainlinkPriceProvider;
        let BackendPriceProvider;
        let UniswapV2PriceProvider;
        let UniswapV3PriceProvider;
        let UniswapV2PriceProviderMock;
        let PriceProviderAggregator;
        let LPPriceProvider;
        let ERC4626PriceProvider;
        let WstETHPriceProvider;


        //instances of contracts
        let proxyAdmin;
        let priceOracleProvider;
        let pythPriceProvider;
        let chainlinkPriceProvider;
        let backendPriceProvider;
        let uniswapV2PriceProvider;
        let uniswapV3PriceProvider;
        let uniswapV2PriceProviderMock;
        let priceProviderAggregator;
        let lpPriceProvider;
        let erc4626PriceProvider;
        let wstETHPriceProvider;

        let pythPriceProviderImplementation;
        let chainlinkPriceProviderImplementation;
        let backendPriceProviderImplementation;
        let uniswapV2PriceProviderImplementation;
        let uniswapV3PriceProviderImplementation;
        let priceProviderAggregatorImplementation;
        let priceOracleImplementation;
        let lpPriceProviderImplementation;
        let erc4626PriceProviderImplementation;
        let wstETHPriceProviderImplementation;


        //====================================================
        //initialize deploy parametrs

        const {
            priceOracle,
            plpModeratorParams,
            blendingToken
        } = configGeneral;

        const {
            priceProcessingOracle,
            Pyth,
            Chainlink,
            UniswapV2,
            UniswapV3,
            BackendProvider,
            LPProvider,
            ERC4626Provider,
            wstETHProvider,
            wstETH
        } = priceOracle;
        let volatilityCapUpPercent = priceProcessingOracle.volatilityCapUpPercent;
        let volatilityCapDownPercent = priceProcessingOracle.volatilityCapDownPercent;

        let pythOracle = Pyth.pythOracle;
        let tokensUsePyth = Pyth.tokensUsePyth;
        let priceIdPath = Pyth.priceIdPath;
        let sequencerUptimeFeed = Chainlink.sequencerUptimeFeed;
        let gracePeriodTime = Chainlink.gracePeriodTime;
        let tokensUseChainlink = Chainlink.tokensUseChainlink;
        let chainlinkAggregatorV3 = Chainlink.chainlinkAggregatorV3;
        let timeOuts = Chainlink.timeOuts;
        let tokensUseUniswapV2 = UniswapV2.tokensUseUniswap;
        let uniswapPairsV2 = UniswapV2.uniswapPairs;
        let tokensUseUniswapV3 = UniswapV3.tokensUseUniswap;
        let pricePointTWAPperiodV3 = UniswapV3.pricePointTWAPperiod;
        let uniswapPairsV3 = UniswapV3.uniswapPairs;
        let tokensUseBackendProvider = BackendProvider.tokensUseBackendProvider;
        let tokensUseLPProvider = LPProvider.tokensUseLPProvider;
        let tokensUseERC4626Provider = ERC4626Provider.tokensUseERC4626Provider;
        let wstETHAggregatorPath = wstETHProvider.wstETHAggregatorPath;
        let timeOutsWstETHAggregatorPath = wstETHProvider.timeOuts;

        let projectTokens = plpModeratorParams.projectTokens;
        let lendingTokens = blendingToken.lendingTokens;

        const {
            PRIMARY_PROXY_ADMIN,
            PriceOracleLogic,
            PriceOracleProxy,
            PythPriceProviderLogic,
            PythPriceProviderProxy,
            ChainlinkPriceProviderLogic,
            ChainlinkPriceProviderProxy,
            BackendPriceProviderLogic,
            BackendPriceProviderProxy,
            UniswapV2PriceProviderLogic,
            UniswapV2PriceProviderProxy,
            UniswapV3PriceProviderLogic,
            UniswapV3PriceProviderProxy,
            PriceProviderAggregatorLogic,
            PriceProviderAggregatorProxy,
            LPPriceProviderLogic,
            LPPriceProviderProxy,
            ERC4626PriceProviderLogic,
            ERC4626PriceProviderProxy,
            wstETHPriceProviderLogic,
            wstETHPriceProviderProxy
        } = config;

        //contracts addresses
        let proxyAdminAddress = isTesting ? "" : PRIMARY_PROXY_ADMIN;
        let priceOracleAddress = isTesting ? "" : PriceOracleProxy;
        let pythPriceProviderAddress = isTesting ? "" : PythPriceProviderProxy;
        let chainlinkPriceProviderAddress = isTesting ? "" : ChainlinkPriceProviderProxy;
        let priceProviderAggregatorAddress = isTesting ? "" : PriceProviderAggregatorProxy;
        let backendPriceProviderAddress = isTesting ? "" : BackendPriceProviderProxy;
        let uniswapV2PriceProviderAddress = isTesting ? "" : UniswapV2PriceProviderProxy;
        let uniswapV3PriceProviderAddress = isTesting ? "" : UniswapV3PriceProviderProxy;
        let uniswapV2PriceProviderMockAddress = "";
        let lpPriceProviderAddress = isTesting ? "" : LPPriceProviderProxy;
        let erc4626PriceProviderAddress = isTesting ? "" : ERC4626PriceProviderProxy;
        let wstETHPriceProviderAddress = isTesting ? "" : wstETHPriceProviderProxy;

        let backendPriceProviderLogicAddress = isTesting ? "" : BackendPriceProviderLogic;
        let priceOracleLogicAddress = isTesting ? "" : PriceOracleLogic;
        let pythPriceProviderLogicAddress = isTesting ? "" : PythPriceProviderLogic;
        let chainlinkPriceProviderLogicAddress = isTesting ? "" : ChainlinkPriceProviderLogic;
        let priceProviderAggregatorLogicAddress = isTesting ? "" : PriceProviderAggregatorLogic;
        let uniswapV2PriceProviderLogicAddress = isTesting ? "" : UniswapV2PriceProviderLogic;
        let uniswapV3PriceProviderLogicAddress = isTesting ? "" : UniswapV3PriceProviderLogic;
        let uniswapV2PriceProviderMockLogicAddress = "";
        let lpPriceProviderLogicAddress = isTesting ? "" : LPPriceProviderLogic;
        let erc4626PriceProviderLogicAddress = isTesting ? "" : ERC4626PriceProviderLogic;
        let wstETHPriceProviderLogicAddress = isTesting ? "" : wstETHPriceProviderLogic;

        ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
        TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
        PriceOracle = await hre.ethers.getContractFactory("PriceOracle");
        PythPriceProvider = await hre.ethers.getContractFactory("PythPriceProvider");
        ChainlinkPriceProvider = isLayer2 ? await hre.ethers.getContractFactory("ChainlinkPriceProviderL2")
            : await hre.ethers.getContractFactory("ChainlinkPriceProvider");
        BackendPriceProvider = await hre.ethers.getContractFactory("BackendPriceProvider");
        UniswapV2PriceProvider = await hre.ethers.getContractFactory("UniswapV2PriceProvider");
        UniswapV3PriceProvider = await hre.ethers.getContractFactory("UniswapV3PriceProvider");
        UniswapV2PriceProviderMock = await hre.ethers.getContractFactory("UniswapV2PriceProviderMock");
        PriceProviderAggregator = await hre.ethers.getContractFactory("PriceProviderAggregatorPyth");
        LPPriceProvider = await hre.ethers.getContractFactory("LPPriceProvider");
        ERC4626PriceProvider = await hre.ethers.getContractFactory("ERC4626PriceProvider");
        WstETHPriceProvider = isLayer2 ? await hre.ethers.getContractFactory("wstETHPriceProviderL2") : await hre.ethers.getContractFactory("wstETHPriceProvider");

        if (isTesting) {
            fs.writeFileSync = function () { };
        }

        log("Network name: " + network.name);
        log("DeployMaster: " + deployMaster.address);
        //====================================================
        //deploy proxy admin

        log();
        log("***** PROXY ADMIN DEPLOYMENT *****");
        if (!proxyAdminAddress) {
            proxyAdmin = await ProxyAdmin.connect(deployMaster).deploy();
            await proxyAdmin.deployed().then(function (instance) {
                log("\nTransaction hash: " + instance.deployTransaction.hash);
                proxyAdminAddress = instance.address;
                config.PRIMARY_PROXY_ADMIN = proxyAdminAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        log("ProxyAdmin deployed at: " + proxyAdminAddress);

        await verify(proxyAdminAddress, [], "PRIMARY_PROXY_ADMIN");

        //====================== deploy priceOracle =============================
        log();
        log("***** PRICE ORACLE DEPLOYMENT *****");

        if (!priceOracleLogicAddress) {
            priceOracleProvider = await PriceOracle.connect(deployMaster).deploy();
            config.PriceOracleLogic = priceOracleLogicAddress = priceOracleProvider.address;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            await priceOracleProvider.deployed().then(function (instance) {
                log("\nTransaction hash: " + instance.deployTransaction.hash);
                config.PriceOracleLogic = priceOracleLogicAddress = instance.address;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        log(`PriceOracle masterCopy was deployed at: ${priceOracleLogicAddress}`);
        await verify(priceOracleLogicAddress, [], "PriceOracleLogic");

        if (!priceOracleAddress) {
            const priceOracleProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                priceOracleLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await priceOracleProxy.deployed().then(function (instance) {
                log("\nTransaction hash: " + instance.deployTransaction.hash);
                config.PriceOracleProxy = priceOracleAddress = instance.address;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        log(`\nPriceOracle was deployed at: ${priceOracleLogicAddress}`);
        await verify(priceOracleAddress, [
            priceOracleLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PriceOracleProxy");

        //====================== deploy pythPriceProvider =============================
        if (tokensUsePyth.length > 0) {
            log();
            log("***** PYTH PRICE PROVIDER DEPLOYMENT *****");

            if (!pythPriceProviderLogicAddress) {
                pythPriceProvider = await PythPriceProvider.connect(deployMaster).deploy();
                config.PythPriceProviderLogic = pythPriceProviderLogicAddress = pythPriceProvider.address;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
                await pythPriceProvider.deployed().then(function (instance) {
                    log("\nTransaction hash: " + instance.deployTransaction.hash);
                    config.PythPriceProviderLogic = pythPriceProviderLogicAddress = instance.address;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
                });
            }
            log(`PythPriceProvider masterCopy was deployed at: ${pythPriceProviderLogicAddress}`);
            await verify(pythPriceProviderLogicAddress, [], "PythPriceProviderLogic");

            if (!pythPriceProviderAddress) {
                const pythPriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                    pythPriceProviderLogicAddress,
                    proxyAdminAddress,
                    "0x"
                );
                await pythPriceProviderProxy.deployed().then(function (instance) {
                    log("\nTransaction hash: " + instance.deployTransaction.hash);
                    config.PythPriceProviderProxy = pythPriceProviderAddress = instance.address;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
                });
            }
            log(`\nPythPriceProvider was deployed at: ${pythPriceProviderAddress}`);
            await verify(pythPriceProviderAddress, [
                pythPriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "PythPriceProviderProxy");
        }
        //====================================================
        //deploy chainlinkPriceProvider or chainlinkPriceProviderL2
        if (tokensUseChainlink.length > 0) {
            log();
            log("***** CHAINLINK PRICE PROVIDER DEPLOYMENT *****");

            if (!chainlinkPriceProviderLogicAddress) {
                chainlinkPriceProvider = await ChainlinkPriceProvider.connect(deployMaster).deploy();
                await chainlinkPriceProvider.deployed().then(function (instance) {
                    log("\nTransaction hash: " + instance.deployTransaction.hash);
                    chainlinkPriceProviderLogicAddress = instance.address;
                    config.ChainlinkPriceProviderLogic = chainlinkPriceProviderLogicAddress;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
                });
            }
            log("ChainlinkPriceProvider masterCopy address: " + chainlinkPriceProviderLogicAddress);
            await verify(chainlinkPriceProviderLogicAddress, [], "ChainlinkPriceProviderLogic");

            if (!chainlinkPriceProviderAddress) {
                let chainlinkPriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                    chainlinkPriceProviderLogicAddress,
                    proxyAdminAddress,
                    "0x"
                );
                await chainlinkPriceProviderProxy.deployed().then(function (instance) {
                    log("\nTransaction hash: " + instance.deployTransaction.hash);
                    chainlinkPriceProviderAddress = instance.address;
                    config.ChainlinkPriceProviderProxy = chainlinkPriceProviderAddress;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
                });
            }

            log("\nChainlinkPriceProvider proxy address: " + chainlinkPriceProviderAddress);
            await verify(chainlinkPriceProviderAddress, [
                chainlinkPriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "ChainlinkPriceProviderProxy");
        }
        //====================================================
        //deploy backendPriceProvider
        if (tokensUseBackendProvider.length > 0) {
            log();
            log("***** BACKEND PRICE PROVIDER DEPLOYMENT *****");

            if (!backendPriceProviderLogicAddress) {
                backendPriceProvider = await BackendPriceProvider.connect(deployMaster).deploy();
                await backendPriceProvider.deployed().then(function (instance) {
                    log("\nTransaction hash: " + instance.deployTransaction.hash);
                    backendPriceProviderLogicAddress = instance.address;
                    config.BackendPriceProviderLogic = backendPriceProviderLogicAddress;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
                });
            }
            log("BackendPriceProvider masterCopy address: " + backendPriceProviderLogicAddress);
            await verify(backendPriceProviderLogicAddress, [], "BackendPriceProviderLogic");

            if (!backendPriceProviderAddress) {
                let backendPriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                    backendPriceProviderLogicAddress,
                    proxyAdminAddress,
                    "0x"
                );
                await backendPriceProviderProxy.deployed().then(function (instance) {
                    log("\nTransaction hash: " + instance.deployTransaction.hash);
                    backendPriceProviderAddress = instance.address;
                    config.BackendPriceProviderProxy = backendPriceProviderAddress;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
                });
            }
            log("\nBackendPriceProvider proxy address: " + backendPriceProviderAddress);
            await verify(backendPriceProviderAddress, [
                backendPriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "BackendPriceProviderProxy");
        }
        //=========================
        //deploy uniswapV2PriceProvider
        if (tokensUseUniswapV2.length > 0) {
            log();
            log("***** UNISWAPV2 PRICE PROVIDER DEPLOYMENT *****");

            if (!uniswapV2PriceProviderLogicAddress) {
                uniswapV2PriceProvider = await UniswapV2PriceProvider.connect(deployMaster).deploy();
                await uniswapV2PriceProvider.deployed().then(function (instance) {
                    log("\nTransaction hash: " + instance.deployTransaction.hash);
                    uniswapV2PriceProviderLogicAddress = instance.address;
                    config.UniswapV2PriceProviderLogic = uniswapV2PriceProviderLogicAddress;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 3));
                });
            }
            log("UniswapV2PriceProvider masterCopy address: " + uniswapV2PriceProviderLogicAddress);
            await verify(uniswapV2PriceProviderLogicAddress, [], "UniswapV2PriceProviderLogic");

            if (!uniswapV2PriceProviderAddress) {
                let uniswapV2PriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                    uniswapV2PriceProviderLogicAddress,
                    proxyAdminAddress,
                    "0x"
                );
                await uniswapV2PriceProviderProxy.deployed().then(function (instance) {
                    log("\nTransaction hash: " + instance.deployTransaction.hash);
                    uniswapV2PriceProviderAddress = instance.address;
                    config.UniswapV2PriceProviderProxy = uniswapV2PriceProviderAddress;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
                });
            }
            log("\nUniswapV2PriceProvider proxy address: " + uniswapV2PriceProviderAddress);
            await verify(uniswapV2PriceProviderAddress, [
                uniswapV2PriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "UniswapV2PriceProviderProxy");
        }

        //deploy uniswapV3PriceProvider
        if (tokensUseUniswapV3.length > 0) {
            log();
            log("***** UNISWAPV3 PRICE PROVIDER DEPLOYMENT *****");

            if (!uniswapV3PriceProviderLogicAddress) {
                uniswapV3PriceProvider = await UniswapV3PriceProvider.connect(deployMaster).deploy();
                await uniswapV3PriceProvider.deployed().then(function (instance) {
                    log("\nTransaction hash: " + instance.deployTransaction.hash);
                    uniswapV3PriceProviderLogicAddress = instance.address;
                    config.UniswapV3PriceProviderLogic = uniswapV3PriceProviderLogicAddress;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 3));
                });
            }
            log("UniswapV3PriceProvider masterCopy address: " + uniswapV3PriceProviderLogicAddress);
            await verify(uniswapV3PriceProviderLogicAddress, [], "UniswapV3PriceProviderLogic");

            if (!uniswapV3PriceProviderAddress) {
                let uniswapV3PriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                    uniswapV3PriceProviderLogicAddress,
                    proxyAdminAddress,
                    "0x"
                );
                await uniswapV3PriceProviderProxy.deployed().then(function (instance) {
                    log("\nTransaction hash: " + instance.deployTransaction.hash);
                    uniswapV3PriceProviderAddress = instance.address;
                    config.UniswapV3PriceProviderProxy = uniswapV3PriceProviderAddress;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
                });
            }
            log("UniswapV3PriceProvider proxy address: " + uniswapV3PriceProviderAddress);
            await verify(uniswapV3PriceProviderAddress, [
                uniswapV3PriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "UniswapV3PriceProviderProxy");
        }

        //=========================
        //deploy LPPriceProvider
        if (tokensUseLPProvider.length > 0) {
            log();
            log("***** LP PRICE PROVIDER DEPLOYMENT *****");

            if (!lpPriceProviderLogicAddress) {
                lpPriceProvider = await LPPriceProvider.connect(deployMaster).deploy();
                await lpPriceProvider.deployed().then(function (instance) {
                    log("\nTransaction hash: " + instance.deployTransaction.hash);
                    lpPriceProviderLogicAddress = instance.address;
                    config.LPPriceProviderLogic = lpPriceProviderLogicAddress;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 3));
                });
            }
            log("lpPriceProvider masterCopy address: " + lpPriceProviderLogicAddress);
            await verify(lpPriceProviderLogicAddress, [], "LPPriceProviderLogic");

            if (!lpPriceProviderAddress) {
                let lpPriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                    lpPriceProviderLogicAddress,
                    proxyAdminAddress,
                    "0x"
                );
                await lpPriceProviderProxy.deployed().then(function (instance) {
                    log("\nTransaction hash: " + instance.deployTransaction.hash);
                    lpPriceProviderAddress = instance.address;
                    config.LPPriceProviderProxy = lpPriceProviderAddress;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
                });
            }
            log("\nlpPriceProvider proxy address: " + lpPriceProviderAddress);
            await verify(lpPriceProviderAddress, [
                lpPriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "LPPriceProviderProxy");
        }

        //deploy ERC4626PriceProvider
        if (tokensUseERC4626Provider.length > 0) {
            log();
            log("***** ERC-4626 PRICE PROVIDER DEPLOYMENT *****");

            if (!erc4626PriceProviderLogicAddress) {
                erc4626PriceProvider = await ERC4626PriceProvider.connect(deployMaster).deploy();
                await erc4626PriceProvider.deployed().then(function (instance) {
                    log("\nTransaction hash: " + instance.deployTransaction.hash);
                    erc4626PriceProviderLogicAddress = instance.address;
                    config.ERC4626PriceProviderLogic = erc4626PriceProviderLogicAddress;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 3));
                });
            }
            await verify(erc4626PriceProviderLogicAddress, [], "ERC4626PriceProviderLogic");

            if (!erc4626PriceProviderAddress) {
                const erc4626PriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                    erc4626PriceProviderLogicAddress,
                    proxyAdminAddress,
                    "0x"
                )
                await erc4626PriceProviderProxy.deployed().then(function (instance) {
                    log("\nTransaction hash: " + instance.deployTransaction.hash);
                    erc4626PriceProviderAddress = instance.address;
                    config.ERC4626PriceProviderProxy = erc4626PriceProviderAddress;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 3));
                });
            }
            log(`\nlpPriceProvider was deployed at: ${erc4626PriceProviderAddress}`);
            await verify(erc4626PriceProviderAddress, [
                erc4626PriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "ERC4626PriceProviderProxy");
        }
        //=========================

        //=========================
        //deploy wstETHPriceProvider
        if (wstETHAggregatorPath.length > 0) {
            log();
            log("***** WSTETH PRICE PROVIDER DEPLOYMENT *****");

            if (!wstETHPriceProviderLogicAddress) {
                wstETHPriceProvider = await WstETHPriceProvider.connect(deployMaster).deploy();
                await wstETHPriceProvider.deployed().then(function (instance) {
                    log("\nTransaction hash: " + instance.deployTransaction.hash);
                    wstETHPriceProviderLogicAddress = instance.address;
                    config.wstETHPriceProviderLogic = wstETHPriceProviderLogicAddress;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 3));
                });
            }
            log("wstETHPriceProvider masterCopy address: " + wstETHPriceProviderLogicAddress);
            await verify(wstETHPriceProviderLogicAddress, [], "wstETHPriceProviderLogic");

            if (!wstETHPriceProviderAddress) {
                let wstETHPriceProviderProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                    wstETHPriceProviderLogicAddress,
                    proxyAdminAddress,
                    "0x"
                );
                await wstETHPriceProviderProxy.deployed().then(function (instance) {
                    log("\nTransaction hash: " + instance.deployTransaction.hash);
                    wstETHPriceProviderAddress = instance.address;
                    config.wstETHPriceProviderProxy = wstETHPriceProviderAddress;
                    fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
                });
            }
            log("\nwstETHPriceProvider proxy address: " + wstETHPriceProviderAddress);
            await verify(wstETHPriceProviderAddress, [
                wstETHPriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "wstETHPriceProviderProxy");
        }
        //=========================
        //deploy PriceProviderAggregator
        log();
        log("***** PRICE PROVIDER AGGREGATOR DEPLOYMENT *****");

        if (!priceProviderAggregatorLogicAddress) {
            priceProviderAggregator = await PriceProviderAggregator.connect(deployMaster).deploy();
            await priceProviderAggregator.deployed().then(function (instance) {
                log("\nTransaction hash: " + instance.deployTransaction.hash);
                priceProviderAggregatorLogicAddress = instance.address;
                config.PriceProviderAggregatorLogic = priceProviderAggregatorLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        log("PriceProviderAggregator masterCopy address: " + priceProviderAggregatorLogicAddress);
        await verify(priceProviderAggregatorLogicAddress, [], "PriceProviderAggregatorLogic");

        if (!priceProviderAggregatorAddress) {
            let priceProviderAggregatorProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                priceProviderAggregatorLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await priceProviderAggregatorProxy.deployed().then(function (instance) {
                log("\nTransaction hash: " + instance.deployTransaction.hash);
                priceProviderAggregatorAddress = instance.address;
                config.PriceProviderAggregatorProxy = priceProviderAggregatorAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        log("\nPriceProviderAggregator proxy address: " + priceProviderAggregatorAddress);
        await verify(priceProviderAggregatorAddress, [
            priceProviderAggregatorLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PriceProviderAggregatorProxy");
        //====================================================
        //deploy and setting uniswapPriceProviderMock
        if (isTesting) {
            log();
            log("***** UNISWAPV2 PRICE PROVIDER MOCK DEPLOYMENT *****");

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
        priceOracleProvider = PriceOracle.attach(priceOracleAddress).connect(deployMaster);
        pythPriceProvider = PythPriceProvider.attach(pythPriceProviderAddress).connect(deployMaster);
        chainlinkPriceProvider = ChainlinkPriceProvider.attach(chainlinkPriceProviderAddress).connect(deployMaster);
        backendPriceProvider = BackendPriceProvider.attach(backendPriceProviderAddress).connect(deployMaster);
        uniswapV2PriceProvider = UniswapV2PriceProvider.attach(uniswapV2PriceProviderAddress).connect(deployMaster);
        uniswapV3PriceProvider = UniswapV3PriceProvider.attach(uniswapV3PriceProviderAddress).connect(deployMaster);
        lpPriceProvider = LPPriceProvider.attach(lpPriceProviderAddress).connect(deployMaster);
        erc4626PriceProvider = ERC4626PriceProvider.attach(erc4626PriceProviderAddress).connect(deployMaster);
        wstETHPriceProvider = WstETHPriceProvider.attach(wstETHPriceProviderAddress).connect(deployMaster);
        priceProviderAggregator = PriceProviderAggregator.attach(priceProviderAggregatorAddress).connect(deployMaster);
        priceOracleProvider = PriceOracle.attach(priceOracleAddress).connect(deployMaster);

        pythPriceProviderImplementation = PythPriceProvider.attach(pythPriceProviderLogicAddress).connect(deployMaster);
        chainlinkPriceProviderImplementation = ChainlinkPriceProvider.attach(chainlinkPriceProviderLogicAddress).connect(deployMaster);
        backendPriceProviderImplementation = BackendPriceProvider.attach(backendPriceProviderLogicAddress).connect(deployMaster);
        uniswapV2PriceProviderImplementation = UniswapV2PriceProvider.attach(uniswapV2PriceProviderLogicAddress).connect(deployMaster);
        uniswapV3PriceProviderImplementation = UniswapV3PriceProvider.attach(uniswapV3PriceProviderLogicAddress).connect(deployMaster);
        lpPriceProviderImplementation = LPPriceProvider.attach(lpPriceProviderLogicAddress).connect(deployMaster);
        erc4626PriceProviderImplementation = LPPriceProvider.attach(lpPriceProviderLogicAddress).connect(deployMaster);
        wstETHPriceProviderImplementation = WstETHPriceProvider.attach(wstETHPriceProviderLogicAddress).connect(deployMaster);
        priceProviderAggregatorImplementation = PriceProviderAggregator.attach(priceProviderAggregatorLogicAddress).connect(deployMaster);
        priceOracleImplementation = PriceOracle.attach(priceOracleLogicAddress).connect(deployMaster);

        //==============================
        // ====================== upgrade pythPriceProvider =============================
        if (pythPriceProviderAddress) {
            log();
            log("***** UPGRADING PYTH PRICE PROVIDER *****");
            await upgrade(proxyAdmin, pythPriceProviderImplementation, pythPriceProvider);
        }

        // ====================== upgrade chainlinkPriceProvider =============================
        if (chainlinkPriceProviderAddress) {
            log();
            log("***** UPGRADING CHAINLINK PRICE PROVIDER *****");
            await upgrade(proxyAdmin, chainlinkPriceProviderImplementation, chainlinkPriceProvider);
        }

        // ====================== upgrade backendPriceProvider =============================
        if (backendPriceProviderAddress) {
            log();
            log("***** UPGRADING BACKEND PRICE PROVIDER *****");
            await upgrade(proxyAdmin, backendPriceProviderImplementation, backendPriceProvider);
        }

        // ====================== upgrade uniswapV2PriceProvider =============================
        if (uniswapV2PriceProviderAddress) {
            log();
            log("***** UPGRADING UNISWAPV2 PRICE PROVIDER *****");
            await upgrade(proxyAdmin, uniswapV2PriceProviderImplementation, uniswapV2PriceProvider);
        }

        // ====================== upgrade uniswapV3PriceProvider =============================
        if (uniswapV3PriceProviderAddress) {
            log();
            log("***** UPGRADING UNISWAPV3 PRICE PROVIDER *****");
            await upgrade(proxyAdmin, uniswapV3PriceProviderImplementation, uniswapV3PriceProvider);
        }

        // ====================== upgrade lpPriceProvider =============================
        if (lpPriceProviderAddress) {
            log();
            log("***** UPGRADING LP PRICE PROVIDER *****");
            await upgrade(proxyAdmin, lpPriceProviderImplementation, lpPriceProvider);
        }

        // ====================== upgrade erc4626PriceProvider =============================
        if (erc4626PriceProviderAddress) {
            log();
            log("***** UPGRADING ERC-4626 PRICE PROVIDER *****");
            await upgrade(proxyAdmin, erc4626PriceProviderImplementation, erc4626PriceProvider);
        }

        // ====================== upgrade wstETHPriceProvider =============================
        if (wstETHPriceProviderAddress) {
            log();
            log("***** UPGRADING WSTETH PRICE PROVIDER *****");
            await upgrade(proxyAdmin, wstETHPriceProviderImplementation, wstETHPriceProvider);
        }

        // ====================== upgrade priceProviderAggregator =============================
        if (priceProviderAggregatorAddress) {
            log();
            log("***** UPGRADING PRICE PROVIDER AGGREGATOR *****");
            await upgrade(proxyAdmin, priceProviderAggregatorImplementation, priceProviderAggregator);
        }

        if (priceOracleAddress) {
            log();
            log("***** UPGRADING PRICE ORACLE *****");
            await upgrade(proxyAdmin, priceOracleImplementation, priceOracleProvider);
        }

        //==============================
        //set priceOracle
        if (priceOracleAddress) {
            log();
            log("***** SETTING PRICE ORACLE *****");

            {
                let usdDecimal = await priceOracleImplementation.tokenPriceDecimals();
                if (usdDecimal == 0) {
                    await priceOracleImplementation.initialize(
                        priceProviderAggregatorAddress,
                        volatilityCapUpPercent,
                        volatilityCapDownPercent
                    ).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("PriceOracle Implementation initialized at " + priceOracleLogicAddress);
                    });
                }
            }
            {
                let usdDecimal = await priceOracleProvider.tokenPriceDecimals();

                if (usdDecimal == 0) {
                    await priceOracleProvider.initialize(
                        priceProviderAggregatorAddress,
                        volatilityCapUpPercent,
                        volatilityCapDownPercent
                    ).then(function (instance) {
                        log("priceOracle initialized at " + priceOracleAddress + " at tx hash " + instance.hash);
                        log("set volatilityCapUpPercent: " + volatilityCapUpPercent);
                        log("set volatilityCapDownPercent: " + volatilityCapDownPercent);
                    });
                }
            }
            {
                let currentPriceProviderAggregator = await priceOracleProvider.priceProviderAggregator();
                let currentVolatilityCapUpPercent = await priceOracleProvider.tvcUp();
                let currentVolatilityCapDownPercent = await priceOracleProvider.tvcDown();

                if (currentPriceProviderAggregator.toLowerCase() != priceProviderAggregatorAddress.toLowerCase()) {
                    await priceOracleProvider.setPriceProviderAggregator(priceProviderAggregatorAddress).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("priceOracleProvider set priceProviderAggregatorAddress: " + priceProviderAggregatorAddress);
                    });
                }
                if (currentVolatilityCapUpPercent != volatilityCapUpPercent || currentVolatilityCapDownPercent != volatilityCapDownPercent) {
                    await priceOracleProvider.setVolatilityCapFixedPercent(
                        volatilityCapUpPercent,
                        volatilityCapDownPercent
                    ).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("priceOracleProvider set volatilityCapUpPercent: " + volatilityCapUpPercent);
                        log("priceOracleProvider set volatilityCapDownPercent: " + volatilityCapDownPercent);
                    });
                }
            }
        }

        // ====================== set pythPriceProvider =============================
        if (pythPriceProviderAddress) {
            log();
            log("***** SETTING PYTH PRICE PROVIDER *****");

            {
                let tokenDecimal = await pythPriceProviderImplementation.getPriceDecimals();
                if (tokenDecimal == 0) {
                    await pythPriceProviderImplementation.initialize()
                        .then(function (instance) {
                            log("Transaction hash: " + instance.hash);
                            log("PythPriceProvider Implementation initialized at " + pythPriceProviderLogicAddress);
                        });
                }
            }

            {
                let tokenDecimal = await pythPriceProvider.getPriceDecimals();
                if (tokenDecimal == 0) {
                    await pythPriceProvider.initialize()
                        .then(function (instance) {
                            log("\nTransaction hash: " + instance.hash);
                            log("PythPriceProvider initialized at " + pythPriceProviderAddress);
                        });
                }
            }

            {
                const tokenDecimal = await pythPriceProvider.getPriceDecimals();
                const currentImplementation = await proxyAdmin.getProxyImplementation(pythPriceProvider.address);
                const priceDecimals = Pyth?.priceDecimals;
                if (priceDecimals && tokenDecimal != priceDecimals && currentImplementation.toLowerCase() == pythPriceProviderLogicAddress.toLowerCase()) {
                    await pythPriceProvider.setTokenDecimals(priceDecimals)
                        .then(function (instance) {
                            log("\nTransaction hash: " + instance.hash);
                            log("PythPriceProvider " + pythPriceProvider.address + " set tokenDecimals: " + priceDecimals);
                        });
                }
            }

            {
                let moderatorRole = await pythPriceProvider.MODERATOR_ROLE();
                let isModeratorRole = await pythPriceProvider.hasRole(moderatorRole, priceProviderAggregatorAddress);
                if (!isModeratorRole) {
                    await pythPriceProvider.grantModerator(priceProviderAggregatorAddress)
                        .then(function (instance) {
                            log("\nTransaction hash: " + instance.hash);
                            log("PythPriceProvider " + pythPriceProvider.address + " granted moderator " + priceProviderAggregatorAddress);
                        });
                }
            }
            {
                let currentPythOracle = await pythPriceProvider.pythOracle();
                if (currentPythOracle.toLowerCase() != pythOracle.toLowerCase()) {
                    await pythPriceProvider.setPythOracle(pythOracle)
                        .then(function (instance) {
                            log("\nTransaction hash: " + instance.hash);
                            log("PythPriceProvider" + pythPriceProvider.address + " set pythOracle: " + pythOracle);
                        });
                }
            }
            {
                for (var i = 0; i < tokensUsePyth.length; i++) {
                    let pythMetadata = await pythPriceProvider.getPythMetadata(tokensUsePyth[i]);
                    const currentPriceIdPath = pythMetadata.priceIdPath;
                    for (let j = 0; j < priceIdPath[i].length; j++) {
                        if (currentPriceIdPath[j] != priceIdPath[i][j]) {
                            await pythPriceProvider.setTokenAndPriceIdPath(
                                tokensUsePyth[i],
                                priceIdPath[i]
                            ).then(function (instance) {
                                log("\nTransaction hash: " + instance.hash);
                                log("PythPriceProvider " + pythPriceProvider.address + " set token with parameters: ");
                                log("   token: " + tokensUsePyth[i]);
                                log("   priceId path: " + priceIdPath[i]);
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
            log();
            log("***** SETTING CHAINLINK PRICE PROVIDER *****");

            {
                let tokenDecimals = await chainlinkPriceProviderImplementation.getPriceDecimals();
                if (tokenDecimals == 0) {
                    await chainlinkPriceProviderImplementation.initialize()
                        .then(function (instance) {
                            log("Transaction hash: " + instance.hash);
                            log("ChainlinkPriceProvider Implementation initialized at " + chainlinkPriceProviderLogicAddress);
                        });
                }
            }

            {
                let tokenDecimals = await chainlinkPriceProvider.getPriceDecimals();
                if (tokenDecimals == 0) {
                    await chainlinkPriceProvider.initialize()
                        .then(function (instance) {
                            log("\nTransaction hash: " + instance.hash);
                            log("ChainlinkPriceProvider initialized at " + chainlinkPriceProviderAddress);
                        });
                }
            }
            
            {
                const tokenDecimal = await chainlinkPriceProvider.getPriceDecimals();
                const currentImplementation = await proxyAdmin.getProxyImplementation(chainlinkPriceProvider.address);
                const priceDecimals = Chainlink?.priceDecimals;
                if (priceDecimals && tokenDecimal != priceDecimals && currentImplementation.toLowerCase() == chainlinkPriceProviderLogicAddress.toLowerCase()) {
                    await chainlinkPriceProvider.setTokenDecimals(priceDecimals)
                        .then(function (instance) {
                            log("\nTransaction hash: " + instance.hash);
                            log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set tokenDecimals: " + priceDecimals);
                        });
                }
            }

            {
                let moderatorRole = await chainlinkPriceProvider.MODERATOR_ROLE();
                let isModeratorRole = await chainlinkPriceProvider.hasRole(moderatorRole, priceProviderAggregatorAddress);
                if (!isModeratorRole) {
                    await chainlinkPriceProvider.grantModerator(priceProviderAggregatorAddress)
                        .then(function (instance) {
                            log("\nTransaction hash: " + instance.hash);
                            log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " granted moderator " + priceProviderAggregatorAddress);
                        });
                }
            }

            if (sequencerUptimeFeed) {
                let currentSequencerUptimeFeed = await chainlinkPriceProvider.sequencerUptimeFeed();
                if (sequencerUptimeFeed != currentSequencerUptimeFeed) {
                    await chainlinkPriceProvider.setSequencerUptimeFeed(
                        sequencerUptimeFeed
                    ).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set sequencerUptimeFeed: " + sequencerUptimeFeed);
                    });
                }
                let currentGracePeriodTime = await chainlinkPriceProvider.gracePeriodTime();
                if (gracePeriodTime != currentGracePeriodTime) {
                    await chainlinkPriceProvider.setGracePeriodTime(
                        gracePeriodTime
                    ).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set gracePeriodTime: " + gracePeriodTime);
                    });
                }
            }

            {
                const currentImplementation = await proxyAdmin.getProxyImplementation(chainlinkPriceProvider.address);
                if (currentImplementation.toLowerCase() == chainlinkPriceProviderLogicAddress.toLowerCase()) {
                    for (var i = 0; i < tokensUseChainlink.length; i++) {
                        let chainlinkMetadata = await chainlinkPriceProvider.getChainlinkMetadata(tokensUseChainlink[i]);
                        const aggregatorPath = chainlinkMetadata.aggregatorPath;
                        for (let j = 0; j < chainlinkAggregatorV3[i].length; j++) {
                            if (aggregatorPath[j] != chainlinkAggregatorV3[i][j]) {
                                await chainlinkPriceProvider.setTokenAndAggregator(
                                    tokensUseChainlink[i],
                                    chainlinkAggregatorV3[i]
                                ).then(function (instance) {
                                    log("\nTransaction hash: " + instance.hash);
                                    log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set token with parameters: ");
                                    log("   token: " + tokensUseChainlink[i]);
                                    log("   aggregator path: " + chainlinkAggregatorV3[i]);
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
                                    log("\nTransaction hash: " + instance.hash);
                                    log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set timeout with parameters: ");
                                    log("   aggregator: " + chainlinkAggregatorV3[i][j]);
                                    log("   timeout: " + timeOuts[i][j]);
                                });
                            }
                        }
                    }
                }
            }
        }

        //==============================
        //set backendPriceProvider
        if (backendPriceProviderAddress) {
            log();
            log("***** SETTING BACKEND PRICE PROVIDER *****");

            {
                let usdDecimal = await backendPriceProviderImplementation.usdDecimals();
                if (usdDecimal == 0) {
                    await backendPriceProviderImplementation.initialize()
                        .then(function (instance) {
                            log("Transaction hash: " + instance.hash);
                            log("BackendPriceProvider Implementation initialized at: " + backendPriceProviderLogicAddress);
                        });
                }
            }

            {
                let usdDecimal = await backendPriceProvider.usdDecimals();
                if (usdDecimal == 0) {
                    await backendPriceProvider.initialize()
                        .then(function (instance) {
                            log("\nTransaction hash: " + instance.hash);
                            log("BackendPriceProvider initialized at: " + backendPriceProviderAddress);
                        });
                }
            }

            {
                let moderatorRole = await backendPriceProvider.TRUSTED_BACKEND_ROLE();
                let isModeratorRole = await backendPriceProvider.hasRole(moderatorRole, deployMasterAddress);
                if (!isModeratorRole) {
                    await backendPriceProvider.grantTrustedBackendRole(deployMasterAddress)
                        .then(function (instance) {
                            log("\nTransaction hash: " + instance.hash);
                            log("BackendPriceProvider set trusted backend at " + backendPriceProvider.address);
                        });
                }
            }


            for (var i = 0; i < tokensUseBackendProvider.length; i++) {
                let backendMetadata = await backendPriceProvider.backendMetadata(tokensUseBackendProvider[i]);
                if (backendMetadata.isListed == false || backendMetadata.isActive == false) {
                    await backendPriceProvider.setToken(tokensUseBackendProvider[i]).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("BackendPriceProvider " + backendPriceProvider.address + " set token " + tokensUseBackendProvider[i]);
                    });
                }
            }
        }

        //==============================
        //set uniswapV2PriceProvider
        if (uniswapV2PriceProviderAddress) {
            log();
            log("***** SETTING UNISWAPV2 PRICE PROVIDER *****");

            {
                let usdDecimal = await uniswapV2PriceProviderImplementation.getPriceDecimals();
                if (usdDecimal == 0) {
                    await uniswapV2PriceProviderImplementation.initialize().then(function (instance) {
                        log("Transaction hash: " + instance.hash);
                        log("UniswapV2PriceProvider Implementation initialized at " + uniswapV2PriceProviderLogicAddress);
                    });
                }
            }

            {
                let usdDecimal = await uniswapV2PriceProvider.getPriceDecimals();
                if (usdDecimal == 0) {
                    await uniswapV2PriceProvider.initialize().then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("UniswapV2PriceProvider initialized at " + uniswapV2PriceProviderAddress);
                    });
                }
            }

            {
                const tokenDecimal = await uniswapV2PriceProvider.getPriceDecimals();
                const currentImplementation = await proxyAdmin.getProxyImplementation(uniswapV2PriceProvider.address);
                const priceDecimals = UniswapV2?.priceDecimals;
                if (priceDecimals && tokenDecimal != priceDecimals && currentImplementation.toLowerCase() == uniswapV2PriceProviderLogicAddress.toLowerCase()) {
                    await uniswapV2PriceProvider.setTokenDecimals(priceDecimals)
                        .then(function (instance) {
                            log("\nTransaction hash: " + instance.hash);
                            log("UniswapV2PriceProvider " + uniswapV2PriceProvider.address + " set tokenDecimals: " + priceDecimals);
                        });
                }
            }

            {
                let moderatorRole = await uniswapV2PriceProvider.MODERATOR_ROLE();
                let isModeratorRole = await uniswapV2PriceProvider.hasRole(moderatorRole, priceProviderAggregatorAddress);
                if (!isModeratorRole) {
                    await uniswapV2PriceProvider.grantModerator(priceProviderAggregatorAddress).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("UniswapV2PriceProvider granted moderator at " + priceProviderAggregatorAddress);
                    });
                }
            }

            for (var i = 0; i < tokensUseUniswapV2.length; i++) {
                let uniswapV2Metadata = await uniswapV2PriceProvider.uniswapV2Metadata(tokensUseUniswapV2[i]);
                if (uniswapV2Metadata.isActive == false || uniswapV2Metadata.pair.toLowerCase() != uniswapPairsV2[i].toLowerCase()) {
                    await uniswapV2PriceProvider.setTokenAndPair(tokensUseUniswapV2[i], uniswapPairsV2[i]).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("UniswapV2PriceProvider set token " + tokensUseUniswapV2[i] + " and pair " + uniswapPairsV2[i]);
                    });
                }
            }
        }

        //set uniswapV3PriceProvider
        if (uniswapV3PriceProviderAddress) {
            log();
            log("***** SETTING UNISWAPV3 PRICE PROVIDER *****");

            decimals = await uniswapV3PriceProvider.getPriceDecimals();

            if (decimals == 0) {
                await uniswapV3PriceProvider.initialize().then(function (instance) {
                    log("UniswapV3PriceProvider initialized at " + uniswapV3PriceProviderAddress + " at tx hash " + instance.hash);
                });
            }

            {
                const tokenDecimal = await uniswapV3PriceProvider.getPriceDecimals();
                const currentImplementation = await proxyAdmin.getProxyImplementation(uniswapV3PriceProvider.address);
                const priceDecimals = UniswapV3?.priceDecimals;
                if (priceDecimals && tokenDecimal != priceDecimals && currentImplementation.toLowerCase() == uniswapV3PriceProviderLogicAddress.toLowerCase()) {
                    await uniswapV3PriceProvider.setTokenDecimals(priceDecimals)
                        .then(function (instance) {
                            log("\nTransaction hash: " + instance.hash);
                            log("UniswapV3PriceProvider " + uniswapV3PriceProvider.address + " set tokenDecimals: " + priceDecimals);
                        });
                }
            }

            {
                let moderatorRole = await uniswapV3PriceProvider.MODERATOR_ROLE();
                let isModeratorRole = await uniswapV3PriceProvider.hasRole(moderatorRole, priceProviderAggregatorAddress);
                if (!isModeratorRole) {
                    await uniswapV3PriceProvider.grantModerator(priceProviderAggregatorAddress).then(function (instance) {
                        log("UniswapV3PriceProvider granted moderator " + priceProviderAggregatorAddress + " at tx hash " + instance.hash);
                    });
                }
            }

            {
                let currentPricePointTWAPperiod = await uniswapV3PriceProvider.pricePointTWAPperiod();
                if (pricePointTWAPperiodV3 != currentPricePointTWAPperiod) {
                    await uniswapV3PriceProvider.setPricePointTWAPperiod(pricePointTWAPperiodV3).then(function (instance) {
                        log("UniswapV3PriceProvider set pricePointTWAPperiod: " + pricePointTWAPperiodV3 + " at tx hash " + instance.hash);
                    });
                }
            }

            for (var i = 0; i < tokensUseUniswapV3.length; i++) {
                let uniswapV3Metadata = await uniswapV3PriceProvider.uniswapV3Metadata(tokensUseUniswapV3[i]);
                log(tokensUseUniswapV3[i], uniswapPairsV3[i]);
                if (uniswapV3Metadata.isActive == false || uniswapV3Metadata.pair.toLowerCase() != uniswapPairsV3[i].toLowerCase()) {
                    await uniswapV3PriceProvider.setTokenAndPair(tokensUseUniswapV3[i], uniswapPairsV3[i]).then(function (instance) {
                        log("UniswapV3PriceProvider  set token " + tokensUseUniswapV3[i] + " and pair " + uniswapPairsV3[i] + " at tx hash: " + instance.hash);
                    });
                }
            }
        }

        //==============================
        //set lpPriceProvider
        if (lpPriceProviderAddress) {
            log();
            log("***** SETTING LP PRICE PROVIDER *****");

            {
                let usdDecimal = await lpPriceProviderImplementation.getPriceDecimals();
                if (usdDecimal == 0) {
                    await lpPriceProviderImplementation.initialize().then(function (instance) {
                        log("Transaction hash: " + instance.hash);
                        log("LPPriceProvider Implementation initialized at " + lpPriceProviderLogicAddress);
                    });
                }
            }

            {
                let usdDecimal = await lpPriceProvider.getPriceDecimals();
                if (usdDecimal == 0) {
                    await lpPriceProvider.initialize().then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("LPPriceProvider initialized at " + lpPriceProviderAddress);
                    });
                }
            }

            {
                const tokenDecimal = await lpPriceProvider.getPriceDecimals();
                const currentImplementation = await proxyAdmin.getProxyImplementation(lpPriceProvider.address);
                const priceDecimals = LPProvider?.priceDecimals;
                if (priceDecimals && tokenDecimal != priceDecimals && currentImplementation.toLowerCase() == lpPriceProviderLogicAddress.toLowerCase()) {
                    await lpPriceProvider.setTokenDecimals(priceDecimals)
                        .then(function (instance) {
                            log("\nTransaction hash: " + instance.hash);
                            log("LPPriceProvider " + lpPriceProvider.address + " set tokenDecimals: " + priceDecimals);
                        });
                }
            }

            {
                let moderatorRole = await lpPriceProvider.MODERATOR_ROLE();
                let isModeratorRole = await lpPriceProvider.hasRole(moderatorRole, priceProviderAggregatorAddress);
                if (!isModeratorRole) {
                    await lpPriceProvider.grantModerator(priceProviderAggregatorAddress).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("LPPriceProvider granted moderator " + priceProviderAggregatorAddress);
                    });
                }
            }

            for (var i = 0; i < tokensUseLPProvider.length; i++) {
                let lpMetadata = await lpPriceProvider.lpMetadata(tokensUseLPProvider[i]);
                if (lpMetadata.isActive == false || lpMetadata.base.toLowerCase() != priceProviderAggregatorAddress.toLowerCase()) {
                    await lpPriceProvider.setLPTokenAndProvider(tokensUseLPProvider[i], priceProviderAggregatorAddress).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("LPPriceProvider  set token " + tokensUseLPProvider[i] + " and pair " + priceProviderAggregatorAddress);
                    });
                }
            }
        }

        //==============================
        //set erc4626PriceProvider
        if (erc4626PriceProviderAddress) {
            log();
            log("***** SETTING ERC-4626 PRICE PROVIDER *****");

            {
                const usdDecimal = await erc4626PriceProviderImplementation.getPriceDecimals();
                if (usdDecimal == 0) {
                    await erc4626PriceProviderImplementation.initialize()
                        .then(function (instance) {
                            log("Transaction hash: " + instance.hash);
                            log("ERC4626PriceProvider Implementation initialized at " + lpPriceProviderLogicAddress);
                        });
                }
            }

            {
                const usdDecimal = await erc4626PriceProvider.getPriceDecimals();
                if (usdDecimal == 0) {
                    await erc4626PriceProvider.initialize().then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("ERC4626PriceProvider initialized at " + lpPriceProviderAddress);
                    });
                }
            }

            {
                const tokenDecimal = await erc4626PriceProvider.getPriceDecimals();
                const currentImplementation = await proxyAdmin.getProxyImplementation(erc4626PriceProvider.address);
                const priceDecimals = erc4626PriceProvider?.priceDecimals;
                if (priceDecimals && tokenDecimal != priceDecimals && currentImplementation.toLowerCase() == erc4626PriceProviderLogicAddress.toLowerCase()) {
                    await erc4626PriceProvider.setTokenDecimals(priceDecimals)
                        .then(function (instance) {
                            log("\nTransaction hash: " + instance.hash);
                            log("ERC4626PriceProvider " + erc4626PriceProvider.address + " set tokenDecimals: " + priceDecimals);
                        });
                }
            }

            {
                let moderatorRole = await erc4626PriceProvider.MODERATOR_ROLE();
                let isModeratorRole = await erc4626PriceProvider.hasRole(moderatorRole, priceProviderAggregatorAddress);
                if (!isModeratorRole) {
                    await erc4626PriceProvider.grantModerator(priceProviderAggregatorAddress).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("ERC4626PriceProvider granted moderator " + priceProviderAggregatorAddress);
                    });
                }
            }

            for (const token of tokensUseERC4626Provider) {
                let erc4626Metadata = await erc4626PriceProvider.erc4626Metadata(token);
                if (erc4626Metadata.isActive == false || erc4626Metadata.base.toLowerCase() != priceProviderAggregatorAddress.toLowerCase()) {
                    await erc4626PriceProvider.setERC4626TokenAndProvider(token, priceProviderAggregatorAddress).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("ERC4626PriceProvider set token " + token + " and pair " + priceProviderAggregatorAddress);
                    });
                }
            }
        }

        //==============================
        //set wstETHPriceProvider
        if (wstETHPriceProviderAddress) {
            log();
            log("***** SETTING WSTETH PRICE PROVIDER *****");

            {
                let usdDecimal = await wstETHPriceProviderImplementation.getPriceDecimals();
                if (usdDecimal == 0) {
                    await wstETHPriceProviderImplementation.initialize(wstETH, wstETHAggregatorPath).then(function (instance) {
                        log("Transaction hash: " + instance.hash);
                        log("wstETHPriceProvider Implementation initialized at " + wstETHPriceProviderLogicAddress);
                    });
                }
            }

            {
                let usdDecimal = await wstETHPriceProvider.getPriceDecimals();
                if (usdDecimal == 0) {
                    await wstETHPriceProvider.initialize(wstETH, wstETHAggregatorPath).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("wstETHPriceProvider initialized at " + wstETHPriceProviderAddress);
                    });
                }
            }

            {
                const tokenDecimal = await wstETHPriceProvider.getPriceDecimals();
                const currentImplementation = await proxyAdmin.getProxyImplementation(wstETHPriceProvider.address);
                const priceDecimals = wstETHProvider?.priceDecimals;
                if (priceDecimals && tokenDecimal != priceDecimals && currentImplementation.toLowerCase() == wstETHPriceProviderLogicAddress.toLowerCase()) {
                    await wstETHPriceProvider.setTokenDecimals(priceDecimals)
                        .then(function (instance) {
                            log("\nTransaction hash: " + instance.hash);
                            log("wstETHPriceProvider " + wstETHPriceProvider.address + " set tokenDecimals: " + priceDecimals);
                        });
                }
            }

            {
                let moderatorRole = await wstETHPriceProvider.MODERATOR_ROLE();
                let isModeratorRole = await wstETHPriceProvider.hasRole(moderatorRole, priceProviderAggregatorAddress);
                if (!isModeratorRole) {
                    await wstETHPriceProvider.grantModerator(priceProviderAggregatorAddress).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("wstETHPriceProvider granted moderator " + priceProviderAggregatorAddress);
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
                        log("\nTransaction hash: " + instance.hash);
                        log("wstETHPriceProvider add AggregatorPath: " + wstETHAggregatorPath);
                    });
                }
            }

            if (sequencerUptimeFeed) {
                let currentSequencerUptimeFeed = await wstETHPriceProvider.sequencerUptimeFeed();
                if (sequencerUptimeFeed != currentSequencerUptimeFeed) {
                    await wstETHPriceProvider.setSequencerUptimeFeed(
                        sequencerUptimeFeed
                    ).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("wstETHPriceProvider " + wstETHPriceProvider.address + " set sequencerUptimeFeed: " + sequencerUptimeFeed);
                    });
                }
                let currentGracePeriodTime = await wstETHPriceProvider.gracePeriodTime();
                if (gracePeriodTime != currentGracePeriodTime) {
                    await wstETHPriceProvider.setGracePeriodTime(
                        gracePeriodTime
                    ).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("wstETHPriceProvider " + wstETHPriceProvider.address + " set gracePeriodTime: " + gracePeriodTime);
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
                        log("\nTransaction hash: " + instance.hash);
                        log("wstETHPriceProvider " + wstETHPriceProvider.address + " set timeout with parameters: ");
                        log("   aggregator: " + wstETHAggregatorPath[i]);
                        log("   timeout: " + timeOutsWstETHAggregatorPath[i]);
                    });
                }
            }
        }


        //==============================
        //set priceProviderAggregator
        log();
        log("***** SETTING PROVIDER AGGREGATOR *****");

        {
            let adminRole = await priceProviderAggregatorImplementation.DEFAULT_ADMIN_ROLE();
            let isAdminRole = await priceProviderAggregatorImplementation.hasRole(adminRole, deployMasterAddress);
            if (!isAdminRole) {
                await priceProviderAggregatorImplementation.initialize(priceOracleAddress)
                    .then(function (instance) {
                        log("Transaction hash: " + instance.hash);
                        log("PriceProviderAggregator Implementation initialized at " + priceProviderAggregatorLogicAddress);
                    });
            }
        }

        {
            let adminRole = await priceProviderAggregator.DEFAULT_ADMIN_ROLE();
            let isAdminRole = await priceProviderAggregator.hasRole(adminRole, deployMasterAddress);
            if (!isAdminRole) {
                await priceProviderAggregator.initialize(priceOracleAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PriceProviderAggregator initialized at " + priceProviderAggregatorAddress);
                });
            }
        }

        {
            let currentPriceOracleAddress = await priceProviderAggregator.priceOracle();
            if (currentPriceOracleAddress.toLowerCase() != priceOracleAddress.toLowerCase()) {
                await priceProviderAggregator.setPriceOracle(priceOracleAddress).then(function (instance) {
                    log("PriceProviderAggregator " + priceProviderAggregator.address + " set priceOracle " + priceOracleAddress + " at tx hash: " + instance.hash);
                });
            }
        }

        {
            let moderatorRole = await priceProviderAggregator.MODERATOR_ROLE();
            let isModeratorRole = await priceProviderAggregator.hasRole(moderatorRole, deployMasterAddress);
            if (!isModeratorRole) {
                await priceProviderAggregator.grantModerator(deployMasterAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PriceProviderAggregator " + priceProviderAggregator.address + " granted moderator " + deployMasterAddress);
                });
            }
        }
        {
            if (pythPriceProviderAddress) {
                const currentImplementation = await proxyAdmin.getProxyImplementation(priceProviderAggregator.address);
                if (currentImplementation.toLowerCase() == priceProviderAggregatorLogicAddress.toLowerCase()) {
                    let currentPythPriceProvider = await priceProviderAggregator.pythPriceProvider();
                    if (currentPythPriceProvider.toLowerCase() != pythPriceProviderAddress.toLowerCase()) {
                        await priceProviderAggregator.setPythPriceProvider(pythPriceProviderAddress).then(function (instance) {
                            log("\nTransaction hash: " + instance.hash);
                            log("PriceProviderAggregator " + priceProviderAggregator.address + " set pythPriceProviderAddress " + pythPriceProviderAddress);
                        });
                    }
                }
            }
        }
        for (var i = 0; i < tokensUseChainlink.length; i++) {
            let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(tokensUseChainlink[i]);
            if (tokenPriceProvider.toLowerCase() != chainlinkPriceProviderAddress.toLowerCase()) {
                await priceProviderAggregator.setTokenAndPriceProvider(tokensUseChainlink[i], chainlinkPriceProviderAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUseChainlink[i] + " with priceOracle " + chainlinkPriceProviderAddress);
                });
            }
        }

        for (var i = 0; i < tokensUseUniswapV2.length; i++) {
            let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(tokensUseUniswapV2[i]);
            if (tokenPriceProvider.toLowerCase() != uniswapV2PriceProviderAddress.toLowerCase()) {
                await priceProviderAggregator.setTokenAndPriceProvider(tokensUseUniswapV2[i], uniswapV2PriceProviderAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUseUniswapV2[i] + " with priceOracle " + uniswapV2PriceProviderAddress);
                });
            }
        }

        for (var i = 0; i < tokensUseUniswapV3.length; i++) {
            let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(tokensUseUniswapV3[i]);
            if (tokenPriceProvider.toLowerCase() != uniswapV3PriceProviderAddress.toLowerCase()) {
                await priceProviderAggregator.setTokenAndPriceProvider(tokensUseUniswapV3[i], uniswapV3PriceProviderAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUseUniswapV3[i] + " with priceOracle " + uniswapV3PriceProviderAddress);
                });
            }
        }

        for (var i = 0; i < tokensUseLPProvider.length; i++) {
            let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(tokensUseLPProvider[i]);
            if (tokenPriceProvider.toLowerCase() != lpPriceProviderAddress.toLowerCase()) {
                await priceProviderAggregator.setTokenAndPriceProvider(tokensUseLPProvider[i], lpPriceProviderAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUseLPProvider[i] + " with priceOracle " + lpPriceProviderAddress);
                });
            }
        }

        for (const token of tokensUseERC4626Provider) {
            let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(token);
            if (tokenPriceProvider.toLowerCase() != erc4626PriceProviderAddress.toLowerCase()) {
                await priceProviderAggregator.setTokenAndPriceProvider(token, erc4626PriceProviderAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + token + " with priceOracle " + lpPriceProviderAddress);
                });
            }
        }

        for (var i = 0; i < tokensUsePyth.length; i++) {
            let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(tokensUsePyth[i]);
            if (tokenPriceProvider.toLowerCase() != pythPriceProviderAddress.toLowerCase()) {
                await priceProviderAggregator.setTokenAndPriceProvider(tokensUsePyth[i], pythPriceProviderAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUsePyth[i] + " with priceOracle " + pythPriceProviderAddress);
                });
            }
        }

        if (wstETHPriceProviderAddress) {
            let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(wstETH);
            if (tokenPriceProvider.toLowerCase() != wstETHPriceProviderAddress.toLowerCase()) {
                await priceProviderAggregator.setTokenAndPriceProvider(wstETH, wstETHPriceProviderAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + wstETH + " with priceOracle " + wstETHPriceProviderAddress);
                });
            }
        }

        {
            const listToken = Array.from(new Set(
                projectTokens.concat(lendingTokens).map(token => token.toLowerCase())
            ));
            const listTokenNeedUpdatePrice = [];
            const listTokenUsePythOracle = [];

            for (let i = 0; i < listToken.length; i++) {

                let currentPrice = await priceOracleProvider.priceInfo(listToken[i]);
                let priceProvider = (await priceProviderAggregator.tokenPriceProvider(listToken[i]));

                if (currentPrice.timestamp.toString() === "0") {
                    listTokenNeedUpdatePrice.push(listToken[i]);
                    if (pythPriceProviderAddress && priceProvider.toLowerCase() === pythPriceProviderAddress.toLowerCase()) {
                        listTokenUsePythOracle.push(listToken[i]);
                    }
                }
            }

            let priceIds = [];
            let updateData = [];
            let updateFee = 0;
            let expiredPriceFeedData;
            if (listTokenUsePythOracle.length > 0) {
                expiredPriceFeedData = await priceProviderAggregator.getExpiredPriceFeeds(listTokenUsePythOracle, 15);
                if (expiredPriceFeedData.priceIds.length > 0) {
                    const connection = new EvmPriceServiceConnection(
                        "https://hermes.pyth.network"
                    );
                    priceIds = expiredPriceFeedData.priceIds;
                    updateFee = expiredPriceFeedData.updateFee;
                    updateData = await connection.getPriceFeedsUpdateData(expiredPriceFeedData.priceIds);
                }
            }
            if (listTokenNeedUpdatePrice.length > 0) {
                await priceProviderAggregator.updateMultiFinalPricesWithUpdatePrice(
                    listTokenNeedUpdatePrice,
                    priceIds,
                    updateData, {
                    value: updateFee
                }
                ).then(function (instance) {
                    log("PriceProviderAggregator " + priceProviderAggregator.address + " updateMultiFinalPricesWithUpdatePrice at tx hash: " + instance.hash);
                    log("Token: " + listTokenNeedUpdatePrice);
                });
            }
        }

        let addresses = {
            proxyAdminAddress: proxyAdminAddress,
            priceOracleAddress: priceOracleAddress,
            pythPriceProviderAddress: pythPriceProviderAddress,
            chainlinkPriceProviderAddress: chainlinkPriceProviderAddress,
            backendPriceProviderAddress: backendPriceProviderAddress,
            uniswapV2PriceProviderAddress: uniswapV2PriceProviderAddress,
            uniswapV3PriceProviderAddress: uniswapV3PriceProviderAddress,
            uniswapV2PriceProviderMockAddress: uniswapV2PriceProviderMockAddress,
            lpPriceProviderAddress: lpPriceProviderAddress,
            wstETHPriceProvider: wstETHPriceProviderAddress,
            priceProviderAggregatorAddress: priceProviderAggregatorAddress
        };

        return addresses;
    }

};