require("dotenv").config();
const fs = require("fs");
const hre = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { deployment } = require("../../../scripts/V3/deployPLP/deploymentPLP");

async function deployPlatform() {
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];

    await helpers.setBalance(deployMaster.address, hre.ethers.constants.MaxUint256);
    let writeFileSync = fs.writeFileSync;
    let address = await deployment();
    fs.writeFileSync = writeFileSync;

    let PLP = await hre.ethers.getContractFactory("PrimaryLendingPlatformV3");
    let PLPAtomicRepay = await hre.ethers.getContractFactory("PrimaryLendingPlatformAtomicRepaymentV3");
    let PLPLeverage = await hre.ethers.getContractFactory("PrimaryLendingPlatformLeverageV3");
    let PLPLiquidation = await hre.ethers.getContractFactory("PrimaryLendingPlatformLiquidationV3");
    let PLPWTG = await hre.ethers.getContractFactory("PrimaryLendingPlatformWrappedTokenGatewayV3");
    let PLPModerator = await hre.ethers.getContractFactory("PrimaryLendingPlatformModeratorV3");
    let PriceProviderAggregator = await hre.ethers.getContractFactory("PriceProviderAggregatorPythV3");
    let PLPWrappedTokenGateway = await hre.ethers.getContractFactory("PrimaryLendingPlatformWrappedTokenGatewayV3")

    const addresses = {
        plpAddress: address.plpAddress,
        plpAtomicRepayAddress: address.plpAtomicRepaymentAddress,
        plpLeverageAddress: address.plpLeverageAddress,
        plpLiquidationAddress: address.plpLiquidationAddress,
        plpWTGAddress: address.plpWrappedTokenGateway,
        plpModeratorAddress: address.plpModerator,
        priceProviderAggregatorAddress: address.priceProviderAggregatorAddress,
        plpWrappedTokenGatewayAddress: address.plpWrappedTokenGateway
    }

    const contractInstance = {
        plpInstance: PLP.attach(addresses.plpAddress).connect(deployMaster),
        plpAtomicRepayInstance: PLPAtomicRepay.attach(addresses.plpAtomicRepayAddress).connect(deployMaster),
        plpLeverageInstance: PLPLeverage.attach(addresses.plpLeverageAddress).connect(deployMaster),
        plpLiquidationInstance: PLPLiquidation.attach(addresses.plpLiquidationAddress).connect(deployMaster),
        plpWTGInstance: PLPWTG.attach(addresses.plpWTGAddress).connect(deployMaster),
        plpModeratorInstance: PLPModerator.attach(addresses.plpModeratorAddress).connect(deployMaster),
        priceProviderAggregatorInstance: PriceProviderAggregator.attach(addresses.priceProviderAggregatorAddress).connect(deployMaster),
        plpWrappedTokenGatewayInstance: PLPWrappedTokenGateway.attach(address.plpWrappedTokenGateway).connect(deployMaster)
    }

    return {
        addresses,
        contractInstance
    }
}

module.exports = {
    deployPlatform
}