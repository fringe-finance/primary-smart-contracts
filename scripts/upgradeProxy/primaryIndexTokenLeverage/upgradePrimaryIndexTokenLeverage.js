const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const fs = require("fs");
const path = require("path");
const configFile = path.join(__dirname, `../../config/${network}/config.json`);
const config = require(configFile);

let {
    PRIMARY_PROXY_ADMIN,
    PrimaryIndexTokenLeverageLogic,
    PrimaryIndexTokenLeverageProxy,
} = config;

let proxyAdminAddress = PRIMARY_PROXY_ADMIN;
let primaryIndexTokenLeverageLogicAddress = PrimaryIndexTokenLeverageLogic;
let primaryIndexTokenLeverageProxyAddress = PrimaryIndexTokenLeverageProxy;

module.exports = {
    upgradePrimaryIndexTokenLeverage: async function () {

        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];
        console.log("DeployMaster: " + deployMaster.address);

        let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
        let PrimaryIndexTokenLeverage = await hre.ethers.getContractFactory("PrimaryIndexTokenLeverage");

        if (!primaryIndexTokenLeverageLogicAddress) {
            pitLeverage = await PrimaryIndexTokenLeverage.connect(deployMaster).deploy();
            await pitLeverage.deployed().then(function (instance) {
                primaryIndexTokenLeverageLogicAddress = instance.address;
                config.PrimaryIndexTokenLeverageLogic = primaryIndexTokenLeverageLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("PrimaryIndexTokenLeverage masterCopy address: " + primaryIndexTokenLeverageLogicAddress);

        let proxyAdmin = await ProxyAdmin.attach(proxyAdminAddress).connect(deployMaster);
        let upgradeData = await proxyAdmin.upgradeData(
            primaryIndexTokenLeverageProxyAddress
        );
        let appendTimestamp = Number(upgradeData.appendTimestamp);
        if (appendTimestamp == 0) {
            await proxyAdmin
                .appendUpgrade(
                    primaryIndexTokenLeverageProxyAddress,
                    primaryIndexTokenLeverageLogicAddress
                )
                .then(function (instance) {
                    console.log(
                        "ProxyAdmin appendUpgrade " +
                        primaryIndexTokenLeverageProxyAddress +
                        " to " +
                        primaryIndexTokenLeverageLogicAddress
                    );
                    return instance;
                });
        } else {
            let timeStamp = (await hre.ethers.provider.getBlock("latest")).timestamp;
            let delayPeriod = Number(upgradeData.delayPeriod);
            if (appendTimestamp + delayPeriod <= timeStamp) {
                await proxyAdmin
                    .upgrade(primaryIndexTokenLeverageProxyAddress, primaryIndexTokenLeverageLogicAddress)
                    .then(function (instance) {
                        console.log(
                            "ProxyAdmin upgraded " +
                            primaryIndexTokenLeverageProxyAddress +
                            " to " +
                            primaryIndexTokenLeverageLogicAddress
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
