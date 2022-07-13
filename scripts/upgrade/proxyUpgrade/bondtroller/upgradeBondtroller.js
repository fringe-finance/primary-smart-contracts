
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../../config/config.json';
const config = require(configFile);

let {PRIMARY_PROXY_ADMIN, BondtrollerLogic, BondtrollerProxy} = config;

let proxyAdmingAddress = PRIMARY_PROXY_ADMIN;
let bondtrollerProxyAddress = BondtrollerProxy;
let bondtrollerLogicAddress = BondtrollerLogic;

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
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
    await proxyAdmin.upgrade(bondtrollerProxyAddress, bondtrollerLogicAddress)
    .then(function(instance){
        console.log("ProxyAdmin upgraded " + bondtrollerProxyAddress + " to " + bondtrollerLogicAddress);
        return instance;
    });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
