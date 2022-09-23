const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../config/config.json';
const config = require(configFile);

let {PRIMARY_PROXY_ADMIN, PriceProviderAggregatorLogic, PriceProviderAggregatorProxy} = config;

let proxyAdmingAddress = PRIMARY_PROXY_ADMIN;
let priceProviderProxyAddress = PriceProviderAggregatorProxy;
let priceProviderLogicAddress = PriceProviderAggregatorLogic;

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
    let PriceProviderAggregator = await hre.ethers.getContractFactory("PriceProviderAggregator");

    if(!priceProviderLogicAddress) {
      let priceProvider = await PriceProviderAggregator.connect(deployMaster).deploy();
      await priceProvider.deployed();
      priceProviderLogicAddress = priceProvider.address;
      config.PriceProviderAggregatorLogic = priceProviderLogicAddress;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
    }
    console.log("Price Provider masterCopy address: " + priceProviderLogicAddress);
  
    let proxyAdmin = await ProxyAdmin.attach(proxyAdmingAddress).connect(deployMaster);
    await proxyAdmin.upgrade(priceProviderProxyAddress, priceProviderLogicAddress)
    .then(function(instance){
        console.log("ProxyAdmin upgraded " + priceProviderProxyAddress + " to " + priceProviderLogicAddress);
        return instance;
    });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});