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
    deploymentPrimaryLendingPlatform: async function () {

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

        let jumpRateModel;
        let bondtroller;
        let blending;
        let plp;
        let plpAtomicRepayment;
        let plpLiquidation;
        let plpLeverage;
        let plpModerator;
        let plpWrappedTokenGateway;

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

        let tokens = plpModeratorParams.tokens;
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

        console.log("Network name: zksync " + network);
        console.log("DeployMaster: " + deployMasterAddress);
        //====================================================
        //deploy proxy admin

        console.log();
        console.log("***** PROXY ADMIN DEPLOYMENT *****");
        if (!proxyAdminAddress) {
            let proxyAdmin = await deployer.deploy(ProxyAdmin, []);
            proxyAdminAddress = proxyAdmin.address;
            if (!isTesting) config.PRIMARY_PROXY_ADMIN = proxyAdminAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }

        console.log("ProxyAdmin deployed at: " + proxyAdminAddress);
        await verify(proxyAdminAddress, [], "PRIMARY_PROXY_ADMIN");

        //====================================================
        console.log();
        console.log("***** BONDTROLLER DEPLOYMENT *****");

        if (!bondtrollerLogicAddress) {
            bondtroller = await deployer.deploy(Bondtroller, []);
            bondtrollerLogicAddress = bondtroller.address;
            if (!isTesting) config.BondtrollerLogic = bondtrollerLogicAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }
        console.log("Bondtroller logic address: " + bondtrollerLogicAddress);
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
        console.log("Bondtroller proxy address: " + bondtrollerProxyAddress);
        await verify(bondtrollerProxyAddress, [
            bondtrollerLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "BondtrollerProxy");

        //====================================================

        console.log();
        console.log("***** JUMP RATE MODEL DEPLOYMENT *****");
        if (!jumpRateModelLogicAddress) {
            let jumpRateModel = await deployer.deploy(JumpRateModel, []);
            jumpRateModelLogicAddress = jumpRateModel.address;
            if (!isTesting) config.JumpRateModelLogic = jumpRateModelLogicAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }
        console.log("JumpRateModel masterCopy address: " + jumpRateModelLogicAddress);
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
        console.log("JumpRateModel proxy address: " + jumpRateModelProxyAddress);
        await verify(jumpRateModelProxyAddress, [
            jumpRateModelLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "JumpRateModelProxy");

        //====================================================

        console.log();
        console.log("***** BLENDING TOKEN DEPLOYMENT *****");

        if (!blendingTokenLogicAddress) {
            blending = await deployer.deploy(BLendingToken, [],);
            blendingTokenLogicAddress = blending.address;
            if (!isTesting) config.BLendingTokenLogic = blendingTokenLogicAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }
        console.log("BLendingToken masterCopy address: " + blendingTokenLogicAddress);
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

        console.log("BLendingToken proxy address: " + blendingTokenProxyAddresses);
        await verify(blendingTokenProxyAddresses[0], [
            blendingTokenLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "BLendingTokenProxies");

        //====================================================

        console.log();
        console.log("***** PRIMARY LENDING PLATFORM DEPLOYMENT *****");

        if (!primaryLendingPlatformV2LogicAddress) {
            plp = await deployer.deploy(PrimaryLendingPlatformV2, []);
            primaryLendingPlatformV2LogicAddress = plp.address;
            if (!isTesting) config.PrimaryLendingPlatformV2Logic = primaryLendingPlatformV2LogicAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }

        console.log("PrimaryLendingPlatformV2 masterCopy address: " + primaryLendingPlatformV2LogicAddress);
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

        console.log("PrimaryLendingPlatformV2 proxy address: " + primaryLendingPlatformV2ProxyAddress);
        await verify(primaryLendingPlatformV2ProxyAddress, [
            primaryLendingPlatformV2LogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryLendingPlatformV2Proxy");

        //====================================================

        console.log();
        console.log("***** PRIMARY LENDING PLATFORM MODERATOR DEPLOYMENT *****");

        if (!primaryLendingPlatformModeratorLogicAddress) {
            plpModerator = await deployer.deploy(PrimaryLendingPlatformModerator, []);
            primaryLendingPlatformModeratorLogicAddress = plpModerator.address;
            if (!isTesting) config.PrimaryLendingPlatformModeratorLogic = primaryLendingPlatformModeratorLogicAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }

        console.log("PrimaryLendingPlatformModerator masterCopy address: " + primaryLendingPlatformModeratorLogicAddress);
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

        console.log("PrimaryLendingPlatformModerator proxy address: " + primaryLendingPlatformModeratorProxyAddress);
        await verify(primaryLendingPlatformModeratorProxyAddress, [
            primaryLendingPlatformModeratorLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryLendingPlatformModeratorProxy");


        //====================================================

        console.log();
        console.log("***** PrimaryLendingPlatformLiquidation DEPLOYMENT *****");

        if (!primaryLendingPlatformLiquidationLogicAddress) {
            plpLiquidation = await deployer.deploy(PrimaryLendingPlatformLiquidation, []);
            primaryLendingPlatformLiquidationLogicAddress = plpLiquidation.address;
            if (!isTesting) config.PrimaryLendingPlatformLiquidationLogic = primaryLendingPlatformLiquidationLogicAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }

        console.log("PrimaryLendingPlatformLiquidation masterCopy address: " + primaryLendingPlatformLiquidationLogicAddress);
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

        console.log("PrimaryLendingPlatformLiquidation proxy address: " + primaryLendingPlatformLiquidationProxyAddress);
        await verify(primaryLendingPlatformLiquidationProxyAddress, [
            primaryLendingPlatformLiquidationLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryLendingPlatformLiquidationProxy");

        //====================================================

        console.log();
        console.log("***** PrimaryLendingPlatformAtomicRepayment DEPLOYMENT *****");

        if (!primaryLendingPlatformAtomicRepaymentLogicAddress) {
            plpAtomicRepayment = await deployer.deploy(PrimaryLendingPlatformAtomicRepayment, []);
            primaryLendingPlatformAtomicRepaymentLogicAddress = plpAtomicRepayment.address;
            if (!isTesting) config.PrimaryLendingPlatformAtomicRepaymentLogic = primaryLendingPlatformAtomicRepaymentLogicAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }

        console.log("PrimaryLendingPlatformAtomicRepayment masterCopy address: " + primaryLendingPlatformAtomicRepaymentLogicAddress);
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

        console.log("PrimaryLendingPlatformAtomicRepayment proxy address: " + primaryLendingPlatformAtomicRepaymentProxyAddress);
        await verify(primaryLendingPlatformAtomicRepaymentProxyAddress, [
            primaryLendingPlatformAtomicRepaymentLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryLendingPlatformAtomicRepaymentProxy");

        //====================================================

        console.log();
        console.log("***** PrimaryLendingPlatformLeverage DEPLOYMENT *****");

        if (!primaryLendingPlatformLeverageLogicAddress) {
            plpLeverage = await deployer.deploy(PrimaryLendingPlatformLeverage, []);
            primaryLendingPlatformLeverageLogicAddress = plpLeverage.address;
            if (!isTesting) config.PrimaryLendingPlatformLeverageLogic = primaryLendingPlatformLeverageLogicAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }

        console.log("PrimaryLendingPlatformLeverage masterCopy address: " + primaryLendingPlatformLeverageLogicAddress);
        await verify(primaryLendingPlatformLeverageLogicAddress, [], "PrimaryLendingPlatformLeverageLogic");

        if (!primaryLendingPlatformLeverageProxyAddress) {
            let pitLeverageProxy = await deployer.deploy(TransparentUpgradeableProxy,
                [
                    primaryLendingPlatformLeverageLogicAddress,
                    proxyAdminAddress,
                    "0x"
                ]
            );
            primaryLendingPlatformLeverageProxyAddress = pitLeverageProxy.address;
            if (!isTesting) config.PrimaryLendingPlatformLeverageProxy = primaryLendingPlatformLeverageProxyAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }

        console.log("PrimaryIndexTokeLeverage proxy address: " + primaryLendingPlatformLeverageProxyAddress);
        await verify(primaryLendingPlatformLeverageProxyAddress, [
            primaryLendingPlatformLeverageLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryLendingPlatformLeverageProxy");


        //====================================================
        console.log();
        console.log("***** PrimaryLendingPlatformWrappedTokenGateway DEPLOYMENT *****");

        if (!primaryLendingPlatformWrappedTokenGatewayLogicAddress) {
            plpWrappedTokenGateway = await deployer.deploy(PrimaryLendingPlatformWrappedTokenGateway, []);
            primaryLendingPlatformWrappedTokenGatewayLogicAddress = plpWrappedTokenGateway.address;
            if (!isTesting) config.PrimaryLendingPlatformWrappedTokenGatewayLogic = primaryLendingPlatformWrappedTokenGatewayLogicAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }

        console.log("PrimaryLendingPlatformWrappedTokenGateway masterCopy address: " + primaryLendingPlatformWrappedTokenGatewayLogicAddress);
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

        console.log("PrimaryLendingPlatformWrappedTokenGateway proxy address: " + PrimaryLendingPlatformWrappedTokenGatewayProxy);
        await verify(PrimaryLendingPlatformWrappedTokenGatewayProxy, [
            primaryLendingPlatformWrappedTokenGatewayLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryLendingPlatformWrappedTokenGatewayProxy");


        //====================================================
        //setting params

        //instances of contracts
        let bondtrollerInterface = new ethers.utils.Interface(Bondtroller.abi);
        let jumpRateModelInterface = new ethers.utils.Interface(JumpRateModel.abi);
        let plpInterface = new ethers.utils.Interface(PrimaryLendingPlatformV2.abi);
        let plpLiquidationInterface = new ethers.utils.Interface(PrimaryLendingPlatformLiquidation.abi);
        let plpAtomicRepaymentInterface = new ethers.utils.Interface(PrimaryLendingPlatformAtomicRepayment.abi);
        let plpLeverageInterface = new ethers.utils.Interface(PrimaryLendingPlatformLeverage.abi);
        let plpModeratorInterface = new ethers.utils.Interface(PrimaryLendingPlatformModerator.abi);
        let plpWrappedTokenGatewayInterface = new ethers.utils.Interface(PrimaryLendingPlatformWrappedTokenGateway.abi);

        bondtroller = new ethers.Contract(bondtrollerProxyAddress, bondtrollerInterface, wallet);
        jumpRateModel = new ethers.Contract(jumpRateModelProxyAddress, jumpRateModelInterface, wallet);
        plp = new ethers.Contract(primaryLendingPlatformV2ProxyAddress, plpInterface, wallet);
        plpLiquidation = new ethers.Contract(primaryLendingPlatformLiquidationProxyAddress, plpLiquidationInterface, wallet);
        plpAtomicRepayment = new ethers.Contract(primaryLendingPlatformAtomicRepaymentProxyAddress, plpAtomicRepaymentInterface, wallet);
        plpLeverage = new ethers.Contract(primaryLendingPlatformLeverageProxyAddress, plpLeverageInterface, wallet);
        plpModerator = new ethers.Contract(primaryLendingPlatformModeratorProxyAddress, plpModeratorInterface, wallet);
        plpWrappedTokenGateway = new ethers.Contract(primaryLendingPlatformWrappedTokenGatewayProxyAddress, plpWrappedTokenGatewayInterface, wallet);

        console.log();
        console.log("***** 1. Setting Bondtroller *****");
        let adminBondtroller = await bondtroller.admin();
        if (adminBondtroller == ZERO_ADDRESS) {
            await bondtroller.init().then(function (instance) {
                console.log("Bondtroller " + bondtroller.address + "call init at tx hash: " + instance.hash);
            });
        }

        {
            let primaryIndexTokenAddress = await bondtroller.getPrimaryLendingPlatformAddress();
            if (primaryIndexTokenAddress != primaryLendingPlatformV2ProxyAddress) {
                await bondtroller.setPrimaryLendingPlatformAddress(primaryLendingPlatformV2ProxyAddress).then(function () {
                    console.log("Bondtroller set PIT " + primaryLendingPlatformV2ProxyAddress);
                });
            }
        }

        {
            let allMarkets = await bondtroller.getAllMarkets();
            for (var i = 0; i < blendingTokenProxyAddresses.length; i++) {
                if (allMarkets.indexOf(blendingTokenProxyAddresses[i]) == -1) {
                    await bondtroller.supportMarket(blendingTokenProxyAddresses[i]).then(function () {
                        console.log("Bondtroller support market " + blendingTokenProxyAddresses[i]);
                    });
                }
            }
        }

        console.log();
        console.log("***** 2. Setting JumRateModel *****");

        let MODERATOR_ROLE = await jumpRateModel.MODERATOR_ROLE();
        let isMODERATOR = await jumpRateModel.hasRole(MODERATOR_ROLE, deployMasterAddress);
        if (!isMODERATOR) {
            await jumpRateModel.initialize(blocksPerYear).then(function (instance) {
                console.log("JumpRateModel " + jumpRateModelProxyAddress + " call initialize at tx hash " + instance.hash);
            });
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
                    console.log("JumpRateModel " + jumpRateModelProxyAddress + " add BLendingToken Suport " + BLendingTokenProxies[i] + " with params: " + gainPerYear[i] + ", " + jumGainPerYear[i] + ", " + targetUtil[i] + " at tx hash " + instance.hash);
                });
            }
        }

        console.log();
        console.log("***** 3. Setting BLending token *****");

        for (var i = 0; i < lendingTokens.length; i++) {
            blendingInterface = new ethers.utils.Interface(BLendingToken.abi);
            blending = new ethers.Contract(blendingTokenProxyAddresses[i], blendingInterface, wallet);
            let adminBlendingToken = await blending.admin();
            if (adminBlendingToken == ZERO_ADDRESS) {
                let admin = wallet.address;
                console.log("blending " + blending.address + " admin " + admin);
                await blending.init(
                    lendingTokens[i],
                    bondtrollerProxyAddress,
                    jumpRateModelProxyAddress,
                    initialExchangeRateMantissa[i],
                    name[i],
                    symbol[i],
                    decimals[i],
                    admin
                ).then(function () {
                    console.log("blending call init at " + blending.address);
                });
            }
            {
                let plpAddress = await blending.primaryLendingPlatform();
                if (plpAddress != primaryLendingPlatformV2ProxyAddress) {
                    await blending.setPrimaryLendingPlatform(primaryLendingPlatformV2ProxyAddress,).then(function () {
                        console.log("blending " + blending.address + " set primaryLendingPlatform " + primaryLendingPlatformV2ProxyAddress);
                    });
                }
            }
        }
        console.log();
        console.log("***** 4. Setting PLP token *****");
        let defaultAdminRolePlp = await plp.DEFAULT_ADMIN_ROLE();
        let isDefaultAdminPlp = await plp.hasRole(defaultAdminRolePlp, deployMasterAddress);
        if (!isDefaultAdminPlp) {
            await plp.initialize()
                .then(function () {
                    console.log("PrimaryLendingPlatformV2 call initialize at " + plp.address);
                });
        }

        {
            let plpModerator = await plp.primaryLendingPlatformModerator();
            if (plpModerator != primaryLendingPlatformModeratorProxyAddress) {
                await plp.setPrimaryLendingPlatformModerator(primaryLendingPlatformModeratorProxyAddress)
                    .then(function () {
                        console.log("PrimaryLendingPlatformV2 set moderator contract: " + primaryLendingPlatformModeratorProxyAddress);
                    });
            }
        }

        console.log();
        console.log("***** 5. Setting PLP Moderator token *****");
        let primaryLendingPlatform = await plpModerator.primaryLendingPlatform();
        if (primaryLendingPlatform == ZERO_ADDRESS) {
            let tx = await plpModerator.initialize(primaryLendingPlatformV2ProxyAddress,)
                .then(function () {
                    console.log("PrimaryLendingPlatformV2 call initialize at " + plpModerator.address);
                });
        }
        {
            let priceOracle = await plp.priceOracle();
            if (priceOracle != PriceProviderAggregatorProxy) {
                await plpModerator.setPriceOracle(PriceProviderAggregatorProxy).then(function () {
                    console.log("PrimaryLendingPlatformV2 set priceOracle: " + PriceProviderAggregatorProxy);
                });
            }
        }

        for (var i = 0; i < tokens.length; i++) {
            let projectTokenInfo = await plp.projectTokenInfo(tokens[i]);
            if (projectTokenInfo.isListed == false
                || projectTokenInfo.loanToValueRatio.numerator != loanToValueRatioNumerator[i]
                || projectTokenInfo.loanToValueRatio.denominator != loanToValueRatioDenominator[i]
            ) {
                await plpModerator.addProjectToken(
                    tokens[i],
                    loanToValueRatioNumerator[i],
                    loanToValueRatioDenominator[i]
                ).then(function () {
                    console.log("Added prj token: " + tokens[i] + " with:");
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
                    loanToValueRatioDenominatorLendingToken[i]
                ).then(function () {
                    console.log("Added lending token: " + lendingTokens[i]);
                    console.log("LoanToValueRatio: ");
                    console.log("   Numerator:   " + loanToValueRatioNumeratorLendingToken[i]);
                    console.log("   Denominator: " + loanToValueRatioDenominatorLendingToken[i]);
                });
        }

        for (var i = 0; i < tokens.length; i++) {
            let borrowLimitPerCollateralValue = await plp.borrowLimitPerCollateral(tokens[i]);
            if (borrowLimitPerCollateralValue.toString() != borrowLimitPerCollateral[i]) {
                await plpModerator.setBorrowLimitPerCollateralAsset(
                    tokens[i],
                    borrowLimitPerCollateral[i]
                ).then(function () {
                    console.log("PrimaryLendingPlatformV2 set " + tokens[i] + " borrow limit " + borrowLimitPerCollateral[i]);
                });
            }
        }

        for (var i = 0; i < lendingTokens.length; i++) {
            let borrowLimitPerLendingTokenValue = await plp.borrowLimitPerLendingToken(lendingTokens[i]);
            if (borrowLimitPerLendingTokenValue.toString() != borrowLimitPerLendingToken[i]) {
                await plpModerator.setBorrowLimitPerLendingAsset(
                    lendingTokens[i],
                    borrowLimitPerLendingToken[i]
                ).then(function () {
                    console.log("PrimaryLendingPlatformV2 set " + lendingTokens[i] + " borrow limit " + borrowLimitPerLendingToken[i]);
                });
            }
        }

        {
            let primaryLendingPlatformLeverage = await plp.primaryLendingPlatformLeverage();
            if (primaryLendingPlatformLeverage != primaryLendingPlatformLeverageProxyAddress) {
                await plpModerator.setPrimaryLendingPlatformLeverage(primaryLendingPlatformLeverageProxyAddress).then(function () {
                    console.log("PrimaryLendingPlatformV2 set Leverage contract " + primaryLendingPlatformLeverageProxyAddress);
                });
            }
        }

        {
            let isRelatedContract = await plp.isRelatedContract(primaryLendingPlatformAtomicRepaymentProxyAddress);
            if (isRelatedContract == false) {
                await plpModerator.addRelatedContracts(primaryLendingPlatformAtomicRepaymentProxyAddress).then(function () {
                    console.log("PrimaryLendingPlatformV2 set role for atomic repayment contract " + primaryLendingPlatformAtomicRepaymentProxyAddress);
                });
            }
        }

        {
            let isRelatedContract = await plp.isRelatedContract(primaryLendingPlatformLiquidationProxyAddress);
            if (isRelatedContract == false) {
                await plpModerator.addRelatedContracts(primaryLendingPlatformLiquidationProxyAddress).then(function () {
                    console.log("PrimaryLendingPlatformV2 set role for liquidation contract " + primaryLendingPlatformLiquidationProxyAddress);
                });
            }
        }

        {
            let isRelatedContract = await plp.isRelatedContract(primaryLendingPlatformLeverageProxyAddress);
            if (isRelatedContract == false) {
                await plpModerator.addRelatedContracts(primaryLendingPlatformLeverageProxyAddress).then(function () {
                    console.log("PrimaryLendingPlatformV2 set role for Leverage contract " + primaryLendingPlatformLeverageProxyAddress);
                });
            }
        }

        {
            let isRelatedContract = await plp.isRelatedContract(primaryLendingPlatformWrappedTokenGatewayProxyAddress);
            if (isRelatedContract == false) {
                await plpModerator.addRelatedContracts(primaryLendingPlatformWrappedTokenGatewayProxyAddress).then(function () {
                    console.log("PrimaryLendingPlatformV2 set role for Wrapped Token Gateway contract " + primaryLendingPlatformWrappedTokenGatewayProxyAddress);
                });
            }
        }

        console.log();
        console.log("***** 6. Setting PLP Liquidation *****");
        let moderatorRoleLiquidation = await plpLiquidation.MODERATOR_ROLE();
        let isModeratorLiquidation = await plpLiquidation.hasRole(moderatorRoleLiquidation, deployMasterAddress);
        if (!isModeratorLiquidation) {
            await plpLiquidation.initialize(primaryLendingPlatformV2ProxyAddress)
                .then(function () {
                    console.log("PrimaryLendingPlatformLiquidation call initialize at " + plpLiquidation.address);
                });
        }

        {
            let minPartialLiquidationAmount = await plpLiquidation.minPartialLiquidationAmount();
            if (minPartialLiquidationAmount != minPA) {
                await plpLiquidation.setMinPartialLiquidationAmount(minPA).then(function () {
                    console.log("PrimaryLendingPlatformLiquidation set minPA " + minPA);
                });
            }
        }

        {
            let maxLRF = await plpLiquidation.maxLRF();
            if (maxLRF.numerator != maxLRFNumerator || maxLRF.denominator != maxLRFDenominator) {
                await plpLiquidation.setMaxLRF(maxLRFNumerator, maxLRFDenominator).then(function () {
                    console.log("PrimaryLendingPlatformLiquidation set maxLRF " + maxLRFNumerator + "/" + maxLRFDenominator);
                });
            }
        }

        {
            let liquidatorRewardCalcFactor = await plpLiquidation.liquidatorRewardCalcFactor();
            if (liquidatorRewardCalcFactor.numerator != rewardCalcFactorNumerator || liquidatorRewardCalcFactor.denominator != rewardCalcFactorDenominator) {
                await plpLiquidation.setLiquidatorRewardCalculationFactor(rewardCalcFactorNumerator, rewardCalcFactorDenominator).then(function () {
                    console.log("PrimaryLendingPlatformLiquidation set rewardCalcFactor " + rewardCalcFactorNumerator + "/" + rewardCalcFactorDenominator);
                });
            }
        }

        {
            let targetHealthFactor = await plpLiquidation.targetHealthFactor();
            if (targetHealthFactor.numerator != targetHFNumerator || targetHealthFactor.denominator != targetHFDenominator) {
                await plpLiquidation.setTargetHealthFactor(targetHFNumerator, targetHFDenominator).then(function () {
                    console.log("PrimaryLendingPlatformLiquidation set targetHF " + targetHFNumerator + "/" + targetHFDenominator);
                });
            }
        }

        console.log();
        console.log("***** 7. Setting PLP atomic repayment *****");
        let moderatorRoleAtomic = await plpAtomicRepayment.MODERATOR_ROLE();
        let isModeratorAtomic = await plpAtomicRepayment.hasRole(moderatorRoleAtomic, deployMasterAddress);
        if (!isModeratorAtomic) {
            await plpAtomicRepayment.initialize(primaryLendingPlatformV2ProxyAddress)
                .then(function () {
                    console.log("PrimaryLendingPlatformAtomicRepayment call initialize at " + plpAtomicRepayment.address);
                });
        }
        console.log();
        let currentExchangeAggregator = await plpAtomicRepayment.exchangeAggregator();
        let currentRegistryAggregator = await plpAtomicRepayment.registryAggregator();
        if (exchangeAggregator != currentExchangeAggregator || registryAggregator != currentRegistryAggregator) {
            await plpAtomicRepayment.setExchangeAggregator(exchangeAggregator, registryAggregator)
                .then(function () {
                    console.log("PrimaryLendingPlatformAtomicRepayment set ExchangeAggregator at:");
                    console.log("ExchangeAggregator: " + exchangeAggregator);
                    console.log("RegistryAggregator: " + registryAggregator);
                });
        }


        console.log();
        console.log("***** 8. Setting PLP leverage *****");
        let moderatorRoleLeverage = await plpLeverage.MODERATOR_ROLE();
        let isModeratorLeverage = await plpLeverage.hasRole(moderatorRoleLeverage, deployMasterAddress);
        if (!isModeratorLeverage) {
            await plpLeverage.initialize(primaryLendingPlatformV2ProxyAddress)
                .then(function () {
                    console.log("PrimaryLendingPlatformLeverage call initialize at " + plpLeverage.address);
                });
        }
        console.log();
        currentExchangeAggregator = await plpLeverage.exchangeAggregator();
        currentRegistryAggregator = await plpLeverage.registryAggregator();
        if (exchangeAggregator != currentExchangeAggregator || registryAggregator != currentRegistryAggregator) {
            await plpLeverage.setExchangeAggregator(exchangeAggregator, registryAggregator)
                .then(function () {
                    console.log("PrimaryLendingPlatformLeverage set ExchangeAggregator at:");
                    console.log("ExchangeAggregator: " + exchangeAggregator);
                    console.log("RegistryAggregator: " + registryAggregator);
                });
        }


        console.log();
        console.log("***** 9. Setting PLP Wrapped Token Gateway *****");
        let moderatorRoleWrappedTokenGateway = await plpWrappedTokenGateway.MODERATOR_ROLE();
        let isModeratorWrappedTokenGateway = await plpWrappedTokenGateway.hasRole(moderatorRoleWrappedTokenGateway, deployMasterAddress);
        if (!isModeratorWrappedTokenGateway) {
            await plpWrappedTokenGateway.initialize(
                primaryLendingPlatformV2ProxyAddress,
                WETH,
                primaryLendingPlatformLiquidationProxyAddress,
                primaryLendingPlatformLeverageProxyAddress,

            )
                .then(function () {
                    console.log("PrimaryLendingPlatformWrappedTokenGateway call initialize at " + plpWrappedTokenGateway.address);
                });
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
            projectTokens: tokens,
            lendingTokens: lendingTokens
        };
        return addresses;
    }
}