const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../../config/config.json';
const configJumRateModelFile = '../../../config/config_JumRateModel.json';
const configBLendingTokenFile = '../../../config/config_BLendingToken.json';
const configPITFile = '../../../config/config_PIT.json';
const config = require(configFile);
const configJumRateModel = require(configJumRateModelFile);
const configBLendingToken = require(configBLendingTokenFile);
const configPIT = '../../../config/config_PIT.json';

let {
    BondtrollerProxy,
    JumpRateModelProxy,
    BLendingTokenProxy,
    PrimaryIndexTokenProxy,
    ZERO_ADDRESS
} = config;

let {
    baseRatePerYear,
    multiplierPerYear,
    jumpMultiplierPerYear,
    kink
} = configJumRateModel;

let {
    initialExchangeRateMantissa,
    reserveFactorMantissa,
    symbol,
    decimals,
    name
} = configBLendingToken;

let {
    loanToValueRatioNumerator,
    loanToValueRatioDenominator,
    liquidationTresholdFactorNumerator,
    liquidationTresholdFactorDenominator,
    liquidationIncentiveNumerator,
    liquidationIncentiveDenominator,
} = configBLendingToken;

async function main() {

    //====================================================
    //declare parametrs

    let network = await hre.network;
    console.log("Network name: "+network.name);
    
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];

    console.log("DeployMaster: "+deployMaster.address);
    let deployMasterAddress = deployMaster.address;

    // Contracts ABI
    let Bondtroller;
    let JumpRateModel;
    let BLendingToken;
    let PrimaryIndexToken;


    //contracts addresses
    let bondtrollerProxyAddress = BondtrollerProxy;
    let jumpRateModelProxyAddress = JumpRateModelProxy;
    let blendingTokenProxyAddress = BLendingTokenProxy;
    let primaryIndexTokenProxyAddress = PrimaryIndexTokenProxy;


    //====================================================
    //initialize deploy parametrs
    Bondtroller = await hre.ethers.getContractFactory("Bondtroller");
    JumpRateModel = await hre.ethers.getContractFactory("JumpRateModelV2Upgradeable");
    BLendingToken = await hre.ethers.getContractFactory("BLendingToken");
    PrimaryIndexToken = await hre.ethers.getContractFactory("PrimaryIndexToken");


    //instances of contracts
    let bondtroller = await Bondtroller.attach(bondtrollerProxyAddress).connect(deployMaster);
    let jumRateModel = await JumpRateModel.attach(jumpRateModelProxyAddress).connect(deployMaster);
    let blendingToken = await JumpRateModel.attach(blendingTokenProxyAddress).connect(deployMaster);
    let primaryIndexToken = await PrimaryIndexToken.attach(primaryIndexTokenProxyAddress).connect(deployMaster);


    //==============================
    //initialize
    console.log();
    console.log("***** 1. Seting Bondtroller *****");
    let adminBondtroller = await bondtroller.admin();
    if (adminBondtroller == ZERO_ADDRESS) {
        await bondtroller.init().then(function(instance){
            console.log("Bondtroller " + bondtroller.address + "call init at tx hash: " + instance.hash);
        });

        await bondtroller.supportMarket(blendingTokenProxyAddress).then(function(){
            console.log("Bondtroller support market " + blendingTokenProxyAddress);
        });
    }

    console.log("***** 2. Seting JumRateModel *****");
    let ownerJumRateModel = await jumRateModel.owner();
    if (ownerJumRateModel == ZERO_ADDRESS) {
        let owner = deployMaster.address;
        await jumRateModel.initialize(
            baseRatePerYear,
            multiplierPerYear,
            jumpMultiplierPerYear,
            kink,
            owner
        ).then(function(instance){
            console.log("Bondtroller " + bondtroller.address + "call init at tx hash: " + instance.hash);
        });
    }

    console.log();
    console.log("***** 3. Seting BLending token *****");
    let adminBlendingToken = await bondtroller.admin();
    if (adminBlendingToken == ZERO_ADDRESS) {
        let admin = deployMaster.address;
        await blendingToken.init(
            usdctestAddress,
            bondtrollerProxyAddress,
            jumpRateModelProxyAddress,
            initialExchangeRateMantissa,
            name,
            symbol,
            decimals,
            admin
        ).then(function(){
            console.log("BUSDC" + blendingToken.address + " call init at tx hash: " + instance.hash);
        });
    
        await blendingToken.connect(deployMaster).setReserveFactor(reserveFactorMantissa).then(function(){
            console.log("BUSDC set reserve factor " + reserveFactorMantissa);
        });
    }

    console.log();
    console.log("***** 3. Seting BLending token *****");
    let decimal = await primaryIndexToken.decimals();
    if (!decimal) {
        await primaryIndexToken.initialize().then(function(instance){
            console.log("PrimaryIndexToken" + primaryIndexToken.address + " call initialize at tx hash:" + instance.hash);
        });
        await primaryIndexToken.setPriceOracle(priceOracleAddress).then(function(instance){
            console.log("PrimaryIndexToken set priceOracle: " + priceOracleAddress + " at tx hash: " + instance.hash);
        });
    
        for(var i = 0; i < PRJsAddresses.length; i++){
            await primaryIndexToken.addProjectToken( 
                PRJsAddresses[i],
                loanToValueRatioNumerator,
                loanToValueRatioDenominator,
                liquidationTresholdFactorNumerator,
                liquidationTresholdFactorDenominator,
                liquidationIncentiveNumerator,
                liquidationIncentiveDenominator,
            ).then(function(){
                console.log("Added prj token: "+PRJsAddresses[i]+" with:");
                console.log("LoanToValueRatio: ")
                console.log("   Numerator:   "+loanToValueRatioNumerator);
                console.log("   Denominator: "+loanToValueRatioDenominator);
                console.log("LiquidationTresholdFactor: ")
                console.log("   Numerator:   "+liquidationTresholdFactorNumerator);
                console.log("   Denominator: "+liquidationTresholdFactorDenominator);
                console.log("LiquidationIncentive: ");
                console.log("   Numerator:   "+liquidationIncentiveNumerator);
                console.log("   Denominator: "+liquidationIncentiveDenominator);
            });
            
        }
    
        await primaryIndexToken.addLendingToken(
            usdcAddress, 
            busdcAddress, 
            isPaused
        ).then(function(){
            console.log("Added lending token: "+usdcAddress);
        });
    
        for(var i = 0; i < PRJsAddresses.length; i++){
            await primaryIndexToken.setBorrowLimit(
                PRJsAddresses[i], 
                usdcAddress, 
                borrowLimit
            ).then(function(){
                console.log("PrimaryIndexToken set " + PRJsAddresses[i] + " borrow limit " + borrowLimit);
            });
        }
    }
 
};

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});