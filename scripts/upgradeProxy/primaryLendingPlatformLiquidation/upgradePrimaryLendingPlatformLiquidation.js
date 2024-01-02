const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const fs = require("fs");
const path = require("path");
const configFile = path.join(__dirname, `../../config/${network}/config.json`);
const config = require(configFile);

let {
    PRIMARY_PROXY_ADMIN,
    PrimaryLendingPlatformLiquidationLogic,
    PrimaryLendingPlatformLiquidationProxy,
} = config;

let proxyAdminAddress = PRIMARY_PROXY_ADMIN;
let primaryLendingPlatformLiquidationLogicAddress = PrimaryLendingPlatformLiquidationLogic;
let primaryLendingPlatformLiquidationProxyAddress = PrimaryLendingPlatformLiquidationProxy;

module.exports = {
    upgradePrimaryLendingPlatformLiquidation: async function () {

        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];
        console.log("DeployMaster: " + deployMaster.address);

        let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
        let PrimaryLendingPlatformLiquidation = await hre.ethers.getContractFactory("PrimaryLendingPlatformLiquidation");

        if (!primaryLendingPlatformLiquidationLogicAddress) {
            plpLiquidation = await PrimaryLendingPlatformLiquidation.connect(deployMaster).deploy();
            await plpLiquidation.deployed().then(function (instance) {
                primaryLendingPlatformLiquidationLogicAddress = instance.address;
                config.PrimaryLendingPlatformLiquidationLogic = primaryLendingPlatformLiquidationLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("PrimaryLendingPlatformLiquidation masterCopy address: " + primaryLendingPlatformLiquidationLogicAddress);

        let proxyAdmin = await ProxyAdmin.attach(proxyAdminAddress).connect(deployMaster);
        let upgradeData = await proxyAdmin.upgradeData(
            primaryLendingPlatformLiquidationProxyAddress
        );
        let appendTimestamp = Number(upgradeData.appendTimestamp);
        if (appendTimestamp == 0) {
            await proxyAdmin
                .appendUpgrade(
                    primaryLendingPlatformLiquidationProxyAddress,
                    primaryLendingPlatformLiquidationLogicAddress
                )
                .then(function (instance) {
                    console.log(
                        "ProxyAdmin appendUpgrade " +
                        primaryLendingPlatformLiquidationProxyAddress +
                        " to " +
                        primaryLendingPlatformLiquidationLogicAddress
                    );
                    return instance;
                });
        } else {
            let timeStamp = (await hre.ethers.provider.getBlock("latest")).timestamp;
            let delayPeriod = Number(upgradeData.delayPeriod);
            if (appendTimestamp + delayPeriod <= timeStamp) {
                await proxyAdmin
                    .upgrade(primaryLendingPlatformLiquidationProxyAddress, primaryLendingPlatformLiquidationLogicAddress)
                    .then(function (instance) {
                        console.log(
                            "ProxyAdmin upgraded " +
                            primaryLendingPlatformLiquidationProxyAddress +
                            " to " +
                            primaryLendingPlatformLiquidationLogicAddress
                        );
                        return instance;
                    });
            } else {
                console.log("AppendTimestamp", appendTimestamp);
                console.log("Delay time ", delayPeriod);
                console.log("Current ", timeStamp);
                console.log("Can upgrade at ", appendTimestamp + delayPeriod);
                console.log("Need to wait another " + (appendTimestamp + delayPeriod - timeStamp) + "s");
            }
        }
    }
}