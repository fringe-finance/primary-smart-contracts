const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../config/config.json';
const config = require(configFile);

let {PRIMARY_PROXY_ADMIN, PrimaryIndexTokenLogic, PrimaryIndexTokenProxy} = config;
let proxyAdmingAddress = PRIMARY_PROXY_ADMIN;
let primaryIndexTokenLogicAddress = PrimaryIndexTokenLogic;
let primaryIndexTokenProxyAddress = PrimaryIndexTokenProxy;

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
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
    await proxyAdmin.upgrade(primaryIndexTokenProxyAddress, primaryIndexTokenLogicAddress)
    .then(function(instance){
        console.log("ProxyAdmin upgraded " + primaryIndexTokenProxyAddress + " to " + primaryIndexTokenLogicAddress);
        return instance;
    });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});