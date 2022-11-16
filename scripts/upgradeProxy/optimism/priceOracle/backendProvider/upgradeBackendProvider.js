const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../../../config/optimism/config.json';
const config = require(configFile);

let {PRIMARY_PROXY_ADMIN, BackendPriceProviderLogic, BackendPriceProviderProxy} = config;

let proxyAdmingAddress = PRIMARY_PROXY_ADMIN;
let backendProviderProxyAddress = BackendPriceProviderProxy;
let backendProviderLogicAddress = BackendPriceProviderLogic;

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
    let BackendPriceProvider = await hre.ethers.getContractFactory("BackendPriceProvider");

    if(!backendProviderLogicAddress) {
      let backendProvider = await BackendPriceProvider.connect(deployMaster).deploy();
      await backendProvider.deployed();
      backendProviderLogicAddress = backendProvider.address;
      config.ChainlinkPriceProviderLogic = backendProviderLogicAddress;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
    }
    console.log("Chainlink provider masterCopy address: " + backendProviderLogicAddress);
  
    let proxyAdmin = await ProxyAdmin.attach(proxyAdmingAddress).connect(deployMaster);
    let upgradeData = await proxyAdmin.upgradeData(
      backendProviderProxyAddress
    );
    let appendTimestamp = Number(upgradeData.appendTimestamp)

    if(appendTimestamp == 0) {
      await proxyAdmin
        .appendUpgrade(
          backendProviderProxyAddress,
          backendProviderLogicAddress
        )
        .then(function (instance) {
          console.log(
            "ProxyAdmin appendUpgrade " +
              backendProviderProxyAddress +
              " to " +
              backendProviderLogicAddress
          );
          return instance;
        });
    } else {
      let timeStamp = (await hre.ethers.provider.getBlock("latest")).timestamp;
      let delayPeriod = Number(upgradeData.delayPeriod);
      if (appendTimestamp + delayPeriod <= timeStamp) {
        await proxyAdmin
          .upgrade(backendProviderProxyAddress, backendProviderLogicAddress)
          .then(function (instance) {
            console.log(
              "ProxyAdmin upgraded " +
                backendProviderProxyAddress +
                " to " +
                backendProviderLogicAddress
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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});