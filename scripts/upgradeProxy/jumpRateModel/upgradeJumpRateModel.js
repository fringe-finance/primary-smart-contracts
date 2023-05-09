const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const fs = require("fs");
const path = require("path");
const configFile = path.join(__dirname, `../../config/${network}/config.json`);
const config = require(configFile);

let { PRIMARY_PROXY_ADMIN, JumpRateModelLogic, JumpRateModelProxy } = config;

let proxyAdmingAddress = PRIMARY_PROXY_ADMIN;
let jumrateModelProxyAddress = JumpRateModelProxy;
let jumrateModelLogicAddress = JumpRateModelLogic;

module.exports = {
  upgradeJumpRateModel: async function () {

    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
    let JumpRateModel = await hre.ethers.getContractFactory("JumpRateModelV3");

    if (!jumrateModelLogicAddress) {
      let jumrateModel = await JumpRateModel.connect(deployMaster).deploy();
      await jumrateModel.deployed();
      jumrateModelLogicAddress = jumrateModel.address;
      config.JumpRateModelLogic = jumrateModelLogicAddress;
      fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
    }
    console.log("JumpRateModel masterCopy address: " + jumrateModelLogicAddress);

    let proxyAdmin = await ProxyAdmin.attach(proxyAdmingAddress).connect(deployMaster);
    let upgradeData = await proxyAdmin.upgradeData(
      jumrateModelProxyAddress
    );
    let appendTimestamp = Number(upgradeData.appendTimestamp)

    if (appendTimestamp == 0) {
      await proxyAdmin
        .appendUpgrade(
          jumrateModelProxyAddress,
          jumrateModelLogicAddress
        )
        .then(function (instance) {
          console.log(
            "ProxyAdmin appendUpgrade " +
            jumrateModelProxyAddress +
            " to " +
            jumrateModelLogicAddress
          );
          return instance;
        });
    } else {
      let timeStamp = (await hre.ethers.provider.getBlock("latest")).timestamp;
      let delayPeriod = Number(upgradeData.delayPeriod);
      if (appendTimestamp + delayPeriod <= timeStamp) {
        await proxyAdmin
          .upgrade(jumrateModelProxyAddress, jumrateModelLogicAddress)
          .then(function (instance) {
            console.log(
              "ProxyAdmin upgraded " +
              jumrateModelProxyAddress +
              " to " +
              jumrateModelLogicAddress
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
};