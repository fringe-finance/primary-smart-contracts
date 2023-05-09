const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const fs = require("fs");
const path = require("path");
const configFile = path.join(__dirname, `../../config/${network}/config.json`);
const config = require(configFile);

let {
    PRIMARY_PROXY_ADMIN,
    PrimaryIndexTokenAtomicRepaymentLogic,
    PrimaryIndexTokenAtomicRepaymentProxy
} = config;

let proxyAdminAddress = PRIMARY_PROXY_ADMIN;
let primaryIndexTokenAtomicRepaymentLogicAddress = PrimaryIndexTokenAtomicRepaymentLogic;
let primaryIndexTokenAtomicRepaymentProxyAddress = PrimaryIndexTokenAtomicRepaymentProxy;

module.exports = {
    upgradePrimaryIndexTokenAtomicRepayment: async function () {

        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];
        console.log("DeployMaster: " + deployMaster.address);

        let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
        let PrimaryIndexTokenAtomicRepayment = await hre.ethers.getContractFactory("PrimaryIndexTokenAtomicRepayment");

        if (!primaryIndexTokenAtomicRepaymentLogicAddress) {
            pitAtomicRepayment = await PrimaryIndexTokenAtomicRepayment.connect(deployMaster).deploy();
            await pitAtomicRepayment.deployed().then(function (instance) {
                primaryIndexTokenAtomicRepaymentLogicAddress = instance.address;
                config.PrimaryIndexTokenAtomicRepaymentLogic = primaryIndexTokenAtomicRepaymentLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("PrimaryIndexTokenAtomicRepayment masterCopy address: " + primaryIndexTokenAtomicRepaymentLogicAddress);

        let proxyAdmin = await ProxyAdmin.attach(proxyAdminAddress).connect(deployMaster);
        let upgradeData = await proxyAdmin.upgradeData(
            primaryIndexTokenAtomicRepaymentProxyAddress
        );
        let appendTimestamp = Number(upgradeData.appendTimestamp);
        if (appendTimestamp == 0) {
            await proxyAdmin
                .appendUpgrade(
                    primaryIndexTokenAtomicRepaymentProxyAddress,
                    primaryIndexTokenAtomicRepaymentLogicAddress
                )
                .then(function (instance) {
                    console.log(
                        "ProxyAdmin appendUpgrade " +
                        primaryIndexTokenAtomicRepaymentProxyAddress +
                        " to " +
                        primaryIndexTokenAtomicRepaymentLogicAddress
                    );
                    return instance;
                });
        } else {
            let timeStamp = (await hre.ethers.provider.getBlock("latest")).timestamp;
            let delayPeriod = Number(upgradeData.delayPeriod);
            if (appendTimestamp + delayPeriod <= timeStamp) {
                await proxyAdmin
                    .upgrade(primaryIndexTokenAtomicRepaymentProxyAddress, primaryIndexTokenAtomicRepaymentLogicAddress)
                    .then(function (instance) {
                        console.log(
                            "ProxyAdmin upgraded " +
                            primaryIndexTokenAtomicRepaymentProxyAddress +
                            " to " +
                            primaryIndexTokenAtomicRepaymentLogicAddress
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