const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const fs = require("fs");
const path = require("path");
const configFile = path.join(__dirname, `../../config/${network}/config.json`);
const config = require(configFile);

let {
    PRIMARY_PROXY_ADMIN,
    PrimaryLendingPlatformModeratorLogic,
    PrimaryLendingPlatformModeratorProxy,
} = config;

let proxyAdminAddress = PRIMARY_PROXY_ADMIN;
let primaryLendingPlatformModeratorLogicAddress = PrimaryLendingPlatformModeratorLogic;
let primaryLendingPlatformModeratorProxyAddress = PrimaryLendingPlatformModeratorProxy;

module.exports = {
    upgradePrimaryLendingPlatformModerator: async function () {

        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];
        console.log("DeployMaster: " + deployMaster.address);

        let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
        let PrimaryLendingPlatformModerator = await hre.ethers.getContractFactory("PrimaryLendingPlatformModerator");

        if (!primaryLendingPlatformModeratorLogicAddress) {
            plpModerator = await PrimaryLendingPlatformModerator.connect(deployMaster).deploy();
            await plpModerator.deployed().then(function (instance) {
                primaryLendingPlatformModeratorLogicAddress = instance.address;
                config.PrimaryLendingPlatformModeratorLogic = primaryLendingPlatformModeratorLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("PrimaryLendingPlatformModerator masterCopy address: " + primaryLendingPlatformModeratorLogicAddress);

        let proxyAdmin = await ProxyAdmin.attach(proxyAdminAddress).connect(deployMaster);
        let upgradeData = await proxyAdmin.upgradeData(
            primaryLendingPlatformModeratorProxyAddress
        );
        let appendTimestamp = Number(upgradeData.appendTimestamp)
        if (appendTimestamp == 0) {
            await proxyAdmin
                .appendUpgrade(
                    primaryLendingPlatformModeratorProxyAddress,
                    primaryLendingPlatformModeratorLogicAddress
                )
                .then(function (instance) {
                    console.log(
                        "ProxyAdmin appendUpgrade " +
                        primaryLendingPlatformModeratorProxyAddress +
                        " to " +
                        primaryLendingPlatformModeratorLogicAddress
                    );
                    return instance;
                });
        } else {
            let timeStamp = (await hre.ethers.provider.getBlock("latest")).timestamp;
            let delayPeriod = Number(upgradeData.delayPeriod);
            if (appendTimestamp + delayPeriod <= timeStamp) {
                await proxyAdmin
                    .upgrade(primaryLendingPlatformModeratorProxyAddress, primaryLendingPlatformModeratorLogicAddress)
                    .then(function (instance) {
                        console.log(
                            "ProxyAdmin upgraded " +
                            primaryLendingPlatformModeratorProxyAddress +
                            " to " +
                            primaryLendingPlatformModeratorLogicAddress
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