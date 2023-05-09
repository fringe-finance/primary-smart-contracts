const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const fs = require("fs");
const path = require("path");
const configFile = path.join(__dirname, `../../config/${network}/config.json`);
const config = require(configFile);

let {
    PRIMARY_PROXY_ADMIN,
    PrimaryIndexTokenLiquidationLogic,
    PrimaryIndexTokenLiquidationProxy,
} = config;

let proxyAdminAddress = PRIMARY_PROXY_ADMIN;
let primaryIndexTokenLiquidationLogicAddress = PrimaryIndexTokenLiquidationLogic;
let primaryIndexTokenLiquidationProxyAddress = PrimaryIndexTokenLiquidationProxy;

module.exports = {
    upgradePrimaryIndexTokenLiquidation: async function () {

        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];
        console.log("DeployMaster: " + deployMaster.address);

        let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
        let PrimaryIndexTokenLiquidation = await hre.ethers.getContractFactory("PrimaryIndexTokenLiquidation");

        if (!primaryIndexTokenLiquidationLogicAddress) {
            pitLiquidation = await PrimaryIndexTokenLiquidation.connect(deployMaster).deploy();
            await pitLiquidation.deployed().then(function (instance) {
                primaryIndexTokenLiquidationLogicAddress = instance.address;
                config.PrimaryIndexTokenLiquidationLogic = primaryIndexTokenLiquidationLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("PrimaryIndexTokenLiquidation masterCopy address: " + primaryIndexTokenLiquidationLogicAddress);

        let proxyAdmin = await ProxyAdmin.attach(proxyAdminAddress).connect(deployMaster);
        let upgradeData = await proxyAdmin.upgradeData(
            primaryIndexTokenLiquidationProxyAddress
        );
        let appendTimestamp = Number(upgradeData.appendTimestamp);
        if (appendTimestamp == 0) {
            await proxyAdmin
                .appendUpgrade(
                    primaryIndexTokenLiquidationProxyAddress,
                    primaryIndexTokenLiquidationLogicAddress
                )
                .then(function (instance) {
                    console.log(
                        "ProxyAdmin appendUpgrade " +
                        primaryIndexTokenLiquidationProxyAddress +
                        " to " +
                        primaryIndexTokenLiquidationLogicAddress
                    );
                    return instance;
                });
        } else {
            let timeStamp = (await hre.ethers.provider.getBlock("latest")).timestamp;
            let delayPeriod = Number(upgradeData.delayPeriod);
            if (appendTimestamp + delayPeriod <= timeStamp) {
                await proxyAdmin
                    .upgrade(primaryIndexTokenLiquidationProxyAddress, primaryIndexTokenLiquidationLogicAddress)
                    .then(function (instance) {
                        console.log(
                            "ProxyAdmin upgraded " +
                            primaryIndexTokenLiquidationProxyAddress +
                            " to " +
                            primaryIndexTokenLiquidationLogicAddress
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