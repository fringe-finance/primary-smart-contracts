const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const fs = require("fs");
const path = require("path");
const configFile = path.join(__dirname, `../../config/${network}/config.json`);
const config = require(configFile);

let {
  PRIMARY_PROXY_ADMIN,
  PrimaryLendingPlatformV2Logic,
  PrimaryLendingPlatformV2Proxy
} = config;

let proxyAdminAddress = PRIMARY_PROXY_ADMIN;
let primaryLendingPlatformV2LogicAddress = PrimaryLendingPlatformV2Logic;
let primaryLendingPlatformV2ProxyAddress = PrimaryLendingPlatformV2Proxy;

module.exports = {
  upgradePrimaryLendingPlatform: async function () {

    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
    let PrimaryLendingPlatformV2 = await hre.ethers.getContractFactory("PrimaryLendingPlatformV2Zksync");

    if (!primaryLendingPlatformV2LogicAddress) {
      plp = await PrimaryLendingPlatformV2.connect(deployMaster).deploy();
      await plp.deployed().then(function (instance) {
        primaryLendingPlatformV2LogicAddress = instance.address;
        config.PrimaryLendingPlatformV2Logic = primaryLendingPlatformV2LogicAddress;
        fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
      });
    }
    console.log("PrimaryLendingPlatform masterCopy address: " + primaryLendingPlatformV2LogicAddress);

    let proxyAdmin = await ProxyAdmin.attach(proxyAdminAddress).connect(deployMaster);
    let upgradeData = await proxyAdmin.upgradeData(
      primaryLendingPlatformV2ProxyAddress
    );
    let appendTimestamp = Number(upgradeData.appendTimestamp)
    if (appendTimestamp == 0) {
      await proxyAdmin
        .appendUpgrade(
          primaryLendingPlatformV2ProxyAddress,
          primaryLendingPlatformV2LogicAddress
        )
        .then(function (instance) {
          console.log(
            "ProxyAdmin appendUpgrade " +
            primaryLendingPlatformV2ProxyAddress +
            " to " +
            primaryLendingPlatformV2LogicAddress
          );
          return instance;
        });
    } else {
      let timeStamp = (await hre.ethers.provider.getBlock("latest")).timestamp;
      let delayPeriod = Number(upgradeData.delayPeriod);
      if (appendTimestamp + delayPeriod <= timeStamp) {
        await proxyAdmin
          .upgrade(primaryLendingPlatformV2ProxyAddress, primaryLendingPlatformV2LogicAddress)
          .then(function (instance) {
            console.log(
              "ProxyAdmin upgraded " +
              primaryLendingPlatformV2ProxyAddress +
              " to " +
              primaryLendingPlatformV2LogicAddress
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