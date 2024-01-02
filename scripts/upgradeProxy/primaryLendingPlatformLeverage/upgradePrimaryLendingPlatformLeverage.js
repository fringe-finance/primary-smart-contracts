const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const fs = require("fs");
const path = require("path");
const configFile = path.join(__dirname, `../../config/${network}/config.json`);
const config = require(configFile);

let {
    PRIMARY_PROXY_ADMIN,
    PrimaryLendingPlatformLeverageLogic,
    PrimaryLendingPlatformLeverageProxy,
} = config;

let proxyAdminAddress = PRIMARY_PROXY_ADMIN;
let primaryLendingPlatformLeverageLogicAddress = PrimaryLendingPlatformLeverageLogic;
let primaryLendingPlatformLeverageProxyAddress = PrimaryLendingPlatformLeverageProxy;

module.exports = {
    upgradePrimaryLendingPlatformLeverage: async function () {

        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];
        console.log("DeployMaster: " + deployMaster.address);

        let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
        let PrimaryLendingPlatformLeverage = await hre.ethers.getContractFactory("PrimaryLendingPlatformLeverageZksync");

        if (!primaryLendingPlatformLeverageLogicAddress) {
            plpLeverage = await PrimaryLendingPlatformLeverage.connect(deployMaster).deploy();
            await plpLeverage.deployed().then(function (instance) {
                primaryLendingPlatformLeverageLogicAddress = instance.address;
                config.PrimaryLendingPlatformLeverageLogic = primaryLendingPlatformLeverageLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("PrimaryLendingPlatformLeverage masterCopy address: " + primaryLendingPlatformLeverageLogicAddress);

        let proxyAdmin = await ProxyAdmin.attach(proxyAdminAddress).connect(deployMaster);
        let upgradeData = await proxyAdmin.upgradeData(
            primaryLendingPlatformLeverageProxyAddress
        );
        let appendTimestamp = Number(upgradeData.appendTimestamp);
        if (appendTimestamp == 0) {
            await proxyAdmin
                .appendUpgrade(
                    primaryLendingPlatformLeverageProxyAddress,
                    primaryLendingPlatformLeverageLogicAddress
                )
                .then(function (instance) {
                    console.log(
                        "ProxyAdmin appendUpgrade " +
                        primaryLendingPlatformLeverageProxyAddress +
                        " to " +
                        primaryLendingPlatformLeverageLogicAddress
                    );
                    return instance;
                });
        } else {
            let timeStamp = (await hre.ethers.provider.getBlock("latest")).timestamp;
            let delayPeriod = Number(upgradeData.delayPeriod);
            if (appendTimestamp + delayPeriod <= timeStamp) {
                await proxyAdmin
                    .upgrade(primaryLendingPlatformLeverageProxyAddress, primaryLendingPlatformLeverageLogicAddress)
                    .then(function (instance) {
                        console.log(
                            "ProxyAdmin upgraded " +
                            primaryLendingPlatformLeverageProxyAddress +
                            " to " +
                            primaryLendingPlatformLeverageLogicAddress
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
