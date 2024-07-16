require("dotenv").config();
const hre = require("hardhat");
const network = hre.hardhatArguments.network;

const isTesting = process.env.TESTING === "true";
const isTestingForZksync = Object.keys(process.env).includes('TESTING_FOR_ZKSYNC');
let chain = process.env.CHAIN && network == 'hardhat' ? "_" + process.env.CHAIN : "";
if (isTestingForZksync) chain = "_zksync_on_polygon_mainnet";

const fs = require("fs");
const path = require("path");
const configGeneralFile = path.join(__dirname, `../../config/${network}${chain}/config_general.json`);
const configGeneral = require(configGeneralFile);
const configFile = path.join(__dirname, `../../config/${network}${chain}/config.json`);
let config = require(configFile);
const verifyFilePath = path.join(__dirname, `../../config/${network}${chain}/verify.json`);
const verifyFile = require(verifyFilePath);

const log = (...args) => {
    if (isTesting) {
        return
    } else {
        console.log(...args);
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

    deploymentPrimaryLendingPlatform: async function () {

        let network = hre.network;
        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];
        let deployMasterAddress = deployMaster.address;

        const {
            priceOracle,
            plpModeratorParams,
            blendingToken,
            jumRateModel,
            exchangeAggregatorParams,
            plpLiquidationParams
        } = configGeneral;

        // Contracts ABI
        let ERC20 = await hre.ethers.getContractFactory("ERC20");
        let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
        let TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
        let JumpRateModel = await hre.ethers.getContractFactory("JumpRateModelV3");
        let Bondtroller = await hre.ethers.getContractFactory("Bondtroller");
        let BLendingToken = await hre.ethers.getContractFactory("BLendingToken");
        let PrimaryLendingPlatformV3 = await hre.ethers.getContractFactory("PrimaryLendingPlatformV3");
        let PrimaryLendingPlatformAtomicRepayment = await hre.ethers.getContractFactory("PrimaryLendingPlatformAtomicRepaymentV3");
        let PrimaryLendingPlatformLiquidation = await hre.ethers.getContractFactory("PrimaryLendingPlatformLiquidationV3");
        let PrimaryLendingPlatformLeverage = await hre.ethers.getContractFactory("PrimaryLendingPlatformLeverageV3");
        let PrimaryLendingPlatformWrappedTokenGateway = await hre.ethers.getContractFactory("PrimaryLendingPlatformWrappedTokenGatewayV3");
        let PrimaryLendingPlatformModerator = await hre.ethers.getContractFactory("PrimaryLendingPlatformModeratorV3");
        let PriceProviderAggregator = await hre.ethers.getContractFactory("PriceProviderAggregatorPythV3");

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
            PRIMARY_PROXY_ADMIN,
            PriceProviderAggregatorProxy,
            BondtrollerLogic,
            BondtrollerProxy,
            BLendingTokenLogic,
            BLendingTokenProxies,
            PrimaryLendingPlatformV3Logic,
            PrimaryLendingPlatformV3Proxy,
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

        let PrimaryLendingPlatformV3LogicAddress = PrimaryLendingPlatformV3Logic;
        let PrimaryLendingPlatformV3ProxyAddress = PrimaryLendingPlatformV3Proxy;

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
        let borrowLimitPerLendingToken = plpModeratorParams.borrowLimitPerLendingToken;
        let depositLimitPerProjectAsset = plpModeratorParams.depositLimitPerProjectAsset;

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

        log("Network name: " + network.name);
        log("DeployMaster: " + deployMaster.address);

        //====================================================
        log();
        log("***** BONDTROLLER DEPLOYMENT *****");

        if (!bondtrollerLogicAddress) {
            bondtroller = await Bondtroller.connect(deployMaster).deploy();
            await bondtroller.deployed().then(function (instance) {
                bondtrollerLogicAddress = instance.address;
                if (!isTesting) config.BondtrollerLogic = bondtrollerLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        log("Bondtroller logic address: " + bondtrollerLogicAddress);
        await verify(bondtrollerLogicAddress, [], "BondtrollerLogic");

        if (!bondtrollerProxyAddress) {
            let bondtrollerProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                bondtrollerLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await bondtrollerProxy.deployed().then(function (instance) {
                bondtrollerProxyAddress = instance.address;
                if (!isTesting) config.BondtrollerProxy = bondtrollerProxyAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
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
            let jumpRateModel = await JumpRateModel.connect(deployMaster).deploy();
            await jumpRateModel.deployed();
            jumpRateModelLogicAddress = jumpRateModel.address;
            if (!isTesting) config.JumpRateModelLogic = jumpRateModelLogicAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }
        log("JumpRateModel masterCopy address: " + jumpRateModelLogicAddress);
        await verify(jumpRateModelLogicAddress, [], "JumpRateModelLogic");

        if (!jumpRateModelProxyAddress) {
            let jumpRateModelProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                jumpRateModelLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await jumpRateModelProxy.deployed().then(function (instance) {
                jumpRateModelProxyAddress = instance.address;
                if (!isTesting) config.JumpRateModelProxy = jumpRateModelProxyAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
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
            blending = await BLendingToken.connect(deployMaster).deploy();
            await blending.deployed().then(function (instance) {
                blendingTokenLogicAddress = instance.address;
                if (!isTesting) config.BLendingTokenLogic = blendingTokenLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        log("BLendingToken masterCopy address: " + blendingTokenLogicAddress);
        await verify(blendingTokenLogicAddress, [], "BLendingTokenLogic");

        for (var i = 0; i < lendingTokens.length; i++) {
            if (blendingTokenProxyAddresses.length < lendingTokens.length) {
                let blendingProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                    blendingTokenLogicAddress,
                    proxyAdminAddress,
                    "0x"
                );
                await blendingProxy.deployed().then(function (instance) {
                    blendingTokenProxyAddresses.push(instance.address);
                });
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

        if (!PrimaryLendingPlatformV3LogicAddress) {
            plp = await PrimaryLendingPlatformV3.connect(deployMaster).deploy();
            await plp.deployed().then(function (instance) {
                PrimaryLendingPlatformV3LogicAddress = instance.address;
                if (!isTesting) config.PrimaryLendingPlatformV3Logic = PrimaryLendingPlatformV3LogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        log("PrimaryLendingPlatformV3 masterCopy address: " + PrimaryLendingPlatformV3LogicAddress);
        await verify(PrimaryLendingPlatformV3LogicAddress, [], "PrimaryLendingPlatformV3Logic");

        if (!PrimaryLendingPlatformV3ProxyAddress) {
            let plpProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                PrimaryLendingPlatformV3LogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await plpProxy.deployed().then(function (instance) {
                PrimaryLendingPlatformV3ProxyAddress = instance.address;
                if (!isTesting) config.PrimaryLendingPlatformV3Proxy = PrimaryLendingPlatformV3ProxyAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        log("\nPrimaryLendingPlatformV3 proxy address: " + PrimaryLendingPlatformV3ProxyAddress);
        await verify(PrimaryLendingPlatformV3ProxyAddress, [
            PrimaryLendingPlatformV3LogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryLendingPlatformV3Proxy");

        //====================================================

        log();
        log("***** PRIMARY LENDING PLATFORM MODERATOR DEPLOYMENT *****");

        if (!primaryLendingPlatformModeratorLogicAddress) {
            plpModerator = await PrimaryLendingPlatformModerator.connect(deployMaster).deploy();
            await plpModerator.deployed().then(function (instance) {
                primaryLendingPlatformModeratorLogicAddress = instance.address;
                if (!isTesting) config.PrimaryLendingPlatformModeratorLogic = primaryLendingPlatformModeratorLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        log("PrimaryLendingPlatformModerator masterCopy address: " + primaryLendingPlatformModeratorLogicAddress);
        await verify(primaryLendingPlatformModeratorLogicAddress, [], "PrimaryLendingPlatformModeratorLogic");

        if (!primaryLendingPlatformModeratorProxyAddress) {
            let plpModeratorProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                primaryLendingPlatformModeratorLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await plpModeratorProxy.deployed().then(function (instance) {
                primaryLendingPlatformModeratorProxyAddress = instance.address;
                if (!isTesting) config.PrimaryLendingPlatformModeratorProxy = primaryLendingPlatformModeratorProxyAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
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
            plpLiquidation = await PrimaryLendingPlatformLiquidation.connect(deployMaster).deploy();
            await plpLiquidation.deployed().then(function (instance) {
                primaryLendingPlatformLiquidationLogicAddress = instance.address;
                if (!isTesting) config.PrimaryLendingPlatformLiquidationLogic = primaryLendingPlatformLiquidationLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        log("PrimaryLendingPlatformLiquidation masterCopy address: " + primaryLendingPlatformLiquidationLogicAddress);
        await verify(primaryLendingPlatformLiquidationLogicAddress, [], "PrimaryLendingPlatformLiquidationLogic");

        if (!primaryLendingPlatformLiquidationProxyAddress) {
            let plpLiquidationProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                primaryLendingPlatformLiquidationLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await plpLiquidationProxy.deployed().then(function (instance) {
                primaryLendingPlatformLiquidationProxyAddress = instance.address;
                if (!isTesting) config.PrimaryLendingPlatformLiquidationProxy = primaryLendingPlatformLiquidationProxyAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
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
            plpAtomicRepayment = await PrimaryLendingPlatformAtomicRepayment.connect(deployMaster).deploy();
            await plpAtomicRepayment.deployed().then(function (instance) {
                primaryLendingPlatformAtomicRepaymentLogicAddress = instance.address;
                if (!isTesting) config.PrimaryLendingPlatformAtomicRepaymentLogic = primaryLendingPlatformAtomicRepaymentLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        log("PrimaryLendingPlatformAtomicRepayment masterCopy address: " + primaryLendingPlatformAtomicRepaymentLogicAddress);
        await verify(primaryLendingPlatformAtomicRepaymentLogicAddress, [], "PrimaryLendingPlatformAtomicRepaymentLogic");

        if (!primaryLendingPlatformAtomicRepaymentProxyAddress) {
            let plpAtomicRepaymentProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                primaryLendingPlatformAtomicRepaymentLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await plpAtomicRepaymentProxy.deployed().then(function (instance) {
                primaryLendingPlatformAtomicRepaymentProxyAddress = instance.address;
                if (!isTesting) config.PrimaryLendingPlatformAtomicRepaymentProxy = primaryLendingPlatformAtomicRepaymentProxyAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
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
            plpLeverage = await PrimaryLendingPlatformLeverage.connect(deployMaster).deploy();
            await plpLeverage.deployed().then(function (instance) {
                primaryLendingPlatformLeverageLogicAddress = instance.address;
                if (!isTesting) config.PrimaryLendingPlatformLeverageLogic = primaryLendingPlatformLeverageLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        log("PrimaryLendingPlatformLeverage masterCopy address: " + primaryLendingPlatformLeverageLogicAddress);
        await verify(primaryLendingPlatformLeverageLogicAddress, [], "PrimaryLendingPlatformLeverageLogic");

        if (!primaryLendingPlatformLeverageProxyAddress) {
            let plpLeverageProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                primaryLendingPlatformLeverageLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await plpLeverageProxy.deployed().then(function (instance) {
                primaryLendingPlatformLeverageProxyAddress = instance.address;
                if (!isTesting) config.PrimaryLendingPlatformLeverageProxy = primaryLendingPlatformLeverageProxyAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        log("\nPrimaryIndexTokeLeverage proxy address: " + primaryLendingPlatformLeverageProxyAddress);
        await verify(primaryLendingPlatformLeverageProxyAddress, [
            primaryLendingPlatformLeverageLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryLendingPlatformLeverageProxy");


        //====================================================
        log();
        log("***** PrimaryLendingPlatformWrappedTokenGateway DEPLOYMENT *****");

        if (!primaryLendingPlatformWrappedTokenGatewayLogicAddress) {
            plpWrappedTokenGateway = await PrimaryLendingPlatformWrappedTokenGateway.connect(deployMaster).deploy();
            await plpWrappedTokenGateway.deployed().then(function (instance) {
                primaryLendingPlatformWrappedTokenGatewayLogicAddress = instance.address;
                if (!isTesting) config.PrimaryLendingPlatformWrappedTokenGatewayLogic = primaryLendingPlatformWrappedTokenGatewayLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        log("PrimaryLendingPlatformWrappedTokenGateway masterCopy address: " + PrimaryLendingPlatformWrappedTokenGatewayLogic);
        await verify(PrimaryLendingPlatformWrappedTokenGatewayLogic, [], "PrimaryLendingPlatformWrappedTokenGatewayLogic");

        if (!primaryLendingPlatformWrappedTokenGatewayProxyAddress) {
            let plpWrappedTokenGatewayProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                primaryLendingPlatformWrappedTokenGatewayLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await plpWrappedTokenGatewayProxy.deployed().then(function (instance) {
                primaryLendingPlatformWrappedTokenGatewayProxyAddress = instance.address;
                if (!isTesting) config.PrimaryLendingPlatformWrappedTokenGatewayProxy = primaryLendingPlatformWrappedTokenGatewayProxyAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
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
        proxyAdmin = ProxyAdmin.attach(proxyAdminAddress).connect(deployMaster);
        bondtroller = Bondtroller.attach(bondtrollerProxyAddress).connect(deployMaster);
        jumpRateModel = JumpRateModel.attach(jumpRateModelProxyAddress).connect(deployMaster);
        plp = PrimaryLendingPlatformV3.attach(PrimaryLendingPlatformV3ProxyAddress).connect(deployMaster);
        plpLiquidation = PrimaryLendingPlatformLiquidation.attach(primaryLendingPlatformLiquidationProxyAddress).connect(deployMaster);
        plpAtomicRepayment = PrimaryLendingPlatformAtomicRepayment.attach(primaryLendingPlatformAtomicRepaymentProxyAddress).connect(deployMaster);
        plpLeverage = PrimaryLendingPlatformLeverage.attach(primaryLendingPlatformLeverageProxyAddress).connect(deployMaster);
        plpModerator = PrimaryLendingPlatformModerator.attach(primaryLendingPlatformModeratorProxyAddress).connect(deployMaster);
        plpWrappedTokenGateway = PrimaryLendingPlatformWrappedTokenGateway.attach(primaryLendingPlatformWrappedTokenGatewayProxyAddress).connect(deployMaster);
        priceProviderAggregator = PriceProviderAggregator.attach(PriceProviderAggregatorProxy).connect(deployMaster);

        bondtrollerImplementation = Bondtroller.attach(bondtrollerLogicAddress).connect(deployMaster);
        jumpRateModelImplementation = JumpRateModel.attach(jumpRateModelLogicAddress).connect(deployMaster);
        blendingImplementation = BLendingToken.attach(blendingTokenLogicAddress).connect(deployMaster);
        plpImplementation = PrimaryLendingPlatformV3.attach(PrimaryLendingPlatformV3LogicAddress).connect(deployMaster);
        plpLiquidationImplementation = PrimaryLendingPlatformLiquidation.attach(primaryLendingPlatformLiquidationLogicAddress).connect(deployMaster);
        plpAtomicRepaymentImplementation = PrimaryLendingPlatformAtomicRepayment.attach(primaryLendingPlatformAtomicRepaymentLogicAddress).connect(deployMaster);
        plpLeverageImplementation = PrimaryLendingPlatformLeverage.attach(primaryLendingPlatformLeverageLogicAddress).connect(deployMaster);
        plpModeratorImplementation = PrimaryLendingPlatformModerator.attach(primaryLendingPlatformModeratorLogicAddress).connect(deployMaster);
        plpWrappedTokenGatewayImplementation = PrimaryLendingPlatformWrappedTokenGateway.attach(primaryLendingPlatformWrappedTokenGatewayLogicAddress).connect(deployMaster);

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
                await upgrade(proxyAdmin, blendingImplementation, BLendingToken.attach(blendingTokenProxyAddresses[i]));
            }
        }

        // ====================== upgrade primary lending platform ======================
        if (PrimaryLendingPlatformV3ProxyAddress) {
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

        bondtrollerImplementation = Bondtroller.attach(bondtrollerLogicAddress).connect(deployMaster);
        jumpRateModelImplementation = JumpRateModel.attach(jumpRateModelLogicAddress).connect(deployMaster);
        blendingImplementation = BLendingToken.attach(blendingTokenLogicAddress).connect(deployMaster);
        plpImplementation = PrimaryLendingPlatformV3.attach(PrimaryLendingPlatformV3LogicAddress).connect(deployMaster);
        plpLiquidationImplementation = PrimaryLendingPlatformLiquidation.attach(primaryLendingPlatformLiquidationLogicAddress).connect(deployMaster);
        plpAtomicRepaymentImplementation = PrimaryLendingPlatformAtomicRepayment.attach(primaryLendingPlatformAtomicRepaymentLogicAddress).connect(deployMaster);
        plpLeverageImplementation = PrimaryLendingPlatformLeverage.attach(primaryLendingPlatformLeverageLogicAddress).connect(deployMaster);
        plpModeratorImplementation = PrimaryLendingPlatformModerator.attach(primaryLendingPlatformModeratorLogicAddress).connect(deployMaster);
        plpWrappedTokenGatewayImplementation = PrimaryLendingPlatformWrappedTokenGateway.attach(primaryLendingPlatformWrappedTokenGatewayLogicAddress).connect(deployMaster);

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
                await upgrade(proxyAdmin, blendingImplementation, BLendingToken.attach(blendingTokenProxyAddresses[i]));
            }
        }

        // ====================== upgrade primary lending platform ======================
        if (PrimaryLendingPlatformV3ProxyAddress) {
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
            let primaryIndexTokenAddress = await bondtroller.getPrimaryLendingPlatformAddress();
            if (primaryIndexTokenAddress.toLowerCase() != PrimaryLendingPlatformV3ProxyAddress.toLowerCase()) {
                await bondtroller.setPrimaryLendingPlatformAddress(PrimaryLendingPlatformV3ProxyAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("Bondtroller set PLP " + PrimaryLendingPlatformV3ProxyAddress);
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
                    log("JumpRateModel call initialize at " + jumpRateModel.address);
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
                    log("JumpRateModel " + jumpRateModelProxyAddress + " add BLendingToken Support " + BLendingTokenProxies[i] + " with params: " + gainPerYear[i] + ", " + jumGainPerYear[i] + ", " + targetUtil[i]);
                });
            }
        }

        log();
        log("***** 3. Setting BLending token *****");

        {
            let adminBlendingToken = await blendingImplementation.admin();
            if (adminBlendingToken == ZERO_ADDRESS) {
                let admin = deployMaster.address;
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
            blending = BLendingToken.attach(blendingTokenProxyAddresses[i]).connect(deployMaster);
            let adminBlendingToken = await blending.admin();
            if (adminBlendingToken == ZERO_ADDRESS) {
                let admin = deployMaster.address;
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
                if (plpAddress.toLowerCase() != PrimaryLendingPlatformV3ProxyAddress.toLowerCase()) {
                    await blending.setPrimaryLendingPlatform(PrimaryLendingPlatformV3ProxyAddress).then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("blending " + blending.address + " set primaryLendingPlatform " + PrimaryLendingPlatformV3ProxyAddress);
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
                        log("PrimaryLendingPlatformV3 Implementation call initialize at " + plpImplementation.address);
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
                        log("PrimaryLendingPlatformV3 call initialize at " + plp.address);
                    });
            }
        }

        {
            let plpModerator = await plp.primaryLendingPlatformModerator();
            if (plpModerator.toLowerCase() != primaryLendingPlatformModeratorProxyAddress.toLowerCase()) {
                await plp.setPrimaryLendingPlatformModerator(primaryLendingPlatformModeratorProxyAddress)
                    .then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("PrimaryLendingPlatformV3 set moderator contract " + primaryLendingPlatformModeratorProxyAddress);
                    });
            }
        }

        {
            let currentPlpAddress = await priceProviderAggregator.primaryLendingPlatform();
            if (currentPlpAddress.toLowerCase() != PrimaryLendingPlatformV3ProxyAddress.toLowerCase()) {
                await priceProviderAggregator.setPrimaryLendingPlatform(PrimaryLendingPlatformV3ProxyAddress).then(function (instance) {
                    log("PriceProviderAggregator " + priceProviderAggregator.address + " PrimaryLendingPlatformV3 " + PrimaryLendingPlatformV3ProxyAddress + " at tx hash: " + instance.hash);
                });
            }
        }

        log();
        log("***** 5. Setting PLP Moderator token *****");

        {
            let primaryLendingPlatform = await plpModeratorImplementation.primaryLendingPlatform();
            if (primaryLendingPlatform == ZERO_ADDRESS) {
                await plpModeratorImplementation.initialize(PrimaryLendingPlatformV3ProxyAddress,)
                    .then(function (instance) {
                        log("Transaction hash: " + instance.hash);
                        log("PrimaryLendingModerator Implementation call initialize at " + plpModeratorImplementation.address);
                    });
            }
        }

        {
            let primaryLendingPlatform = await plpModerator.primaryLendingPlatform();
            if (primaryLendingPlatform == ZERO_ADDRESS) {
                await plpModerator.initialize(PrimaryLendingPlatformV3ProxyAddress,)
                    .then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("PrimaryLendingModerator call initialize at " + plpModerator.address);
                    });
            }
        }

        {
            let priceOracle = await plp.priceOracle();
            if (priceOracle.toLowerCase() != PriceProviderAggregatorProxy.toLowerCase()) {
                await plpModerator.setPriceOracle(PriceProviderAggregatorProxy).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PrimaryLendingPlatformV3 set priceOracle: " + PriceProviderAggregatorProxy);
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
                    loanToValueRatioDenominatorLendingToken[i],
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

        for (var i = 0; i < lendingTokens.length; i++) {
            let borrowLimitPerLendingTokenValue = await plp.borrowLimitPerLendingToken(lendingTokens[i]);
            if (borrowLimitPerLendingTokenValue.toString() != borrowLimitPerLendingToken[i]) {
                await plpModerator.setBorrowLimitPerLendingAsset(
                    lendingTokens[i],
                    borrowLimitPerLendingToken[i]
                ).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PrimaryLendingPlatformV3 set " + lendingTokens[i] + " borrow limit " + borrowLimitPerLendingToken[i]);
                });
            }
        }

        for (var i = 0; i < projectTokens.length; i++) {
            let depositLimitPerProjectAssetValue = await plp.depositLimitPerProjectToken(projectTokens[i]);
            if (depositLimitPerProjectAssetValue.toString() != depositLimitPerProjectAsset[i]) {
                await plpModerator.setDepositLimitPerProjectAsset(
                    projectTokens[i],
                    depositLimitPerProjectAsset[i]
                ).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PrimaryLendingPlatformV3 set " + projectTokens[i] + " deposit limit " + depositLimitPerProjectAsset[i]);
                })
            }
        }

        {
            let primaryLendingPlatformLeverage = await plp.primaryLendingPlatformLeverage();
            if (primaryLendingPlatformLeverage.toLowerCase() != primaryLendingPlatformLeverageProxyAddress.toLowerCase()) {
                await plpModerator.setPrimaryLendingPlatformLeverage(primaryLendingPlatformLeverageProxyAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PrimaryLendingPlatformV3 set Leverage contract " + primaryLendingPlatformLeverageProxyAddress);
                });
            }
        }

        {
            let isRelatedContract = await plp.isRelatedContract(primaryLendingPlatformAtomicRepaymentProxyAddress);
            if (isRelatedContract == false) {
                await plpModerator.addRelatedContracts(primaryLendingPlatformAtomicRepaymentProxyAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PrimaryLendingPlatformV3 set role for atomic repayment contract " + primaryLendingPlatformAtomicRepaymentProxyAddress);
                });
            }
        }

        {
            let isRelatedContract = await plp.isRelatedContract(primaryLendingPlatformLiquidationProxyAddress);
            if (isRelatedContract == false) {
                await plpModerator.addRelatedContracts(primaryLendingPlatformLiquidationProxyAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PrimaryLendingPlatformV3 set role for liquidation contract " + primaryLendingPlatformLiquidationProxyAddress);
                });
            }
        }

        {
            let isRelatedContract = await plp.isRelatedContract(primaryLendingPlatformLeverageProxyAddress);
            if (isRelatedContract == false) {
                await plpModerator.addRelatedContracts(primaryLendingPlatformLeverageProxyAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PrimaryLendingPlatformV3 set role for Leverage contract " + primaryLendingPlatformLeverageProxyAddress);
                });
            }
        }

        {
            let isRelatedContract = await plp.isRelatedContract(primaryLendingPlatformWrappedTokenGatewayProxyAddress);
            if (isRelatedContract == false) {
                await plpModerator.addRelatedContracts(primaryLendingPlatformWrappedTokenGatewayProxyAddress).then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PrimaryLendingPlatformV3 set role for Wrapped Token Gateway contract " + primaryLendingPlatformWrappedTokenGatewayProxyAddress);
                });
            }
        }

        log();
        log("***** 6. Initially supply BLending token *****");
        if (initialSupplyAmount.length != 0) {
            for (var i = 0; i < lendingTokens.length; i++) {
                blending = BLendingToken.attach(blendingTokenProxyAddresses[i]).connect(deployMaster);

                let totalSupply = await blending.totalSupply();
                let totalSupplyValue = ethers.BigNumber.from(totalSupply.toString());

                let initialSupplyValue = initialSupplyAmount[i] == "" ? ethers.BigNumber.from(0) : ethers.BigNumber.from(initialSupplyAmount[i].toString());
                if (initialSupplyValue.gt(ethers.BigNumber.from(0))) {
                    let lendingToken = ERC20.attach(lendingTokens[i]).connect(deployMaster);

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
                    let moderatorRoleLiquidation = await plpLiquidationImplementation.MODERATOR_ROLE();
                    let isModeratorLiquidation = await plpLiquidationImplementation.hasRole(moderatorRoleLiquidation, deployMasterAddress);
                    if (!isModeratorLiquidation) {
                        await plpLiquidationImplementation.initialize(PrimaryLendingPlatformV3ProxyAddress)
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
                        await plpLiquidation.initialize(PrimaryLendingPlatformV3ProxyAddress)
                            .then(function (instance) {
                                log("\nTransaction hash: " + instance.hash);
                                log("PrimaryLendingPlatformLiquidation call initialize at " + plpLiquidation.address);
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

                let currentExchangeAggregator = await plpLiquidation.exchangeAggregator();
                let currentRegistryAggregator = await plpLiquidation.registryAggregator();
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
        log();
        log("***** 8. Setting PLP atomic repayment *****");
        {
            let moderatorRoleAtomic = await plpAtomicRepaymentImplementation.MODERATOR_ROLE();
            let isModeratorAtomic = await plpAtomicRepaymentImplementation.hasRole(moderatorRoleAtomic, deployMasterAddress);
            if (!isModeratorAtomic) {
                await plpAtomicRepaymentImplementation.initialize(PrimaryLendingPlatformV3ProxyAddress)
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
                await plpAtomicRepayment.initialize(PrimaryLendingPlatformV3ProxyAddress)
                    .then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("PrimaryLendingPlatformAtomicRepayment call initialize at " + plpAtomicRepayment.address);
                    });
            }
        }
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


        log();
        log("***** 9. Setting PLP leverage *****");

        {
            let moderatorRoleLeverage = await plpLeverageImplementation.MODERATOR_ROLE();
            let isModeratorLeverage = await plpLeverageImplementation.hasRole(moderatorRoleLeverage, deployMasterAddress);
            if (!isModeratorLeverage) {
                await plpLeverageImplementation.initialize(PrimaryLendingPlatformV3ProxyAddress, primaryLendingPlatformAtomicRepaymentProxyAddress)
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
                await plpLeverage.initialize(PrimaryLendingPlatformV3ProxyAddress, primaryLendingPlatformAtomicRepaymentProxyAddress)
                    .then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("PrimaryLendingPlatformLeverage call initialize at " + plpLeverage.address);
                    });
            }
        }
        currentExchangeAggregator = await plpLeverage.exchangeAggregator();
        currentRegistryAggregator = await plpLeverage.registryAggregator();
        if (exchangeAggregator.toLowerCase() != currentExchangeAggregator.toLowerCase() || registryAggregator.toLowerCase() != currentRegistryAggregator.toLowerCase()) {
            await plpLeverage.setExchangeAggregator(exchangeAggregator, registryAggregator)
                .then(function (instance) {
                    log("\nTransaction hash: " + instance.hash);
                    log("PrimaryLendingPlatformLeverage set ExchangeAggregator:");
                    log("ExchangeAggregator: " + exchangeAggregator);
                    log("RegistryAggregator: " + registryAggregator);
                });
        }

        log();
        log("***** 10. Setting PLP Wrapped Token Gateway *****");

        {
            let moderatorRoleWrappedTokenGateway = await plpWrappedTokenGatewayImplementation.MODERATOR_ROLE();
            let isModeratorWrappedTokenGateway = await plpWrappedTokenGatewayImplementation.hasRole(moderatorRoleWrappedTokenGateway, deployMasterAddress);
            if (!isModeratorWrappedTokenGateway) {
                await plpWrappedTokenGatewayImplementation.initialize(
                    PrimaryLendingPlatformV3ProxyAddress,
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
                    PrimaryLendingPlatformV3ProxyAddress,
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
            if (currentPLP.toLowerCase() != PrimaryLendingPlatformV3ProxyAddress.toLowerCase()) {
                await plpWrappedTokenGateway.setPrimaryLendingPlatform(PrimaryLendingPlatformV3ProxyAddress)
                    .then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("PrimaryLendingPlatformWrappedTokenGateway set primaryLendingPlatform " + PrimaryLendingPlatformV3ProxyAddress);
                    });
            }
        }

        {
            let currentLiquidation = await plpWrappedTokenGateway.primaryLendingPlatformLiquidation();
            if (currentLiquidation.toLowerCase() != primaryLendingPlatformLiquidationProxyAddress.toLowerCase()) {
                await plpWrappedTokenGateway.setPITLiquidation(primaryLendingPlatformLiquidationProxyAddress)
                    .then(function (instance) {
                        log("\nTransaction hash: " + instance.hash);
                        log("PrimaryLendingPlatformWrappedTokenGateway set liquidation " + primaryLendingPlatformLiquidationProxyAddress);
                    });
            }
        }

        {
            let currentLeverage = await plpWrappedTokenGateway.primaryLendingPlatformLeverage();
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
            plpAddress: PrimaryLendingPlatformV3ProxyAddress,
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
};