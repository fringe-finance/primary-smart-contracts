
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../../../config/config_rinkeby.json';
const config = require(configFile);
let {PRIMARY_PROXY_ADMIN, BLendingTokenLogic, BLendingTokenProxy} = config;

let proxyAdmingAddress = PRIMARY_PROXY_ADMIN;
let busdcProxyAddress = BLendingTokenProxy;
let busdcLogicAdress = BLendingTokenLogic;

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
    let BUSDC = await hre.ethers.getContractFactory("BLendingToken");
    if(!busdcLogicAdress){
      let busdc = await BUSDC.connect(deployMaster).deploy();
      await busdc.deployed();
      bondtrollerLogicAddress = busdc.address;
      config.BLendingTokenLogic = bondtrollerLogicAddress;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
    }
    console.log("BUSDC masterCopy address: " + bondtrollerLogicAddress);
  
    let proxyAdmin = await ProxyAdmin.attach(proxyAdmingAddress).connect(deployMaster);

    await proxyAdmin.upgrade(busdcProxyAddress, bondtrollerLogicAddress)
    .then(function(instance){
        console.log("ProxyAdmin upgraded " + busdcProxyAddress + " to " + bondtrollerLogicAddress);
        return instance;
    });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
