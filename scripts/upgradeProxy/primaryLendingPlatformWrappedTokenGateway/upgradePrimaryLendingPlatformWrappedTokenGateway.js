const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const fs = require("fs");
const path = require("path");
const configFile = path.join(__dirname, `../../config/${network}/config.json`);
const config = require(configFile);

let {
    PRIMARY_PROXY_ADMIN,
    PrimaryLendingPlatformWrappedTokenGatewayLogic,
    PrimaryLendingPlatformWrappedTokenGatewayProxy,
} = config;

let proxyAdminAddress = PRIMARY_PROXY_ADMIN;
let primaryLendingPlatformWrappedTokenGatewayLogicAddress = PrimaryLendingPlatformWrappedTokenGatewayLogic;
let primaryLendingPlatformWrappedTokenGatewayProxyAddress = PrimaryLendingPlatformWrappedTokenGatewayProxy;

module.exports = {
    upgradePrimaryLendingPlatformWrappedTokenGateway: async function () {

        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];
        console.log("DeployMaster: " + deployMaster.address);

        let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
        let PrimaryLendingPlatformWrappedTokenGateway = await hre.ethers.getContractFactory("PrimaryLendingPlatformWrappedTokenGateway");

        if (!primaryLendingPlatformWrappedTokenGatewayLogicAddress) {
            plpWrappedTokenGateway = await PrimaryLendingPlatformWrappedTokenGateway.connect(deployMaster).deploy();
            await plpWrappedTokenGateway.deployed().then(function (instance) {
                primaryLendingPlatformWrappedTokenGatewayLogicAddress = instance.address;
                config.PrimaryLendingPlatformWrappedTokenGatewayLogic = primaryLendingPlatformWrappedTokenGatewayLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("PrimaryLendingPlatformWrappedTokenGateway masterCopy address: " + PrimaryLendingPlatformWrappedTokenGatewayLogic);

        let proxyAdmin = await ProxyAdmin.attach(proxyAdminAddress).connect(deployMaster);
        let upgradeData = await proxyAdmin.upgradeData(
            primaryLendingPlatformWrappedTokenGatewayProxyAddress
        );
        let appendTimestamp = Number(upgradeData.appendTimestamp);
        if (appendTimestamp == 0) {
            await proxyAdmin
                .appendUpgrade(
                    primaryLendingPlatformWrappedTokenGatewayProxyAddress,
                    primaryLendingPlatformWrappedTokenGatewayLogicAddress
                )
                .then(function (instance) {
                    console.log(
                        "ProxyAdmin appendUpgrade " +
                        primaryLendingPlatformWrappedTokenGatewayProxyAddress +
                        " to " +
                        primaryLendingPlatformWrappedTokenGatewayLogicAddress
                    );
                    return instance;
                });
        } else {
            let timeStamp = (await hre.ethers.provider.getBlock("latest")).timestamp;
            let delayPeriod = Number(upgradeData.delayPeriod);
            if (appendTimestamp + delayPeriod <= timeStamp) {
                await proxyAdmin
                    .upgrade(primaryLendingPlatformWrappedTokenGatewayProxyAddress, primaryLendingPlatformWrappedTokenGatewayLogicAddress)
                    .then(function (instance) {
                        console.log(
                            "ProxyAdmin upgraded " +
                            primaryLendingPlatformWrappedTokenGatewayProxyAddress +
                            " to " +
                            primaryLendingPlatformWrappedTokenGatewayLogicAddress
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