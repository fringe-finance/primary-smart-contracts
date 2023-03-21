const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const BN = hre.ethers.BigNumber;
const toBN = (num) => BN.from(num);
const fs = require("fs");
const path = require("path");
const configFile = path.join(__dirname, `../../config/${network}/config.json`);
const config = require(configFile);
let { PRIMARY_PROXY_ADMIN, BLendingTokenLogic, BLendingTokenProxies } = config;

let proxyAdmingAddress = PRIMARY_PROXY_ADMIN;
let bLendingTokenProxyAddresses = BLendingTokenProxies;
let bLendingTokenLogicAddress = BLendingTokenLogic;

async function main() {
  let signers = await hre.ethers.getSigners();
  let deployMaster = signers[0];
  console.log("DeployMaster: " + deployMaster.address);

  let ProxyAdmin = await hre.ethers.getContractFactory(
    "PrimaryLendingPlatformProxyAdmin"
  );
  let BLendingToken = await hre.ethers.getContractFactory("BLendingToken");
  if (!bLendingTokenLogicAddress) {
    let blendingToken = await BLendingToken.connect(deployMaster).deploy();
    await blendingToken.deployed();
    bLendingTokenLogicAddress = blendingToken.address;
    config.BLendingTokenLogic = bLendingTokenLogicAddress;
    fs.writeFileSync(
      path.join(configFile),
      JSON.stringify(config, null, 2)
    );
  }
  console.log("BLendingToken masterCopy address: " + bLendingTokenLogicAddress);

  let proxyAdmin = await ProxyAdmin.attach(proxyAdmingAddress).connect(
    deployMaster
  );
  for (var i = 0; i < bLendingTokenProxyAddresses.length; i++) {
    let upgradeData = await proxyAdmin.upgradeData(
      bLendingTokenProxyAddresses[i]
    );
    let appendTimestamp = Number(upgradeData.appendTimestamp)

    if(appendTimestamp == 0) {
      await proxyAdmin
        .appendUpgrade(
          bLendingTokenProxyAddresses[i],
          bLendingTokenLogicAddress
        )
        .then(function (instance) {
          console.log(
            "ProxyAdmin appendUpgrade " +
              bLendingTokenProxyAddresses[i] +
              " to " +
              bLendingTokenLogicAddress
          );
          return instance;
        });
    } else {
      let timeStamp = (await hre.ethers.provider.getBlock("latest")).timestamp;
      let delayPeriod = Number(upgradeData.delayPeriod);
      if (appendTimestamp + delayPeriod <= timeStamp) {
        await proxyAdmin
          .upgrade(bLendingTokenProxyAddresses[i], bLendingTokenLogicAddress)
          .then(function (instance) {
            console.log(
              "ProxyAdmin upgraded " +
                bLendingTokenProxyAddresses[i] +
                " to " +
                bLendingTokenLogicAddress
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
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
