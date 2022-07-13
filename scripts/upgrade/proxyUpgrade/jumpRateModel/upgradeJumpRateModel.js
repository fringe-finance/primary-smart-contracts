
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../../config/config.json';
const config = require(configFile);

let {PRIMARY_PROXY_ADMIN, JumpRateModelV2UpgradeableLogic, JumpRateModelV2UpgradeableProxy} = config;

let proxyAdmingAddress = PRIMARY_PROXY_ADMIN;
let jumpRateModelV2UpgradeableProxyAddress = JumpRateModelV2UpgradeableProxy;
let jumpRateModelV2UpgradeableLogicAddress = JumpRateModelV2UpgradeableLogic;

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
    let JumpRateModelV2Upgradeable = await hre.ethers.getContractFactory("JumpRateModelV2Upgradeable");

    if(!jumpRateModelV2UpgradeableLogicAddress) {
      let jumpRateModelV2Upgradeable = await JumpRateModelV2Upgradeable.connect(deployMaster).deploy();
      await jumpRateModelV2Upgradeable.deployed();
      jumpRateModelV2UpgradeableLogicAddress = jumpRateModelV2Upgradeable.address;
      config.JumpRateModelV2UpgradeableLogic = jumpRateModelV2UpgradeableLogicAddress;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
    }
    console.log("JumpRateModelV2Upgradeable masterCopy address: " + jumpRateModelV2UpgradeableLogicAddress);
  
    let proxyAdmin = await ProxyAdmin.attach(proxyAdmingAddress).connect(deployMaster);
    await proxyAdmin.upgrade(jumpRateModelV2UpgradeableProxyAddress, jumpRateModelV2UpgradeableLogicAddress)
    .then(function(instance){
        console.log("ProxyAdmin upgraded " + jumpRateModelV2UpgradeableProxyAddress + " to " + jumpRateModelV2UpgradeableLogicAddress);
        return instance;
    });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
