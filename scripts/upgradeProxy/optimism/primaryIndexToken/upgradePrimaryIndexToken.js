const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../../config/optimism/config.json';
const config = require(configFile);

let {PRIMARY_PROXY_ADMIN, PrimaryIndexTokenLogic, PrimaryIndexTokenProxy} = config;
let proxyAdmingAddress = PRIMARY_PROXY_ADMIN;
let primaryIndexTokenLogicAddress = PrimaryIndexTokenLogic;
let primaryIndexTokenProxyAddress = PrimaryIndexTokenProxy;

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
    let PrimaryIndexToken = await hre.ethers.getContractFactory("PrimaryIndexToken");

    if(!primaryIndexTokenLogicAddress) {
      let primaryIndexToken = await PrimaryIndexToken.connect(deployMaster).deploy();
      await primaryIndexToken.deployed();
      primaryIndexTokenLogicAddress = primaryIndexToken.address;
      config.PrimaryIndexTokenLogic = primaryIndexTokenLogicAddress;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
    }
    console.log("PrimaryIndexToken masterCopy address: " + primaryIndexTokenLogicAddress);
  
    let proxyAdmin = await ProxyAdmin.attach(proxyAdmingAddress).connect(deployMaster);
    let upgradeData = await proxyAdmin.upgradeData(
      primaryIndexTokenProxyAddress
    );
    let appendTimestamp = Number(upgradeData.appendTimestamp)

    if(appendTimestamp == 0) {
      await proxyAdmin
        .appendUpgrade(
          primaryIndexTokenProxyAddress,
          primaryIndexTokenLogicAddress
        )
        .then(function (instance) {
          console.log(
            "ProxyAdmin appendUpgrade " +
              primaryIndexTokenProxyAddress +
              " to " +
              primaryIndexTokenLogicAddress
          );
          return instance;
        });
    } else {
      let timeStamp = (await hre.ethers.provider.getBlock("latest")).timestamp;
      let delayPeriod = Number(upgradeData.delayPeriod);
      if (appendTimestamp + delayPeriod <= timeStamp) {
        await proxyAdmin
          .upgrade(primaryIndexTokenProxyAddress, primaryIndexTokenLogicAddress)
          .then(function (instance) {
            console.log(
              "ProxyAdmin upgraded " +
                primaryIndexTokenProxyAddress +
                " to " +
                primaryIndexTokenLogicAddress
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