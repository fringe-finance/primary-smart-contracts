
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../../../../config/config_rinkeby.json';
const config = require(configFile);

let {PRIMARY_PROXY_ADMIN, UniswapV2PriceProviderLogic, UniswapV2PriceProviderProxy} = config;

let proxyAdmingAddress = PRIMARY_PROXY_ADMIN;
let uniswapV2ProviderProxyAddress = UniswapV2PriceProviderProxy;
let uniswapV2ProviderLogicAddress = UniswapV2PriceProviderLogic;

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
    let UniswapV2PriceProvider = await hre.ethers.getContractFactory("UniswapV2PriceProvider");

    if(!uniswapV2ProviderLogicAddress) {
      let uniswapV2Provider = await UniswapV2PriceProvider.connect(deployMaster).deploy();
      await uniswapV2Provider.deployed();
      uniswapV2ProviderLogicAddress = uniswapV2Provider.address;
      config.UniswapV2PriceProviderLogic = uniswapV2ProviderLogicAddress;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
    }
    console.log("UniswapV2 provider masterCopy address: " + uniswapV2ProviderLogicAddress);
  
    let proxyAdmin = await ProxyAdmin.attach(proxyAdmingAddress).connect(deployMaster);
    await proxyAdmin.upgrade(uniswapV2ProviderProxyAddress, uniswapV2ProviderLogicAddress)
    .then(function(instance){
        console.log("ProxyAdmin upgraded " + uniswapV2ProviderProxyAddress + " to " + uniswapV2ProviderLogicAddress);
        return instance;
    });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
