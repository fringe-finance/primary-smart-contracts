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

const verify = async (address, constructorArguments, keyInConfig) => {
    console.log("Verifying " + address);
    if (!verifyFile[keyInConfig]) {
        await hre.run(`verify:verify`, {
            address,
            constructorArguments ,
        });
        verifyFile[keyInConfig] = true;
        fs.writeFileSync(path.join(verifyFilePath), JSON.stringify(verifyFile, null, 2));
    }
    console.log("Verified " + address);
}

module.exports = {
   
    deploymentPrimaryLendingPlatform : async function () {
        let network = await hre.network;
        console.log("Network name: "+network.name);
       
        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];
        let deployMasterAddress = deployMaster.address;
        console.log("DeployMaster: " + deployMasterAddress);

        // Contracts ABI
        let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
        let TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
        let JumpRateModel = await hre.ethers.getContractFactory("JumpRateModelV3");
        let Bondtroller = await hre.ethers.getContractFactory("Bondtroller");
        let BLendingToken = await hre.ethers.getContractFactory("BLendingToken");
        let PrimaryIndexToken = await hre.ethers.getContractFactory("PrimaryIndexToken");
        let PrimaryIndexTokenAtomicRepayment = await hre.ethers.getContractFactory("PrimaryIndexTokenAtomicRepayment");
        let PrimaryIndexTokenLiquidation = await hre.ethers.getContractFactory("PrimaryIndexTokenLiquidation");
        let PrimaryIndexTokenLeverage = await hre.ethers.getContractFactory("PrimaryIndexTokenLeverage");
        let PrimaryIndexTokenModerator = await hre.ethers.getContractFactory("PrimaryIndexTokenModerator");
        let PrimaryIndexTokenWrappedTokenGateway = await hre.ethers.getContractFactory("PrimaryIndexTokenWrappedTokenGateway");

        let jumpRateModel;
        let bondtroller;
        let blending;
        let pit;
        let pitAtomicRepayment;
        let pitLiquidation;
        let pitLeverage;
        let pitModerator;
        let pitWrappedTokenGateway;

        const {
            priceOracle,
            pitModeratorParams,
            blendingToken,
            jumRateModel,
            pitAtomicRepaymentParams,
            pitLiquidationParams
        } = configGeneral;

        const {
            PRIMARY_PROXY_ADMIN,
            PriceProviderAggregatorProxy,
            BondtrollerLogic,
            BondtrollerProxy,
            BLendingTokenLogic,
            BLendingTokenProxies,
            PrimaryIndexTokenLogic,
            PrimaryIndexTokenProxy,
            JumpRateModelLogic,
            JumpRateModelProxy,
            PrimaryIndexTokenAtomicRepaymentLogic,
            PrimaryIndexTokenAtomicRepaymentProxy,
            PrimaryIndexTokenLiquidationLogic,
            PrimaryIndexTokenLiquidationProxy,
            PrimaryIndexTokenLeverageLogic,
            PrimaryIndexTokenLeverageProxy,
            PrimaryIndexTokenModeratorLogic,
            PrimaryIndexTokenModeratorProxy,
            PrimaryIndexTokenWrappedTokenGatewayLogic,
            PrimaryIndexTokenWrappedTokenGatewayProxy,
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

        let primaryIndexTokenLogicAddress = PrimaryIndexTokenLogic;
        let primaryIndexTokenProxyAddress = PrimaryIndexTokenProxy;

        let primaryIndexTokenAtomicRepaymentLogicAddress = PrimaryIndexTokenAtomicRepaymentLogic;
        let primaryIndexTokenAtomicRepaymentProxyAddress = PrimaryIndexTokenAtomicRepaymentProxy;
        let primaryIndexTokenLiquidationLogicAddress = PrimaryIndexTokenLiquidationLogic;
        let primaryIndexTokenLiquidationProxyAddress = PrimaryIndexTokenLiquidationProxy;

        let primaryIndexTokenLeverageLogicAddress = PrimaryIndexTokenLeverageLogic;
        let primaryIndexTokenLeverageProxyAddress = PrimaryIndexTokenLeverageProxy;

        let primaryIndexTokenModeratorLogicAddress = PrimaryIndexTokenModeratorLogic;
        let primaryIndexTokenModeratorProxyAddress = PrimaryIndexTokenModeratorProxy;

        let primaryIndexTokenWrappedTokenGatewayLogicAddress = PrimaryIndexTokenWrappedTokenGatewayLogic;
        let primaryIndexTokenWrappedTokenGatewayProxyAddress = PrimaryIndexTokenWrappedTokenGatewayProxy;

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
        let reserveFactorMantissa = blendingToken.reserveFactorMantissa;
        let name = blendingToken.name;
        let symbol = blendingToken.symbol;
        let decimals = blendingToken.decimals;
        let loanToValueRatioNumeratorLendingToken = blendingToken.loanToValueRatioNumerator;
        let loanToValueRatioDenominatorLendingToken = blendingToken.loanToValueRatioDenominator;

        let tokens = pitModeratorParams.tokens;
        let loanToValueRatioNumerator = pitModeratorParams.loanToValueRatioNumerator;
        let loanToValueRatioDenominator = pitModeratorParams.loanToValueRatioDenominator;
        let liquidationTresholdFactorNumerator = pitModeratorParams.liquidationTresholdFactorNumerator;
        let liquidationTresholdFactorDenominator = pitModeratorParams.liquidationTresholdFactorDenominator;
        let liquidationIncentiveNumerator = pitModeratorParams.liquidationIncentiveNumerator;
        let liquidationIncentiveDenominator = pitModeratorParams.liquidationIncentiveDenominator;
        let isPaused = pitModeratorParams.isPaused;
        let usdc = pitModeratorParams.usdc;
        let borrowLimitPerCollateral = pitModeratorParams.borrowLimitPerCollateral;
        let borrowLimitPerLendingToken = pitModeratorParams.borrowLimitPerLendingToken;

        let augustusParaswap = pitAtomicRepaymentParams.augustusParaswap;
        let AUGUSTUS_REGISTRY = pitAtomicRepaymentParams.AUGUSTUS_REGISTRY;

        let minPA = pitLiquidationParams.minPA;
        let maxLRFNumerator = pitLiquidationParams.maxLRFNumerator;
        let maxLRFDenominator = pitLiquidationParams.maxLRFDenominator;
        let rewardCalcFactorNumerator = pitLiquidationParams.rewardCalcFactorNumerator;
        let rewardCalcFactorDenominator = pitLiquidationParams.rewardCalcFactorDenominator;
        let targetHFNumerator = pitLiquidationParams.targetHFNumerator;
        let targetHFDenominator = pitLiquidationParams.targetHFDenominator;

    //====================================================
    //deploy proxy admin

        console.log();
        console.log("***** PROXY ADMIN DEPLOYMENT *****");
        if(!proxyAdminAddress){
            let proxyAdmin = await ProxyAdmin.connect(deployMaster).deploy();
            await proxyAdmin.deployed().then(function(instance){
                proxyAdminAddress = instance.address;
                config.PRIMARY_PROXY_ADMIN = proxyAdminAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        
        console.log("ProxyAdmin deployed at: " + proxyAdminAddress);
        await verify(proxyAdminAddress, [], "PRIMARY_PROXY_ADMIN");

    //====================================================
    //deploy price oracle

        console.log();
        console.log("***** PRICE ORACLE DEPLOYMENT *****");
        if (!priceProvider) {
            const { deploymentPriceOracle } = require('../priceOracle/deploymentPriceProividerAggregator.js')
            let priceOracleAddresses = await deploymentPriceOracle(proxyAdminAddress)
            priceProvider = priceOracleAddresses.priceProviderAggregatorAddress
        } 
        console.log("PriceOracle is deployed at: " + priceProvider);
    
    //====================================================
    console.log();
    console.log("***** BONDTROLLER DEPLOYMENT *****");

    if(!bondtrollerLogicAddress) {
        bondtroller = await Bondtroller.connect(deployMaster).deploy();
        await bondtroller.deployed().then(function(instance){
            bondtrollerLogicAddress = instance.address;
            config.BondtrollerLogic = bondtrollerLogicAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        });
    }
    console.log("Bondtroller logic address: " + bondtrollerLogicAddress);
    await verify(bondtrollerLogicAddress, [], "BondtrollerLogic");

    if(!bondtrollerProxyAddress) {
        let bondtrollerProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            bondtrollerLogicAddress,
            proxyAdminAddress,
            "0x"
        );
        await bondtrollerProxy.deployed().then(function(instance){
            bondtrollerProxyAddress = instance.address;
            config.BondtrollerProxy = bondtrollerProxyAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        });
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
        if(!jumpRateModelLogicAddress) {
            let jumpRateModel = await JumpRateModel.connect(deployMaster).deploy();
            await jumpRateModel.deployed();
            jumpRateModelLogicAddress = jumpRateModel.address;
            config.JumpRateModelLogic = jumpRateModelLogicAddress;
            fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
        }
        console.log("JumpRateModel masterCopy address: " + jumpRateModelLogicAddress);
        await verify(jumpRateModelLogicAddress, [], "JumpRateModelLogic");
        
        if(!jumpRateModelProxyAddress) {
            let jumpRateModelProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                jumpRateModelLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await jumpRateModelProxy.deployed().then(function(instance){
                jumpRateModelProxyAddress = instance.address;
                config.JumpRateModelProxy = jumpRateModelProxyAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("JumpRateModel proxy address: " + jumpRateModelProxyAddress);
        await verify(jumpRateModelProxyAddress, [
            jumpRateModelLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "JumpRateModelProxy");

    //====================================================
        console.log();
        console.log("***** BONDTROLLER DEPLOYMENT *****");

        if(!bondtrollerLogicAddress) {
            bondtroller = await Bondtroller.connect(deployMaster).deploy();
            await bondtroller.deployed().then(function(instance){
                bondtrollerLogicAddress = instance.address;
                config.BondtrollerLogic = bondtrollerLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("Bondtroller logic address: " + bondtrollerLogicAddress);
        await verify(bondtrollerLogicAddress, [], "BondtrollerLogic");

        if(!bondtrollerProxyAddress) {
            let bondtrollerProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                bondtrollerLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await bondtrollerProxy.deployed().then(function(instance){
                bondtrollerProxyAddress = instance.address;
                config.BondtrollerProxy = bondtrollerProxyAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("Bondtroller proxy address: " + bondtrollerProxyAddress);
        await verify(bondtrollerProxyAddress, [
            bondtrollerLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "BondtrollerProxy");

    //====================================================

        console.log();
        console.log("***** BLENDING TOKEN DEPLOYMENT *****");

        if(!blendingTokenLogicAddress) {
            blending = await BLendingToken.connect(deployMaster).deploy();
            await blending.deployed().then(function(instance){
                blendingTokenLogicAddress = instance.address;
                config.BLendingTokenLogic = blendingTokenLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("BLendingToken masterCopy address: " + blendingTokenLogicAddress);
        await verify(blendingTokenLogicAddress, [], "BLendingTokenLogic");

        for(var i = 0; i < lendingTokens.length; i++) {
            if(blendingTokenProxyAddresses.length < lendingTokens.length) {
                let blendingProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                    blendingTokenLogicAddress,
                    proxyAdminAddress,
                    "0x"
                );
                await blendingProxy.deployed().then(function(instance){
                    blendingTokenProxyAddresses.push(instance.address);
                });
            }
        }
        config.BLendingTokenProxies = blendingTokenProxyAddresses;
        fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));

        console.log("BLendingToken proxy address: " + blendingTokenProxyAddresses);
        await verify(blendingTokenProxyAddresses[0], [
            blendingTokenLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "BLendingTokenProxies");
        
        //====================================================

        console.log();
        console.log("***** PRIMARY INDEX TOKEN DEPLOYMENT *****");

        if(!primaryIndexTokenLogicAddress) {
            pit = await PrimaryIndexToken.connect(deployMaster).deploy();
            await pit.deployed().then(function(instance){
                primaryIndexTokenLogicAddress = instance.address;
                config.PrimaryIndexTokenLogic = primaryIndexTokenLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PrimaryIndexToken masterCopy address: " + primaryIndexTokenLogicAddress);
        await verify(primaryIndexTokenLogicAddress, [], "PrimaryIndexTokenLogic");

        if(!primaryIndexTokenProxyAddress) {
            let pitProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                primaryIndexTokenLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await pitProxy.deployed().then(function(instance){
                primaryIndexTokenProxyAddress = instance.address;
                config.PrimaryIndexTokenProxy = primaryIndexTokenProxyAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PrimaryIndexToken proxy address: " + primaryIndexTokenProxyAddress);
        await verify(primaryIndexTokenProxyAddress, [
            primaryIndexTokenLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryIndexTokenProxy");

        //====================================================

        console.log();
        console.log("***** PRIMARY INDEX TOKEN MODERATOR DEPLOYMENT *****");

        if(!primaryIndexTokenModeratorLogicAddress) {
            pitModerator = await PrimaryIndexTokenModerator.connect(deployMaster).deploy();
            await pitModerator.deployed().then(function(instance){
                primaryIndexTokenModeratorLogicAddress = instance.address;
                config.PrimaryIndexTokenModeratorLogic = primaryIndexTokenModeratorLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PrimaryIndexTokenModerator masterCopy address: " + primaryIndexTokenModeratorLogicAddress);
        await verify(primaryIndexTokenModeratorLogicAddress, [], "PrimaryIndexTokenModeratorLogic");

        if(!primaryIndexTokenModeratorProxyAddress) {
            let pitModeratorProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                primaryIndexTokenModeratorLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await pitModeratorProxy.deployed().then(function(instance){
                primaryIndexTokenModeratorProxyAddress = instance.address;
                config.PrimaryIndexTokenModeratorProxy = primaryIndexTokenModeratorProxyAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PrimaryIndexTokenModerator proxy address: " + primaryIndexTokenModeratorProxyAddress);
        await verify(primaryIndexTokenModeratorProxyAddress, [
            primaryIndexTokenModeratorLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryIndexTokenModeratorProxy");
        

        //====================================================

        console.log();
        console.log("***** PrimaryIndexTokenLiquidation DEPLOYMENT *****");

        if(!primaryIndexTokenLiquidationLogicAddress) {
            pitLiquidation = await PrimaryIndexTokenLiquidation.connect(deployMaster).deploy();
            await pitLiquidation.deployed().then(function(instance){
                primaryIndexTokenLiquidationLogicAddress = instance.address;
                config.PrimaryIndexTokenLiquidationLogic = primaryIndexTokenLiquidationLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PrimaryIndexTokenLiquidation masterCopy address: " + primaryIndexTokenLiquidationLogicAddress);
        await verify(primaryIndexTokenLiquidationLogicAddress, [], "PrimaryIndexTokenLiquidationLogic");

        if(!primaryIndexTokenLiquidationProxyAddress) {
            let pitLiquidationProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                primaryIndexTokenLiquidationLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await pitLiquidationProxy.deployed().then(function(instance){
                primaryIndexTokenLiquidationProxyAddress = instance.address;
                config.PrimaryIndexTokenLiquidationProxy = primaryIndexTokenLiquidationProxyAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PrimaryIndexTokenLiquidation proxy address: " + primaryIndexTokenLiquidationProxyAddress);
        await verify(primaryIndexTokenLiquidationProxyAddress, [
            primaryIndexTokenLiquidationLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryIndexTokenLiquidationProxy");

        //====================================================

        console.log();
        console.log("***** PrimaryIndexTokenAtomicRepayment DEPLOYMENT *****");

        if(!primaryIndexTokenAtomicRepaymentLogicAddress) {
            pitAtomicRepayment = await PrimaryIndexTokenAtomicRepayment.connect(deployMaster).deploy();
            await pitAtomicRepayment.deployed().then(function(instance){
                primaryIndexTokenAtomicRepaymentLogicAddress = instance.address;
                config.PrimaryIndexTokenAtomicRepaymentLogic= primaryIndexTokenAtomicRepaymentLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PrimaryIndexTokenAtomicRepayment masterCopy address: " + primaryIndexTokenAtomicRepaymentLogicAddress);
        await verify(primaryIndexTokenAtomicRepaymentLogicAddress, [], "PrimaryIndexTokenAtomicRepaymentLogic");

        if(!primaryIndexTokenAtomicRepaymentProxyAddress) {
            let pitAtomicRepaymentProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                primaryIndexTokenAtomicRepaymentLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await pitAtomicRepaymentProxy.deployed().then(function(instance){
                primaryIndexTokenAtomicRepaymentProxyAddress = instance.address;
                config.PrimaryIndexTokenAtomicRepaymentProxy = primaryIndexTokenAtomicRepaymentProxyAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PrimaryIndexTokenAtomicRepaymen proxy address: " + primaryIndexTokenAtomicRepaymentProxyAddress);
        await verify(primaryIndexTokenAtomicRepaymentProxyAddress, [
            primaryIndexTokenAtomicRepaymentLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryIndexTokenAtomicRepaymentProxy");

        //====================================================

        console.log();
        console.log("***** PrimaryIndexTokenLeverage DEPLOYMENT *****");

        if(!primaryIndexTokenLeverageLogicAddress) {
            pitLeverage = await PrimaryIndexTokenLeverage.connect(deployMaster).deploy();
            await pitLeverage.deployed().then(function(instance){
                primaryIndexTokenLeverageLogicAddress = instance.address;
                config.PrimaryIndexTokenLeverageLogic= primaryIndexTokenLeverageLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PrimaryIndexTokenLeverage masterCopy address: " + primaryIndexTokenLeverageLogicAddress);
        await verify(primaryIndexTokenLeverageLogicAddress, [], "PrimaryIndexTokenLeverageLogic");

        if(!primaryIndexTokenLeverageProxyAddress) {
            let pitLeverageProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                primaryIndexTokenLeverageLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await pitLeverageProxy.deployed().then(function(instance){
                primaryIndexTokenLeverageProxyAddress = instance.address;
                config.PrimaryIndexTokenLeverageProxy = primaryIndexTokenLeverageProxyAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PrimaryIndexTokeLeverage proxy address: " + primaryIndexTokenLeverageProxyAddress);
        await verify(primaryIndexTokenLeverageProxyAddress, [
            primaryIndexTokenLeverageLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryIndexTokenLeverageProxy");


        //====================================================
        console.log();
        console.log("***** PrimaryIndexTokenWrappedTokenGateway DEPLOYMENT *****");

        if(!primaryIndexTokenWrappedTokenGatewayLogicAddress) {
            pitWrappedTokenGateway = await PrimaryIndexTokenWrappedTokenGateway.connect(deployMaster).deploy();
            await pitWrappedTokenGateway.deployed().then(function(instance){
                primaryIndexTokenWrappedTokenGatewayLogicAddress = instance.address;
                config.PrimaryIndexTokenWrappedTokenGatewayLogic= primaryIndexTokenWrappedTokenGatewayLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PrimaryIndexTokenWrappedTokenGateway masterCopy address: " + PrimaryIndexTokenWrappedTokenGatewayLogic);
        await verify(PrimaryIndexTokenWrappedTokenGatewayLogic, [], "PrimaryIndexTokenWrappedTokenGatewayLogic");

        if(!primaryIndexTokenWrappedTokenGatewayProxyAddress) {
            let pitWrappedTokenGatewayProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                primaryIndexTokenWrappedTokenGatewayLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await pitWrappedTokenGatewayProxy.deployed().then(function(instance){
                primaryIndexTokenWrappedTokenGatewayProxyAddress = instance.address;
                config.PrimaryIndexTokenWrappedTokenGatewayProxy = primaryIndexTokenWrappedTokenGatewayProxyAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PrimaryIndexTokenWrappedTokenGateway proxy address: " + PrimaryIndexTokenWrappedTokenGatewayProxy);
        await verify(PrimaryIndexTokenWrappedTokenGatewayProxy, [
            primaryIndexTokenWrappedTokenGatewayLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PrimaryIndexTokenWrappedTokenGatewayProxy");


        //====================================================
        //setting params

        //instances of contracts
        bondtroller = await Bondtroller.attach(bondtrollerProxyAddress).connect(deployMaster);
        jumpRateModel = await JumpRateModel.attach(jumpRateModelProxyAddress).connect(deployMaster);
        pit = await PrimaryIndexToken.attach(primaryIndexTokenProxyAddress).connect(deployMaster);
        pitLiquidation = await PrimaryIndexTokenLiquidation.attach(primaryIndexTokenLiquidationProxyAddress).connect(deployMaster);
        pitAtomicRepayment = await PrimaryIndexTokenAtomicRepayment.attach(primaryIndexTokenAtomicRepaymentProxyAddress).connect(deployMaster);
        pitLeverage = await PrimaryIndexTokenLeverage.attach(primaryIndexTokenLeverageProxyAddress).connect(deployMaster);
        pitModerator = await PrimaryIndexTokenModerator.attach(primaryIndexTokenModeratorProxyAddress).connect(deployMaster);
        pitWrappedTokenGateway = await PrimaryIndexTokenWrappedTokenGateway.attach(primaryIndexTokenWrappedTokenGatewayProxyAddress).connect(deployMaster);

        console.log();
        console.log("***** 1. Setting Bondtroller *****");
        let adminBondtroller = await bondtroller.admin();
        if (adminBondtroller == ZERO_ADDRESS) {
            await bondtroller.init().then(function(instance){
                console.log("Bondtroller " + bondtroller.address + "call init at tx hash: " + instance.hash);
            });
        }
        
        {
            let primaryIndexTokenAddress = await bondtroller.getPrimaryIndexTokenAddress();
            if (primaryIndexTokenAddress != primaryIndexTokenProxyAddress) {
                await bondtroller.setPrimaryIndexTokenAddress(primaryIndexTokenProxyAddress).then(function(){
                    console.log("Bondtroller set PIT " + primaryIndexTokenProxyAddress);
                });
            }
        }
        
        {
            let allMarkets = await bondtroller.getAllMarkets();
            for(var i = 0; i < blendingTokenProxyAddresses.length; i++) {
                if (allMarkets.indexOf(blendingTokenProxyAddresses[i]) == -1) {
                    await bondtroller.supportMarket(blendingTokenProxyAddresses[i]).then(function(){
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
            await jumpRateModel.initialize(blocksPerYear).then(function(instance){ 
                console.log("JumpRateModel " + jumpRateModelProxyAddress + " call initialize at tx hash " + instance.hash);
            })

            for(var i=0; i < BLendingTokenProxies.length; i++) {
                await jumpRateModel.addBLendingTokenSuport(BLendingTokenProxies[i], gainPerYear[i], jumGainPerYear[i], targetUtil[i], newMaxBorrow[i]).then(function(instance){
                    console.log("JumpRateModel " + jumpRateModelProxyAddress + " add BLendingToken Suport " + BLendingTokenProxies[i] + " with params: " + gainPerYear[i] + ", " + jumGainPerYear[i] + ", " + targetUtil[i] + " at tx hash " + instance.hash);
                })
            }
        }

        console.log();
        console.log("***** 3. Setting BLending token *****");

        for(var i = 0; i < lendingTokens.length; i++) { 
            blending = await BLendingToken.attach(blendingTokenProxyAddresses[i]).connect(deployMaster);
            let adminBlendingToken = await blending.admin();
            if (adminBlendingToken == ZERO_ADDRESS) {
                let admin = deployMaster.address;
                console.log("blending " + blending.address + " admin " + admin)
                await blending.init(
                    lendingTokens[i],
                    bondtrollerProxyAddress,
                    jumpRateModelProxyAddress,
                    initialExchangeRateMantissa[i],
                    name[i],
                    symbol[i],
                    decimals[i],
                    admin
                ).then(function(){
                    console.log("blending call init at " + blending.address);
                });
            }
            {
                let pitAddress = await blending.primaryIndexToken();
                if (pitAddress != primaryIndexTokenProxyAddress) {
                    await blending.setPrimaryIndexToken(primaryIndexTokenProxyAddress).then(function(){
                        console.log("blending " + blending.address +" set primaryIndexToken " + primaryIndexTokenProxyAddress);
                    });
                }
            }
        }

        console.log();
        console.log("***** 4. Setting PIT token *****");
        let namePit = await pit.name();
        if(!namePit) {
            await pit.initialize()
            .then(function(){
                console.log("PrimaryIndexToken call initialize at " + pit.address)
            });
        }

        {
            let pitModerator = await pit.primaryIndexTokenModerator();
            if (pitModerator != primaryIndexTokenModeratorProxyAddress) {
                await pit.setPrimaryIndexTokenModerator(primaryIndexTokenModeratorProxyAddress)
                    .then(function(){
                        console.log("PrimaryIndexToken set moderator contract: " + primaryIndexTokenModeratorProxyAddress);
                    });
            }
        }

        console.log();
        console.log("***** 5. Setting PIT Moderator token *****");
        let primaryIndexToken = await pitModerator.primaryIndexToken();
        if(primaryIndexToken == ZERO_ADDRESS) {
            await pitModerator.initialize(primaryIndexTokenProxyAddress)
            .then(function(){
                console.log("PrimaryIndexToken call initialize at " + pitModerator.address)
            });
        }
        {
            let priceOracle = await pit.priceOracle();
            if (priceOracle != PriceProviderAggregatorProxy) {
                await pitModerator.setPriceOracle(PriceProviderAggregatorProxy).then(function(){
                    console.log("PrimaryIndexToken set priceOracle: " + PriceProviderAggregatorProxy);
                });
            }
        }
        {
            let usdcToken = await pit.usdcToken();
            if (usdcToken != usdc) {
                await pitModerator.setUSDCToken(usdc).then(function(){
                    console.log("PrimaryIndexToken set usdc: " + usdc);
                });
            }
        }
    
        for(var i = 0; i < tokens.length; i++){
            let projectTokenInfo = await pit.projectTokenInfo(tokens[i]);
            if (projectTokenInfo.isListed == false 
                || projectTokenInfo.loanToValueRatio.numerator != loanToValueRatioNumerator[i]
                || projectTokenInfo.loanToValueRatio.denominator != loanToValueRatioDenominator[i]
                || projectTokenInfo.liquidationThresholdFactor.numerator != liquidationTresholdFactorNumerator[i]
                || projectTokenInfo.liquidationThresholdFactor.denominator != liquidationTresholdFactorDenominator[i]
                || projectTokenInfo.liquidationIncentive.numerator != liquidationIncentiveNumerator[i]
                || projectTokenInfo.liquidationIncentive.denominator != liquidationIncentiveDenominator[i]
            ) {
                await pitModerator.addProjectToken( 
                    tokens[i],
                    loanToValueRatioNumerator[i],
                    loanToValueRatioDenominator[i],
                    liquidationTresholdFactorNumerator[i],
                    liquidationTresholdFactorDenominator[i],
                    liquidationIncentiveNumerator[i],
                    liquidationIncentiveDenominator[i],
                ).then(function(){
                    console.log("Added prj token: "+tokens[i]+" with:");
                    console.log("LoanToValueRatio: ")
                    console.log("   Numerator:   "+loanToValueRatioNumerator[i]);
                    console.log("   Denominator: "+loanToValueRatioDenominator[i]);
                    console.log("LiquidationTresholdFactor: ")
                    console.log("   Numerator:   "+liquidationTresholdFactorNumerator[i]);
                    console.log("   Denominator: "+liquidationTresholdFactorDenominator[i]);
                    console.log("LiquidationIncentive: ");
                    console.log("   Numerator:   "+liquidationIncentiveNumerator[i]);
                    console.log("   Denominator: "+liquidationIncentiveDenominator[i]);
                });
            }
        }
    
        for(var i = 0; i < lendingTokens.length; i++){
            let lendingTokenInfo = await pit.lendingTokenInfo(lendingTokens[i]);
            let lendingTokenLoanToValueRatio = await pit.lendingTokenLoanToValueRatio(lendingTokens[i]);
            if (lendingTokenInfo.isListed == false 
                || lendingTokenInfo.isPaused != isPaused
                || lendingTokenInfo.bLendingToken != blendingTokenProxyAddresses[i]
                || lendingTokenLoanToValueRatio.numerator != loanToValueRatioNumeratorLendingToken[i]
                || lendingTokenLoanToValueRatio.denominator != loanToValueRatioDenominatorLendingToken[i]
            )
            await pitModerator.addLendingToken(
                lendingTokens[i], 
                blendingTokenProxyAddresses[i], 
                isPaused,
                loanToValueRatioNumeratorLendingToken[i],
                loanToValueRatioDenominatorLendingToken[i],
            ).then(function(){
                console.log("Added lending token: " + lendingTokens[i]);
                console.log("LoanToValueRatio: ")
                console.log("   Numerator:   "+loanToValueRatioNumeratorLendingToken[i]);
                console.log("   Denominator: "+loanToValueRatioDenominatorLendingToken[i]);
            });
        }

        for(var i = 0; i < tokens.length; i++){
            let borrowLimitPerCollateralValue = await pit.borrowLimitPerCollateral(tokens[i]);
            if (borrowLimitPerCollateralValue.toString() != borrowLimitPerCollateral[i]) {
                await pitModerator.setBorrowLimitPerCollateral(
                    tokens[i], 
                    borrowLimitPerCollateral[i]
                ).then(function(){
                    console.log("PrimaryIndexToken set " + tokens[i] + " borrow limit " + borrowLimitPerCollateral[i]);
                });
            }
        }

        for(var i = 0; i < lendingTokens.length; i++){
            let borrowLimitPerLendingTokenValue = await pit.borrowLimitPerLendingToken(lendingTokens[i]);
            if (borrowLimitPerLendingTokenValue.toString() != borrowLimitPerLendingToken[i]) {
                await pitModerator.setBorrowLimitPerLendingAsset(
                    lendingTokens[i], 
                    borrowLimitPerLendingToken[i]
                ).then(function(){
                    console.log("PrimaryIndexToken set " + lendingTokens[i] + " borrow limit " + borrowLimitPerLendingToken[i]);
                });
            }
        }

        {
            let primaryIndexTokenLeverage = await pit.primaryIndexTokenLeverage();
            if (primaryIndexTokenLeverage != primaryIndexTokenLeverageProxyAddress) {
                await pitModerator.setPrimaryIndexTokenLeverage(primaryIndexTokenLeverageProxyAddress).then(function(){
                    console.log("PrimaryIndexToken set Leverage contract " + primaryIndexTokenLeverageProxyAddress);
                })
            }
        }

        {
            let isRelatedContract = await pit.getRelatedContract(primaryIndexTokenAtomicRepaymentProxyAddress);
            if (isRelatedContract == false) {
                await pitModerator.addRelatedContracts(primaryIndexTokenAtomicRepaymentProxyAddress).then(function(){
                    console.log("PrimaryIndexToken set role for atomic repayment contract " + primaryIndexTokenAtomicRepaymentProxyAddress);
                })
            }
        }

        {
            let isRelatedContract = await pit.getRelatedContract(primaryIndexTokenLiquidationProxyAddress);
            if (isRelatedContract == false) {
                await pitModerator.addRelatedContracts(primaryIndexTokenLiquidationProxyAddress).then(function(){
                    console.log("PrimaryIndexToken set role for liquidation contract " + primaryIndexTokenLiquidationProxyAddress);
                })
            }
        }
        
        {
            let isRelatedContract = await pit.getRelatedContract(primaryIndexTokenLeverageProxyAddress);
            if (isRelatedContract == false) {
                await pitModerator.addRelatedContracts(primaryIndexTokenLeverageProxyAddress).then(function(){
                    console.log("PrimaryIndexToken set role for Leverage contract " + primaryIndexTokenLeverageProxyAddress);
                })
            }
        }

        {
            let isRelatedContract = await pit.getRelatedContract(primaryIndexTokenWrappedTokenGatewayProxyAddress);
            if (isRelatedContract == false) {
                await pitModerator.addRelatedContracts(primaryIndexTokenWrappedTokenGatewayProxyAddress).then(function(){
                    console.log("PrimaryIndexToken set role for Wrapped Token Gateway contract " + primaryIndexTokenWrappedTokenGatewayProxyAddress);
                }) 
            }
        }

        console.log();
        console.log("***** 6. Setting PIT Liquidation *****");
        let moderatorRoleLiquidation = await pitLiquidation.MODERATOR_ROLE();
        let isModeratorLiquidation = await pitLiquidation.hasRole(moderatorRoleLiquidation, deployMasterAddress);
        if (!isModeratorLiquidation) { 
            await pitLiquidation.initialize(primaryIndexTokenProxyAddress)
            .then(function(){
                console.log("PrimaryIndexTokenLiquidation call initialize at " + pitLiquidation.address)
            });
        }

        {
            let minPartialLiquidationAmount = await pitLiquidation.minPartialLiquidationAmount();
            if (minPartialLiquidationAmount != minPA) {
                await pitLiquidation.setMinPartialLiquidationAmount(minPA).then(function(){
                    console.log("PrimaryIndexTokenLiquidation set minPA " + minPA);
                })
            }
        }
        
        {
            let maxLRF = await pitLiquidation.maxLRF();
            if (maxLRF.numerator != maxLRFNumerator || maxLRF.denominator != maxLRFDenominator) {
                await pitLiquidation.setMaxLRF(maxLRFNumerator, maxLRFDenominator).then(function(){
                    console.log("PrimaryIndexTokenLiquidation set maxLRF " + maxLRFNumerator + "/" + maxLRFDenominator);
                })
            }
        }

        {
            let liquidatorRewardCalcFactor = await pitLiquidation.liquidatorRewardCalcFactor();
            if (liquidatorRewardCalcFactor.numerator != rewardCalcFactorNumerator || liquidatorRewardCalcFactor.denominator != rewardCalcFactorDenominator) {
                await pitLiquidation.setLiquidatorRewardCalculationFactor(rewardCalcFactorNumerator, rewardCalcFactorDenominator).then(function(){
                    console.log("PrimaryIndexTokenLiquidation set rewardCalcFactor " + rewardCalcFactorNumerator + "/" + rewardCalcFactorDenominator);
                })
            }
        }
        
        {
            let targetHealthFactor = await pitLiquidation.targetHealthFactor();
            if (targetHealthFactor.numerator != targetHFNumerator || targetHealthFactor.denominator != targetHFDenominator) {
                await pitLiquidation.setTargetHealthFactor(targetHFNumerator, targetHFDenominator).then(function(){
                    console.log("PrimaryIndexTokenLiquidation set targetHF " + targetHFNumerator + "/" + targetHFDenominator);
                })
            }
        }

        console.log();
        console.log("***** 7. Setting PIT atomic repayment *****");
        let moderatorRoleAtomic = await pitAtomicRepayment.MODERATOR_ROLE();
        let isModeratorAtomic = await pitAtomicRepayment.hasRole(moderatorRoleAtomic, deployMasterAddress);
        if (!isModeratorAtomic) { 
            await pitAtomicRepayment.initialize(primaryIndexTokenProxyAddress, augustusParaswap, AUGUSTUS_REGISTRY)
            .then(function(){
                console.log("PrimaryIndexTokenAtomicRepayment call initialize at " + pitAtomicRepayment.address)
            });
        }

        console.log();
        console.log("***** 8. Setting PIT leverage *****");
        let moderatorRoleLeverage = await pitLeverage.MODERATOR_ROLE();
        let isModeratorLeverage = await pitLeverage.hasRole(moderatorRoleLeverage, deployMasterAddress);
        if (!isModeratorLeverage) { 
            await pitLeverage.initialize(primaryIndexTokenProxyAddress, augustusParaswap, AUGUSTUS_REGISTRY)
            .then(function(){
                console.log("PrimaryIndexTokenLeverage call initialize at " + pitLeverage.address)
            });
        }

        console.log();
        console.log("***** 9. Setting PIT Wrapped Token Gateway *****");
        let moderatorRoleWrappedTokenGateway = await pitWrappedTokenGateway.MODERATOR_ROLE();
        let isModeratorWrappedTokenGateway = await pitWrappedTokenGateway.hasRole(moderatorRoleWrappedTokenGateway, deployMasterAddress);
        if (!isModeratorWrappedTokenGateway) { 
            await pitWrappedTokenGateway.initialize(primaryIndexTokenProxyAddress, WETH, primaryIndexTokenLiquidationProxyAddress, primaryIndexTokenLeverageProxyAddress)
            .then(function(){
                console.log("PrimaryIndexTokenWrappedTokenGateway call initialize at " + pitWrappedTokenGateway.address)
            });
        }

        let addresses = {
            bondtrollerAddress: bondtrollerProxyAddress,
            jumpRateModelAddress: jumpRateModelProxyAddress,
            blendingAddress: blendingTokenProxyAddresses,
            pitAddress: primaryIndexTokenProxyAddress,
            pitLiquidationAddress: primaryIndexTokenLiquidationProxyAddress,
            pitAtomicRepaymentAddress: primaryIndexTokenAtomicRepaymentProxyAddress,
            pitLeverageAddress: primaryIndexTokenLeverageProxyAddress,
            pitModerator: primaryIndexTokenModeratorProxyAddress,
            pitWrappedTokenGateway: primaryIndexTokenWrappedTokenGatewayProxyAddress
        }
        return addresses;
    }
};