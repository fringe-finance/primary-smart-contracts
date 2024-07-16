require("dotenv").config();
const isTesting = Object.keys(process.env).includes('TESTING');

const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const { Wallet, Provider } = require("zksync-web3");
const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const configGeneralFile = path.join(__dirname, `../config_${network}/config_general.json`);
const configGeneral = require(configGeneralFile);
const configFile = path.join(__dirname, `../config_${network}/config.json`);
let configs = require(configFile);
const verifyFilePath = path.join(__dirname, `../config_${network}/verify.json`);
const verifyFile = require(verifyFilePath);
const { EvmPriceServiceConnection } = require('@pythnetwork/pyth-evm-js');

const verify = async (address, constructorArguments, keyInConfig) => {
    log("Verifying " + address);
    if (!verifyFile[keyInConfig] && !isTesting) {
        await hre.run(`verify:verify`, {
            address,
            constructorArguments,
        });
        verifyFile[keyInConfig] = true;
        fs.writeFileSync(path.join(verifyFilePath), JSON.stringify(verifyFile, null, 2));
    }
    log("Verified " + address);
}

const log = (...args) => {
    if (isTesting) {
        return
    } else {
        console.log(...args);
    }
}
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
    deploymentPriceProviderAggregator: async function () {

        //====================================================
        //declare parameters
        let provider;
        switch (network) {
            case "goerli":
                provider = new Provider("https://zksync2-testnet.zksync.dev");
                break;
            case "mainnet":
                provider = new Provider("https://mainnet.era.zksync.io");
                break;
            default:
                provider = new Provider("http://127.0.0.1:8011");
                break;
        }

        const wallet = new Wallet(process.env.PRIVATE_KEY).connect(provider);
        const deployer = new Deployer(hre, wallet);
        const deployMasterAddress = wallet.address;

        // Contracts ABI
        let ProxyAdmin;
        let TransparentUpgradeableProxy;
        let PriceOracle;
        let PythPriceProvider;
        let ChainlinkPriceProvider;
        let BackendPriceProvider;
        let UniswapV2PriceProvider;
        let UniswapV2PriceProviderMock;
        let PriceProviderAggregator;
        let LPPriceProvider;
        let WstETHPriceProvider;
        let MutePriceProvider;

        //instances of contracts
        let proxyAdmin;
        let priceOracleProvider;
        let pythPriceProvider;
        let chainlinkPriceProvider;
        let backendPriceProvider;
        let uniswapV2PriceProvider;
        let uniswapV2PriceProviderMock;
        let priceProviderAggregator;
        let lpPriceProvider;
        let wstETHPriceProvider;
        let mutePriceProvider;

        let priceOracleImplementation;
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
            priceOracle,
            plpModeratorParams,
            blendingToken
        } = configGeneral;

        const {
            priceProcessingOracle,
            Pyth,
            Chainlink,
            Uniswap,
            Mute,
            BackendProvider,
            LPProvider,
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
        let tokensUseUniswap = Uniswap.tokensUseUniswap;
        let uniswapPairs = Uniswap.uniswapPairs;
        let tokensUseBackendProvider = BackendProvider.tokensUseBackendProvider;
        let tokensUseLPProvider = LPProvider.tokensUseLPProvider;
        let wstETHAggregatorPath = wstETHProvider.wstETHAggregatorPath;
        let timeOutsWstETHAggregatorPath = wstETHProvider.timeOuts;
        let tokensUseMute = Mute.tokensUseMute;
        let mutePairs = Mute.mutePairs;

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
            PriceProviderAggregatorLogic,
            PriceProviderAggregatorProxy,
            LPPriceProviderLogic,
            LPPriceProviderProxy,
            wstETHPriceProviderLogic,
            wstETHPriceProviderProxy,
            MutePriceProviderLogic,
            MutePriceProviderProxy
        } = configs;

        //contracts addresses
        let proxyAdminAddress = isTesting ? "" : PRIMARY_PROXY_ADMIN;
        let priceOracleAddress = isTesting ? "" : PriceOracleProxy;
        let pythPriceProviderAddress = isTesting ? "" : PythPriceProviderProxy;
        let chainlinkPriceProviderAddress = isTesting ? "" : ChainlinkPriceProviderProxy;
        let priceProviderAggregatorAddress = isTesting ? "" : PriceProviderAggregatorProxy;
        let backendPriceProviderAddress = isTesting ? "" : BackendPriceProviderProxy;
        let uniswapV2PriceProviderAddress = isTesting ? "" : UniswapV2PriceProviderProxy;
        let uniswapV2PriceProviderMockAddress = "";
        let lpPriceProviderAddress = isTesting ? "" : LPPriceProviderProxy;
        let wstETHPriceProviderAddress = isTesting ? "" : wstETHPriceProviderProxy;
        let mutePriceProviderAddress = isTesting ? "" : MutePriceProviderProxy;

        let priceOracleLogicAddress = isTesting ? "" : PriceOracleLogic;
        let backendPriceProviderLogicAddress = isTesting ? "" : BackendPriceProviderLogic;
        let pythPriceProviderLogicAddress = isTesting ? "" : PythPriceProviderLogic;
        let chainlinkPriceProviderLogicAddress = isTesting ? "" : ChainlinkPriceProviderLogic;
        let priceProviderAggregatorLogicAddress = isTesting ? "" : PriceProviderAggregatorLogic;
        let uniswapV2PriceProviderLogicAddress = isTesting ? "" : UniswapV2PriceProviderLogic;
        let uniswapV2PriceProviderMockLogicAddress = "";
        let lpPriceProviderLogicAddress = isTesting ? "" : LPPriceProviderLogic;
        let wstETHPriceProviderLogicAddress = isTesting ? "" : wstETHPriceProviderLogic;
        let mutePriceProviderLogicAddress = isTesting ? "" : MutePriceProviderLogic;

        ProxyAdmin = await deployer.loadArtifact("PrimaryLendingPlatformProxyAdmin");
        TransparentUpgradeableProxy = await deployer.loadArtifact("TransparentUpgradeableProxy");
        PriceOracle = await deployer.loadArtifact("PriceOracle");
        PythPriceProvider = await deployer.loadArtifact("PythPriceProvider");
        ChainlinkPriceProvider = await deployer.loadArtifact("ChainlinkPriceProvider");
        BackendPriceProvider = await deployer.loadArtifact("BackendPriceProvider");
        UniswapV2PriceProvider = await deployer.loadArtifact("UniswapV2PriceProvider");
        UniswapV2PriceProviderMock = await deployer.loadArtifact("UniswapV2PriceProviderMock");
        PriceProviderAggregator = await deployer.loadArtifact("PriceProviderAggregatorPythV3");
        LPPriceProvider = await deployer.loadArtifact("LPPriceProvider");
        WstETHPriceProvider = await deployer.loadArtifact("wstETHPriceProvider");
        MutePriceProvider = await deployer.loadArtifact("MutePriceProvider");

        //interfaces of contracts
        let proxyAdminInterface = new ethers.utils.Interface(ProxyAdmin.abi);
        let priceOracleInterface = new ethers.utils.Interface(PriceOracle.abi);
        let pythPriceProviderInterface = new ethers.utils.Interface(PythPriceProvider.abi);
        let chainlinkPriceProviderInterface = new ethers.utils.Interface(ChainlinkPriceProvider.abi);
        let backendPriceProviderInterface = new ethers.utils.Interface(BackendPriceProvider.abi);
        let uniswapV2PriceProviderInterface = new ethers.utils.Interface(UniswapV2PriceProvider.abi);
        let uniswapV2PriceProviderMockInterface = new ethers.utils.Interface(UniswapV2PriceProviderMock.abi);
        let priceProviderAggregatorInterface = new ethers.utils.Interface(PriceProviderAggregator.abi);
        let lpPriceProviderInterface = new ethers.utils.Interface(LPPriceProvider.abi);
        let wstETHPriceProviderInterface = new ethers.utils.Interface(WstETHPriceProvider.abi);
        let mutePriceProviderInterface = new ethers.utils.Interface(MutePriceProvider.abi);

        if (isTesting) {
            fs.writeFileSync = function () { };
        }

        log("Network name: " + network);
        log("DeployMaster: " + deployMasterAddress);
        //====================================================
        //====================== deploy proxy admin =============================
        log();
        log("***** PROXY ADMIN DEPLOYMENT *****");
        if (!proxyAdminAddress) {
            proxyAdmin = await deployer.deploy(ProxyAdmin, []);
            configs.PRIMARY_PROXY_ADMIN = proxyAdminAddress = proxyAdmin.address;
            fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
        }
        log(`${ProxyAdmin.contractName} was deployed at: ${proxyAdminAddress}`);
        await verify(proxyAdminAddress, [], "PRIMARY_PROXY_ADMIN");
        //====================== deploy pythPriceProvider =============================
        if (tokensUsePyth.length > 0) {
            log();
            log("***** PYTH PRICE PROVIDER DEPLOYMENT *****");

            if (!pythPriceProviderLogicAddress) {
                pythPriceProvider = await deployer.deploy(PythPriceProvider, []);
                configs.PythPriceProviderLogic = pythPriceProviderLogicAddress = pythPriceProvider.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            log(`PythPriceProvider masterCopy was deployed at: ${pythPriceProviderLogicAddress}`);
            await verify(pythPriceProviderLogicAddress, [], "PythPriceProviderLogic");

            if (!pythPriceProviderAddress) {
                const pythPriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
                    [pythPriceProviderLogicAddress, proxyAdminAddress, "0x"]
                );
                configs.PythPriceProviderProxy = pythPriceProviderAddress = pythPriceProviderProxy.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            log(`\nPythPriceProvider was deployed at: ${pythPriceProviderAddress}`);
            await verify(pythPriceProviderAddress, [
                pythPriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "PythPriceProviderProxy");
        }
        //====================================================
        //====================== deploy priceOracle =============================
        if (tokensUsePyth.length > 0) {
            log();
            log("***** PRICE ORACLE PROVIDER DEPLOYMENT *****");

            if (!priceOracleLogicAddress) {
                priceOracleProvider = await deployer.deploy(PriceOracle, []);
                configs.PriceOracleLogic = priceOracleLogicAddress = priceOracleProvider.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            log(`PriceOracleProvider masterCopy was deployed at: ${priceOracleLogicAddress}`);
            await verify(priceOracleLogicAddress, [], "PriceOracleLogic");

            if (!priceOracleAddress) {
                const priceOracleProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
                    [priceOracleLogicAddress, proxyAdminAddress, "0x"]
                );
                configs.PriceOracleProxy = priceOracleAddress = priceOracleProviderProxy.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            log(`\nPriceOracleProvider was deployed at: ${priceOracleAddress}`);
            await verify(priceOracleAddress, [
                priceOracleLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "PriceOracleProxy");
        }
        //=========================
        //deploy mutePriceProvider
        if (tokensUseMute.length > 0) {
            log();
            log("***** MUTE PRICE PROVIDER DEPLOYMENT *****");

            if (!mutePriceProviderLogicAddress) {
                mutePriceProvider = await deployer.deploy(MutePriceProvider, []);
                configs.MutePriceProviderLogic = mutePriceProviderLogicAddress = mutePriceProvider.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            log(`MutePriceProvider masterCopy was deployed at: ${mutePriceProviderLogicAddress}`);
            await verify(mutePriceProviderLogicAddress, [], "MutePriceProviderLogic");

            if (!mutePriceProviderAddress) {
                const mutePriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
                    [mutePriceProviderLogicAddress, proxyAdminAddress, "0x"]
                );
                configs.MutePriceProviderProxy = mutePriceProviderAddress = mutePriceProviderProxy.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            log(`\nMutePriceProvider was deployed at: ${mutePriceProviderAddress}`);
            await verify(mutePriceProviderAddress, [
                mutePriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "MutePriceProviderProxy");
        }
        //=========================
        //====================================================
        //deploy chainlinkPriceProvider or chainlinkPriceProviderL2
        if (tokensUseChainlink.length > 0) {
            log();
            log("***** CHAINLINK PRICE PROVIDER DEPLOYMENT *****");
            if (!chainlinkPriceProviderLogicAddress) {
                chainlinkPriceProvider = await deployer.deploy(ChainlinkPriceProvider, []);
                configs.ChainlinkPriceProviderLogic = chainlinkPriceProviderLogicAddress = chainlinkPriceProvider.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            log(`ChainlinkPriceProvider masterCopy was deployed at: ${chainlinkPriceProviderLogicAddress}`);
            await verify(chainlinkPriceProviderLogicAddress, [], "ChainlinkPriceProviderLogic");

            if (!chainlinkPriceProviderAddress) {
                const chainlinkPriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
                    [chainlinkPriceProviderLogicAddress, proxyAdminAddress, "0x"]
                );
                configs.ChainlinkPriceProviderProxy = chainlinkPriceProviderAddress = chainlinkPriceProviderProxy.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            log(`\nChainlinkPriceProvider was deployed at: ${chainlinkPriceProviderAddress}`);
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

            // if exist backendPriceProvider, then we need to get interface of it
            if (!backendPriceProviderLogicAddress) {
                backendPriceProvider = await deployer.deploy(BackendPriceProvider, []);
                configs.BackendPriceProviderLogic = backendPriceProviderLogicAddress = backendPriceProvider.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            log(`BackendPriceProvider masterCopy was deployed at: ${backendPriceProviderLogicAddress}`);
            await verify(backendPriceProviderLogicAddress, [], "BackendPriceProviderLogic");

            if (!backendPriceProviderAddress) {
                const backendPriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
                    [backendPriceProviderLogicAddress, proxyAdminAddress, "0x"]
                );
                configs.BackendPriceProviderProxy = backendPriceProviderAddress = backendPriceProviderProxy.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            log(`\nBackendPriceProvider was deployed at: ${backendPriceProviderAddress}`);
            await verify(backendPriceProviderAddress, [
                backendPriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "BackendPriceProviderProxy");
        }
        //=========================
        //deploy uniswapV2PriceProvider
        if (tokensUseUniswap.length > 0) {
            log();
            log("***** UNISWAPV2 PRICE PROVIDER DEPLOYMENT *****");

            if (!uniswapV2PriceProviderLogicAddress) {
                uniswapV2PriceProvider = await deployer.deploy(UniswapV2PriceProvider, []);
                configs.UniswapV2PriceProviderLogic = uniswapV2PriceProviderLogicAddress = uniswapV2PriceProvider.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            log(`UniswapV2PriceProvider masterCopy was deployed at: ${uniswapV2PriceProviderLogicAddress}`);
            await verify(uniswapV2PriceProviderLogicAddress, [], "UniswapV2PriceProviderLogic");

            if (!uniswapV2PriceProviderAddress) {
                const uniswapV2PriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
                    [uniswapV2PriceProviderLogicAddress, proxyAdminAddress, "0x"]
                );
                configs.UniswapV2PriceProviderProxy = uniswapV2PriceProviderAddress = uniswapV2PriceProviderProxy.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            log(`\nUniswapV2PriceProvider was deployed at: ${uniswapV2PriceProviderAddress}`);
            await verify(uniswapV2PriceProviderAddress, [
                uniswapV2PriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "UniswapV2PriceProviderProxy");
        }
        //=========================
        //deploy LPPriceProvider
        if (tokensUseLPProvider.length > 0) {
            log();
            log("***** LP PRICE PROVIDER DEPLOYMENT *****");

            if (!lpPriceProviderLogicAddress) {
                lpPriceProvider = await deployer.deploy(LPPriceProvider, []);
                configs.LPPriceProviderLogic = lpPriceProviderLogicAddress = lpPriceProvider.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            log(`lpPriceProvider masterCopy was deployed at: ${lpPriceProviderLogicAddress}`);
            await verify(lpPriceProviderLogicAddress, [], "LPPriceProviderLogic");

            if (!lpPriceProviderAddress) {
                const lpPriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
                    [lpPriceProviderLogicAddress, proxyAdminAddress, "0x"]
                );
                configs.LPPriceProviderProxy = lpPriceProviderAddress = lpPriceProviderProxy.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            log(`\nlpPriceProvider was deployed at: ${lpPriceProviderAddress}`);
            await verify(lpPriceProviderAddress, [
                lpPriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "LPPriceProviderProxy");
        }
        //=========================
        //deploy wstETHPriceProvider
        if (wstETHAggregatorPath.length > 0) {
            log();
            log("***** WSTETH PRICE PROVIDER DEPLOYMENT *****");

            if (!wstETHPriceProviderLogicAddress) {
                wstETHPriceProvider = await deployer.deploy(WstETHPriceProvider, []);
                configs.wstETHPriceProviderLogic = wstETHPriceProviderLogicAddress = wstETHPriceProvider.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            log(`wstETHPriceProvider masterCopy was deployed at: ${wstETHPriceProviderLogicAddress}`);
            await verify(wstETHPriceProviderLogicAddress, [], "wstETHPriceProviderLogic");

            if (!wstETHPriceProviderAddress) {
                const wstETHPriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
                    [wstETHPriceProviderLogicAddress, proxyAdminAddress, "0x"]
                );
                configs.wstETHPriceProviderProxy = wstETHPriceProviderAddress = wstETHPriceProviderProxy.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            log(`\nwstETHPriceProvider was deployed at: ${wstETHPriceProviderAddress}`);
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
            priceProviderAggregator = await deployer.deploy(PriceProviderAggregator, []);
            configs.PriceProviderAggregatorLogic = priceProviderAggregatorLogicAddress = priceProviderAggregator.address;
            fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
        }
        log(`PriceProviderAggregator masterCopy was deployed at: ${priceProviderAggregatorLogicAddress}`);
        await verify(priceProviderAggregatorLogicAddress, [], "PriceProviderAggregatorLogic");

        if (!priceProviderAggregatorAddress) {
            const priceProviderAggregatorProxy = await deployer.deploy(TransparentUpgradeableProxy,
                [priceProviderAggregatorLogicAddress, proxyAdminAddress, "0x"]
            );
            configs.PriceProviderAggregatorProxy = priceProviderAggregatorAddress = priceProviderAggregatorProxy.address;
            fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
        }
        log(`\nPriceProviderAggregator was deployed at: ${priceProviderAggregatorAddress}`);
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
                uniswapV2PriceProviderMock = await deployer.deploy(UniswapV2PriceProviderMock, []);
                configs.UniswapV2PriceProviderMockLogic = uniswapV2PriceProviderMockLogicAddress = uniswapV2PriceProviderMock.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            log(`UniswapV2PriceProviderMock masterCopy was deployed at: ${uniswapV2PriceProviderMockLogicAddress}`);
            await verify(uniswapV2PriceProviderMockLogicAddress, [], "UniswapV2PriceProviderMockLogic");

            if (!uniswapV2PriceProviderMockAddress) {
                const uniswapV2PriceProviderMockProxy = await deployer.deploy(TransparentUpgradeableProxy,
                    [uniswapV2PriceProviderMockLogicAddress, proxyAdminAddress, "0x"]
                );
                configs.UniswapV2PriceProviderMockProxy = uniswapV2PriceProviderMockAddress = uniswapV2PriceProviderMockProxy.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            log(`\nUniswapV2PriceProviderMock was deployed at: ${uniswapV2PriceProviderMockAddress}`);
            await verify(uniswapV2PriceProviderMockAddress, [
                uniswapV2PriceProviderMockLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "UniswapV2PriceProviderMockProxy");
        }
        //====================== setting Params =============================
        if (proxyAdminAddress) proxyAdmin = new ethers.Contract(proxyAdminAddress, proxyAdminInterface, wallet);
        if (priceOracleAddress) priceOracleProvider = new ethers.Contract(priceOracleAddress, priceOracleInterface, wallet);
        if (pythPriceProviderAddress) pythPriceProvider = new ethers.Contract(pythPriceProviderAddress, pythPriceProviderInterface, wallet);
        if (chainlinkPriceProviderAddress) chainlinkPriceProvider = new ethers.Contract(chainlinkPriceProviderAddress, chainlinkPriceProviderInterface, wallet);
        if (backendPriceProviderAddress) backendPriceProvider = new ethers.Contract(backendPriceProviderAddress, backendPriceProviderInterface, wallet);
        if (uniswapV2PriceProviderAddress) uniswapV2PriceProvider = new ethers.Contract(uniswapV2PriceProviderAddress, uniswapV2PriceProviderInterface, wallet);
        if (uniswapV2PriceProviderMockAddress) uniswapV2PriceProviderMock = new ethers.Contract(uniswapV2PriceProviderMockAddress, uniswapV2PriceProviderMockInterface, wallet);
        if (priceProviderAggregatorAddress) priceProviderAggregator = new ethers.Contract(priceProviderAggregatorAddress, priceProviderAggregatorInterface, wallet);
        if (wstETHPriceProviderAddress) wstETHPriceProvider = new ethers.Contract(wstETHPriceProviderAddress, wstETHPriceProviderInterface, wallet);
        if (lpPriceProviderAddress) lpPriceProvider = new ethers.Contract(lpPriceProviderAddress, lpPriceProviderInterface, wallet);
        if (mutePriceProviderAddress) mutePriceProvider = new ethers.Contract(mutePriceProviderAddress, mutePriceProviderInterface, wallet);

        if (priceOracleLogicAddress) priceOracleImplementation = new ethers.Contract(priceOracleLogicAddress, priceOracleInterface, wallet);
        if (pythPriceProviderLogicAddress) pythPriceProviderImplementation = new ethers.Contract(pythPriceProviderLogicAddress, pythPriceProviderInterface, wallet);
        if (chainlinkPriceProviderLogicAddress) chainlinkPriceProviderImplementation = new ethers.Contract(chainlinkPriceProviderLogicAddress, chainlinkPriceProviderInterface, wallet);
        if (backendPriceProviderLogicAddress) backendPriceProviderImplementation = new ethers.Contract(backendPriceProviderLogicAddress, backendPriceProviderInterface, wallet);
        if (uniswapV2PriceProviderLogicAddress) uniswapV2PriceProviderImplementation = new ethers.Contract(uniswapV2PriceProviderLogicAddress, uniswapV2PriceProviderInterface, wallet);
        if (priceProviderAggregatorLogicAddress) priceProviderAggregatorImplementation = new ethers.Contract(priceProviderAggregatorLogicAddress, priceProviderAggregatorInterface, wallet);
        if (wstETHPriceProviderLogicAddress) wstETHPriceProviderImplementation = new ethers.Contract(wstETHPriceProviderLogicAddress, wstETHPriceProviderInterface, wallet);
        if (lpPriceProviderLogicAddress) lpPriceProviderImplementation = new ethers.Contract(lpPriceProviderLogicAddress, lpPriceProviderInterface, wallet);

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

        // ====================== upgrade lpPriceProvider =============================
        if (lpPriceProviderAddress) {
            log();
            log("***** UPGRADING LP PRICE PROVIDER *****");
            await upgrade(proxyAdmin, lpPriceProviderImplementation, lpPriceProvider);
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

        // ====================== upgrade lpPriceProvider =============================
        if (lpPriceProviderAddress) {
            log();
            log("***** UPGRADING LP PRICE PROVIDER *****");
            await upgrade(proxyAdmin, lpPriceProviderImplementation, lpPriceProvider);
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
                        log("PriceOracle initialized at " + priceOracleAddress + " at tx hash " + instance.hash);
                        log("Set volatilityCapUpPercent: " + volatilityCapUpPercent);
                        log("Set volatilityCapDownPercent: " + volatilityCapDownPercent);
                    });
                }
            }

            {
                let currentPriceProviderAggregator = await priceOracleProvider.priceProviderAggregator();
                let currentVolatilityCapUpPercent = await priceOracleProvider.currentVolatilityCapUpPercent();
                let currentVolatilityCapDownPercent = await priceOracleProvider.currentVolatilityCapDownPercent();

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
                        log("PriceOracleProvider set volatilityCapUpPercent: " + volatilityCapUpPercent);
                        log("PriceOracleProvider set volatilityCapDownPercent: " + volatilityCapDownPercent);
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
                            log("\nTransaction hash: " + instance.hash);
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
                            log("\nTransaction hash: " + instance.hash);
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
        //set mutePriceProvider
        if (mutePriceProviderAddress) {
            log();
            log("***** SETTING MUTE PRICE PROVIDER *****");

            {
                let usdDecimal = await mutePriceProvider.getPriceDecimals();
                if (usdDecimal == 0) {
                    await mutePriceProvider.initialize().then(function (instance) {
                        log("Transaction hash: " + instance.hash);
                        log("MutePriceProvider initialized at " + mutePriceProviderAddress);
                    });
                }
            }

            {
                const tokenDecimal = await mutePriceProvider.getPriceDecimals();
                const currentImplementation = await proxyAdmin.getProxyImplementation(mutePriceProvider.address);
                const priceDecimals = Mute?.priceDecimals;
                if (priceDecimals && tokenDecimal != priceDecimals && currentImplementation.toLowerCase() == mutePriceProviderLogicAddress.toLowerCase()) {
                    await mutePriceProvider.setTokenDecimals(priceDecimals)
                        .then(function (instance) {
                            log("\nTransaction hash: " + instance.hash);
                            log("MutePriceProvider " + mutePriceProvider.address + " set tokenDecimals: " + priceDecimals);
                        });
                }
            }

            {
                let moderatorRole = await mutePriceProvider.MODERATOR_ROLE();
                let isModeratorRole = await mutePriceProvider.hasRole(moderatorRole, priceProviderAggregatorAddress);
                if (!isModeratorRole) {
                    await mutePriceProvider.grantModerator(priceProviderAggregatorAddress).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("MutePriceProvider granted moderator " + priceProviderAggregatorAddress);
                    });
                }
            }

            for (var i = 0; i < tokensUseMute.length; i++) {
                let muteMetadata = await mutePriceProvider.muteMetadata(tokensUseMute[i]);
                if (muteMetadata.isActive == false || muteMetadata.pair.toLowerCase() != mutePairs[i].toLowerCase()) {
                    await mutePriceProvider.setTokenAndPair(tokensUseMute[i], mutePairs[i]).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("MutePriceProvider set token " + tokensUseMute[i] + " and pair " + mutePairs[i]);
                    });
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
                            log("BackendPriceProvider Implementation initialized at " + backendPriceProviderLogicAddress);
                        });
                }
            }

            {
                usdDecimal = await backendPriceProvider.usdDecimals();
                if (usdDecimal == 0) {
                    await backendPriceProvider.initialize()
                        .then(function (instance) {
                            log("\nTransaction hash: " + instance.hash);
                            log("BackendPriceProvider initialized at " + backendPriceProviderAddress);
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
                            log("BackendPriceProvider set trusted backend " + backendPriceProvider.address);
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
                    await uniswapV2PriceProviderImplementation.initialize()
                        .then(function (instance) {
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
                const priceDecimals = Uniswap?.priceDecimals;
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
                        log("UniswapV2PriceProvider granted moderator " + priceProviderAggregatorAddress);
                    });
                }
            }

            for (var i = 0; i < tokensUseUniswap.length; i++) {
                let uniswapV2Metadata = await uniswapV2PriceProvider.uniswapV2Metadata(tokensUseUniswap[i]);
                if (uniswapV2Metadata.isActive == false || uniswapV2Metadata.pair.toLowerCase() != uniswapPairs[i].toLowerCase()) {
                    await uniswapV2PriceProvider.setTokenAndPair(tokensUseUniswap[i], uniswapPairs[i]).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("UniswapV2PriceProvider  set token " + tokensUseUniswap[i] + " and pair " + uniswapPairs[i]);
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
                    await lpPriceProviderImplementation.initialize()
                        .then(function (instance) {
                            log("Transaction hash: " + instance.hash);
                            log("LPPriceProvider Implementation initialized at " + lpPriceProviderLogicAddress);
                        });
                }
            }

            {
                usdDecimal = await lpPriceProvider.getPriceDecimals();
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
                        log("LPPriceProvider set token " + tokensUseLPProvider[i] + " and pair " + priceProviderAggregatorAddress);
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
                    await wstETHPriceProviderImplementation.initialize()
                        .then(function (instance) {
                            log("Transaction hash: " + instance.hash);
                            log("wstETHPriceProvider Implementation initialized at " + wstETHPriceProviderLogicAddress);
                        });
                }
            }

            {
                usdDecimal = await wstETHPriceProvider.getPriceDecimals();
                if (usdDecimal == 0) {
                    await wstETHPriceProvider.initialize(wstETH, wstETHAggregatorPath).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("wstETHPriceProvider initialized at " + wstETHPriceProviderAddres);
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
                    log("PriceProviderAggregator granted moderator " + priceProviderAggregator.address);
                });
            }
        }
        {
            if (pythPriceProviderAddress) {
                let currentPythPriceProvider = await priceProviderAggregator.pythPriceProvider();
                if (currentPythPriceProvider.toLowerCase() != pythPriceProviderAddress.toLowerCase()) {
                    await priceProviderAggregator.setPythPriceProvider(pythPriceProviderAddress).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("PriceProviderAggregator " + priceProviderAggregator.address + " set pythPriceProviderAddress " + pythPriceProviderAddress);
                    });
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

        for (var i = 0; i < tokensUseUniswap.length; i++) {
            let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(tokensUseUniswap[i]);
            if (tokenPriceProvider.toLowerCase() != uniswapV2PriceProviderAddress.toLowerCase()) {
                await priceProviderAggregator.setTokenAndPriceProvider(tokensUseUniswap[i], uniswapV2PriceProviderAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUseUniswap[i] + " with priceOracle " + uniswapV2PriceProviderAddress);
                });
            }
        }

        for (var i = 0; i < tokensUseMute.length; i++) {
            let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(tokensUseMute[i]);
            if (tokenPriceProvider.toLowerCase() != mutePriceProviderAddress.toLowerCase()) {
                await priceProviderAggregator.setTokenAndPriceProvider(tokensUseMute[i], mutePriceProviderAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUseMute[i] + " with priceOracle " + mutePriceProviderAddress);
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

        for (var i = 0; i < tokensUsePyth.length; i++) {
            let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(tokensUsePyth[i]);
            if (tokenPriceProvider.toLowerCase() != pythPriceProviderAddress.toLowerCase()) {
                await priceProviderAggregator.setTokenAndPriceProvider(tokensUsePyth[i], pythPriceProviderAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUsePyth[i] + " with priceOracle " + pythPriceProviderAddress);
                });
            }
        }

        for (var i = 0; i < tokensUseBackendProvider.length; i++) {
            let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(tokensUseBackendProvider[i]);
            if (tokenPriceProvider.toLowerCase() != backendPriceProviderAddress.toLowerCase()) {
                await priceProviderAggregator.setTokenAndPriceProvider(tokensUseBackendProvider[i], backendPriceProviderAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUseBackendProvider[i] + " with priceOracle " + backendPriceProviderAddress);
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
            const listToken = projectTokens.concat(lendingTokens);
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
            mutePriceProviderAddress: mutePriceProviderAddress,
            uniswapV2PriceProviderMockAddress: uniswapV2PriceProviderMockAddress,
            lpPriceProviderAddress: lpPriceProviderAddress,
            wstETHPriceProvider: wstETHPriceProviderAddress,
            priceProviderAggregatorAddress: priceProviderAggregatorAddress
        };
        return addresses;
    }
}