require("dotenv").config();
const hre = require("hardhat");
const network = hre.hardhatArguments.network;

const isTesting = Object.keys(process.env).includes('TESTING');
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
        let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
        let TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
        let JumpRateModel = await hre.ethers.getContractFactory("JumpRateModelV3");
        let Bondtroller = await hre.ethers.getContractFactory("Bondtroller");
        let BLendingToken = await hre.ethers.getContractFactory("BLendingToken");
        let PrimaryLendingPlatformV2 = await hre.ethers.getContractFactory("PrimaryLendingPlatformV2Zksync");
        let PrimaryLendingPlatformAtomicRepayment = await hre.ethers.getContractFactory("PrimaryLendingPlatformAtomicRepaymentZksync");
        let PrimaryLendingPlatformLiquidation = await hre.ethers.getContractFactory("PrimaryLendingPlatformLiquidationZksync");
        let PrimaryLendingPlatformLeverage = await hre.ethers.getContractFactory("PrimaryLendingPlatformLeverageZksync");
        let PrimaryLendingPlatformWrappedTokenGateway = await hre.ethers.getContractFactory("PrimaryLendingPlatformWrappedTokenGatewayZksync");
        let PrimaryLendingPlatformModerator = await hre.ethers.getContractFactory("PrimaryLendingPlatformModerator");

        let jumpRateModel;
        let bondtroller;
        let blending;
        let plp;
        let plpAtomicRepayment;
        let plpLiquidation;
        let plpLeverage;
        let plpModerator;
        let plpWrappedTokenGateway;

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

        let priceProvider = PriceProviderAggregatorProxy;

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
            console.log = function () { };
            config.BLendingTokenProxies = [];
            fs.writeFileSync = function () { };
        }

        console.log("Network name: " + network.name);
        console.log("DeployMaster: " + deployMaster.address);
        //====================================================
        //deploy proxy admin

        console.log();
        console.log("***** PROXY ADMIN DEPLOYMENT *****");
        if (!proxyAdminAddress) {
            let proxyAdmin = await ProxyAdmin.connect(deployMaster).deploy();
            await proxyAdmin.deployed().then(function (instance) {
                proxyAdminAddress = instance.address;
                if (!isTesting) config.PRIMARY_PROXY_ADMIN = proxyAdminAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("ProxyAdmin deployed at: " + proxyAdminAddress);
        await verify(proxyAdminAddress, [], "PRIMARY_PROXY_ADMIN");

        //====================================================
        //deploy price oracle

        // console.log();
        // console.log("***** PRICE ORACLE DEPLOYMENT *****");
        // if (!priceProvider) {
        //     const { deploymentPriceOracle } = require('../priceOracle/deploymentPriceProividerAggregator.js')
        //     let priceOracleAddresses = await deploymentPriceOracle(proxyAdminAddress)
        //     priceProvider = priceOracleAddresses.priceProviderAggregatorAddress
        // }
        // console.log("PriceOracle is deployed at: " + priceProvider);

        //====================================================
        console.log();
        console.log("***** BONDTROLLER DEPLOYMENT *****");

        if (!bondtrollerLogicAddress) {
            bondtroller = await Bondtroller.connect(deployMaster).deploy();
            await bondtroller.deployed().then(function (instance) {
                bondtrollerLogicAddress = instance.address;
                if (!isTesting) config.BondtrollerLogic = bondtrollerLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("Bondtroller logic address: " + bondtrollerLogicAddress);
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
        console.log("\nBondtroller proxy address: " + bondtrollerProxyAddress);
        await verify(bondtrollerProxyAddress, [
            bondtrollerLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "BondtrollerProxy");

        //====================================================

        console.log();
        console.log("***** JUMP RATE MODEL DEPLOYMENT *****");
        if (!jumpRateModelLogicAddress) {
            let jumpRateModel = await JumpRateModel.connect(deployMaster).deploy();
            await jumpRateModel.deployed();
            jumpRateModelLogicAddress = jumpRateModel.address;
            if (!isTesting) config.JumpRateModelLogic = jumpRateModelLogicAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }
        console.log("JumpRateModel masterCopy address: " + jumpRateModelLogicAddress);
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
        console.log("\nJumpRateModel proxy address: " + jumpRateModelProxyAddress);
        await verify(jumpRateModelProxyAddress, [
            jumpRateModelLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "JumpRateModelProxy");

        //====================================================

        console.log();
        console.log("***** BLENDING TOKEN DEPLOYMENT *****");

        if (!blendingTokenLogicAddress) {
            blending = await BLendingToken.connect(deployMaster).deploy();
            await blending.deployed().then(function (instance) {
                blendingTokenLogicAddress = instance.address;
                if (!isTesting) config.BLendingTokenLogic = blendingTokenLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("BLendingToken masterCopy address: " + blendingTokenLogicAddress);
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

        console.log("\nBLendingToken proxy address: " + blendingTokenProxyAddresses);
        await verify(blendingTokenProxyAddresses[0], [
            blendingTokenLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "BLendingTokenProxies");

        //====================================================

        console.log();
        console.log("***** PRIMARY LENDING PLATFORM DEPLOYMENT *****");

        if (!primaryLendingPlatformV2LogicAddress) {
            plp = await PrimaryLendingPlatformV2.connect(deployMaster).deploy();
            await plp.deployed().then(function (instance) {
                primaryLendingPlatformV2LogicAddress = instance.address;
                if (!isTesting) config.PrimaryLendingPlatformV2Logic = primaryLendingPlatformV2LogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PrimaryLendingPlatformV2 masterCopy address: " + primaryLendingPlatformV2LogicAddress);
        await verify(primaryLendingPlatformV2LogicAddress, [], "PrimaryLendingPlatformV2Logic");

        if (!primaryLendingPlatformV2ProxyAddress) {
            let plpProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                primaryLendingPlatformV2LogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await plpProxy.deployed().then(function (instance) {
                primaryLendingPlatformV2ProxyAddress = instance.address;
                if (!isTesting) config.PrimaryLendingPlatformV2Proxy = primaryLendingPlatformV2ProxyAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("\nPrimaryLendingPlatformV2 proxy address: " + primaryLendingPlatformV2ProxyAddress);
        await verify(primaryLendingPlatformV2ProxyAddress, [
            primaryLendingPlatformV2LogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryLendingPlatformV2Proxy");

        //====================================================

        console.log();
        console.log("***** PRIMARY LENDING PLATFORM MODERATOR DEPLOYMENT *****");

        if (!primaryLendingPlatformModeratorLogicAddress) {
            plpModerator = await PrimaryLendingPlatformModerator.connect(deployMaster).deploy();
            await plpModerator.deployed().then(function (instance) {
                primaryLendingPlatformModeratorLogicAddress = instance.address;
                if (!isTesting) config.PrimaryLendingPlatformModeratorLogic = primaryLendingPlatformModeratorLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PrimaryLendingPlatformModerator masterCopy address: " + primaryLendingPlatformModeratorLogicAddress);
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

        console.log("\nPrimaryLendingPlatformModerator proxy address: " + primaryLendingPlatformModeratorProxyAddress);
        await verify(primaryLendingPlatformModeratorProxyAddress, [
            primaryLendingPlatformModeratorLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryLendingPlatformModeratorProxy");


        //====================================================

        console.log();
        console.log("***** PrimaryLendingPlatformLiquidation DEPLOYMENT *****");

        if (!primaryLendingPlatformLiquidationLogicAddress) {
            plpLiquidation = await PrimaryLendingPlatformLiquidation.connect(deployMaster).deploy();
            await plpLiquidation.deployed().then(function (instance) {
                primaryLendingPlatformLiquidationLogicAddress = instance.address;
                if (!isTesting) config.PrimaryLendingPlatformLiquidationLogic = primaryLendingPlatformLiquidationLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PrimaryLendingPlatformLiquidation masterCopy address: " + primaryLendingPlatformLiquidationLogicAddress);
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

        console.log("\nPrimaryLendingPlatformLiquidation proxy address: " + primaryLendingPlatformLiquidationProxyAddress);
        await verify(primaryLendingPlatformLiquidationProxyAddress, [
            primaryLendingPlatformLiquidationLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryLendingPlatformLiquidationProxy");

        //====================================================

        console.log();
        console.log("***** PrimaryLendingPlatformAtomicRepayment DEPLOYMENT *****");

        if (!primaryLendingPlatformAtomicRepaymentLogicAddress) {
            plpAtomicRepayment = await PrimaryLendingPlatformAtomicRepayment.connect(deployMaster).deploy();
            await plpAtomicRepayment.deployed().then(function (instance) {
                primaryLendingPlatformAtomicRepaymentLogicAddress = instance.address;
                if (!isTesting) config.PrimaryLendingPlatformAtomicRepaymentLogic = primaryLendingPlatformAtomicRepaymentLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PrimaryLendingPlatformAtomicRepayment masterCopy address: " + primaryLendingPlatformAtomicRepaymentLogicAddress);
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

        console.log("\nPrimaryLendingPlatformAtomicRepayment proxy address: " + primaryLendingPlatformAtomicRepaymentProxyAddress);
        await verify(primaryLendingPlatformAtomicRepaymentProxyAddress, [
            primaryLendingPlatformAtomicRepaymentLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryLendingPlatformAtomicRepaymentProxy");

        //====================================================

        console.log();
        console.log("***** PrimaryLendingPlatformLeverage DEPLOYMENT *****");

        if (!primaryLendingPlatformLeverageLogicAddress) {
            plpLeverage = await PrimaryLendingPlatformLeverage.connect(deployMaster).deploy();
            await plpLeverage.deployed().then(function (instance) {
                primaryLendingPlatformLeverageLogicAddress = instance.address;
                if (!isTesting) config.PrimaryLendingPlatformLeverageLogic = primaryLendingPlatformLeverageLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PrimaryLendingPlatformLeverage masterCopy address: " + primaryLendingPlatformLeverageLogicAddress);
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

        console.log("\nPrimaryIndexTokeLeverage proxy address: " + primaryLendingPlatformLeverageProxyAddress);
        await verify(primaryLendingPlatformLeverageProxyAddress, [
            primaryLendingPlatformLeverageLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryLendingPlatformLeverageProxy");


        //====================================================
        console.log();
        console.log("***** PrimaryLendingPlatformWrappedTokenGateway DEPLOYMENT *****");

        if (!primaryLendingPlatformWrappedTokenGatewayLogicAddress) {
            plpWrappedTokenGateway = await PrimaryLendingPlatformWrappedTokenGateway.connect(deployMaster).deploy();
            await plpWrappedTokenGateway.deployed().then(function (instance) {
                primaryLendingPlatformWrappedTokenGatewayLogicAddress = instance.address;
                if (!isTesting) config.PrimaryLendingPlatformWrappedTokenGatewayLogic = primaryLendingPlatformWrappedTokenGatewayLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PrimaryLendingPlatformWrappedTokenGateway masterCopy address: " + PrimaryLendingPlatformWrappedTokenGatewayLogic);
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

        console.log("\nPrimaryLendingPlatformWrappedTokenGateway proxy address: " + PrimaryLendingPlatformWrappedTokenGatewayProxy);
        await verify(PrimaryLendingPlatformWrappedTokenGatewayProxy, [
            primaryLendingPlatformWrappedTokenGatewayLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryLendingPlatformWrappedTokenGatewayProxy");


        //====================================================
        //setting params

        //instances of contracts
        bondtroller = Bondtroller.attach(bondtrollerProxyAddress).connect(deployMaster);
        jumpRateModel = JumpRateModel.attach(jumpRateModelProxyAddress).connect(deployMaster);
        plp = PrimaryLendingPlatformV2.attach(primaryLendingPlatformV2ProxyAddress).connect(deployMaster);
        plpLiquidation = PrimaryLendingPlatformLiquidation.attach(primaryLendingPlatformLiquidationProxyAddress).connect(deployMaster);
        plpAtomicRepayment = PrimaryLendingPlatformAtomicRepayment.attach(primaryLendingPlatformAtomicRepaymentProxyAddress).connect(deployMaster);
        plpLeverage = PrimaryLendingPlatformLeverage.attach(primaryLendingPlatformLeverageProxyAddress).connect(deployMaster);
        plpModerator = PrimaryLendingPlatformModerator.attach(primaryLendingPlatformModeratorProxyAddress).connect(deployMaster);
        plpWrappedTokenGateway = PrimaryLendingPlatformWrappedTokenGateway.attach(primaryLendingPlatformWrappedTokenGatewayProxyAddress).connect(deployMaster);

        bondtrollerImplementation = Bondtroller.attach(bondtrollerLogicAddress).connect(deployMaster);
        jumpRateModelImplementation = JumpRateModel.attach(jumpRateModelLogicAddress).connect(deployMaster);
        blendingImplementation = BLendingToken.attach(blendingTokenLogicAddress).connect(deployMaster);
        plpImplementation = PrimaryLendingPlatformV2.attach(primaryLendingPlatformV2LogicAddress).connect(deployMaster);
        plpLiquidationImplementation = PrimaryLendingPlatformLiquidation.attach(primaryLendingPlatformLiquidationLogicAddress).connect(deployMaster);
        plpAtomicRepaymentImplementation = PrimaryLendingPlatformAtomicRepayment.attach(primaryLendingPlatformAtomicRepaymentLogicAddress).connect(deployMaster);
        plpLeverageImplementation = PrimaryLendingPlatformLeverage.attach(primaryLendingPlatformLeverageLogicAddress).connect(deployMaster);
        plpModeratorImplementation = PrimaryLendingPlatformModerator.attach(primaryLendingPlatformModeratorLogicAddress).connect(deployMaster);
        plpWrappedTokenGatewayImplementation = PrimaryLendingPlatformWrappedTokenGateway.attach(primaryLendingPlatformWrappedTokenGatewayLogicAddress).connect(deployMaster);

        console.log();
        console.log("***** 1. Setting Bondtroller *****");

        {
            let adminBondtroller = await bondtrollerImplementation.admin();
            if (adminBondtroller == ZERO_ADDRESS) {
                await bondtrollerImplementation.init().then(function (instance) {
                    console.log("Transaction hash: " + instance.hash);
                    console.log("Bondtroller Implementation call init at " + bondtrollerImplementation.address);
                });
            }
        }

        {
            let adminBondtroller = await bondtroller.admin();
            if (adminBondtroller == ZERO_ADDRESS) {
                await bondtroller.init().then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("Bondtroller call init at " + bondtroller.address);
                });
            }
        }

        {
            let primaryIndexTokenAddress = await bondtroller.getPrimaryLendingPlatformAddress();
            if (primaryIndexTokenAddress != primaryLendingPlatformV2ProxyAddress) {
                await bondtroller.setPrimaryLendingPlatformAddress(primaryLendingPlatformV2ProxyAddress).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("Bondtroller set PLP " + primaryLendingPlatformV2ProxyAddress);
                });
            }
        }

        {
            let allMarkets = await bondtroller.getAllMarkets();
            for (var i = 0; i < blendingTokenProxyAddresses.length; i++) {
                if (allMarkets.indexOf(blendingTokenProxyAddresses[i]) == -1) {
                    await bondtroller.supportMarket(blendingTokenProxyAddresses[i]).then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("Bondtroller support market " + blendingTokenProxyAddresses[i]);
                    });
                }
            }
        }

        console.log();
        console.log("***** 2. Setting JumRateModel *****");

        {
            let MODERATOR_ROLE = await jumpRateModelImplementation.MODERATOR_ROLE();
            let isMODERATOR = await jumpRateModelImplementation.hasRole(MODERATOR_ROLE, deployMasterAddress);
            if (!isMODERATOR) {
                await jumpRateModelImplementation.initialize(blocksPerYear).then(function (instance) {
                    console.log("Transaction hash: " + instance.hash);
                    console.log("JumpRateModel Implementation call initialize at " + jumpRateModelImplementation.address);
                });
            }
        }

        {
            let MODERATOR_ROLE = await jumpRateModel.MODERATOR_ROLE();
            let isMODERATOR = await jumpRateModel.hasRole(MODERATOR_ROLE, deployMasterAddress);
            if (!isMODERATOR) {
                await jumpRateModel.initialize(blocksPerYear).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("JumpRateModel call initialize at " + jumpRateModel.address);
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
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("JumpRateModel " + jumpRateModelProxyAddress + " add BLendingToken Support " + BLendingTokenProxies[i] + " with params: " + gainPerYear[i] + ", " + jumGainPerYear[i] + ", " + targetUtil[i]);
                });
            }
        }

        console.log();
        console.log("***** 3. Setting BLending token *****");

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
                    console.log("Transaction hash: " + instance.hash);
                    console.log("Blending token Implementation call initialize at " + blendingImplementation.address);
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
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("Blending token call initialize at " + blending.address);
                });
            }
            {
                let plpAddress = await blending.primaryLendingPlatform();
                if (plpAddress != primaryLendingPlatformV2ProxyAddress) {
                    await blending.setPrimaryLendingPlatform(primaryLendingPlatformV2ProxyAddress).then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("blending " + blending.address + " set primaryLendingPlatform " + primaryLendingPlatformV2ProxyAddress);
                    });
                }
            }
        }

        console.log();
        console.log("***** 4. Setting PLP token *****");

        {
            let defaultAdminRolePlp = await plpImplementation.DEFAULT_ADMIN_ROLE();
            let isDefaultAdminPlp = await plpImplementation.hasRole(defaultAdminRolePlp, deployMasterAddress);
            if (!isDefaultAdminPlp) {
                await plpImplementation.initialize()
                    .then(function (instance) {
                        console.log("Transaction hash: " + instance.hash);
                        console.log("PrimaryLendingPlatformV2 Implementation call initialize at " + plpImplementation.address);
                    });
            }
        }

        {
            let defaultAdminRolePlp = await plp.DEFAULT_ADMIN_ROLE();
            let isDefaultAdminPlp = await plp.hasRole(defaultAdminRolePlp, deployMasterAddress);
            if (!isDefaultAdminPlp) {
                await plp.initialize()
                    .then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("PrimaryLendingPlatformV2 Implementation call initialize at " + plp.address);
                    });
            }
        }

        {
            let plpModerator = await plp.primaryLendingPlatformModerator();
            if (plpModerator != primaryLendingPlatformModeratorProxyAddress) {
                await plp.setPrimaryLendingPlatformModerator(primaryLendingPlatformModeratorProxyAddress)
                    .then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("PrimaryLendingPlatformV2 set moderator contract " + primaryLendingPlatformModeratorProxyAddress);
                    });
            }
        }

        console.log();
        console.log("***** 5. Setting PLP Moderator token *****");

        {
            let primaryLendingPlatform = await plpModeratorImplementation.primaryLendingPlatform();
            if (primaryLendingPlatform == ZERO_ADDRESS) {
                await plpModeratorImplementation.initialize(primaryLendingPlatformV2ProxyAddress,)
                    .then(function (instance) {
                        console.log("Transaction hash: " + instance.hash);
                        console.log("PrimaryLendingPlatformV2 Implementation call initialize at " + plpModeratorImplementation.address);
                    });
            }
        }

        {
            let primaryLendingPlatform = await plpModerator.primaryLendingPlatform();
            if (primaryLendingPlatform == ZERO_ADDRESS) {
                await plpModerator.initialize(primaryLendingPlatformV2ProxyAddress,)
                    .then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("PrimaryLendingPlatformV2 call initialize at " + plpModerator.address);
                    });
            }
        }

        {
            let priceOracle = await plp.priceOracle();
            if (priceOracle != PriceProviderAggregatorProxy) {
                await plpModerator.setPriceOracle(PriceProviderAggregatorProxy).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PrimaryLendingPlatformV2 set priceOracle: " + PriceProviderAggregatorProxy);
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
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("Added prj token " + projectTokens[i] + ":");
                    console.log("LoanToValueRatio: ");
                    console.log("   Numerator:   " + loanToValueRatioNumerator[i]);
                    console.log("   Denominator: " + loanToValueRatioDenominator[i]);
                });
            }
        }

        for (var i = 0; i < lendingTokens.length; i++) {
            let lendingTokenInfo = await plp.lendingTokenInfo(lendingTokens[i]);
            let lendingTokenLoan = await plp.lendingTokenInfo(lendingTokens[i]);
            if (lendingTokenInfo.isListed == false
                || lendingTokenInfo.isPaused != isPaused
                || lendingTokenInfo.bLendingToken != blendingTokenProxyAddresses[i]
                || lendingTokenLoan.loanToValueRatio.numerator != loanToValueRatioNumeratorLendingToken[i]
                || lendingTokenLoan.loanToValueRatio.denominator != loanToValueRatioDenominatorLendingToken[i]
            )
                await plpModerator.addLendingToken(
                    lendingTokens[i],
                    blendingTokenProxyAddresses[i],
                    isPaused,
                    loanToValueRatioNumeratorLendingToken[i],
                    loanToValueRatioDenominatorLendingToken[i],
                ).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("Added lending token " + lendingTokens[i] + ":");
                    console.log("LoanToValueRatio: ");
                    console.log("   Numerator:   " + loanToValueRatioNumeratorLendingToken[i]);
                    console.log("   Denominator: " + loanToValueRatioDenominatorLendingToken[i]);
                });
        }

        for (var i = 0; i < projectTokens.length; i++) {
            let borrowLimitPerCollateralValue = await plp.borrowLimitPerCollateral(projectTokens[i]);
            if (borrowLimitPerCollateralValue.toString() != borrowLimitPerCollateral[i]) {
                await plpModerator.setBorrowLimitPerCollateralAsset(
                    projectTokens[i],
                    borrowLimitPerCollateral[i]
                ).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PrimaryLendingPlatformV2 set " + projectTokens[i] + " borrow limit " + borrowLimitPerCollateral[i]);
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
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PrimaryLendingPlatformV2 set " + lendingTokens[i] + " borrow limit " + borrowLimitPerLendingToken[i]);
                });
            }
        }

        {
            let primaryLendingPlatformLeverage = await plp.primaryLendingPlatformLeverage();
            if (primaryLendingPlatformLeverage != primaryLendingPlatformLeverageProxyAddress) {
                await plpModerator.setPrimaryLendingPlatformLeverage(primaryLendingPlatformLeverageProxyAddress).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PrimaryLendingPlatformV2 set Leverage contract " + primaryLendingPlatformLeverageProxyAddress);
                });
            }
        }

        {
            let isRelatedContract = await plp.isRelatedContract(primaryLendingPlatformAtomicRepaymentProxyAddress);
            if (isRelatedContract == false) {
                await plpModerator.addRelatedContracts(primaryLendingPlatformAtomicRepaymentProxyAddress).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PrimaryLendingPlatformV2 set role for atomic repayment contract " + primaryLendingPlatformAtomicRepaymentProxyAddress);
                });
            }
        }

        {
            let isRelatedContract = await plp.isRelatedContract(primaryLendingPlatformLiquidationProxyAddress);
            if (isRelatedContract == false) {
                await plpModerator.addRelatedContracts(primaryLendingPlatformLiquidationProxyAddress).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PrimaryLendingPlatformV2 set role for liquidation contract " + primaryLendingPlatformLiquidationProxyAddress);
                });
            }
        }

        {
            let isRelatedContract = await plp.isRelatedContract(primaryLendingPlatformLeverageProxyAddress);
            if (isRelatedContract == false) {
                await plpModerator.addRelatedContracts(primaryLendingPlatformLeverageProxyAddress).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PrimaryLendingPlatformV2 set role for Leverage contract " + primaryLendingPlatformLeverageProxyAddress);
                });
            }
        }

        {
            let isRelatedContract = await plp.isRelatedContract(primaryLendingPlatformWrappedTokenGatewayProxyAddress);
            if (isRelatedContract == false) {
                await plpModerator.addRelatedContracts(primaryLendingPlatformWrappedTokenGatewayProxyAddress).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PrimaryLendingPlatformV2 set role for Wrapped Token Gateway contract " + primaryLendingPlatformWrappedTokenGatewayProxyAddress);
                });
            }
        }

        console.log();
        console.log("***** 6. Setting PLP Liquidation *****");
        {
            let moderatorRoleLiquidation = await plpLiquidationImplementation.MODERATOR_ROLE();
            let isModeratorLiquidation = await plpLiquidationImplementation.hasRole(moderatorRoleLiquidation, deployMasterAddress);
            if (!isModeratorLiquidation) {
                await plpLiquidationImplementation.initialize(primaryLendingPlatformV2ProxyAddress)
                    .then(function (instance) {
                        console.log("Transaction hash: " + instance.hash);
                        console.log("PrimaryLendingPlatformLiquidation Implementation call initialize at " + plpLiquidationImplementation.address);
                    });
            }
        }

        {
            let moderatorRoleLiquidation = await plpLiquidation.MODERATOR_ROLE();
            let isModeratorLiquidation = await plpLiquidation.hasRole(moderatorRoleLiquidation, deployMasterAddress);
            if (!isModeratorLiquidation) {
                await plpLiquidation.initialize(primaryLendingPlatformV2ProxyAddress)
                    .then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("PrimaryLendingPlatformLiquidation call initialize at " + plpLiquidation.address);
                    });
            }
        }

        {
            let minPartialLiquidationAmount = await plpLiquidation.minPartialLiquidationAmount();
            if (minPartialLiquidationAmount != minPA) {
                await plpLiquidation.setMinPartialLiquidationAmount(minPA).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PrimaryLendingPlatformLiquidation set minPA " + minPA);
                });
            }
        }

        {
            let maxLRF = await plpLiquidation.maxLRF();
            if (maxLRF.numerator != maxLRFNumerator || maxLRF.denominator != maxLRFDenominator) {
                await plpLiquidation.setMaxLRF(maxLRFNumerator, maxLRFDenominator).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PrimaryLendingPlatformLiquidation set maxLRF " + maxLRFNumerator + "/" + maxLRFDenominator);
                });
            }
        }

        {
            let liquidatorRewardCalcFactor = await plpLiquidation.liquidatorRewardCalcFactor();
            if (liquidatorRewardCalcFactor.numerator != rewardCalcFactorNumerator || liquidatorRewardCalcFactor.denominator != rewardCalcFactorDenominator) {
                await plpLiquidation.setLiquidatorRewardCalculationFactor(rewardCalcFactorNumerator, rewardCalcFactorDenominator).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PrimaryLendingPlatformLiquidation set rewardCalcFactor " + rewardCalcFactorNumerator + "/" + rewardCalcFactorDenominator);
                });
            }
        }

        {
            let targetHealthFactor = await plpLiquidation.targetHealthFactor();
            if (targetHealthFactor.numerator != targetHFNumerator || targetHealthFactor.denominator != targetHFDenominator) {
                await plpLiquidation.setTargetHealthFactor(targetHFNumerator, targetHFDenominator).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PrimaryLendingPlatformLiquidation set targetHF " + targetHFNumerator + "/" + targetHFDenominator);
                });
            }
        }

        console.log();
        console.log("***** 7. Setting PLP atomic repayment *****");
        {
            let moderatorRoleAtomic = await plpAtomicRepaymentImplementation.MODERATOR_ROLE();
            let isModeratorAtomic = await plpAtomicRepaymentImplementation.hasRole(moderatorRoleAtomic, deployMasterAddress);
            if (!isModeratorAtomic) {
                await plpAtomicRepaymentImplementation.initialize(primaryLendingPlatformV2ProxyAddress)
                    .then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("PrimaryLendingPlatformAtomicRepayment Implementation call initialize at " + plpAtomicRepaymentImplementation.address);
                    });
            }
        }

        {
            let moderatorRoleAtomic = await plpAtomicRepayment.MODERATOR_ROLE();
            let isModeratorAtomic = await plpAtomicRepayment.hasRole(moderatorRoleAtomic, deployMasterAddress);
            if (!isModeratorAtomic) {
                await plpAtomicRepayment.initialize(primaryLendingPlatformV2ProxyAddress)
                    .then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("PrimaryLendingPlatformAtomicRepayment call initialize at " + plpAtomicRepayment.address);
                    });
            }
        }
        console.log();
        let currentExchangeAggregator = await plpAtomicRepayment.exchangeAggregator();
        let currentRegistryAggregator = await plpAtomicRepayment.registryAggregator();
        if (exchangeAggregator != currentExchangeAggregator || registryAggregator != currentRegistryAggregator) {
            await plpAtomicRepayment.setExchangeAggregator(exchangeAggregator, registryAggregator)
                .then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PrimaryLendingPlatformAtomicRepayment set ExchangeAggregator:");
                    console.log("ExchangeAggregator: " + exchangeAggregator);
                    console.log("RegistryAggregator: " + registryAggregator);
                });
        }


        console.log();
        console.log("***** 8. Setting PLP leverage *****");
        
        {
            let moderatorRoleLeverage = await plpLeverageImplementation.MODERATOR_ROLE();
            let isModeratorLeverage = await plpLeverageImplementation.hasRole(moderatorRoleLeverage, deployMasterAddress);
            if (!isModeratorLeverage) {
                await plpLeverageImplementation.initialize(primaryLendingPlatformV2ProxyAddress)
                    .then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("PrimaryLendingPlatformLeverage Implementation call initialize at " + plpLeverageImplementation.address);
                    });
            }
        }

        {
            let moderatorRoleLeverage = await plpLeverage.MODERATOR_ROLE();
            let isModeratorLeverage = await plpLeverage.hasRole(moderatorRoleLeverage, deployMasterAddress);
            if (!isModeratorLeverage) {
                await plpLeverage.initialize(primaryLendingPlatformV2ProxyAddress)
                    .then(function (instance) {
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("PrimaryLendingPlatformLeverage call initialize at " + plpLeverage.address);
                    });
            }
        }
        console.log();
        currentExchangeAggregator = await plpLeverage.exchangeAggregator();
        currentRegistryAggregator = await plpLeverage.registryAggregator();
        if (exchangeAggregator != currentExchangeAggregator || registryAggregator != currentRegistryAggregator) {
            await plpLeverage.setExchangeAggregator(exchangeAggregator, registryAggregator)
            .then(function (instance) {
                console.log("\nTransaction hash: " + instance.hash);
                console.log("PrimaryLendingPlatformLeverage set ExchangeAggregator:");
                console.log("ExchangeAggregator: " + exchangeAggregator);
                console.log("RegistryAggregator: " + registryAggregator);
            });
        }

        console.log();
        console.log("***** 9. Setting PLP Wrapped Token Gateway *****");
        
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
                        console.log("Transaction hash: " + instance.hash);
                        console.log("PrimaryLendingPlatformWrappedTokenGateway Implementation call initialize at " + plpWrappedTokenGatewayImplementation.address);
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
                        console.log("\nTransaction hash: " + instance.hash);
                        console.log("PrimaryLendingPlatformWrappedTokenGateway call initialize at " + plpWrappedTokenGateway.address);
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
};