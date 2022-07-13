
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../../config.json';
const config = require(configFile);

let {PRIMARY_PROXY_ADMIN, ChainlinkPriceProviderLogic, ChainlinkPriceProviderProxy} = config;

let proxyAdmingAddress = PRIMARY_PROXY_ADMIN;
let chainlinkProviderProxyAddress = ChainlinkPriceProviderProxy;
let chainlinkProviderLogicAddress = ChainlinkPriceProviderLogic;

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
    let ChainlinkPriceProvider = await hre.ethers.getContractFactory("ChainlinkPriceProvider");

    if(!chainlinkProviderLogicAddress) {
      let chainlinkProvider = await ChainlinkPriceProvider.connect(deployMaster).deploy();
      await chainlinkProvider.deployed();
      chainlinkProviderLogicAddress = chainlinkProvider.address;
      config.ChainlinkPriceProviderLogic = chainlinkProviderLogicAddress;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
    }
    console.log("Chainlink provider masterCopy address: " + chainlinkProviderLogicAddress);
  
    let proxyAdmin = await ProxyAdmin.attach(proxyAdmingAddress).connect(deployMaster);
    await proxyAdmin.upgrade(chainlinkProviderProxyAddress, chainlinkProviderLogicAddress)
    .then(function(instance){
        console.log("ProxyAdmin upgraded " + chainlinkProviderProxyAddress + " to " + chainlinkProviderLogicAddress);
        return instance;
    });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
