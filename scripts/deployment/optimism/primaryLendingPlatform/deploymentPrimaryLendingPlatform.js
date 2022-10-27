const hre = require("hardhat");
const BN = hre.ethers.BigNumber;
const fs = require("fs");
const path = require("path");
const configFile = '../../../config/optimism/config.json';
const config = require(configFile);
const configGeneralFile = '../../../config/optimism/config_general.json';
const configGeneral = require(configGeneralFile);

const toBN = (num) => BN.from(num);

module.exports = {
   
    deploymentPrimaryLendingPlatform : async function () {
        let network = await hre.network;
        console.log("Network name: "+network.name);
       
        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];
        let deployMasterAddress = deployMaster.address;
        console.log("DeployMaster: " + deployMasterAddress);

        // Contracts ABI
        let ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
        let TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
        let JumpRateModelV2 = await hre.ethers.getContractFactory("JumpRateModelV2Upgradeable");
        let Bondtroller = await hre.ethers.getContractFactory("Bondtroller");
        let BLendingToken = await hre.ethers.getContractFactory("BLendingToken");
        let PrimaryIndexToken = await hre.ethers.getContractFactory("PrimaryIndexToken");

        let jumpRateModelV2;
        let bondtroller;
        let blending;
        let pit;

        const {
            pitToken,
            blendingToken,
            jumRateModel
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

        let priceProvider = PriceProviderAggregatorProxy;

        let kink = jumRateModel.kink;
        let baseRatePerYear = jumRateModel.baseRatePerYear;
        let multiplierPerYear = jumRateModel.multiplierPerYear;
        let jumpMultiplierPerYear = jumRateModel.jumpMultiplierPerYear;

        //config 
        let lendingTokens = blendingToken.lendingTokens;
        let initialExchangeRateMantissa = blendingToken.initialExchangeRateMantissa;
        let reserveFactorMantissa = blendingToken.reserveFactorMantissa;
        let name = blendingToken.name;
        let symbol = blendingToken.symbol;
        let decimals = blendingToken.decimals;

        let tokens = pitToken.tokens;
        let borrowLimitPerCollateral = pitToken.borrowLimitPerCollateral;
        let borrowLimitPerLendingToken = pitToken.borrowLimitPerLendingToken;
        let loanToValueRatioNumerator = pitToken.loanToValueRatioNumerator;
        let loanToValueRatioDenominator = pitToken.loanToValueRatioDenominator;
        let liquidationTresholdFactorNumerator = pitToken.liquidationTresholdFactorNumerator;
        let liquidationTresholdFactorDenominator = pitToken.liquidationTresholdFactorDenominator;
        let liquidationIncentiveNumerator = pitToken.liquidationIncentiveNumerator;
        let liquidationIncentiveDenominator = pitToken.liquidationIncentiveDenominator;
        let isPaused = pitToken.isPaused;

    //====================================================
    //deploy proxy admin

        console.log();
        console.log("***** PROXY ADMIN DEPLOYMENT *****");
        if(!proxyAdminAddress){
            let proxyAdmin = await ProxyAdmin.connect(deployMaster).deploy();
            await proxyAdmin.deployed().then(function(instance){
                proxyAdminAddress = instance.address;
                config.PRIMARY_PROXY_ADMIN = proxyAdminAddress;
                fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
            });
        }
        
        console.log("ProxyAdmin deployed at: " + proxyAdminAddress);

    //====================================================
    //deploy price oracle

        console.log();
        console.log("***** PRICE ORACLE DEPLOYMENT *****");
        if (!priceProvider) {
            const { deploymentPriceOracle } = require('../priceOracle/deploymentPriceOracle.js')
            let priceOracleAddresses = await deploymentPriceOracle(proxyAdminAddress)
            priceProvider = priceOracleAddresses.priceProviderAggregatorAddress
        } 
        console.log("PriceOracle is deployed at: " + priceProvider);

    //====================================================

        console.log();
        console.log("***** JUMP RATE MODELV2 DEPLOYMENT *****");
        // let multiplier = toBN(10).pow(toBN(18));
        // let baseRatePerBlock = toBN(9512937595);
        // let blocksPerYear = toBN(2102400);
        // let jumpMultiplierPerBlock = toBN(1902587519025);
        // let multiplierPerBlock = toBN(107020547945);
        if(!jumpRateModelLogicAddress) {
            let jumpRateModelV2 = await JumpRateModelV2.connect(deployMaster).deploy();
            await jumpRateModelV2.deployed();
            jumpRateModelLogicAddress = jumpRateModelV2.address;
            config.JumpRateModelLogic = jumpRateModelLogicAddress;
            fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
        }
        console.log("JumpRateModel masterCopy address: " + jumpRateModelLogicAddress);
        
        if(!jumpRateModelProxyAddress) {
            let jumpRateModelProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                jumpRateModelLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await jumpRateModelProxy.deployed().then(function(instance){
                jumpRateModelProxyAddress = instance.address;
                config.JumpRateModelProxy = jumpRateModelProxyAddress;
                fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("JumpRateModel proxy address: " + jumpRateModelProxyAddress);

        let owner = deployMasterAddress;

    //====================================================
        console.log();
        console.log("***** BONDTROLLER DEPLOYMENT *****");

        if(!bondtrollerLogicAddress) {
            bondtroller = await Bondtroller.connect(deployMaster).deploy();
            await bondtroller.deployed().then(function(instance){
                bondtrollerLogicAddress = instance.address;
                config.BondtrollerLogic = bondtrollerLogicAddress;
                fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("Bondtroller logic address: " + bondtrollerLogicAddress);

        if(!bondtrollerProxyAddress) {
            let bondtrollerProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                bondtrollerLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await bondtrollerProxy.deployed().then(function(instance){
                bondtrollerProxyAddress = instance.address;
                config.BondtrollerProxy = bondtrollerProxyAddress;
                fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("Bondtroller proxy address: " + bondtrollerProxyAddress);

    //====================================================

        console.log();
        console.log("***** BLENDING TOKEN DEPLOYMENT *****");

        if(!blendingTokenLogicAddress) {
            blending = await BLendingToken.connect(deployMaster).deploy();
            await blending.deployed().then(function(instance){
                blendingTokenLogicAddress = instance.address;
                config.BLendingTokenLogic = blendingTokenLogicAddress;
                fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
    
            });
        }
        console.log("BLendingToken masterCopy address: " + blendingTokenLogicAddress);
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
        fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));

        console.log("BLendingToken proxy address: " + blendingTokenProxyAddresses);
        
        //====================================================

        console.log();
        console.log("***** PRIMARY INDEX TOKEN DEPLOYMENT *****");

        if(!primaryIndexTokenLogicAddress) {
            pit = await PrimaryIndexToken.connect(deployMaster).deploy();
            await pit.deployed().then(function(instance){
                primaryIndexTokenLogicAddress = instance.address;
                config.PrimaryIndexTokenLogic = primaryIndexTokenLogicAddress;
                fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PrimaryIndexToken masterCopy address: " + primaryIndexTokenLogicAddress);

        if(!primaryIndexTokenProxyAddress) {
            let pitProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                primaryIndexTokenLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await pitProxy.deployed().then(function(instance){
                primaryIndexTokenProxyAddress = instance.address;
                config.PrimaryIndexTokenProxy = primaryIndexTokenProxyAddress;
                fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PrimaryIndexToken proxy address: " + primaryIndexTokenProxyAddress);

        //====================================================
        //setting params

        //instances of contracts
        bondtroller = await Bondtroller.attach(bondtrollerProxyAddress).connect(deployMaster);
        jumpRateModelV2 = await JumpRateModelV2.attach(jumpRateModelProxyAddress).connect(deployMaster);
        pit = await PrimaryIndexToken.attach(primaryIndexTokenProxyAddress).connect(deployMaster);

        console.log();
        console.log("***** 1. Seting Bondtroller *****");
        let adminBondtroller = await bondtroller.admin();
        if (adminBondtroller == ZERO_ADDRESS) {
            await bondtroller.init().then(function(instance){
                console.log("Bondtroller " + bondtroller.address + "call init at tx hash: " + instance.hash);
            });
            await bondtroller.setPrimaryIndexTokenAddress(primaryIndexTokenProxyAddress).then(function(){
                console.log("Bondtroller set PIT " + primaryIndexTokenProxyAddress);
            });
            for(var i = 0; i < blendingTokenProxyAddresses.length; i++) {
                await bondtroller.supportMarket(blendingTokenProxyAddresses[i]).then(function(){
                    console.log("Bondtroller support market " + blendingTokenProxyAddresses[i]);
                });
            }
        }

        console.log("***** 2. Seting JumRateModel *****");

        let ownerJumRateModel = await jumpRateModelV2.owner();
        if (ownerJumRateModel == ZERO_ADDRESS) {
            let owner = deployMaster.address;
            await jumpRateModelV2.initialize(
                baseRatePerYear,
                multiplierPerYear,
                jumpMultiplierPerYear,
                kink,
                owner
            ).then(function(instance){
                console.log("JumRateModel " + bondtroller.address + " call init at tx hash: " + instance.hash);
            });
        }

        console.log();
        console.log("***** 3. Seting BLending  token *****");

        for(var i = 0; i < lendingTokens.length; i++) { 
            blending = await BLendingToken.attach(blendingTokenProxyAddresses[i]).connect(deployMaster);
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
                ).then(function(){
                    console.log("blending call init at " + blending.address);
                });
        
                await blending.setReserveFactor(reserveFactorMantissa[i]).then(function(){
                    console.log("blending set reserve factor " + reserveFactorMantissa[i]);
                });
            
                await blending.setPrimaryIndexToken(primaryIndexTokenProxyAddress).then(function(){
                    console.log("blending " + blending.address +" set primaryIndexToken " + primaryIndexTokenProxyAddress);
                });
            }
        }

        console.log();
        console.log("***** 4. Seting PIT token *****");
        let namePit = await pit.name();
        if(!namePit) {
            await pit.initialize()
            .then(function(){
                console.log("PrimaryIndexToken call initialize at " + pit.address)
            });

            await pit.setPriceOracle(PriceProviderAggregatorProxy).then(function(){
                console.log("PrimaryIndexToken set priceOracle: " + PriceProviderAggregatorProxy);
            });
        
            for(var i = 0; i < tokens.length; i++){
                await pit.addProjectToken( 
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
        
            for(var i = 0; i < lendingTokens.length; i++){
                await pit.addLendingToken(
                    lendingTokens[i], 
                    blendingTokenProxyAddresses[i], 
                    isPaused
                ).then(function(){
                    console.log("Added lending token: " + lendingTokens[i]);
                });
    
            }
        
            for(var i = 0; i < tokens.length; i++){
                await pit.setBorrowLimitPerCollateral(
                    tokens[i], 
                    borrowLimitPerCollateral[i]
                ).then(function(){
                    console.log("PrimaryIndexToken set " + tokens[i] + " borrow limit " + borrowLimitPerCollateral[i]);
                });
            }

            for(var i = 0; i < lendingTokens.length; i++){
                await pit.setBorrowLimitPerLendingAsset(
                    lendingTokens[i], 
                    borrowLimitPerLendingToken[i]
                ).then(function(){
                    console.log("PrimaryIndexToken set " + lendingTokens[i] + " borrow limit " + borrowLimitPerLendingToken[i]);
                });
            }
        }

        let addresses = {
            bondtrollerAddress: bondtrollerProxyAddress,
            blendingAddress: blendingTokenProxyAddresses,
            pitAddress: primaryIndexTokenProxyAddress
        }
        console.log(addresses);
        return addresses;
    }
};
