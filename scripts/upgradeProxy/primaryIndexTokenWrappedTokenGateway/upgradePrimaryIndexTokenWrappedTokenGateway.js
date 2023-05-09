const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const fs = require("fs");
const path = require("path");
const configFile = path.join(__dirname, `../../config/${network}/config.json`);
const config = require(configFile);

let {
    PRIMARY_PROXY_ADMIN,
    PrimaryIndexTokenWrappedTokenGatewayLogic,
    PrimaryIndexTokenWrappedTokenGatewayProxy,
} = config;

let proxyAdminAddress = PRIMARY_PROXY_ADMIN;
let primaryIndexTokenWrappedTokenGatewayLogicAddress = PrimaryIndexTokenWrappedTokenGatewayLogic;
let primaryIndexTokenWrappedTokenGatewayProxyAddress = PrimaryIndexTokenWrappedTokenGatewayProxy;

module.exports = {
    upgradePrimaryIndexTokenWrappedTokenGateway: async function () {

        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];
        console.log("DeployMaster: " + deployMaster.address);

        let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
        let PrimaryIndexTokenWrappedTokenGateway = await hre.ethers.getContractFactory("PrimaryIndexTokenWrappedTokenGateway");

        if (!primaryIndexTokenWrappedTokenGatewayLogicAddress) {
            pitWrappedTokenGateway = await PrimaryIndexTokenWrappedTokenGateway.connect(deployMaster).deploy();
            await pitWrappedTokenGateway.deployed().then(function (instance) {
                primaryIndexTokenWrappedTokenGatewayLogicAddress = instance.address;
                config.PrimaryIndexTokenWrappedTokenGatewayLogic = primaryIndexTokenWrappedTokenGatewayLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("PrimaryIndexTokenWrappedTokenGateway masterCopy address: " + PrimaryIndexTokenWrappedTokenGatewayLogic);

        let proxyAdmin = await ProxyAdmin.attach(proxyAdminAddress).connect(deployMaster);
        let upgradeData = await proxyAdmin.upgradeData(
            primaryIndexTokenWrappedTokenGatewayProxyAddress
        );
        let appendTimestamp = Number(upgradeData.appendTimestamp);
        if (appendTimestamp == 0) {
            await proxyAdmin
                .appendUpgrade(
                    primaryIndexTokenWrappedTokenGatewayProxyAddress,
                    primaryIndexTokenWrappedTokenGatewayLogicAddress
                )
                .then(function (instance) {
                    console.log(
                        "ProxyAdmin appendUpgrade " +
                        primaryIndexTokenWrappedTokenGatewayProxyAddress +
                        " to " +
                        primaryIndexTokenWrappedTokenGatewayLogicAddress
                    );
                    return instance;
                });
        } else {
            let timeStamp = (await hre.ethers.provider.getBlock("latest")).timestamp;
            let delayPeriod = Number(upgradeData.delayPeriod);
            if (appendTimestamp + delayPeriod <= timeStamp) {
                await proxyAdmin
                    .upgrade(primaryIndexTokenWrappedTokenGatewayProxyAddress, primaryIndexTokenWrappedTokenGatewayLogicAddress)
                    .then(function (instance) {
                        console.log(
                            "ProxyAdmin upgraded " +
                            primaryIndexTokenWrappedTokenGatewayProxyAddress +
                            " to " +
                            primaryIndexTokenWrappedTokenGatewayLogicAddress
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