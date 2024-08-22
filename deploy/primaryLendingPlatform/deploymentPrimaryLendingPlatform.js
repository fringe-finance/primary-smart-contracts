require("dotenv").config();
const isTesting = Object.keys(process.env).includes('TESTING');

const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const fs = require("fs");
const path = require("path");
const { Wallet, Provider } = require("zksync-web3");
const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");
const configGeneralFile = path.join(__dirname, `../config_${network}/config_general.json`);
const configGeneral = require(configGeneralFile);
const configFile = path.join(__dirname, `../config_${network}/config.json`);
let config = require(configFile);
const verifyFilePath = path.join(__dirname, `../config_${network}/verify.json`);
const verifyFile = require(verifyFilePath);

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
    deploymentPrimaryLendingPlatform: async function () {

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
        let ERC20Proxy = await deployer.loadArtifact("ERC20");
        let ProxyAdmin = await deployer.loadArtifact("PrimaryLendingPlatformProxyAdmin");
        let TransparentUpgradeableProxy = await deployer.loadArtifact("TransparentUpgradeableProxy");
        let JumpRateModel = await deployer.loadArtifact("JumpRateModelV3");
        let Bondtroller = await deployer.loadArtifact("Bondtroller");
        let BLendingToken = await deployer.loadArtifact("BLendingToken");
        let PrimaryLendingPlatformV2 = await deployer.loadArtifact("PrimaryLendingPlatformV2Zksync");
        let PrimaryLendingPlatformAtomicRepayment = await deployer.loadArtifact("PrimaryLendingPlatformAtomicRepaymentZksync");
        let PrimaryLendingPlatformLiquidation = await deployer.loadArtifact("PrimaryLendingPlatformLiquidationZksync");
        let PrimaryLendingPlatformLeverage = await deployer.loadArtifact("PrimaryLendingPlatformLeverageZksync");
        let PrimaryLendingPlatformWrappedTokenGateway = await deployer.loadArtifact("PrimaryLendingPlatformWrappedTokenGatewayZksync");
        let PrimaryLendingPlatformModerator = await deployer.loadArtifact("PrimaryLendingPlatformModerator");
        let PriceProviderAggregator = await deployer.loadArtifact("PriceProviderAggregatorPyth");

        let proxyAdmin;
        let jumpRateModel;
        let bondtroller;
        let blending;
        let plp;
        let plpAtomicRepayment;
        let plpLiquidation;
        let plpLeverage;
        let plpModerator;
        let plpWrappedTokenGateway;
        let priceProviderAggregator;

        let jumpRateModelImplementation;
        let bondtrollerImplementation;
        let blendingImplementation;
        let plpImplementation;
        let plpAtomicRepaymentImplementation;
        let plpLiquidationImplementation;
        let plpLeverageImplementation;
        let plpModeratorImplementation;
        let plpWrappedTokenGatewayImplementation;

        const {
            priceOracle,
            plpModeratorParams,
            blendingToken,
            jumRateModel,
            exchangeAggregatorParams,
            plpLiquidationParams
        } = configGeneral;

        const {
            PRIMARY_PROXY_ADMIN,
            PriceProviderAggregatorProxy,
            BondtrollerLogic,
            BondtrollerProxy,
            BLendingTokenLogic,
            BLendingTokenProxies,
            PrimaryLendingPlatformV2Logic,
            PrimaryLendingPlatformV2Proxy,
            JumpRateModelLogic,
            JumpRateModelProxy,
            PrimaryLendingPlatformAtomicRepaymentLogic,
            PrimaryLendingPlatformAtomicRepaymentProxy,
            PrimaryLendingPlatformLiquidationLogic,
            PrimaryLendingPlatformLiquidationProxy,
            PrimaryLendingPlatformLeverageLogic,
            PrimaryLendingPlatformLeverageProxy,
            PrimaryLendingPlatformModeratorLogic,
            PrimaryLendingPlatformModeratorProxy,
            PrimaryLendingPlatformWrappedTokenGatewayLogic,
            PrimaryLendingPlatformWrappedTokenGatewayProxy,
            ZERO_ADDRESS
        } = config;
        //Address
        let proxyAdminAddress = PRIMARY_PROXY_ADMIN;
        let blendingTokenLogicAddress = BLendingTokenLogic;
        let blendingTokenProxyAddresses = BLendingTokenProxies;

        let bondtrollerLogicAddress = BondtrollerLogic;
        let bondtrollerProxyAddress = BondtrollerProxy;

        let jumpRateModelLogicAddress = JumpRateModelLogic;
        let jumpRateModelProxyAddress = JumpRateModelProxy;

        let primaryLendingPlatformV2LogicAddress = PrimaryLendingPlatformV2Logic;
        let primaryLendingPlatformV2ProxyAddress = PrimaryLendingPlatformV2Proxy;

        let primaryLendingPlatformAtomicRepaymentLogicAddress = PrimaryLendingPlatformAtomicRepaymentLogic;
        let primaryLendingPlatformAtomicRepaymentProxyAddress = PrimaryLendingPlatformAtomicRepaymentProxy;
        let primaryLendingPlatformLiquidationLogicAddress = PrimaryLendingPlatformLiquidationLogic;
        let primaryLendingPlatformLiquidationProxyAddress = PrimaryLendingPlatformLiquidationProxy;

        let primaryLendingPlatformLeverageLogicAddress = PrimaryLendingPlatformLeverageLogic;
        let primaryLendingPlatformLeverageProxyAddress = PrimaryLendingPlatformLeverageProxy;

        let primaryLendingPlatformModeratorLogicAddress = PrimaryLendingPlatformModeratorLogic;
        let primaryLendingPlatformModeratorProxyAddress = PrimaryLendingPlatformModeratorProxy;

        let primaryLendingPlatformWrappedTokenGatewayLogicAddress = PrimaryLendingPlatformWrappedTokenGatewayLogic;
        let primaryLendingPlatformWrappedTokenGatewayProxyAddress = PrimaryLendingPlatformWrappedTokenGatewayProxy;

        let gainPerYear = jumRateModel.gainPerYear;
        let jumGainPerYear = jumRateModel.jumGainPerYear;
        let targetUtil = jumRateModel.targetUtil;
        let newMaxBorrow = jumRateModel.newMaxBorrow;
        let blocksPerYear = jumRateModel.blocksPerYear;

        let WETH = priceOracle.WETH;

        //config 
        let lendingTokens = blendingToken.lendingTokens;
        let initialExchangeRateMantissa = blendingToken.initialExchangeRateMantissa;
        let name = blendingToken.name;
        let symbol = blendingToken.symbol;
        let decimals = blendingToken.decimals;
        let loanToValueRatioNumeratorLendingToken = blendingToken.loanToValueRatioNumerator;
        let loanToValueRatioDenominatorLendingToken = blendingToken.loanToValueRatioDenominator;
        let initialSupplyAmount = blendingToken.initialSupplyAmount;
        let reserveFactorMantissa = blendingToken.reserveFactorMantissa;

        let projectTokens = plpModeratorParams.projectTokens;
        let loanToValueRatioNumerator = plpModeratorParams.loanToValueRatioNumerator;
        let loanToValueRatioDenominator = plpModeratorParams.loanToValueRatioDenominator;
        let isPaused = plpModeratorParams.isPaused;
        let borrowLimitPerCollateral = plpModeratorParams.borrowLimitPerCollateral;
        let borrowLimitPerLendingToken = plpModeratorParams.borrowLimitPerLendingToken;

        let exchangeAggregator = exchangeAggregatorParams.exchangeAggregator;
        let registryAggregator = exchangeAggregatorParams.registryAggregator;
        if (!registryAggregator) {
            registryAggregator = ZERO_ADDRESS;
        }

        let minPA = plpLiquidationParams.minPA;
        let maxLRFNumerator = plpLiquidationParams.maxLRFNumerator;
        let maxLRFDenominator = plpLiquidationParams.maxLRFDenominator;
        let rewardCalcFactorNumerator = plpLiquidationParams.rewardCalcFactorNumerator;
        let rewardCalcFactorDenominator = plpLiquidationParams.rewardCalcFactorDenominator;
        let targetHFNumerator = plpLiquidationParams.targetHFNumerator;
        let targetHFDenominator = plpLiquidationParams.targetHFDenominator;

        if (isTesting) {
            config.BLendingTokenProxies = [];
            fs.writeFileSync = function () { };
        }

        log("Network name: " + network);
        log("DeployMaster: " + deployMasterAddress);
        //====================================================
        log();
        log("***** BONDTROLLER DEPLOYMENT *****");

        if (!bondtrollerLogicAddress) {
            bondtroller = await deployer.deploy(Bondtroller, []);
            bondtrollerLogicAddress = bondtroller.address;
            if (!isTesting) config.BondtrollerLogic = bondtrollerLogicAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }
        log("Bondtroller logic address: " + bondtrollerLogicAddress);
        await verify(bondtrollerLogicAddress, [], "BondtrollerLogic");

        if (!bondtrollerProxyAddress) {
            let bondtrollerProxy = await deployer.deploy(TransparentUpgradeableProxy,
                [
                    bondtrollerLogicAddress,
                    proxyAdminAddress,
                    "0x"
                ]
            );
            bondtrollerProxyAddress = bondtrollerProxy.address;
            if (!isTesting) config.BondtrollerProxy = bondtrollerProxyAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }
        log("\nBondtroller proxy address: " + bondtrollerProxyAddress);
        await verify(bondtrollerProxyAddress, [
            bondtrollerLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "BondtrollerProxy");

        //====================================================

        log();
        log("***** JUMP RATE MODEL DEPLOYMENT *****");
        if (!jumpRateModelLogicAddress) {
            let jumpRateModel = await deployer.deploy(JumpRateModel, []);
            jumpRateModelLogicAddress = jumpRateModel.address;
            if (!isTesting) config.JumpRateModelLogic = jumpRateModelLogicAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }
        log("JumpRateModel masterCopy address: " + jumpRateModelLogicAddress);
        await verify(jumpRateModelLogicAddress, [], "JumpRateModelLogic");

        if (!jumpRateModelProxyAddress) {
            let jumpRateModelProxy = await deployer.deploy(TransparentUpgradeableProxy,
                [
                    jumpRateModelLogicAddress,
                    proxyAdminAddress,
                    "0x"
                ]
            );
            jumpRateModelProxyAddress = jumpRateModelProxy.address;
            if (!isTesting) config.JumpRateModelProxy = jumpRateModelProxyAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }
        log("\nJumpRateModel proxy address: " + jumpRateModelProxyAddress);
        await verify(jumpRateModelProxyAddress, [
            jumpRateModelLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "JumpRateModelProxy");

        //====================================================

        log();
        log("***** BLENDING TOKEN DEPLOYMENT *****");

        if (!blendingTokenLogicAddress) {
            blending = await deployer.deploy(BLendingToken, [],);
            blendingTokenLogicAddress = blending.address;
            if (!isTesting) config.BLendingTokenLogic = blendingTokenLogicAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }
        log("BLendingToken masterCopy address: " + blendingTokenLogicAddress);
        await verify(blendingTokenLogicAddress, [], "BLendingTokenLogic");

        for (var i = 0; i < lendingTokens.length; i++) {
            if (blendingTokenProxyAddresses.length < lendingTokens.length) {
                let blendingProxy = await deployer.deploy(TransparentUpgradeableProxy,
                    [
                        blendingTokenLogicAddress,
                        proxyAdminAddress,
                        "0x"
                    ]
                );
                blendingTokenProxyAddresses.push(blendingProxy.address);
            }
        }
        if (!isTesting) config.BLendingTokenProxies = blendingTokenProxyAddresses;
        fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));

        log("\nBLendingToken proxy address: " + blendingTokenProxyAddresses);
        await verify(blendingTokenProxyAddresses[0], [
            blendingTokenLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "BLendingTokenProxies");

        //====================================================

        log();
        log("***** PRIMARY LENDING PLATFORM DEPLOYMENT *****");

        if (!primaryLendingPlatformV2LogicAddress) {
            plp = await deployer.deploy(PrimaryLendingPlatformV2, []);
            primaryLendingPlatformV2LogicAddress = plp.address;
            if (!isTesting) config.PrimaryLendingPlatformV2Logic = primaryLendingPlatformV2LogicAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }

        log("PrimaryLendingPlatformV2 masterCopy address: " + primaryLendingPlatformV2LogicAddress);
        await verify(primaryLendingPlatformV2LogicAddress, [], "PrimaryLendingPlatformV2Logic");

        if (!primaryLendingPlatformV2ProxyAddress) {
            let plpProxy = await deployer.deploy(TransparentUpgradeableProxy,
                [
                    primaryLendingPlatformV2LogicAddress,
                    proxyAdminAddress,
                    "0x"
                ]
            );
            primaryLendingPlatformV2ProxyAddress = plpProxy.address;
            if (!isTesting) config.PrimaryLendingPlatformV2Proxy = primaryLendingPlatformV2ProxyAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }

        log("\nPrimaryLendingPlatformV2 proxy address: " + primaryLendingPlatformV2ProxyAddress);
        await verify(primaryLendingPlatformV2ProxyAddress, [
            primaryLendingPlatformV2LogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryLendingPlatformV2Proxy");

        //====================================================

        log();
        log("***** PRIMARY LENDING PLATFORM MODERATOR DEPLOYMENT *****");

        if (!primaryLendingPlatformModeratorLogicAddress) {
            plpModerator = await deployer.deploy(PrimaryLendingPlatformModerator, []);
            primaryLendingPlatformModeratorLogicAddress = plpModerator.address;
            if (!isTesting) config.PrimaryLendingPlatformModeratorLogic = primaryLendingPlatformModeratorLogicAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }

        log("PrimaryLendingPlatformModerator masterCopy address: " + primaryLendingPlatformModeratorLogicAddress);
        await verify(primaryLendingPlatformModeratorLogicAddress, [], "PrimaryLendingPlatformModeratorLogic");

        if (!primaryLendingPlatformModeratorProxyAddress) {
            let plpModeratorProxy = await deployer.deploy(TransparentUpgradeableProxy,
                [
                    primaryLendingPlatformModeratorLogicAddress,
                    proxyAdminAddress,
                    "0x"
                ]
            );
            primaryLendingPlatformModeratorProxyAddress = plpModeratorProxy.address;
            if (!isTesting) config.PrimaryLendingPlatformModeratorProxy = primaryLendingPlatformModeratorProxyAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }

        log("\nPrimaryLendingPlatformModerator proxy address: " + primaryLendingPlatformModeratorProxyAddress);
        await verify(primaryLendingPlatformModeratorProxyAddress, [
            primaryLendingPlatformModeratorLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryLendingPlatformModeratorProxy");


        //====================================================

        log();
        log("***** PrimaryLendingPlatformLiquidation DEPLOYMENT *****");

        if (!primaryLendingPlatformLiquidationLogicAddress) {
            plpLiquidation = await deployer.deploy(PrimaryLendingPlatformLiquidation, []);
            primaryLendingPlatformLiquidationLogicAddress = plpLiquidation.address;
            if (!isTesting) config.PrimaryLendingPlatformLiquidationLogic = primaryLendingPlatformLiquidationLogicAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }

        log("PrimaryLendingPlatformLiquidation masterCopy address: " + primaryLendingPlatformLiquidationLogicAddress);
        await verify(primaryLendingPlatformLiquidationLogicAddress, [], "PrimaryLendingPlatformLiquidationLogic");

        if (!primaryLendingPlatformLiquidationProxyAddress) {
            let plpLiquidationProxy = await deployer.deploy(TransparentUpgradeableProxy,
                [
                    primaryLendingPlatformLiquidationLogicAddress,
                    proxyAdminAddress,
                    "0x"
                ]
            );
            primaryLendingPlatformLiquidationProxyAddress = plpLiquidationProxy.address;
            if (!isTesting) config.PrimaryLendingPlatformLiquidationProxy = primaryLendingPlatformLiquidationProxyAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }

        log("\nPrimaryLendingPlatformLiquidation proxy address: " + primaryLendingPlatformLiquidationProxyAddress);
        await verify(primaryLendingPlatformLiquidationProxyAddress, [
            primaryLendingPlatformLiquidationLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryLendingPlatformLiquidationProxy");

        //====================================================

        log();
        log("***** PrimaryLendingPlatformAtomicRepayment DEPLOYMENT *****");

        if (!primaryLendingPlatformAtomicRepaymentLogicAddress) {
            plpAtomicRepayment = await deployer.deploy(PrimaryLendingPlatformAtomicRepayment, []);
            primaryLendingPlatformAtomicRepaymentLogicAddress = plpAtomicRepayment.address;
            if (!isTesting) config.PrimaryLendingPlatformAtomicRepaymentLogic = primaryLendingPlatformAtomicRepaymentLogicAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }

        log("PrimaryLendingPlatformAtomicRepayment masterCopy address: " + primaryLendingPlatformAtomicRepaymentLogicAddress);
        await verify(primaryLendingPlatformAtomicRepaymentLogicAddress, [], "PrimaryLendingPlatformAtomicRepaymentLogic");

        if (!primaryLendingPlatformAtomicRepaymentProxyAddress) {
            let plpAtomicRepaymentProxy = await deployer.deploy(TransparentUpgradeableProxy,
                [
                    primaryLendingPlatformAtomicRepaymentLogicAddress,
                    proxyAdminAddress,
                    "0x"
                ]
            );
            primaryLendingPlatformAtomicRepaymentProxyAddress = plpAtomicRepaymentProxy.address;
            if (!isTesting) config.PrimaryLendingPlatformAtomicRepaymentProxy = primaryLendingPlatformAtomicRepaymentProxyAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }

        log("\nPrimaryLendingPlatformAtomicRepayment proxy address: " + primaryLendingPlatformAtomicRepaymentProxyAddress);
        await verify(primaryLendingPlatformAtomicRepaymentProxyAddress, [
            primaryLendingPlatformAtomicRepaymentLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryLendingPlatformAtomicRepaymentProxy");

        //====================================================

        log();
        log("***** PrimaryLendingPlatformLeverage DEPLOYMENT *****");

        if (!primaryLendingPlatformLeverageLogicAddress) {
            plpLeverage = await deployer.deploy(PrimaryLendingPlatformLeverage, []);
            primaryLendingPlatformLeverageLogicAddress = plpLeverage.address;
            if (!isTesting) config.PrimaryLendingPlatformLeverageLogic = primaryLendingPlatformLeverageLogicAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }

        log("PrimaryLendingPlatformLeverage masterCopy address: " + primaryLendingPlatformLeverageLogicAddress);
        await verify(primaryLendingPlatformLeverageLogicAddress, [], "PrimaryLendingPlatformLeverageLogic");

        if (!primaryLendingPlatformLeverageProxyAddress) {
            let plpLeverageProxy = await deployer.deploy(TransparentUpgradeableProxy,
                [
                    primaryLendingPlatformLeverageLogicAddress,
                    proxyAdminAddress,
                    "0x"
                ]
            );
            primaryLendingPlatformLeverageProxyAddress = plpLeverageProxy.address;
            if (!isTesting) config.PrimaryLendingPlatformLeverageProxy = primaryLendingPlatformLeverageProxyAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }

        log("\nPrimaryLendingPlatformLeverage proxy address: " + primaryLendingPlatformLeverageProxyAddress);
        await verify(primaryLendingPlatformLeverageProxyAddress, [
            primaryLendingPlatformLeverageLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryLendingPlatformLeverageProxy");


        //====================================================
        log();
        log("***** PrimaryLendingPlatformWrappedTokenGateway DEPLOYMENT *****");

        if (!primaryLendingPlatformWrappedTokenGatewayLogicAddress) {
            plpWrappedTokenGateway = await deployer.deploy(PrimaryLendingPlatformWrappedTokenGateway, []);
            primaryLendingPlatformWrappedTokenGatewayLogicAddress = plpWrappedTokenGateway.address;
            if (!isTesting) config.PrimaryLendingPlatformWrappedTokenGatewayLogic = primaryLendingPlatformWrappedTokenGatewayLogicAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }

        log("PrimaryLendingPlatformWrappedTokenGateway masterCopy address: " + primaryLendingPlatformWrappedTokenGatewayLogicAddress);
        await verify(primaryLendingPlatformWrappedTokenGatewayLogicAddress, [], "PrimaryLendingPlatformWrappedTokenGatewayLogic");

        if (!primaryLendingPlatformWrappedTokenGatewayProxyAddress) {
            let plpWrappedTokenGatewayProxy = await deployer.deploy(TransparentUpgradeableProxy,
                [
                    primaryLendingPlatformWrappedTokenGatewayLogicAddress,
                    proxyAdminAddress,
                    "0x"
                ]
            );
            primaryLendingPlatformWrappedTokenGatewayProxyAddress = plpWrappedTokenGatewayProxy.address;
            if (!isTesting) config.PrimaryLendingPlatformWrappedTokenGatewayProxy = primaryLendingPlatformWrappedTokenGatewayProxyAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }

        log("\nPrimaryLendingPlatformWrappedTokenGateway proxy address: " + PrimaryLendingPlatformWrappedTokenGatewayProxy);
        await verify(PrimaryLendingPlatformWrappedTokenGatewayProxy, [
            primaryLendingPlatformWrappedTokenGatewayLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryLendingPlatformWrappedTokenGatewayProxy");


        //====================================================
        //setting params

        //instances of contracts
        let proxyAdminInterface = new ethers.utils.Interface(ProxyAdmin.abi);
        let erc20Interface = new ethers.utils.Interface(ERC20Proxy.abi);
        let bondtrollerInterface = new ethers.utils.Interface(Bondtroller.abi);
        let jumpRateModelInterface = new ethers.utils.Interface(JumpRateModel.abi);
        let blendingInterface = new ethers.utils.Interface(BLendingToken.abi);
        let plpInterface = new ethers.utils.Interface(PrimaryLendingPlatformV2.abi);
        let plpLiquidationInterface = new ethers.utils.Interface(PrimaryLendingPlatformLiquidation.abi);
        let plpAtomicRepaymentInterface = new ethers.utils.Interface(PrimaryLendingPlatformAtomicRepayment.abi);
        let plpLeverageInterface = new ethers.utils.Interface(PrimaryLendingPlatformLeverage.abi);
        let plpModeratorInterface = new ethers.utils.Interface(PrimaryLendingPlatformModerator.abi);
        let plpWrappedTokenGatewayInterface = new ethers.utils.Interface(PrimaryLendingPlatformWrappedTokenGateway.abi);
        let priceProviderAggregatorInterface = new ethers.utils.Interface(PriceProviderAggregator.abi);

        proxyAdmin = new ethers.Contract(proxyAdminAddress, proxyAdminInterface, wallet);
        bondtroller = new ethers.Contract(bondtrollerProxyAddress, bondtrollerInterface, wallet);
        jumpRateModel = new ethers.Contract(jumpRateModelProxyAddress, jumpRateModelInterface, wallet);
        plp = new ethers.Contract(primaryLendingPlatformV2ProxyAddress, plpInterface, wallet);
        plpLiquidation = new ethers.Contract(primaryLendingPlatformLiquidationProxyAddress, plpLiquidationInterface, wallet);
        plpAtomicRepayment = new ethers.Contract(primaryLendingPlatformAtomicRepaymentProxyAddress, plpAtomicRepaymentInterface, wallet);
        plpLeverage = new ethers.Contract(primaryLendingPlatformLeverageProxyAddress, plpLeverageInterface, wallet);
        plpModerator = new ethers.Contract(primaryLendingPlatformModeratorProxyAddress, plpModeratorInterface, wallet);
        plpWrappedTokenGateway = new ethers.Contract(primaryLendingPlatformWrappedTokenGatewayProxyAddress, plpWrappedTokenGatewayInterface, wallet);
        priceProviderAggregator = new ethers.Contract(priceProviderAggregatorAddress, priceProviderAggregatorInterface, wallet);

        bondtrollerImplementation = new ethers.Contract(bondtrollerLogicAddress, bondtrollerInterface, wallet);
        jumpRateModelImplementation = new ethers.Contract(jumpRateModelLogicAddress, jumpRateModelInterface, wallet);
        blendingImplementation = new ethers.Contract(blendingTokenLogicAddress, blendingInterface, wallet);
        plpImplementation = new ethers.Contract(primaryLendingPlatformV2LogicAddress, plpInterface, wallet);
        plpLiquidationImplementation = new ethers.Contract(primaryLendingPlatformLiquidationLogicAddress, plpLiquidationInterface, wallet);
        plpAtomicRepaymentImplementation = new ethers.Contract(primaryLendingPlatformAtomicRepaymentLogicAddress, plpAtomicRepaymentInterface, wallet);
        plpLeverageImplementation = new ethers.Contract(primaryLendingPlatformLeverageLogicAddress, plpLeverageInterface, wallet);
        plpModeratorImplementation = new ethers.Contract(primaryLendingPlatformModeratorLogicAddress, plpModeratorInterface, wallet);
        plpWrappedTokenGatewayImplementation = new ethers.Contract(primaryLendingPlatformWrappedTokenGatewayLogicAddress, plpWrappedTokenGatewayInterface, wallet);


        //====================================================
        // ====================== upgrade bondtroller ======================
        if (bondtrollerProxyAddress) {
            log();
            log("***** UPGRADING BONDTROLLER *****");
            await upgrade(proxyAdmin, bondtrollerImplementation, bondtroller);
        }

        // ====================== upgrade jumpRateModel ======================
        if (jumpRateModelProxyAddress) {
            log();
            log("***** UPGRADING JUMP-RATE MODEL *****");
            await upgrade(proxyAdmin, jumpRateModelImplementation, jumpRateModel);
        }

        // ====================== upgrade blending token ======================
        if (blendingTokenProxyAddresses.length > 0) {
            log();
            log("***** UPGRADING BLENDING TOKEN *****");
            for (var i = 0; i < blendingTokenProxyAddresses.length; i++) {
                log();
                log("Blending token " + blendingTokenProxyAddresses[i]);
                let blending = new ethers.Contract(blendingTokenProxyAddresses[i], blendingInterface, wallet);
                await upgrade(proxyAdmin, blendingImplementation, blending);
            }
        }

        // ====================== upgrade primary lending platform ======================
        if (primaryLendingPlatformV2ProxyAddress) {
            log();
            log("***** UPGRADING PRIMARY LENDING PLATFORM *****");
            await upgrade(proxyAdmin, plpImplementation, plp);
        }

        // ====================== upgrade primary lending platform moderator ======================
        if (primaryLendingPlatformModeratorProxyAddress) {
            log();
            log("***** UPGRADING PRIMARY LENDING PLATFORM MODERATOR *****");
            await upgrade(proxyAdmin, plpModeratorImplementation, plpModerator);
        }

        // ====================== upgrade primary lending platform liquidation ======================
        if (primaryLendingPlatformLiquidationProxyAddress) {
            log();
            log("***** UPGRADING PRIMARY LENDING PLATFORM LIQUIDATION *****");
            await upgrade(proxyAdmin, plpLiquidationImplementation, plpLiquidation);
        }

        // ====================== upgrade primary lending platform atomic repayment ======================
        if (primaryLendingPlatformAtomicRepaymentProxyAddress) {
            log();
            log("***** UPGRADING PRIMARY LENDING PLATFORM ATOMIC REPAYMENT *****");
            await upgrade(proxyAdmin, plpAtomicRepaymentImplementation, plpAtomicRepayment);
        }

        // ====================== upgrade primary lending platform leverage ======================
        if (primaryLendingPlatformLeverageProxyAddress) {
            log();
            log("***** UPGRADING PRIMARY LENDING PLATFORM LEVERAGE *****");
            await upgrade(proxyAdmin, plpLeverageImplementation, plpLeverage);
        }

        // ====================== upgrade primary lending platform wrapped token gateway ======================
        if (primaryLendingPlatformWrappedTokenGatewayProxyAddress) {
            log();
            log("***** UPGRADING PRIMARY LENDING PLATFORM WRAPPED TOKEN GATEWAY *****");
            await upgrade(proxyAdmin, plpWrappedTokenGatewayImplementation, plpWrappedTokenGateway);
        }
        
        log();
        log("***** 1. Setting Bondtroller *****");

        {
            let adminBondtroller = await bondtrollerImplementation.admin();
            if (adminBondtroller == ZERO_ADDRESS) {
                await bondtrollerImplementation.init().then(function (instance) {
                    log("Transaction hash: " + instance.hash);
                    log("Bondtroller Implementation call init at " + bondtrollerImplementation.address);
                });
            }
        }

        {
            let adminBondtroller = await bondtroller.admin();
            if (adminBondtroller == ZERO_ADDRESS) {
                await bondtroller.init().then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("Bondtroller call init at " + bondtroller.address);
                });
            }
        }

        {
            let primaryLendingPlatformAddress = await bondtroller.getPrimaryLendingPlatformAddress();
            if (primaryLendingPlatformAddress.toLowerCase() != primaryLendingPlatformV2ProxyAddress.toLowerCase()) {
                await bondtroller.setPrimaryLendingPlatformAddress(primaryLendingPlatformV2ProxyAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("Bondtroller set PLP " + primaryLendingPlatformV2ProxyAddress);
                });
            }
        }

        {
            let allMarkets = await bondtroller.getAllMarkets();
            for (var i = 0; i < blendingTokenProxyAddresses.length; i++) {
                if (allMarkets.indexOf(blendingTokenProxyAddresses[i]) == -1) {
                    await bondtroller.supportMarket(blendingTokenProxyAddresses[i]).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("Bondtroller support market " + blendingTokenProxyAddresses[i]);
                    });
                }
            }
        }

        log();
        log("***** 2. Setting JumRateModel *****");

        {
            let MODERATOR_ROLE = await jumpRateModelImplementation.MODERATOR_ROLE();
            let isMODERATOR = await jumpRateModelImplementation.hasRole(MODERATOR_ROLE, deployMasterAddress);
            if (!isMODERATOR) {
                await jumpRateModelImplementation.initialize(blocksPerYear).then(function (instance) {
                    log("Transaction hash: " + instance.hash);
                    log("JumpRateModel Implementation call initialize at " + jumpRateModelImplementation.address);
                });
            }
        }

        {
            let MODERATOR_ROLE = await jumpRateModel.MODERATOR_ROLE();
            let isMODERATOR = await jumpRateModel.hasRole(MODERATOR_ROLE, deployMasterAddress);
            if (!isMODERATOR) {
                await jumpRateModel.initialize(blocksPerYear).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("JumpRateModel call initialize at " + jumpRateModelProxyAddress);
                });
            }
        }

        for (var i = 0; i < BLendingTokenProxies.length; i++) {
            let blendingTokenInfo = await jumpRateModel.blendingTokenInfo(BLendingTokenProxies[i]);
            let rateInfo = await jumpRateModel.rateInfo(BLendingTokenProxies[i]);
            let blocksPerYear = await jumpRateModel.blocksPerYear();

            let blocksPerYearValue = ethers.BigNumber.from(blocksPerYear.toString());
            let gainPerYearValue = ethers.BigNumber.from(gainPerYear[i].toString());
            let jumGainPerYearValue = ethers.BigNumber.from(jumGainPerYear[i].toString());

            let gainPerBlock = gainPerYearValue.div(blocksPerYearValue);
            let jumGainPerBlock = jumGainPerYearValue.div(blocksPerYearValue);

            if (blendingTokenInfo.targetUtil != targetUtil[i] || rateInfo.maxBorrowRate != newMaxBorrow[i] || gainPerBlock.toString() != blendingTokenInfo.gainPerBlock || jumGainPerBlock.toString() != blendingTokenInfo.jumGainPerBlock) {
                await jumpRateModel.addBLendingTokenSupport(BLendingTokenProxies[i], gainPerYear[i], jumGainPerYear[i], targetUtil[i], newMaxBorrow[i]).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("JumpRateModel " + jumpRateModelProxyAddress + " add BLendingToken Suport " + BLendingTokenProxies[i] + " with params: " + gainPerYear[i] + ", " + jumGainPerYear[i] + ", " + targetUtil[i]);
                });
            }
        }

        log();
        log("***** 3. Setting BLending token *****");

        {
            let adminBlendingToken = await blendingImplementation.admin();
            if (adminBlendingToken == ZERO_ADDRESS) {
                let admin = wallet.address;
                await blendingImplementation.init(
                    lendingTokens[0],
                    bondtrollerProxyAddress,
                    jumpRateModelProxyAddress,
                    initialExchangeRateMantissa[0],
                    name[0],
                    symbol[0],
                    decimals[0],
                    admin
                ).then(function (instance) {
                    log("Transaction hash: " + instance.hash);
                    log("Blending token Implementation call initialize at " + blendingImplementation.address);
                });
            }
        }

        for (var i = 0; i < lendingTokens.length; i++) {
            blending = new ethers.Contract(blendingTokenProxyAddresses[i], blendingInterface, wallet);
            let adminBlendingToken = await blending.admin();
            if (adminBlendingToken == ZERO_ADDRESS) {
                let admin = wallet.address;
                await blending.init(
                    lendingTokens[i],
                    bondtrollerProxyAddress,
                    jumpRateModelProxyAddress,
                    initialExchangeRateMantissa[i],
                    name[i],
                    symbol[i],
                    decimals[i],
                    admin
                ).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("Blending token call initialize at " + blending.address);
                });
            }

            {
                let reserveFactor = await blending.reserveFactorMantissa();
                if (reserveFactor != reserveFactorMantissa[i] && reserveFactorMantissa[i] != "") {
                    await blending._setReserveFactor(reserveFactorMantissa[i]).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("blending set reserve factor " + reserveFactorMantissa[i]);
                    });
                }
            }

            {
                let plpAddress = await blending.primaryLendingPlatform();
                if (plpAddress.toLowerCase() != primaryLendingPlatformV2ProxyAddress.toLowerCase()) {
                    await blending.setPrimaryLendingPlatform(primaryLendingPlatformV2ProxyAddress,).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("blending " + blending.address + " set primaryLendingPlatform " + primaryLendingPlatformV2ProxyAddress);
                    });
                }
            }
        }
        log();
        log("***** 4. Setting PLP token *****");

        {
            let defaultAdminRolePlp = await plpImplementation.DEFAULT_ADMIN_ROLE();
            let isDefaultAdminPlp = await plpImplementation.hasRole(defaultAdminRolePlp, deployMasterAddress);
            if (!isDefaultAdminPlp) {
                await plpImplementation.initialize()
                    .then(function (instance) {
                        log("Transaction hash: " + instance.hash);
                        log("PrimaryLendingPlatformV2 Implementation call initialize at " + plpImplementation.address);
                    });
            }
        }

        {
            let defaultAdminRolePlp = await plp.DEFAULT_ADMIN_ROLE();
            let isDefaultAdminPlp = await plp.hasRole(defaultAdminRolePlp, deployMasterAddress);
            if (!isDefaultAdminPlp) {
                await plp.initialize()
                    .then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("PrimaryLendingPlatformV2 call initialize at " + plp.address);
                    });
            }
        }

        {
            let plpModerator = await plp.primaryLendingPlatformModerator();
            if (plpModerator.toLowerCase() != primaryLendingPlatformModeratorProxyAddress.toLowerCase()) {
                await plp.setPrimaryLendingPlatformModerator(primaryLendingPlatformModeratorProxyAddress)
                    .then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("PrimaryLendingPlatformV2 set moderator contract " + primaryLendingPlatformModeratorProxyAddress);
                    });
            }
        }

        {
            let currentPlpAddress = await priceProviderAggregator.primaryLendingPlatform();
            if (currentPlpAddress.toLowerCase() != primaryLendingPlatformV2ProxyAddress.toLowerCase()) {
                await priceProviderAggregator.setPrimaryLendingPlatform(primaryLendingPlatformV2ProxyAddress).then(function (instance) {
                    log("PriceProviderAggregator " + priceProviderAggregator.address + " primaryLendingPlatformV2 " + primaryLendingPlatformV2ProxyAddress + " at tx hash: " + instance.hash);
                });
            }
        }

        log();
        log("***** 5. Setting PLP Moderator token *****");

        {
            let primaryLendingPlatform = await plpModeratorImplementation.primaryLendingPlatform();
            if (primaryLendingPlatform == ZERO_ADDRESS) {
                await plpModeratorImplementation.initialize(primaryLendingPlatformV2ProxyAddress,)
                    .then(function (instance) {
                        log("Transaction hash: " + instance.hash);
                        log("PrimaryLendingModerator Implementation call initialize at " + plpModeratorImplementation.address);
                    });
            }
        }

        {
            let primaryLendingPlatform = await plpModerator.primaryLendingPlatform();
            if (primaryLendingPlatform == ZERO_ADDRESS) {
                await plpModerator.initialize(primaryLendingPlatformV2ProxyAddress,)
                    .then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("PrimaryLendingModerator call initialize at " + plpModerator.address);
                    });
            }
        }

        {
            let currentPlpAddress = await plpModerator.primaryLendingPlatform();
            if (currentPlpAddress.toLowerCase() != primaryLendingPlatformV2ProxyAddress.toLowerCase()) {
                await plpModerator.setPrimaryLendingPlatform(primaryLendingPlatformV2ProxyAddress).then(function (instance) {
                    log("PrimaryLendingModerator set primaryLendingPlatformV2 " + primaryLendingPlatformV2ProxyAddress + " at tx hash: " + instance.hash);
                });
            }
        }

        {
            let priceOracle = await plp.priceOracle();
            if (priceOracle.toLowerCase() != PriceProviderAggregatorProxy.toLowerCase()) {
                await plpModerator.setPriceOracle(PriceProviderAggregatorProxy).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PrimaryLendingModerator set priceOracle " + PriceProviderAggregatorProxy);
                });
            }
        }

        for (var i = 0; i < projectTokens.length; i++) {
            let projectTokenInfo = await plp.projectTokenInfo(projectTokens[i]);
            if (projectTokenInfo.isListed == false
                || projectTokenInfo.loanToValueRatio.numerator != loanToValueRatioNumerator[i]
                || projectTokenInfo.loanToValueRatio.denominator != loanToValueRatioDenominator[i]
            ) {
                await plpModerator.addProjectToken(
                    projectTokens[i],
                    loanToValueRatioNumerator[i],
                    loanToValueRatioDenominator[i]
                ).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("Added prj token " + projectTokens[i]);
                    log("LoanToValueRatio: ");
                    log("   Numerator:   " + loanToValueRatioNumerator[i]);
                    log("   Denominator: " + loanToValueRatioDenominator[i]);
                });
            }
        }

        {
            const projectTokensLength = await plp.projectTokensLength();
            let projectTokensListSnapshot = [];
            for (var i = 0; i < projectTokensLength; i++) {
                projectTokensListSnapshot.push(await plp.projectTokens(i));
            }

            for (var i = 0; i < projectTokensListSnapshot.length; i++) {
                for (var j = 0; j < projectTokens.length; j++) {
                    if (projectTokensListSnapshot[i].toLowerCase() == projectTokens[j].toLowerCase()) {
                        break;
                    }
                    if (j == projectTokens.length - 1) {
                        const tokensLength = await plp.projectTokensLength();
                        for (var index = 0; index < tokensLength; index++) {
                            const token = await plp.projectTokens(index);
                            if (token.toLowerCase() == projectTokensListSnapshot[i].toLowerCase()) {
                                try {
                                    const tx = await plpModerator.removeProjectToken(index);
                                    log("\nTransaction hash: " + tx.hash);
                                    log("Removed prj token " + projectTokensListSnapshot[i]);
                                    await tx.wait(2);
                                } catch (error) {
                                    if (error.reason == "execution reverted: PITModerator: ProjectToken amount exist on PIT") {
                                        log("\x1b[31m%s\x1b[0m", "\n[ERROR] Project token " + projectTokensListSnapshot[i] + " has been deposited");
                                        log("\x1b[31m%s\x1b[0m", "Please withdraw all this token amount and try again");
                                    } else {
                                        log("\x1b[31m%s\x1b[0m", "\n[ERROR] " + error.reason);
                                    }
                                } finally {
                                    break;
                                }
                            }
                        }
                    }
                }
            }

        }

        for (var i = 0; i < lendingTokens.length; i++) {
            let lendingTokenInfo = await plp.lendingTokenInfo(lendingTokens[i]);
            if (lendingTokenInfo.isListed == false
                || lendingTokenInfo.isPaused != isPaused
                || lendingTokenInfo.bLendingToken.toLowerCase() != blendingTokenProxyAddresses[i].toLowerCase()
                || lendingTokenInfo.loanToValueRatio.numerator != loanToValueRatioNumeratorLendingToken[i]
                || lendingTokenInfo.loanToValueRatio.denominator != loanToValueRatioDenominatorLendingToken[i]
            )
                await plpModerator.addLendingToken(
                    lendingTokens[i],
                    blendingTokenProxyAddresses[i],
                    isPaused,
                    loanToValueRatioNumeratorLendingToken[i],
                    loanToValueRatioDenominatorLendingToken[i]
                ).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("Added lending token " + lendingTokens[i]);
                    log("LoanToValueRatio: ");
                    log("   Numerator:   " + loanToValueRatioNumeratorLendingToken[i]);
                    log("   Denominator: " + loanToValueRatioDenominatorLendingToken[i]);
                });
        }

        {
            const lendingTokensLength = await plp.lendingTokensLength();
            let lendingTokensListSnapshot = [];
            for (var i = 0; i < lendingTokensLength; i++) {
                lendingTokensListSnapshot.push(await plp.lendingTokens(i));
            }

            for (var i = 0; i < lendingTokensListSnapshot.length; i++) {
                for (var j = 0; j < lendingTokens.length; j++) {
                    if (lendingTokensListSnapshot[i].toLowerCase() == lendingTokens[j].toLowerCase()) {
                        break;
                    }
                    if (j == lendingTokens.length - 1) {
                        const tokensLength = await plp.lendingTokensLength();
                        for (var index = 0; index < tokensLength; index++) {
                            const token = await plp.lendingTokens(index);
                            if (token.toLowerCase() == lendingTokensListSnapshot[i].toLowerCase()) {
                                try {
                                    const tx = await plpModerator.removeLendingToken(index);
                                    log("\nTransaction hash: " + tx.hash);
                                    log("Removed lending token " + lendingTokensListSnapshot[i]);
                                    await tx.wait(2);
                                } catch (error) {
                                    if (error.reason == "execution reverted: PITModerator: Exist borrow of lendingToken") {
                                        const projectTokensLength = await plp.projectTokensLength();
                                        let projectTokensListSnapshot = [];
                                        for (var k = 0; k < projectTokensLength; k++) {
                                            projectTokensListSnapshot.push(await plp.projectTokens(k));
                                        }
                                        for (var l = 0; l < projectTokensListSnapshot.length; l++) {
                                            const borrowBalance = await plp.totalBorrow(projectTokensListSnapshot[l], token);
                                            if (borrowBalance.toString() != "0") {
                                                log("\x1b[31m%s\x1b[0m", "\n[ERROR] Lending token " + projectTokensListSnapshot[i] + " has been borrowed by project token " + projectTokensListSnapshot[l]);
                                                log("\x1b[31m%s\x1b[0m", "Please repay all this token amount and try again");
                                            }
                                        }
                                    } else {
                                        log("\x1b[31m%s\x1b[0m", "\n[ERROR] " + error.reason);
                                    }
                                } finally {
                                    break;
                                }
                            }
                        }
                    }
                }
            }

        }

        for (var i = 0; i < projectTokens.length; i++) {
            let borrowLimitPerCollateralValue = await plp.borrowLimitPerCollateral(projectTokens[i]);
            if (borrowLimitPerCollateralValue.toString() != borrowLimitPerCollateral[i]) {
                await plpModerator.setBorrowLimitPerCollateralAsset(
                    projectTokens[i],
                    borrowLimitPerCollateral[i]
                ).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PrimaryLendingPlatformV2 set " + projectTokens[i] + " borrow limit " + borrowLimitPerCollateral[i]);
                });
            }
        }

        for (var i = 0; i < lendingTokens.length; i++) {
            let borrowLimitPerLendingTokenValue = await plp.borrowLimitPerLendingToken(lendingTokens[i]);
            if (borrowLimitPerLendingTokenValue.toString() != borrowLimitPerLendingToken[i]) {
                await plpModerator.setBorrowLimitPerLendingAsset(
                    lendingTokens[i],
                    borrowLimitPerLendingToken[i]
                ).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PrimaryLendingPlatformV2 set " + lendingTokens[i] + " borrow limit " + borrowLimitPerLendingToken[i]);
                });
            }
        }

        {
            let primaryLendingPlatformLeverage = await plp.primaryLendingPlatformLeverage();
            if (primaryLendingPlatformLeverage.toLowerCase() != primaryLendingPlatformLeverageProxyAddress.toLowerCase()) {
                await plpModerator.setPrimaryLendingPlatformLeverage(primaryLendingPlatformLeverageProxyAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PrimaryLendingPlatformV2 set Leverage contract " + primaryLendingPlatformLeverageProxyAddress);
                });
            }
        }

        {
            let isRelatedContract = await plp.isRelatedContract(primaryLendingPlatformAtomicRepaymentProxyAddress);
            if (isRelatedContract == false) {
                await plpModerator.addRelatedContracts(primaryLendingPlatformAtomicRepaymentProxyAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PrimaryLendingPlatformV2 set role for atomic repayment contract " + primaryLendingPlatformAtomicRepaymentProxyAddress);
                });
            }
        }

        {
            let isRelatedContract = await plp.isRelatedContract(primaryLendingPlatformLiquidationProxyAddress);
            if (isRelatedContract == false) {
                await plpModerator.addRelatedContracts(primaryLendingPlatformLiquidationProxyAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PrimaryLendingPlatformV2 set role for liquidation contract " + primaryLendingPlatformLiquidationProxyAddress);
                });
            }
        }

        {
            let isRelatedContract = await plp.isRelatedContract(primaryLendingPlatformLeverageProxyAddress);
            if (isRelatedContract == false) {
                await plpModerator.addRelatedContracts(primaryLendingPlatformLeverageProxyAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PrimaryLendingPlatformV2 set role for Leverage contract " + primaryLendingPlatformLeverageProxyAddress);
                });
            }
        }

        {
            let isRelatedContract = await plp.isRelatedContract(primaryLendingPlatformWrappedTokenGatewayProxyAddress);
            if (isRelatedContract == false) {
                await plpModerator.addRelatedContracts(primaryLendingPlatformWrappedTokenGatewayProxyAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PrimaryLendingPlatformV2 set role for Wrapped Token Gateway contract " + primaryLendingPlatformWrappedTokenGatewayProxyAddress);
                });
            }
        }

        log();
        log("***** 6. Initially supply BLending token *****");
        if (initialSupplyAmount.length != 0) {
            for (var i = 0; i < lendingTokens.length; i++) {
                let blending = new ethers.Contract(blendingTokenProxyAddresses[i], blendingInterface, wallet);

                let totalSupply = await blending.totalSupply();
                let totalSupplyValue = ethers.BigNumber.from(totalSupply.toString());

                let initialSupplyValue = initialSupplyAmount[i] == "" ? ethers.BigNumber.from(0) : ethers.BigNumber.from(initialSupplyAmount[i].toString());
                if (initialSupplyValue.gt(ethers.BigNumber.from(0))) {
                    let lendingToken = new ethers.Contract(lendingTokens[i], erc20Interface, wallet);

                    if (totalSupplyValue.eq(ethers.BigNumber.from(0))) {
                        let lendingTokenBalance = await lendingToken.balanceOf(deployMasterAddress);
                        let lendingTokenBalanceValue = ethers.BigNumber.from(lendingTokenBalance.toString());
                        if (lendingTokenBalanceValue.lt(initialSupplyValue)) {
                            log("Please ensure there is sufficient token balance for " + lendingTokens[i] + " in " + deployMasterAddress + " before continue");
                            return;
                        } else {
                            let allowance = await lendingToken.allowance(deployMasterAddress, blending.address);
                            let allowanceValue = ethers.BigNumber.from(allowance.toString());
                            if (allowanceValue.lt(initialSupplyValue)) {
                                const tx = await lendingToken.approve(blending.address, initialSupplyValue);
                                log("\nTransaction hash: " + tx.hash);
                                log("Approve " + initialSupplyValue + " " + lendingTokens[i] + " to " + blending.address);
                                await tx.wait(10);
                            }

                            await plp.supply(lendingTokens[i], initialSupplyValue).then(function (instance) {
                                log("\nTransaction hash: " + instance.hash);
                                log("Supply " + initialSupplyValue + " " + lendingTokens[i] + " to " + blending.address);
                            });
                        }
                    }

                    let blendingTokenBalanceOfAddress0x0 = await blending.balanceOf(ZERO_ADDRESS);
                    let blendingTokenBalanceOfAddress0x0Value = ethers.BigNumber.from(blendingTokenBalanceOfAddress0x0.toString());
                    if (blendingTokenBalanceOfAddress0x0Value.eq(ethers.BigNumber.from(0))) {
                        let exchangeRate = await blending.exchangeRateStored();
                        let exchangeRateValue = ethers.BigNumber.from(exchangeRate.toString());

                        let blendingTokenDecimals = await blending.decimals();
                        let blendingTokenDecimalsValue = ethers.BigNumber.from(blendingTokenDecimals.toString());

                        let lendingTokenDecimals = await lendingToken.decimals();
                        let lendingTokenDecimalsValue = ethers.BigNumber.from(lendingTokenDecimals.toString());

                        let blendingTokenBurnValue = initialSupplyValue
                            .mul(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(18)))
                            .div(exchangeRateValue)
                            .mul(ethers.BigNumber.from(10).pow(blendingTokenDecimalsValue))
                            .div(ethers.BigNumber.from(10).pow(lendingTokenDecimalsValue));
                        await blending.transfer(ZERO_ADDRESS, blendingTokenBurnValue).then(function (instance) {
                            log("\nTransaction hash: " + instance.hash);
                            log("Burn " + blendingTokenBurnValue + " " + blendingTokenProxyAddresses[i] + " to " + ZERO_ADDRESS);
                        });
                    }
                }
            }
        }

        log();
        log("***** 7. Setting PLP Liquidation *****");
        {
            const currentImplementation = await proxyAdmin.getProxyImplementation(primaryLendingPlatformLiquidationProxyAddress);
            if (currentImplementation.toLowerCase() == primaryLendingPlatformLiquidationLogicAddress.toLowerCase()) {
                {
                    {
                        let moderatorRoleLiquidation = await plpLiquidationImplementation.MODERATOR_ROLE();
                        let isModeratorLiquidation = await plpLiquidationImplementation.hasRole(moderatorRoleLiquidation, deployMasterAddress);
                        if (!isModeratorLiquidation) {
                            await plpLiquidationImplementation.initialize(primaryLendingPlatformV2ProxyAddress)
                                .then(function (instance) {
                                    log("Transaction hash: " + instance.hash);
                                    log("PrimaryLendingPlatformLiquidation Implementation call initialize at " + plpLiquidationImplementation.address);
                                });
                        }
                    }

                    {
                        let moderatorRoleLiquidation = await plpLiquidation.MODERATOR_ROLE();
                        let isModeratorLiquidation = await plpLiquidation.hasRole(moderatorRoleLiquidation, deployMasterAddress);
                        if (!isModeratorLiquidation) {
                            await plpLiquidation.initialize(primaryLendingPlatformV2ProxyAddress)
                                .then(function (instance) {
                                    log("\nTransaction hash: " + instance.hash);
                                    log("PrimaryLendingPlatformLiquidation call initialize at " + plpLiquidation.address);
                                });
                        }
                    }

                    {
                        let currentPlpAddress = await plpLiquidation.primaryLendingPlatform();
                        if (currentPlpAddress.toLowerCase() != primaryLendingPlatformV2ProxyAddress.toLowerCase()) {
                            await plpLiquidation.setPrimaryLendingPlatformAddress(primaryLendingPlatformV2ProxyAddress).then(function (instance) {
                                log("PrimaryLendingPlatformLiquidation set primaryLendingPlatformV2 " + primaryLendingPlatformV2ProxyAddress + " at tx hash: " + instance.hash);
                            });
                        }
                    }

                    {
                        let minPartialLiquidationAmount = await plpLiquidation.minPartialLiquidationAmount();
                        if (minPartialLiquidationAmount != minPA) {
                            await plpLiquidation.setMinPartialLiquidationAmount(minPA).then(function (instance) {
                                log("\nTransaction hash: " + instance.hash);
                                log("PrimaryLendingPlatformLiquidation set minPA " + minPA);
                            });
                        }
                    }

                    {
                        let maxLRF = await plpLiquidation.maxLRF();
                        if (maxLRF.numerator != maxLRFNumerator || maxLRF.denominator != maxLRFDenominator) {
                            await plpLiquidation.setMaxLRF(maxLRFNumerator, maxLRFDenominator).then(function (instance) {
                                log("\nTransaction hash: " + instance.hash);
                                log("PrimaryLendingPlatformLiquidation set maxLRF " + maxLRFNumerator + "/" + maxLRFDenominator);
                            });
                        }
                    }

                    {
                        let liquidatorRewardCalcFactor = await plpLiquidation.liquidatorRewardCalcFactor();
                        if (liquidatorRewardCalcFactor.numerator != rewardCalcFactorNumerator || liquidatorRewardCalcFactor.denominator != rewardCalcFactorDenominator) {
                            await plpLiquidation.setLiquidatorRewardCalculationFactor(rewardCalcFactorNumerator, rewardCalcFactorDenominator).then(function (instance) {
                                log("\nTransaction hash: " + instance.hash);
                                log("PrimaryLendingPlatformLiquidation set rewardCalcFactor " + rewardCalcFactorNumerator + "/" + rewardCalcFactorDenominator);
                            });
                        }
                    }

                    {
                        let targetHealthFactor = await plpLiquidation.targetHealthFactor();
                        if (targetHealthFactor.numerator != targetHFNumerator || targetHealthFactor.denominator != targetHFDenominator) {
                            await plpLiquidation.setTargetHealthFactor(targetHFNumerator, targetHFDenominator).then(function (instance) {
                                log("\nTransaction hash: " + instance.hash);
                                log("PrimaryLendingPlatformLiquidation set targetHF " + targetHFNumerator + "/" + targetHFDenominator);
                            });
                        }
                    }

                    {
                        const currentExchangeAggregator = await plpLiquidation.exchangeAggregator();
                        const currentRegistryAggregator = await plpLiquidation.registryAggregator();
                    if (exchangeAggregator.toLowerCase() != currentExchangeAggregator.toLowerCase() || registryAggregator.toLowerCase() != currentRegistryAggregator.toLowerCase()) {
                        await plpLiquidation.setExchangeAggregator(exchangeAggregator, registryAggregator)
                            .then(function (instance) {
                                log("\nTransaction hash: " + instance.hash);
                                log("PrimaryLendingPlatformLiquidation set ExchangeAggregator:");
                                log("ExchangeAggregator: " + exchangeAggregator);
                                log("RegistryAggregator: " + registryAggregator);
                            });
                    }
                }
            }
        }
        }

        log();
        log("***** 8. Setting PLP atomic repayment *****");

        {
            let moderatorRoleAtomic = await plpAtomicRepaymentImplementation.MODERATOR_ROLE();
            let isModeratorAtomic = await plpAtomicRepaymentImplementation.hasRole(moderatorRoleAtomic, deployMasterAddress);
            if (!isModeratorAtomic) {
                await plpAtomicRepaymentImplementation.initialize(primaryLendingPlatformV2ProxyAddress)
                    .then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("PrimaryLendingPlatformAtomicRepayment Implementation call initialize at " + plpAtomicRepaymentImplementation.address);
                    });
            }
        }

        {
            let moderatorRoleAtomic = await plpAtomicRepayment.MODERATOR_ROLE();
            let isModeratorAtomic = await plpAtomicRepayment.hasRole(moderatorRoleAtomic, deployMasterAddress);
            if (!isModeratorAtomic) {
                await plpAtomicRepayment.initialize(primaryLendingPlatformV2ProxyAddress)
                    .then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("PrimaryLendingPlatformAtomicRepayment call initialize at " + plpAtomicRepayment.address);
                    });
            }
        }

        {
            let currentPlpAddress = await plpAtomicRepayment.primaryLendingPlatform();
            if (currentPlpAddress.toLowerCase() != primaryLendingPlatformV2ProxyAddress.toLowerCase()) {
                await plpAtomicRepayment.setPrimaryLendingPlatform(primaryLendingPlatformV2ProxyAddress).then(function (instance) {
                    log("PrimaryLendingPlatformAtomicRepayment set primaryLendingPlatformV2 " + primaryLendingPlatformV2ProxyAddress + " at tx hash: " + instance.hash);
                });
            }
        }

        {
        let currentExchangeAggregator = await plpAtomicRepayment.exchangeAggregator();
        let currentRegistryAggregator = await plpAtomicRepayment.registryAggregator();
        if (exchangeAggregator.toLowerCase() != currentExchangeAggregator.toLowerCase() || registryAggregator.toLowerCase() != currentRegistryAggregator.toLowerCase()) {
            await plpAtomicRepayment.setExchangeAggregator(exchangeAggregator, registryAggregator)
                .then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PrimaryLendingPlatformAtomicRepayment set ExchangeAggregator:");
                    log("ExchangeAggregator: " + exchangeAggregator);
                    log("RegistryAggregator: " + registryAggregator);
                });
        }
        }


        log();
        log("***** 9. Setting PLP leverage *****");

        {
            let moderatorRoleLeverage = await plpLeverageImplementation.MODERATOR_ROLE();
            let isModeratorLeverage = await plpLeverageImplementation.hasRole(moderatorRoleLeverage, deployMasterAddress);
            if (!isModeratorLeverage) {
                await plpLeverageImplementation.initialize(primaryLendingPlatformV2ProxyAddress)
                    .then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("PrimaryLendingPlatformLeverage Implementation call initialize at " + plpLeverageImplementation.address);
                    });
            }
        }

        {
            let moderatorRoleLeverage = await plpLeverage.MODERATOR_ROLE();
            let isModeratorLeverage = await plpLeverage.hasRole(moderatorRoleLeverage, deployMasterAddress);
            if (!isModeratorLeverage) {
                await plpLeverage.initialize(primaryLendingPlatformV2ProxyAddress)
                    .then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("PrimaryLendingPlatformLeverage call initialize at " + plpLeverage.address);
                    });
            }
        }

        {
            let currentPlpAddress = await plpLeverage.primaryLendingPlatform();
            if (currentPlpAddress.toLowerCase() != primaryLendingPlatformV2ProxyAddress.toLowerCase()) {
                await plpLeverage.setPrimaryLendingPlatformAddress(primaryLendingPlatformV2ProxyAddress).then(function (instance) {
                    log("PrimaryLendingPlatformLeverage set primaryLendingPlatformV2 " + primaryLendingPlatformV2ProxyAddress + " at tx hash: " + instance.hash);
                });
            }
        }

        {
            const currentExchangeAggregator = await plpLeverage.exchangeAggregator();
            const currentRegistryAggregator = await plpLeverage.registryAggregator();
        if (exchangeAggregator.toLowerCase() != currentExchangeAggregator.toLowerCase() || registryAggregator.toLowerCase() != currentRegistryAggregator.toLowerCase()) {
            await plpLeverage.setExchangeAggregator(exchangeAggregator, registryAggregator)
                .then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PrimaryLendingPlatformLeverage set ExchangeAggregator:");
                    log("ExchangeAggregator: " + exchangeAggregator);
                    log("RegistryAggregator: " + registryAggregator);
                });
        }
        }


        log();
        log("***** 10. Setting PLP Wrapped Token Gateway *****");

        {
            let moderatorRoleWrappedTokenGateway = await plpWrappedTokenGatewayImplementation.MODERATOR_ROLE();
            let isModeratorWrappedTokenGateway = await plpWrappedTokenGatewayImplementation.hasRole(moderatorRoleWrappedTokenGateway, deployMasterAddress);
            if (!isModeratorWrappedTokenGateway) {
                await plpWrappedTokenGatewayImplementation.initialize(
                    primaryLendingPlatformV2ProxyAddress,
                    WETH,
                    primaryLendingPlatformLiquidationProxyAddress,
                    primaryLendingPlatformLeverageProxyAddress,

                )
                    .then(function (instance) {
                        log("Transaction hash: " + instance.hash);
                        log("PrimaryLendingPlatformWrappedTokenGateway Implementation call initialize at " + plpWrappedTokenGatewayImplementation.address);
                    });
            }
        }

        {
            let moderatorRoleWrappedTokenGateway = await plpWrappedTokenGateway.MODERATOR_ROLE();
            let isModeratorWrappedTokenGateway = await plpWrappedTokenGateway.hasRole(moderatorRoleWrappedTokenGateway, deployMasterAddress);
            if (!isModeratorWrappedTokenGateway) {
                await plpWrappedTokenGateway.initialize(
                    primaryLendingPlatformV2ProxyAddress,
                    WETH,
                    primaryLendingPlatformLiquidationProxyAddress,
                    primaryLendingPlatformLeverageProxyAddress,

                )
                    .then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("PrimaryLendingPlatformWrappedTokenGateway call initialize at " + plpWrappedTokenGateway.address);
                    });
            }
        }

        {
            let currentPLP = await plpWrappedTokenGateway.primaryLendingPlatform();
            if (currentPLP.toLowerCase() != primaryLendingPlatformV2ProxyAddress.toLowerCase()) {
                await plpWrappedTokenGateway.setPrimaryLendingPlatform(primaryLendingPlatformV2ProxyAddress)
                    .then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("PrimaryLendingPlatformWrappedTokenGateway set primaryLendingPlatform " + primaryLendingPlatformV2ProxyAddress);
                    });
            }
        }

        {
            let currentLiquidation = await plpWrappedTokenGateway.pitLiquidation();
            if (currentLiquidation.toLowerCase() != primaryLendingPlatformLiquidationProxyAddress.toLowerCase()) {
                await plpWrappedTokenGateway.setPITLiquidation(primaryLendingPlatformLiquidationProxyAddress)
                    .then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("PrimaryLendingPlatformWrappedTokenGateway set liquidation " + primaryLendingPlatformLiquidationProxyAddress);
                    });
            }
        }

        {
            let currentLeverage = await plpWrappedTokenGateway.pitLeverage();
            if (currentLeverage.toLowerCase() != primaryLendingPlatformLeverageProxyAddress.toLowerCase()) {
                await plpWrappedTokenGateway.setPITLeverage(primaryLendingPlatformLeverageProxyAddress)
                    .then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("PrimaryLendingPlatformWrappedTokenGateway set leverage " + primaryLendingPlatformLeverageProxyAddress);
                    });
            }
        }

        let addresses = {
            bondtrollerAddress: bondtrollerProxyAddress,
            jumpRateModelAddress: jumpRateModelProxyAddress,
            blendingAddress: blendingTokenProxyAddresses,
            plpAddress: primaryLendingPlatformV2ProxyAddress,
            plpLiquidationAddress: primaryLendingPlatformLiquidationProxyAddress,
            plpAtomicRepaymentAddress: primaryLendingPlatformAtomicRepaymentProxyAddress,
            plpLeverageAddress: primaryLendingPlatformLeverageProxyAddress,
            plpModerator: primaryLendingPlatformModeratorProxyAddress,
            plpWrappedTokenGateway: primaryLendingPlatformWrappedTokenGatewayProxyAddress,
            projectTokens: projectTokens,
            lendingTokens: lendingTokens
        };
        return addresses;
    }
}