
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../../config/config.json';
const config = require(configFile);
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let {
    PRIMARY_PROXY_ADMIN, 
    BondtrollerLogic, 
    BondtrollerProxy
} = config;

let {
    multiplier,
    baseRatePerBlock,
    blocksPerYear,
    jumpMultiplierPerBlock,
    multiplierPerBlock,
    kink
} = require("../config.js");

let proxyAdmingAddress = PRIMARY_PROXY_ADMIN;
let bondtrollerLogicAddress = BondtrollerLogic;
let bondtrollerProxyAddress = BondtrollerProxy;

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
    let Bondtroller = await hre.ethers.getContractFactory("Bondtroller");
    let TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");

    if(!bondtrollerLogicAddress) {
      let bondtroller = await Bondtroller.connect(deployMaster).deploy();
      await bondtroller.deployed();
      bondtrollerLogicAddress = bondtroller.address;
      config.BondtrollerLogic = bondtrollerLogicAddress;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
    }
    console.log("Bondtroller masterCopy address: " + bondtrollerLogicAddress);
    
    if(!bondtrollerProxyAddress) {
        let bondtrollerProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            bondtrollerLogicAddress,
            proxyAdmingAddress,
            "0x"
        );
        await bondtrollerProxy.deployed().then(function(instance){
            bondtrollerProxyAddress = instance.address;
            config.BondtrollerProxy = bondtrollerProxyAddress;
            fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
        });
    }
    console.log("Bondtroller proxy address: " + bondtrollerProxyAddress);

    let bondtroller = await Bondtroller.attach(bondtrollerProxyAddress).connect(deployMaster);

    await bondtroller.init().then(function(instance){
        console.log("Bondtroller call init at " + bondtroller.address);
    });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
