const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const fs = require("fs");
const path = require("path");
const configFile = path.join(__dirname, `../../config/${network}/config.json`);
const config = require(configFile);

let {
    PRIMARY_PROXY_ADMIN,
    PrimaryLendingPlatformAtomicRepaymentLogic,
    PrimaryLendingPlatformAtomicRepaymentProxy
} = config;

let proxyAdminAddress = PRIMARY_PROXY_ADMIN;
let primaryLendingPlatformAtomicRepaymentLogicAddress = PrimaryLendingPlatformAtomicRepaymentLogic;
let primaryLendingPlatformAtomicRepaymentProxyAddress = PrimaryLendingPlatformAtomicRepaymentProxy;

module.exports = {
    upgradePrimaryLendingPlatformAtomicRepayment: async function () {

        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];
        console.log("DeployMaster: " + deployMaster.address);

        let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
        let PrimaryLendingPlatformAtomicRepayment = await hre.ethers.getContractFactory("PrimaryLendingPlatformAtomicRepaymentZksync");

        if (!primaryLendingPlatformAtomicRepaymentLogicAddress) {
            pitAtomicRepayment = await PrimaryLendingPlatformAtomicRepayment.connect(deployMaster).deploy();
            await pitAtomicRepayment.deployed().then(function (instance) {
                primaryLendingPlatformAtomicRepaymentLogicAddress = instance.address;
                config.PrimaryLendingPlatformAtomicRepaymentLogic = primaryLendingPlatformAtomicRepaymentLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("PrimaryLendingPlatformAtomicRepayment masterCopy address: " + primaryLendingPlatformAtomicRepaymentLogicAddress);

        let proxyAdmin = await ProxyAdmin.attach(proxyAdminAddress).connect(deployMaster);
        let upgradeData = await proxyAdmin.upgradeData(
            primaryLendingPlatformAtomicRepaymentProxyAddress
        );
        let appendTimestamp = Number(upgradeData.appendTimestamp);
        if (appendTimestamp == 0) {
            await proxyAdmin
                .appendUpgrade(
                    primaryLendingPlatformAtomicRepaymentProxyAddress,
                    primaryLendingPlatformAtomicRepaymentLogicAddress
                )
                .then(function (instance) {
                    console.log(
                        "ProxyAdmin appendUpgrade " +
                        primaryLendingPlatformAtomicRepaymentProxyAddress +
                        " to " +
                        primaryLendingPlatformAtomicRepaymentLogicAddress
                    );
                    return instance;
                });
        } else {
            let timeStamp = (await hre.ethers.provider.getBlock("latest")).timestamp;
            let delayPeriod = Number(upgradeData.delayPeriod);
            if (appendTimestamp + delayPeriod <= timeStamp) {
                await proxyAdmin
                    .upgrade(primaryLendingPlatformAtomicRepaymentProxyAddress, primaryLendingPlatformAtomicRepaymentLogicAddress)
                    .then(function (instance) {
                        console.log(
                            "ProxyAdmin upgraded " +
                            primaryLendingPlatformAtomicRepaymentProxyAddress +
                            " to " +
                            primaryLendingPlatformAtomicRepaymentLogicAddress
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