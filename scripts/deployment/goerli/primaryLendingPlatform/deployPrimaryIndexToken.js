
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../../config/config.json';
const config = require(configFile);
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let {
    PRIMARY_PROXY_ADMIN, 
    PrimaryIndexTokenLogic, 
    PrimaryIndexTokenProxy,
    PriceProviderAggregatorProxy,
    BondtrollerProxy,
    BLendingTokenProxy,
    JumpRateModelV2UpgradeableProxy,
    USDCTest,
    LINK,
    MATIC,
    WBTC,
    PRJsAddresses
} = config;

let proxyAdmingAddress = PRIMARY_PROXY_ADMIN;
let primaryIndexTokenLogicAddress = PrimaryIndexTokenLogic;
let primaryIndexTokenProxyAddress = PrimaryIndexTokenProxy;
let priceOracleAddress = PriceProviderAggregatorProxy;
let busdcAddress = BLendingTokenProxy;
let bondtrollerAddress = BondtrollerProxy;

let USDCmultiplier = toBN(10).pow(toBN(6))
let isPaused = false;
let usdcAddress = USDCTest;
let loanToValueRatioNumerator = toBN(6);
let loanToValueRatioDenominator = toBN(10);
let liquidationTresholdFactorNumerator = toBN(1);
let liquidationTresholdFactorDenominator = toBN(1);
let liquidationIncentiveNumerator = toBN(115);
let liquidationIncentiveDenominator = toBN(100);
let borrowLimit = toBN(1_000_000).mul(toBN(10).pow(toBN(6)));

async function verify(contractAddress, constructor) {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructor,
    }).catch((err) => console.log(err.message));
    console.log("Contract verified at: ", contractAddress);
}

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
    let PrimaryIndexToken = await hre.ethers.getContractFactory("PrimaryIndexToken");
    let TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
    let Bondtroller = await hre.ethers.getContractFactory("Bondtroller");
    let BLendingToken = await hre.ethers.getContractFactory("BLendingToken");

    if(!primaryIndexTokenLogicAddress) {
      let primaryIndexToken = await PrimaryIndexToken.connect(deployMaster).deploy();
      await primaryIndexToken.deployed();
      primaryIndexTokenLogicAddress = primaryIndexToken.address;
      config.PrimaryIndexTokenLogic = primaryIndexTokenLogicAddress;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
    }
    console.log("primaryIndexToken masterCopy address: " + primaryIndexTokenLogicAddress);
    
    if(!primaryIndexTokenProxyAddress) {
        let primaryIndexTokenProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            primaryIndexTokenLogicAddress,
            proxyAdmingAddress,
            "0x"
        );
        await primaryIndexTokenProxy.deployed().then(function(instance){
            primaryIndexTokenProxyAddress = instance.address;
            config.PrimaryIndexTokenProxy = primaryIndexTokenProxyAddress;
            fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
        });
    }
    console.log("primaryIndexToken proxy address: " + primaryIndexTokenProxyAddress);

    let primaryIndexToken = await PrimaryIndexToken.attach(primaryIndexTokenProxyAddress).connect(deployMaster);
    let bondtroller = await Bondtroller.attach(bondtrollerAddress).connect(deployMaster);
    let busdc = await BLendingToken.attach(busdcAddress).connect(deployMaster);

    await primaryIndexToken.initialize().then(function(instance){
        console.log("\nTransaction hash: " + instance.hash);
        console.log("PrimaryIndexToken call initialize at " + primaryIndexToken.address)
    });
    await primaryIndexToken.setPriceOracle(priceOracleAddress).then(function(instance){
        console.log("\nTransaction hash: " + instance.hash);
        console.log("PrimaryIndexToken set priceOracle: " + priceOracleAddress);
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
    await bondtroller.setPrimaryIndexTokenAddress(primaryIndexTokenProxyAddress).then(function(){
        console.log("Bondtroller " + bondtrollerAddress + " set PrimaryIndexToken "+ primaryIndexTokenProxyAddress);
    });

    await busdc.setPrimaryIndexToken(primaryIndexTokenProxyAddress).then(function(){
        console.log("BUSDC " + busdcAddress +" set primaryIndexToken " + primaryIndexTokenProxyAddress);
    });

    await verify(primaryIndexTokenLogicAddress, []);
    await verify(primaryIndexTokenProxyAddress, [primaryIndexTokenLogicAddress, proxyAdmingAddress, "0x"]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
