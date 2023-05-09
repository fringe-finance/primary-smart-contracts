const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const fs = require("fs");
const path = require("path");
const configFile = path.join(__dirname, `../../../config/${network}/config.json`);
const config = require(configFile);

let {PRIMARY_PROXY_ADMIN, ChainlinkPriceProviderLogic, ChainlinkPriceProviderProxy} = config;

let proxyAdmingAddress = PRIMARY_PROXY_ADMIN;
let chainlinkProviderProxyAddress = ChainlinkPriceProviderProxy;
let chainlinkProviderLogicAddress = ChainlinkPriceProviderLogic;

module.exports = {
  upgradeChainlinkProvider: async function () {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
    let ChainlinkPriceProvider = await hre.ethers.getContractFactory("ChainlinkPriceProvider");

    if(!chainlinkProviderLogicAddress) {
      let chainlinkProvider = await ChainlinkPriceProvider.connect(deployMaster).deploy();
      await chainlinkProvider.deployed();
      chainlinkProviderLogicAddress = chainlinkProvider.address;
      config.ChainlinkPriceProviderLogic = chainlinkProviderLogicAddress;
      fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
    }
    console.log("Chainlink provider masterCopy address: " + chainlinkProviderLogicAddress);
  
    let proxyAdmin = await ProxyAdmin.attach(proxyAdmingAddress).connect(deployMaster);
    let upgradeData = await proxyAdmin.upgradeData(
      chainlinkProviderProxyAddress
    );
    let appendTimestamp = Number(upgradeData.appendTimestamp)

    if(appendTimestamp == 0) {
      await proxyAdmin
        .appendUpgrade(
          chainlinkProviderProxyAddress,
          chainlinkProviderLogicAddress
        )
        .then(function (instance) {
          console.log(
            "ProxyAdmin appendUpgrade " +
              chainlinkProviderProxyAddress +
              " to " +
              chainlinkProviderLogicAddress
          );
          return instance;
        });
    } else {
      let timeStamp = (await hre.ethers.provider.getBlock("latest")).timestamp;
      let delayPeriod = Number(upgradeData.delayPeriod);
      if (appendTimestamp + delayPeriod <= timeStamp) {
        await proxyAdmin
          .upgrade(chainlinkProviderProxyAddress, chainlinkProviderLogicAddress)
          .then(function (instance) {
            console.log(
              "ProxyAdmin upgraded " +
                chainlinkProviderProxyAddress +
                " to " +
                chainlinkProviderLogicAddress
            );
            return instance;
          });
      } else {
        console.log("AppendTimestamp", appendTimestamp);
        console.log("Delay time ", delayPeriod);
        console.log("Current ", timeStamp);
        console.log("Can upgrade at ", appendTimestamp + delayPeriod);
        console.log("Need to wait another " + (appendTimestamp + delayPeriod - timeStamp)+ "s");
      }
    }
}
};