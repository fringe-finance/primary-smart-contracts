require("dotenv").config();
const hre = require("hardhat");
let network = hre.network;

const isLayer2 = Object.keys(process.env).includes('LAYER2');

async function main() {
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];

    let provider = hre.ethers.provider;

    let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");

    let PythPriceProvider = await hre.ethers.getContractFactory("PythPriceProvider");
    let ChainlinkPriceProvider = isLayer2 ? await hre.ethers.getContractFactory("ChainlinkPriceProviderL2")
        : await hre.ethers.getContractFactory("ChainlinkPriceProvider");
    let PriceProviderAggregator = await hre.ethers.getContractFactory("PriceProviderAggregatorPyth");

    let JumpRateModel = await hre.ethers.getContractFactory("JumpRateModelV3");
    let Bondtroller = await hre.ethers.getContractFactory("Bondtroller");
    let BLendingToken = await hre.ethers.getContractFactory("BLendingToken");
    let PrimaryLendingPlatformV2 = await hre.ethers.getContractFactory("PrimaryLendingPlatformV2Zksync");
    let PrimaryLendingPlatformAtomicRepayment = await hre.ethers.getContractFactory("PrimaryLendingPlatformAtomicRepaymentZksync");
    let PrimaryLendingPlatformLiquidation = await hre.ethers.getContractFactory("PrimaryLendingPlatformLiquidationZksync");
    let PrimaryLendingPlatformLeverage = await hre.ethers.getContractFactory("PrimaryLendingPlatformLeverageZksync");
    let PrimaryLendingPlatformWrappedTokenGateway = await hre.ethers.getContractFactory("PrimaryLendingPlatformWrappedTokenGatewayZksync");
    let PrimaryLendingPlatformModerator = await hre.ethers.getContractFactory("PrimaryLendingPlatformModerator");
    let WstETHPriceProvider = isLayer2 ? await hre.ethers.getContractFactory("wstETHPriceProviderL2") : await hre.ethers.getContractFactory("wstETHPriceProvider");


    let totalFee = ethers.BigNumber.from(0);

    const gasPrice = await provider.getGasPrice();
    if (network.name === "polygon_mainnet") {
        console.log(`Current estimated gas price: ${ethers.utils.formatEther(gasPrice)} MATIC`);
    } else {
        console.log(`Current estimated gas price: ${ethers.utils.formatEther(gasPrice)} ETH`);
    }

    console.log("\nEstimating deployment fee for ProxyAdmin");
    totalFee = await estimateGasFee(gasPrice, totalFee, deployMaster, ProxyAdmin);

    console.log("\nEstimating deployment fee for PythPriceProvider");
    totalFee = await estimateGasFee(gasPrice, totalFee, deployMaster, PythPriceProvider);

    console.log("\nEstimating deployment fee for ChainlinkPriceProvider");
    totalFee = await estimateGasFee(gasPrice, totalFee, deployMaster, ChainlinkPriceProvider);

    console.log("\nEstimating deployment fee for PriceProviderAggregator");
    totalFee = await estimateGasFee(gasPrice, totalFee, deployMaster, PriceProviderAggregator);

    console.log("\nEstimating deployment fee for WstETHPriceProvider");
    totalFee = await estimateGasFee(gasPrice, totalFee, deployMaster, WstETHPriceProvider);

    console.log("\nEstimating deployment fee for JumpRateModel");
    totalFee = await estimateGasFee(gasPrice, totalFee, deployMaster, JumpRateModel);

    console.log("\nEstimating deployment fee for Bondtroller");
    totalFee = await estimateGasFee(gasPrice, totalFee, deployMaster, Bondtroller);

    console.log("\nEstimating deployment fee for BLendingToken");
    totalFee = await estimateGasFee(gasPrice, totalFee, deployMaster, BLendingToken);

    console.log("\nEstimating deployment fee for PrimaryLendingPlatformV2");
    totalFee = await estimateGasFee(gasPrice, totalFee, deployMaster, PrimaryLendingPlatformV2);

    console.log("\nEstimating deployment fee for PrimaryLendingPlatformAtomicRepayment");
    totalFee = await estimateGasFee(gasPrice, totalFee, deployMaster, PrimaryLendingPlatformAtomicRepayment);

    console.log("\nEstimating deployment fee for PrimaryLendingPlatformLiquidation");
    totalFee = await estimateGasFee(gasPrice, totalFee, deployMaster, PrimaryLendingPlatformLiquidation);

    console.log("\nEstimating deployment fee for PrimaryLendingPlatformLeverage");
    totalFee = await estimateGasFee(gasPrice, totalFee, deployMaster, PrimaryLendingPlatformLeverage);

    console.log("\nEstimating deployment fee for PrimaryLendingPlatformWrappedTokenGateway");
    totalFee = await estimateGasFee(gasPrice, totalFee, deployMaster, PrimaryLendingPlatformWrappedTokenGateway);

    console.log("\nEstimating deployment fee for PrimaryLendingPlatformModerator");
    totalFee = await estimateGasFee(gasPrice, totalFee, deployMaster, PrimaryLendingPlatformModerator);

    if (network.name === "polygon_mainnet") {
        console.log(`\nTotal estimated deployment fee: ${ethers.utils.formatEther(totalFee)} MATIC`);
    } else {
        console.log(`\nTotal estimated deployment fee: ${ethers.utils.formatEther(totalFee)} ETH`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

const estimateGasFee = async (gasPrice, totalFee, deployMaster, artifact) => {
    const abi = artifact.interface.format("json");
    const contract = new ethers.ContractFactory(abi, artifact.bytecode, deployMaster);
    const deploymentData = await contract.getDeployTransaction().data;
    const estimatedGas = await ethers.provider.estimateGas({ from: deployMaster.address, data: deploymentData });
    const estimatedFee = estimatedGas.mul(gasPrice);
    const parsedFee = ethers.utils.formatEther(estimatedFee);
    totalFee = totalFee.add(estimatedFee);
    if (network.name === "polygon_mainnet") {
        console.log(`The deployment is estimated to cost ${parsedFee} MATIC`);
    } else {
        console.log(`The deployment is estimated to cost ${parsedFee} ETH`);
    }
    return totalFee;
}
