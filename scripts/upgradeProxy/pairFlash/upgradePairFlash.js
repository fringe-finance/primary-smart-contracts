require("dotenv").config();
const hre = require("hardhat");
const network = hre.hardhatArguments.network;
let chain = process.env.CHAIN && network == 'hardhat' ? "_" + process.env.CHAIN : "";
const fs = require("fs");
const path = require("path");
const configFile = path.join(__dirname, `../../config/${network}${chain}/config.json`);
const config = require(configFile);

let {
    PRIMARY_PROXY_ADMIN,
    PairFlashLogic,
    PairFlashProxy,
} = config;

let proxyAdminAddress = PRIMARY_PROXY_ADMIN;
let pairFlashLogicAddress = PairFlashLogic;
let pairFlashProxyAddress = PairFlashProxy;

module.exports = {
    upgradePairFlash: async function () {

        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];
        console.log("DeployMaster: " + deployMaster.address);

        let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
        let PairFlash = await hre.ethers.getContractFactory("PairFlash");

        if (!pairFlashLogicAddress) {
            let pairFlash = await PairFlash.connect(deployMaster).deploy();
            await pairFlash.deployed().then(function (instance) {
                pairFlashLogicAddress = instance.address;
                config.PairFlashLogic = pairFlashLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("PairFlash masterCopy address: " + pairFlashLogicAddress);

        let proxyAdmin = await ProxyAdmin.attach(proxyAdminAddress).connect(deployMaster);
        let upgradeData = await proxyAdmin.upgradeData(
            pairFlashProxyAddress
        );
        let appendTimestamp = Number(upgradeData.appendTimestamp);
        if (appendTimestamp == 0) {
            await proxyAdmin
                .appendUpgrade(
                    pairFlashProxyAddress,
                    pairFlashLogicAddress
                )
                .then(function (instance) {
                    console.log(
                        "ProxyAdmin appendUpgrade " +
                        pairFlashProxyAddress +
                        " to " +
                        pairFlashLogicAddress
                    );
                    return instance;
                });
        } else {
            let timeStamp = (await hre.ethers.provider.getBlock("latest")).timestamp;
            let delayPeriod = Number(upgradeData.delayPeriod);
            if (appendTimestamp + delayPeriod <= timeStamp) {
                await proxyAdmin
                    .upgrade(pairFlashProxyAddress, pairFlashLogicAddress)
                    .then(function (instance) {
                        console.log(
                            "ProxyAdmin upgraded " +
                            pairFlashProxyAddress +
                            " to " +
                            pairFlashLogicAddress
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
