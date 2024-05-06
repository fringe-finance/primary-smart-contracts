require("dotenv").config();

const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const { Wallet, Provider } = require("zksync-web3");
const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");
const { ethers } = require("ethers");

module.exports = async function () {
    let provider;
    switch (network) {
        case "goerli":
            provider = new Provider("https://zksync2-testnet.zksync.dev");
            break;
        case "mainnet":
            provider = new Provider("https://mainnet.era.zksync.io");
            break;
        default:
            provider = new Provider("http://127.0.0.1:8011");
            break;
    }

    const wallet = new Wallet(process.env.PRIVATE_KEY).connect(provider);
    const deployer = new Deployer(hre, wallet);

    let ProxyAdmin = await deployer.loadArtifact("PrimaryLendingPlatformProxyAdmin");

    let PythPriceProvider = await deployer.loadArtifact("PythPriceProvider");
    let ChainlinkPriceProvider = await deployer.loadArtifact("ChainlinkPriceProvider");
    let PriceProviderAggregator = await deployer.loadArtifact("PriceProviderAggregatorPyth");
    let WstETHPriceProvider = await deployer.loadArtifact("wstETHPriceProvider");


    let JumpRateModel = await deployer.loadArtifact("JumpRateModelV3");
    let Bondtroller = await deployer.loadArtifact("Bondtroller");
    let BLendingToken = await deployer.loadArtifact("BLendingToken");
    let PrimaryLendingPlatformV2 = await deployer.loadArtifact("PrimaryLendingPlatformV2Zksync");
    let PrimaryLendingPlatformAtomicRepayment = await deployer.loadArtifact("PrimaryLendingPlatformAtomicRepaymentZksync");
    let PrimaryLendingPlatformLiquidation = await deployer.loadArtifact("PrimaryLendingPlatformLiquidationZksync");
    let PrimaryLendingPlatformLeverage = await deployer.loadArtifact("PrimaryLendingPlatformLeverageZksync");
    let PrimaryLendingPlatformWrappedTokenGateway = await deployer.loadArtifact("PrimaryLendingPlatformWrappedTokenGatewayZksync");
    let PrimaryLendingPlatformModerator = await deployer.loadArtifact("PrimaryLendingPlatformModerator");

    let totalFee = ethers.BigNumber.from(0);

    const gasPrice = await provider.getGasPrice();
    console.log(`Current estimated gas price: ${ethers.utils.formatEther(gasPrice)} ETH`);

    console.log("\nEstimating deployment fee for ProxyAdmin");
    totalFee = await estimateGasFee(deployer, totalFee, ProxyAdmin);

    console.log("\nEstimating deployment fee for PythPriceProvider");
    totalFee = await estimateGasFee(deployer, totalFee, PythPriceProvider);

    console.log("\nEstimating deployment fee for ChainlinkPriceProvider");
    totalFee = await estimateGasFee(deployer, totalFee, ChainlinkPriceProvider);

    console.log("\nEstimating deployment fee for PriceProviderAggregator");
    totalFee = await estimateGasFee(deployer, totalFee, PriceProviderAggregator);

    console.log("\nEstimating deployment fee for WstETHPriceProvider");
    totalFee = await estimateGasFee(deployer, totalFee, WstETHPriceProvider);

    console.log("\nEstimating deployment fee for JumpRateModel");
    totalFee = await estimateGasFee(deployer, totalFee, JumpRateModel);

    console.log("\nEstimating deployment fee for Bondtroller");
    totalFee = await estimateGasFee(deployer, totalFee, Bondtroller);

    console.log("\nEstimating deployment fee for BLendingToken");
    totalFee = await estimateGasFee(deployer, totalFee, BLendingToken);

    console.log("\nEstimating deployment fee for PrimaryLendingPlatformV2");
    totalFee = await estimateGasFee(deployer, totalFee, PrimaryLendingPlatformV2);

    console.log("\nEstimating deployment fee for PrimaryLendingPlatformAtomicRepayment");
    totalFee = await estimateGasFee(deployer, totalFee, PrimaryLendingPlatformAtomicRepayment);

    console.log("\nEstimating deployment fee for PrimaryLendingPlatformLiquidation");
    totalFee = await estimateGasFee(deployer, totalFee, PrimaryLendingPlatformLiquidation);

    console.log("\nEstimating deployment fee for PrimaryLendingPlatformLeverage");
    totalFee = await estimateGasFee(deployer, totalFee, PrimaryLendingPlatformLeverage);

    console.log("\nEstimating deployment fee for PrimaryLendingPlatformWrappedTokenGateway");
    totalFee = await estimateGasFee(deployer, totalFee, PrimaryLendingPlatformWrappedTokenGateway);

    console.log("\nEstimating deployment fee for PrimaryLendingPlatformModerator");
    totalFee = await estimateGasFee(deployer, totalFee, PrimaryLendingPlatformModerator);

    console.log(`\nTotal estimated deployment fee: ${ethers.utils.formatEther(totalFee)} ETH`);
}

const estimateGasFee = async (deployer, totalFee, artifact) => {
    const deploymentFee = await deployer.estimateDeployFee(artifact, []);
    const parsedFee = ethers.utils.formatEther(deploymentFee);
    totalFee = totalFee.add(deploymentFee);
    console.log(`The deployment is estimated to cost ${parsedFee} ETH`);
    return totalFee;
}