
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../../config/config.json';
const config = require(configFile);
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let {
    PRIMARY_PROXY_ADMIN, 
    JumpRateModelLogic,
    JumpRateModelProxy
} = config;

let proxyAdmingAddress = PRIMARY_PROXY_ADMIN;
let jumpRateModelLogicAddress = JumpRateModelLogic;
let jumpRateModelV2ProxyAddress = JumpRateModelProxy;

async function verify(contractAddress, constructor) {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructor,
    }).catch((err) => console.log(err.message));
    console.log("Contract verified at: ", contractAddress);
}

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    let deployMasterAddress = deployMaster.address;
    console.log("DeployMaster: " + deployMaster.address);

    let JumpRateModel = await hre.ethers.getContractFactory("JumpRateModelV3");
    let TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");

    let gainPerYear = toBN("6000000000000000000");
    let jumGainPerYear = toBN("4000000000000000000");
    let targetUtil = toBN("800000000000000000");
    let owner = deployMasterAddress;

    if(!jumpRateModelLogicAddress) {
      let jumpRateModelV2 = await JumpRateModel.connect(deployMaster).deploy();
      await jumpRateModelV2.deployed();
      jumpRateModelLogicAddress = jumpRateModelV2.address;
      config.JumpRateModelLogic = jumpRateModelLogicAddress;
      fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
    }
    console.log("JumpRateModel masterCopy address: " + jumpRateModelLogicAddress);
    
    if(!jumpRateModelV2ProxyAddress) {
        let jumpRateModelV2Proxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            jumpRateModelLogicAddress,
            proxyAdmingAddress,
            "0x"
        );
        await jumpRateModelV2Proxy.deployed().then(function(instance){
            jumpRateModelV2ProxyAddress = instance.address;
            config.JumpRateModelProxy = jumpRateModelV2ProxyAddress;
            fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
        });
    }
    console.log("JumpRateModel proxy address: " + jumpRateModelV2ProxyAddress);

    let jumpRateModelV2 = await JumpRateModel.attach(jumpRateModelV2ProxyAddress).connect(deployMaster);
    await jumpRateModelV2.initialize(
        gainPerYear,
        jumGainPerYear,
        targetUtil,
        owner,
    ).then(function(instance){
        console.log("\nTransaction hash: " + instance.hash);
        console.log("JumpRateModel call initialize at " + jumpRateModelV2ProxyAddress);
    })

    await verify(jumpRateModelLogicAddress, []);
    await verify(jumpRateModelV2ProxyAddress, [jumpRateModelLogicAddress, proxyAdmingAddress, "0x"]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
