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
const configPIT = require(configPITFile);

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
    PRJsAddresses,
    lendingAddresses,
    blendingAddress,
    loanToValueRatioNumerator,
    loanToValueRatioDenominator,
    liquidationTresholdFactorNumerator,
    liquidationTresholdFactorDenominator,
    liquidationIncentiveNumerator,
    liquidationIncentiveDenominator,
    USDCTest,
    LINK,
    MATIC,
    WBTC,
    isPaused,
    borrowLimit,
    USB
} = configPIT;

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
    let blendingToken = await BLendingToken.attach(blendingTokenProxyAddress).connect(deployMaster);
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
        await bondtroller.setPrimaryIndexTokenAddress(primaryIndexTokenProxyAddress).then(function(){
            console.log("Bondtroller " + bondtrollerAddress + " set PrimaryIndexToken "+ primaryIndexTokenProxyAddress);
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
            console.log("JumRateModel " + bondtroller.address + "call init at tx hash: " + instance.hash);
        });
    }

    console.log();
    console.log("***** 3. Seting BLending  token *****");
    let adminBlendingToken = await blendingToken.admin();
    if (adminBlendingToken == ZERO_ADDRESS) {
        let admin = deployMaster.address;
        await blendingToken.init(
            USB,
            bondtrollerProxyAddress,
            jumpRateModelProxyAddress,
            initialExchangeRateMantissa,
            name,
            symbol,
            decimals,
            admin
        ).then(function(instance){
            console.log("BLending" + blendingToken.address + " call init at tx hash: " + instance.hash);
        });
    }
    await blendingToken.connect(deployMaster).setReserveFactor(reserveFactorMantissa).then(function(){
        console.log("BUSDC set reserve factor " + reserveFactorMantissa);
    });
    await blendingToken.setPrimaryIndexToken(primaryIndexTokenProxyAddress).then(function(){
        console.log("BUSDC " + busdcAddress +" set primaryIndexToken " + primaryIndexTokenProxyAddress);
    });

    console.log();
    console.log("***** 4. Seting PIT token *****");
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
        for(var i = 0; i < lendingAddresses.length; i++){
            await primaryIndexToken.addLendingToken(
                lendingAddresses[i], 
                blendingAddress[i], 
                isPaused
            ).then(function(){
                console.log("Added lending token: " + lendingAddresses[i]);
            });
        }
    
        for(var i = 0; i < PRJsAddresses.length; i++){
            await primaryIndexToken.setBorrowLimitPerCollateral(
                PRJsAddresses[i], 
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