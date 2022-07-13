
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../../../config/config.json';
const config = require(configFile);

let {PRIMARY_PROXY_ADMIN, BackendPriceProviderLogic, BackendPriceProviderProxy} = config;

let proxyAdmingAddress = PRIMARY_PROXY_ADMIN;
let backendProviderProxyAddress = BackendPriceProviderProxy;
let backendProviderLogicAddress = BackendPriceProviderLogic;

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
    let BackendPriceProvider = await hre.ethers.getContractFactory("BackendPriceProvider");

    if(!backendProviderLogicAddress) {
      let backendProvider = await BackendPriceProvider.connect(deployMaster).deploy();
      await backendProvider.deployed();
      backendProviderLogicAddress = backendProvider.address;
      config.BackendPriceProviderLogic = backendProviderLogicAddress;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
    }
    console.log("Backend provider masterCopy address: " + backendProviderLogicAddress);
  
    let proxyAdmin = await ProxyAdmin.attach(proxyAdmingAddress).connect(deployMaster);
    await proxyAdmin.upgrade(backendProviderProxyAddress, backendProviderLogicAddress)
    .then(function(instance){
        console.log("ProxyAdmin upgraded " + backendProviderProxyAddress + " to " + backendProviderLogicAddress);
        return instance;
    });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
