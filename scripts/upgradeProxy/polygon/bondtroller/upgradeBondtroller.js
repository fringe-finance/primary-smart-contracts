const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = "../../../config/polygon/config.json";
const config = require(configFile);

let {PRIMARY_PROXY_ADMIN, BondtrollerLogic, BondtrollerProxy} = config;

let proxyAdmingAddress = PRIMARY_PROXY_ADMIN;
let bondtrollerProxyAddress = BondtrollerProxy;
let bondtrollerLogicAddress = BondtrollerLogic;

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
    let Bondtroller = await hre.ethers.getContractFactory("Bondtroller");

    if(!bondtrollerLogicAddress) {
      let bondtroller = await Bondtroller.connect(deployMaster).deploy();
      await bondtroller.deployed();
      bondtrollerLogicAddress = bondtroller.address;
      config.BondtrollerLogic = bondtrollerLogicAddress;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
    }
    console.log("Bondtroller masterCopy address: " + bondtrollerLogicAddress);
  
    let proxyAdmin = await ProxyAdmin.attach(proxyAdmingAddress).connect(deployMaster);
    let upgradeData = await proxyAdmin.upgradeData(
      bondtrollerProxyAddress
    );
    let appendTimestamp = Number(upgradeData.appendTimestamp)

    if(appendTimestamp == 0) {
      await proxyAdmin
        .appendUpgrade(
          bondtrollerProxyAddress,
          bondtrollerLogicAddress
        )
        .then(function (instance) {
          console.log(
            "ProxyAdmin appendUpgrade " +
              bondtrollerProxyAddress +
              " to " +
              bondtrollerLogicAddress
          );
          return instance;
        });
    } else {
      let timeStamp = (await hre.ethers.provider.getBlock("latest")).timestamp;
      let delayPeriod = Number(upgradeData.delayPeriod);
      if (appendTimestamp + delayPeriod <= timeStamp) {
        await proxyAdmin
          .upgrade(bondtrollerProxyAddress, bondtrollerLogicAddress)
          .then(function (instance) {
            console.log(
              "ProxyAdmin upgraded " +
                bondtrollerProxyAddress +
                " to " +
                bondtrollerLogicAddress
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