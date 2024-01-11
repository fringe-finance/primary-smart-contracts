const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const fs = require("fs");
const path = require("path");
const configFile = path.join(__dirname, `../../config/${network}/config.json`);
const config = require(configFile);

let { PRIMARY_PROXY_ADMIN, PriceProviderAggregatorLogic, PriceProviderAggregatorProxy } = config;

let proxyAdminAddress = PRIMARY_PROXY_ADMIN;
let priceProviderProxyAddress = PriceProviderAggregatorProxy;
let priceProviderLogicAddress = PriceProviderAggregatorLogic;

module.exports = {
  upgradePriceProviderAggregator: async function () {

    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
    let PriceProviderAggregator = await hre.ethers.getContractFactory("PriceProviderAggregatorPyth");

    if (!priceProviderLogicAddress) {
      let priceProvider = await PriceProviderAggregator.connect(deployMaster).deploy();
      await priceProvider.deployed();
      priceProviderLogicAddress = priceProvider.address;
      config.PriceProviderAggregatorLogic = priceProviderLogicAddress;
      fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
    }
    console.log("Price Provider masterCopy address: " + priceProviderLogicAddress);

    let proxyAdmin = await ProxyAdmin.attach(proxyAdminAddress).connect(deployMaster);
    let upgradeData = await proxyAdmin.upgradeData(
      priceProviderProxyAddress
    );
    let appendTimestamp = Number(upgradeData.appendTimestamp)

    if (appendTimestamp == 0) {
      await proxyAdmin
        .appendUpgrade(
          priceProviderProxyAddress,
          priceProviderLogicAddress
        )
        .then(function (instance) {
          console.log(
            "ProxyAdmin appendUpgrade " +
            priceProviderProxyAddress +
            " to " +
            priceProviderLogicAddress
          );
          return instance;
        });
    } else {
      let timeStamp = (await hre.ethers.provider.getBlock("latest")).timestamp;
      let delayPeriod = Number(upgradeData.delayPeriod);
      if (appendTimestamp + delayPeriod <= timeStamp) {
        await proxyAdmin
          .upgrade(priceProviderProxyAddress, priceProviderLogicAddress)
          .then(function (instance) {
            console.log(
              "ProxyAdmin upgraded " +
              priceProviderProxyAddress +
              " to " +
              priceProviderLogicAddress
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