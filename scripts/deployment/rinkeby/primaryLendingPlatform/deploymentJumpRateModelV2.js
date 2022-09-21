
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../../config/config.json';
const config = require(configFile);
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let {
    PRIMARY_PROXY_ADMIN, 
    JumpRateModelV2UpgradeableLogic,
    JumpRateModelV2UpgradeableProxy
} = config;

let proxyAdmingAddress = PRIMARY_PROXY_ADMIN;
let jumpRateModelV2UpgradeableLogicAddress = JumpRateModelV2UpgradeableLogic;
let jumpRateModelV2ProxyAddress = JumpRateModelV2UpgradeableProxy;

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    let deployMasterAddress = deployMaster.address;
    console.log("DeployMaster: " + deployMaster.address);

    let JumpRateModelV2Upgradeable = await hre.ethers.getContractFactory("JumpRateModelV2Upgradeable");
    let TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");

    let multiplier = toBN(10).pow(toBN(18));
    let baseRatePerBlock = toBN(9512937595);
    let blocksPerYear = toBN(2102400);
    let jumpMultiplierPerBlock = toBN(1902587519025);
    let multiplierPerBlock = toBN(107020547945);
    let kink = toBN("800000000000000000");

    let baseRatePerYear = baseRatePerBlock.mul(blocksPerYear);
    let multiplierPerYear = multiplierPerBlock.mul(blocksPerYear.mul(kink)).div(multiplier);
    let jumpMultiplierPerYear = jumpMultiplierPerBlock.mul(blocksPerYear);
    let owner = deployMasterAddress;

    if(!jumpRateModelV2UpgradeableLogicAddress) {
      let jumpRateModelV2 = await JumpRateModelV2Upgradeable.connect(deployMaster).deploy();
      await jumpRateModelV2.deployed();
      jumpRateModelV2UpgradeableLogicAddress = jumpRateModelV2.address;
      config.JumpRateModelV2UpgradeableLogic = jumpRateModelV2UpgradeableLogicAddress;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
    }
    console.log("JumpRateModelV2Upgradeable masterCopy address: " + jumpRateModelV2UpgradeableLogicAddress);
    
    if(!jumpRateModelV2ProxyAddress) {
        let jumpRateModelV2Proxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            jumpRateModelV2UpgradeableLogicAddress,
            proxyAdmingAddress,
            "0x"
        );
        await jumpRateModelV2Proxy.deployed().then(function(instance){
            jumpRateModelV2ProxyAddress = instance.address;
            config.JumpRateModelV2UpgradeableProxy = jumpRateModelV2ProxyAddress;
            fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
        });
    }
    console.log("JumpRateModelV2Upgradeable proxy address: " + jumpRateModelV2ProxyAddress);

    let jumpRateModelV2 = await JumpRateModelV2Upgradeable.attach(jumpRateModelV2ProxyAddress).connect(deployMaster);
    await jumpRateModelV2.initialize(
        baseRatePerYear,
        multiplierPerYear,
        jumpMultiplierPerYear,
        kink,
        owner,
    ).then(function(instance){
        console.log("\nTransaction hash: " + instance.hash);
        console.log("JumpRateModelV2Upgradeable call initialize at " + jumpRateModelV2ProxyAddress);
    })
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
