require("dotenv").config();
const fs = require("fs");
const hre = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { deployment } = require("../../../scripts/deployPLP_V2/deploymentPLP");

async function deployPlatform() {
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];

    await helpers.setBalance(deployMaster.address, hre.ethers.constants.MaxUint256);
    let logFunc = console.log;
    let writeFileSync = fs.writeFileSync;
    let address = await deployment();
    console.log = logFunc;
    fs.writeFileSync = writeFileSync;

    let PLP = await hre.ethers.getContractFactory("PrimaryLendingPlatformV2Zksync");
    let PLPAtomicRepay = await hre.ethers.getContractFactory("PrimaryLendingPlatformAtomicRepaymentZksync");
    let PLPLeverage = await hre.ethers.getContractFactory("PrimaryLendingPlatformLeverageZksync");
    let PLPLiquidation = await hre.ethers.getContractFactory("PrimaryLendingPlatformLiquidationZksync");
    let PLPWTG = await hre.ethers.getContractFactory("PrimaryLendingPlatformWrappedTokenGatewayZksync");
    let PLPModerator = await hre.ethers.getContractFactory("PrimaryLendingPlatformModerator");
    let PriceProviderAggregator = await hre.ethers.getContractFactory("PriceProviderAggregatorPyth");

    const addresses = {
        plpAddress: address.plpAddress,
        plpAtomicRepayAddress: address.plpAtomicRepaymentAddress,
        plpLeverageAddress: address.plpLeverageAddress,
        plpLiquidationAddress: address.plpLiquidationAddress,
        plpWTGAddress: address.plpWrappedTokenGateway,
        plpModeratorAddress: address.plpModerator,
        priceProviderAggregatorAddress: address.priceProviderAggregatorAddress
    }

    const contractInstance = {
        plpInstance: PLP.attach(addresses.plpAddress).connect(deployMaster),
        plpAtomicRepayInstance: PLPAtomicRepay.attach(addresses.plpAtomicRepayAddress).connect(deployMaster),
        plpLeverageInstance: PLPLeverage.attach(addresses.plpLeverageAddress).connect(deployMaster),
        plpLiquidationInstance: PLPLiquidation.attach(addresses.plpLiquidationAddress).connect(deployMaster),
        plpWTGInstance: PLPWTG.attach(addresses.plpWTGAddress).connect(deployMaster),
        plpModeratorInstance: PLPModerator.attach(addresses.plpModeratorAddress).connect(deployMaster),
        priceProviderAggregatorInstance: PriceProviderAggregator.attach(addresses.priceProviderAggregatorAddress).connect(deployMaster)
    }

    return {
        addresses,
        contractInstance
    }
}

module.exports = {
    deployPlatform
}