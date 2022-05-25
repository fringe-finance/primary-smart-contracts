
const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let primaryIndexTokenAddress = '' // address of PrimaryIndexToken
let chainlinkPriceProviderAddress = '' // address of ChainlinkPriceProvider
let pricePath = [''] // array of addresses of chainlink
let priceOracleAddress = '' // address of PriceProviderAggregator
let projectTokenAddress = '' // address of project token
let lendingTokenAddresses = ['', ''] // list of addresses of all lendingTokens

let borrowLimit = [toBN(1000).mul(toBN(10).pow(toBN(6)))] // list of 
let loanToValueRatioNumerator = toBN(6)
let loanToValueRatioDenominator = toBN(10)
let liquidationTresholdFactorNumerator = toBN(1)
let liquidationTresholdFactorDenominator = toBN(1)
let liquidationIncentiveNumerator = toBN(115)
let liquidationIncentiveDenominator = toBN(100)


async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ChainlinkPriceProvider = await hre.ethers.getContractFactory("ChainlinkPriceProvider");
    let PriceProviderAggregator = await hre.ethers.getContractFactory("PriceProviderAggregator");
  
    let PrimaryIndexToken = await hre.ethers.getContractFactory("PrimaryIndexToken");
    
    let primaryIndexToken = await PrimaryIndexToken.attach(primaryIndexTokenAddress).connect(deployMaster);
    let chainlinkPriceProvider = await ChainlinkPriceProvider.attach(chainlinkPriceProviderAddress).connect(deployMaster);
    let priceProviderAggregator = await PriceProviderAggregator.attach(priceOracleAddress).connect(deployMaster);
    
    await chainlinkPriceProvider.setTokenAndAggregator(projectTokenAddress, pricePath).then(function(instance){
        console.log("\nTransaction hash: " + instance.hash)
        console.log("ChainlinkPriceProvider " + chainlinkPriceProvider.address + " setTokenAndAggregator with params: ")
        console.log("   token: " + projectTokenAddress)
        console.log("   aggregatorPath: " + pricePath)
    });

    await priceProviderAggregator.setTokenAndPriceProvider(
        projectTokenAddress, 
        chainlinkPriceProviderAddress, 
        false
    ).then(function(instance){
        console.log("\nTransaction hash: " + instance.hash)
        console.log("PriceProviderAggregator set token "+ projectTokenAddress + " with priceOracle " + chainlinkPriceProviderAddress);
    });

    await primaryIndexToken.addProjectToken(
        projectTokenAddress,
        loanToValueRatioNumerator,
        loanToValueRatioDenominator,
        liquidationTresholdFactorNumerator,
        liquidationTresholdFactorDenominator,
        liquidationIncentiveNumerator,
        liquidationIncentiveDenominator
    ).then(function(instance){
        console.log("\nTransaction hash: " + instance.hash);
        console.log("Added projent token: " + projectTokenAddress + " with:");
        console.log("LoanToValueRatio: ")
        console.log("   Numerator:   " + loanToValueRatioNumerator);
        console.log("   Denominator: " + loanToValueRatioDenominator);
        console.log("LiquidationTresholdFactor: ")
        console.log("   Numerator:   " + liquidationTresholdFactorNumerator);
        console.log("   Denominator: " + liquidationTresholdFactorDenominator);
        console.log("LiquidationIncentive: ");
        console.log("   Numerator:   " + liquidationIncentiveNumerator);
        console.log("   Denominator: " + liquidationIncentiveDenominator);
    });
    
    for (var i of lendingTokenAddresses) {
        console.log(i)
        await primaryIndexToken.setBorrowLimit(projectTokenAddress, lendingTokenAddress, borrowLimit).then(function(instance){
            console.log("\nTransaction hash: " + instance.hash);
            console.log("PrimaryIndexToken set to " + REN + " borrow limit " + REN_borrowLimit);
        });
    }
    

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
