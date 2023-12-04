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

const verify = async (address, constructorArguments, keyInConfig) => {
    console.log("Verifying " + address);
    if (!verifyFile[keyInConfig] && !isTesting) {
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
        let pythPriceProvider;
        let chainlinkPriceProvider;
        let backendPriceProvider;
        let uniswapV2PriceProvider;
        let uniswapV2PriceProviderMock;
        let priceProviderAggregator;
        let lpPriceProvider;
        let wstETHPriceProvider;
        let mutePriceProvider;

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
            Mute,
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
        let tokensUseMute = Mute.tokensUseMute;
        let mutePairs = Mute.mutePairs;

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
            wstETHPriceProviderProxy,
            mutePriceProviderLogic,
            mutePriceProviderProxy
        } = configs;

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
        let mutePriceProviderAddress = isTesting ? "" : mutePriceProviderProxy;

        let backendPriceProviderLogicAddress = isTesting ? "" : BackendPriceProviderLogic;
        let pythPriceProviderLogicAddress = isTesting ? "" : PythPriceProviderLogic;
        let chainlinkPriceProviderLogicAddress = isTesting ? "" : ChainlinkPriceProviderLogic;
        let priceProviderAggregatorLogicAddress = isTesting ? "" : PriceProviderAggregatorLogic;
        let uniswapV2PriceProviderLogicAddress = isTesting ? "" : UniswapV2PriceProviderLogic;
        let uniswapV2PriceProviderMockLogicAddress = "";
        let lpPriceProviderLogicAddress = isTesting ? "" : LPPriceProviderLogic;
        let wstETHPriceProviderLogicAddress = isTesting ? "" : wstETHPriceProviderLogic;
        let mutePriceProviderLogicAddress = isTesting ? "" : mutePriceProviderLogic;

        ProxyAdmin = await deployer.loadArtifact("PrimaryLendingPlatformProxyAdmin");
        TransparentUpgradeableProxy = await deployer.loadArtifact("TransparentUpgradeableProxy");
        PythPriceProvider = await deployer.loadArtifact("PythPriceProvider");
        ChainlinkPriceProvider = await deployer.loadArtifact("ChainlinkPriceProvider");
        BackendPriceProvider = await deployer.loadArtifact("BackendPriceProvider");
        UniswapV2PriceProvider = await deployer.loadArtifact("UniswapV2PriceProvider");
        UniswapV2PriceProviderMock = await deployer.loadArtifact("UniswapV2PriceProviderMock");
        PriceProviderAggregator = await deployer.loadArtifact("PriceProviderAggregatorPyth");
        LPPriceProvider = await deployer.loadArtifact("LPPriceProvider");
        WstETHPriceProvider = await deployer.loadArtifact("wstETHPriceProvider");
        MutePriceProvider = await deployer.loadArtifact("MutePriceProvider");

        //interfaces of contracts
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
            console.log = function () { };
            fs.writeFileSync = function () { };
        }

        console.log("Network name: " + network);
        console.log("DeployMaster: " + deployMasterAddress);
        //====================================================
        //====================== deploy proxy admin =============================
        console.log();
        console.log("***** PROXY ADMIN DEPLOYMENT *****");
        if (!proxyAdminAddress) {
            proxyAdmin = await deployer.deploy(ProxyAdmin, []);
            configs.PRIMARY_PROXY_ADMIN = proxyAdminAddress = proxyAdmin.address;
            fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
        }
        console.log(`${ProxyAdmin.contractName} was deployed at: ${proxyAdminAddress}`);
        await verify(proxyAdminAddress, [], "PRIMARY_PROXY_ADMIN");
        //====================== deploy pythPriceProvider =============================
        if (tokensUsePyth.length > 0) {
            console.log();
            console.log("***** PYTH PRICE PROVIDER DEPLOYMENT *****");

            if (!pythPriceProviderLogicAddress) {
                pythPriceProvider = await deployer.deploy(PythPriceProvider, []);
                configs.PythPriceProviderLogic = pythPriceProviderLogicAddress = pythPriceProvider.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            console.log(`PythPriceProvider masterCopy was deployed at: ${pythPriceProviderLogicAddress}`);
            await verify(pythPriceProviderLogicAddress, [], "PythPriceProviderLogic");

            if (!pythPriceProviderAddress) {
                const pythPriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
                    [pythPriceProviderLogicAddress, proxyAdminAddress, "0x"]
                );
                configs.PythPriceProviderProxy = pythPriceProviderAddress = pythPriceProviderProxy.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            console.log(`PythPriceProvider was deployed at: ${pythPriceProviderAddress}`);
            await verify(pythPriceProviderAddress, [
                pythPriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "PythPriceProviderProxy");
        }
        //====================================================
        //deploy mutePriceProvider
        if (tokensUseMute.length > 0) {
            console.log();
            console.log("***** MUTE PRICE PROVIDER DEPLOYMENT *****");

            if (!mutePriceProviderLogicAddress) {
                mutePriceProvider = await deployer.deploy(MutePriceProvider, []);
                configs.MutePriceProviderLogic = mutePriceProviderLogicAddress = mutePriceProvider.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            console.log(`MutePriceProvider masterCopy was deployed at: ${mutePriceProviderLogicAddress}`);
            await verify(mutePriceProviderLogicAddress, [], "MutePriceProviderLogic");

            if (!mutePriceProviderAddress) {
                const mutePriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
                    [mutePriceProviderLogicAddress, proxyAdminAddress, "0x"]
                );
                configs.MutePriceProviderProxy = mutePriceProviderAddress = mutePriceProviderProxy.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            console.log(`MutePriceProvider was deployed at: ${mutePriceProviderAddress}`);
            await verify(mutePriceProviderAddress, [
                mutePriceProviderLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "MutePriceProviderProxy");
        }
        //====================================================
        //deploy chainlinkPriceProvider or chainlinkPriceProviderL2
        if (tokensUseChainlink.length > 0) {
            console.log();
            console.log("***** CHAINLINK PRICE PROVIDER DEPLOYMENT *****");
            if (!chainlinkPriceProviderLogicAddress) {
                chainlinkPriceProvider = await deployer.deploy(ChainlinkPriceProvider, []);
                configs.ChainlinkPriceProviderLogic = chainlinkPriceProviderLogicAddress = chainlinkPriceProvider.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            console.log(`ChainlinkPriceProvider masterCopy was deployed at: ${chainlinkPriceProviderLogicAddress}`);
            await verify(chainlinkPriceProviderLogicAddress, [], "ChainlinkPriceProviderLogic");

            if (!chainlinkPriceProviderAddress) {
                const chainlinkPriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
                    [chainlinkPriceProviderLogicAddress, proxyAdminAddress, "0x"]
                );
                configs.ChainlinkPriceProviderProxy = chainlinkPriceProviderAddress = chainlinkPriceProviderProxy.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            console.log(`ChainlinkPriceProvider was deployed at: ${chainlinkPriceProviderAddress}`);
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

            // if exist backendPriceProvider, then we need to get interface of it
            if (!backendPriceProviderLogicAddress) {
                backendPriceProvider = await deployer.deploy(BackendPriceProvider, []);
                configs.BackendPriceProviderLogic = backendPriceProviderLogicAddress = backendPriceProvider.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            console.log(`BackendPriceProvider masterCopy was deployed at: ${backendPriceProviderLogicAddress}`);
            await verify(backendPriceProviderLogicAddress, [], "BackendPriceProviderLogic");

            if (!backendPriceProviderAddress) {
                const backendPriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
                    [backendPriceProviderLogicAddress, proxyAdminAddress, "0x"]
                );
                configs.BackendPriceProviderProxy = backendPriceProviderAddress = backendPriceProviderProxy.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            console.log(`BackendPriceProvider was deployed at: ${backendPriceProviderAddress}`);
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
                uniswapV2PriceProvider = await deployer.deploy(UniswapV2PriceProvider, []);
                configs.UniswapV2PriceProviderLogic = uniswapV2PriceProviderLogicAddress = uniswapV2PriceProvider.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            console.log(`UniswapV2PriceProvider masterCopy was deployed at: ${uniswapV2PriceProviderLogicAddress}`);
            await verify(uniswapV2PriceProviderLogicAddress, [], "UniswapV2PriceProviderLogic");

            if (!uniswapV2PriceProviderAddress) {
                const uniswapV2PriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
                    [uniswapV2PriceProviderLogicAddress, proxyAdminAddress, "0x"]
                );
                configs.UniswapV2PriceProviderProxy = uniswapV2PriceProviderAddress = uniswapV2PriceProviderProxy.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            console.log(`UniswapV2PriceProvider was deployed at: ${uniswapV2PriceProviderAddress}`);
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
                lpPriceProvider = await deployer.deploy(LPPriceProvider, []);
                configs.LPPriceProviderLogic = lpPriceProviderLogicAddress = lpPriceProvider.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            console.log(`lpPriceProvider masterCopy was deployed at: ${lpPriceProviderLogicAddress}`);
            await verify(lpPriceProviderLogicAddress, [], "LPPriceProviderLogic");

            if (!lpPriceProviderAddress) {
                const lpPriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
                    [lpPriceProviderLogicAddress, proxyAdminAddress, "0x"]
                );
                configs.LPPriceProviderProxy = lpPriceProviderAddress = lpPriceProviderProxy.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            console.log(`lpPriceProvider was deployed at: ${lpPriceProviderAddress}`);
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
                wstETHPriceProvider = await deployer.deploy(WstETHPriceProvider, []);
                configs.wstETHPriceProviderLogic = wstETHPriceProviderLogicAddress = wstETHPriceProvider.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            console.log(`wstETHPriceProvider masterCopy was deployed at: ${wstETHPriceProviderLogicAddress}`);
            await verify(wstETHPriceProviderLogicAddress, [], "wstETHPriceProviderLogic");

            if (!wstETHPriceProviderAddress) {
                const wstETHPriceProviderProxy = await deployer.deploy(TransparentUpgradeableProxy,
                    [wstETHPriceProviderLogicAddress, proxyAdminAddress, "0x"]
                );
                configs.wstETHPriceProviderProxy = wstETHPriceProviderAddress = wstETHPriceProviderProxy.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            console.log(`wstETHPriceProvider was deployed at: ${wstETHPriceProviderAddress}`);
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
            priceProviderAggregator = await deployer.deploy(PriceProviderAggregator, []);
            configs.PriceProviderAggregatorLogic = priceProviderAggregatorLogicAddress = priceProviderAggregator.address;
            fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
        }
        console.log(`PriceProviderAggregator masterCopy was deployed at: ${priceProviderAggregatorLogicAddress}`);
        await verify(priceProviderAggregatorLogicAddress, [], "PriceProviderAggregatorLogic");

        if (!priceProviderAggregatorAddress) {
            const priceProviderAggregatorProxy = await deployer.deploy(TransparentUpgradeableProxy,
                [priceProviderAggregatorLogicAddress, proxyAdminAddress, "0x"]
            );
            configs.PriceProviderAggregatorProxy = priceProviderAggregatorAddress = priceProviderAggregatorProxy.address;
            fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
        }
        console.log(`PriceProviderAggregator was deployed at: ${priceProviderAggregatorAddress}`);
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
                uniswapV2PriceProviderMock = await deployer.deploy(UniswapV2PriceProviderMock, []);
                configs.UniswapV2PriceProviderMockLogic = uniswapV2PriceProviderMockLogicAddress = uniswapV2PriceProviderMock.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            console.log(`UniswapV2PriceProviderMock masterCopy was deployed at: ${uniswapV2PriceProviderMockLogicAddress}`);
            await verify(uniswapV2PriceProviderMockLogicAddress, [], "UniswapV2PriceProviderMockLogic");

            if (!uniswapV2PriceProviderMockAddress) {
                const uniswapV2PriceProviderMockProxy = await deployer.deploy(TransparentUpgradeableProxy,
                    [uniswapV2PriceProviderMockLogicAddress, proxyAdminAddress, "0x"]
                );
                configs.UniswapV2PriceProviderMockProxy = uniswapV2PriceProviderMockAddress = uniswapV2PriceProviderMockProxy.address;
                fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
            }
            console.log(`UniswapV2PriceProviderMock was deployed at: ${uniswapV2PriceProviderMockAddress}`);
            await verify(uniswapV2PriceProviderMockAddress, [
                uniswapV2PriceProviderMockLogicAddress,
                proxyAdminAddress,
                "0x"
            ], "UniswapV2PriceProviderMockProxy");
        }
        //====================== setting Params =============================
        if (pythPriceProviderAddress) pythPriceProvider = new ethers.Contract(pythPriceProviderAddress, pythPriceProviderInterface, wallet);
        if (chainlinkPriceProviderAddress) chainlinkPriceProvider = new ethers.Contract(chainlinkPriceProviderAddress, chainlinkPriceProviderInterface, wallet);
        if (backendPriceProviderAddress) backendPriceProvider = new ethers.Contract(backendPriceProviderAddress, backendPriceProviderInterface, wallet);
        if (uniswapV2PriceProviderAddress) uniswapV2PriceProvider = new ethers.Contract(uniswapV2PriceProviderAddress, uniswapV2PriceProviderInterface, wallet);
        if (uniswapV2PriceProviderMockAddress) uniswapV2PriceProviderMock = new ethers.Contract(uniswapV2PriceProviderMockAddress, uniswapV2PriceProviderMockInterface, wallet);
        if (priceProviderAggregatorAddress) priceProviderAggregator = new ethers.Contract(priceProviderAggregatorAddress, priceProviderAggregatorInterface, wallet);
        if (wstETHPriceProviderAddress) wstETHPriceProvider = new ethers.Contract(wstETHPriceProviderAddress, wstETHPriceProviderInterface, wallet);
        if (lpPriceProviderAddress) lpPriceProvider = new ethers.Contract(lpPriceProviderAddress, lpPriceProviderInterface, wallet);
        if (mutePriceProviderAddress) mutePriceProvider = new ethers.Contract(mutePriceProviderAddress, mutePriceProviderInterface, wallet);

        if (pythPriceProviderLogicAddress) pythPriceProviderImplementation = new ethers.Contract(pythPriceProviderLogicAddress, pythPriceProviderInterface, wallet);
        if (chainlinkPriceProviderLogicAddress) chainlinkPriceProviderImplementation = new ethers.Contract(chainlinkPriceProviderLogicAddress, chainlinkPriceProviderInterface, wallet);
        if (backendPriceProviderLogicAddress) backendPriceProviderImplementation = new ethers.Contract(backendPriceProviderLogicAddress, backendPriceProviderInterface, wallet);
        if (uniswapV2PriceProviderLogicAddress) uniswapV2PriceProviderImplementation = new ethers.Contract(uniswapV2PriceProviderLogicAddress, uniswapV2PriceProviderInterface, wallet);
        if (priceProviderAggregatorLogicAddress) priceProviderAggregatorImplementation = new ethers.Contract(priceProviderAggregatorLogicAddress, priceProviderAggregatorInterface, wallet);
        if (wstETHPriceProviderLogicAddress) wstETHPriceProviderImplementation = new ethers.Contract(wstETHPriceProviderLogicAddress, wstETHPriceProviderInterface, wallet);
        if (lpPriceProviderLogicAddress) lpPriceProviderImplementation = new ethers.Contract(lpPriceProviderLogicAddress, lpPriceProviderInterface, wallet);
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
                            console.log("\nTransaction hash: " + instance.hash);
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
                    let pythMetadata = await pythPriceProvider.pythMetadata(tokensUsePyth[i]);
                    if (pythMetadata == false) {
                        await pythPriceProvider.setTokenAndPriceIdPath(
                            tokensUsePyth[i],
                            priceIdPath[i]
                        ).then(function (instance) {
                            console.log("\nTransaction hash: " + instance.hash);
                            console.log("PythPriceProvider " + pythPriceProvider.address + " set token with parameters: ");
                            console.log("   token: " + tokensUsePyth[i]);
                            console.log("   priceId path: " + priceIdPath[i]);
                        });
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
                            console.log("\nTransaction hash: " + instance.hash);
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
                let chainlinkMetadataIsActive = await chainlinkPriceProvider.chainlinkMetadata(tokensUseChainlink[i]);
                if (chainlinkMetadataIsActive == false) {
                    await chainlinkPriceProvider.setTokenAndAggregator(
                        tokensUseChainlink[i],
                        chainlinkAggregatorV3[i]
                    ).then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " set token with parameters: ");
                        console.log("   token: " + tokensUseChainlink[i]);
                        console.log("   aggregator path: " + chainlinkAggregatorV3[i]);
                    });
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
        //set mutePriceProvider
        if (mutePriceProviderAddress) {
            console.log();
            console.log("***** SETTING MUTE PRICE PROVIDER *****");

            {
                let usdDecimal = await mutePriceProvider.getPriceDecimals();
                if (usdDecimal == 0) {
                    await mutePriceProvider.initialize().then(function (instance) {
                        console.log("Transaction hash: " + instance.hash);
                        console.log("MutePriceProvider initialized at " + mutePriceProviderAddress);
                    });
                }
            }

            {
                let moderatorRole = await mutePriceProvider.MODERATOR_ROLE();
                let isModeratorRole = await mutePriceProvider.hasRole(moderatorRole, priceProviderAggregatorAddress);
                if (!isModeratorRole) {
                    await mutePriceProvider.grantModerator(priceProviderAggregatorAddress).then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("MutePriceProvider granted moderator " + priceProviderAggregatorAddress);
                    });
                }
            }

            for (var i = 0; i < tokensUseMute.length; i++) {
                let muteMetadata = await mutePriceProvider.muteMetadata(tokensUseMute[i]);
                if (muteMetadata.isActive == false || muteMetadata.pair != mutePairs[i]) {
                    await mutePriceProvider.setTokenAndPair(tokensUseMute[i], mutePairs[i]).then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("UniswapV2PMutePriceProviderriceProvider set token " + tokensUseMute[i] + " and pair " + mutePairs[i]);
                    });
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
                            console.log("BackendPriceProvider Implementation initialized at " + backendPriceProviderLogicAddress);
                        });
                }
            }

            {
                usdDecimal = await backendPriceProvider.usdDecimals();
                if (usdDecimal == 0) {
                    await backendPriceProvider.initialize()
                        .then(function (instance) {
                            console.log("\nTransaction hash: " + instance.hash);
                            console.log("BackendPriceProvider initialized at " + backendPriceProviderAddress);
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
                            console.log("BackendPriceProvider set trusted backend " + backendPriceProvider.address);
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
                    await uniswapV2PriceProviderImplementation.initialize()
                        .then(function (instance) {
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
                        console.log("UniswapV2PriceProvider granted moderator " + priceProviderAggregatorAddress);
                    });
                }
            }

            for (var i = 0; i < tokensUseUniswap.length; i++) {
                let uniswapV2Metadata = await uniswapV2PriceProvider.uniswapV2Metadata(tokensUseUniswap[i]);
                if (uniswapV2Metadata.isActive == false || uniswapV2Metadata.pair != uniswapPairs[i]) {
                    await uniswapV2PriceProvider.setTokenAndPair(tokensUseUniswap[i], uniswapPairs[i]).then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("UniswapV2PriceProvider  set token " + tokensUseUniswap[i] + " and pair " + uniswapPairs[i]);
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
                    await lpPriceProviderImplementation.initialize()
                        .then(function (instance) {
                            console.log("Transaction hash: " + instance.hash);
                            console.log("LPPriceProvider Implementation initialized at " + lpPriceProviderLogicAddress);
                        });
                }
            }

            {
                usdDecimal = await lpPriceProvider.getPriceDecimals();
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
                        console.log("LPPriceProvider set token " + tokensUseLPProvider[i] + " and pair " + priceProviderAggregatorAddress);
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
                    await wstETHPriceProviderImplementation.initialize()
                        .then(function (instance) {
                            console.log("Transaction hash: " + instance.hash);
                            console.log("wstETHPriceProvider Implementation initialized at " + wstETHPriceProviderLogicAddress);
                        });
                }
            }

            {
                usdDecimal = await wstETHPriceProvider.getPriceDecimals();
                if (usdDecimal == 0) {
                    await wstETHPriceProvider.initialize(wstETH, wstETHAggregatorPath).then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("wstETHPriceProvider initialized at " + wstETHPriceProviderAddres);
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
                await priceProviderAggregatorImplementation.initialize()
                    .then(function (instance) {
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
                    console.log("PriceProviderAggregator granted moderator " + priceProviderAggregator.address);
                });
            }
        }
        {
            if (pythPriceProviderAddress) {
                let currentPythPriceProvider = await priceProviderAggregator.pythPriceProvider();
                if (currentPythPriceProvider != pythPriceProviderAddress) {
                    await priceProviderAggregator.setPythPriceProvider(pythPriceProviderAddress).then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set pythPriceProviderAddress " + pythPriceProviderAddress);
                    });
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

        for (var i = 0; i < tokensUseMute.length; i++) {
            let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(tokensUseMute[i]);
            if (tokenPriceProvider.priceProvider != mutePriceProviderAddress) {
                await priceProviderAggregator.setTokenAndPriceProvider(tokensUseMute[i], mutePriceProviderAddress, false).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUseMute[i] + " with priceOracle " + mutePriceProviderAddress);
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

        for (var i = 0; i < tokensUseBackendProvider.length; i++) {
            let tokenPriceProvider = await priceProviderAggregator.tokenPriceProvider(tokensUseBackendProvider[i]);
            if (tokenPriceProvider.priceProvider != backendPriceProviderAddress) {
                await priceProviderAggregator.setTokenAndPriceProvider(tokensUseBackendProvider[i], backendPriceProviderAddress, false).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PriceProviderAggregator " + priceProviderAggregator.address + " set token " + tokensUseBackendProvider[i] + " with priceOracle " + backendPriceProviderAddress);
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
            mutePriceProviderAddress: mutePriceProviderAddress,
            uniswapV2PriceProviderMockAddress: uniswapV2PriceProviderMockAddress,
            lpPriceProviderAddress: lpPriceProviderAddress,
            wstETHPriceProvider: wstETHPriceProviderAddress,
            priceProviderAggregatorAddress: priceProviderAggregatorAddress
        };
        return addresses;
    }
}