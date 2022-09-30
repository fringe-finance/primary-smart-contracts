
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../../config/config.json';
const config = require(configFile);
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let {
    PRIMARY_PROXY_ADMIN, 
    BLendingTokenLogic, 
    BLendingTokenProxy,
    USBBLendingTokenLogic,
    USBBLendingTokenProxy,
    BondtrollerLogic,
    BondtrollerProxy,
    JumpRateModelLogic,
    JumpRateModelProxy,
    PrimaryIndexTokenLogic, 
    PrimaryIndexTokenProxy,
} = config;

//Address
let proxyAdmingAddress = PRIMARY_PROXY_ADMIN;
let blendingTokenLogicAddress = BLendingTokenLogic;
let blendingTokenProxyAddress = BLendingTokenProxy;
let usbBlendingTokenProxyAddress = USBBLendingTokenProxy;

let bondtrollerLogicAddress = BondtrollerLogic;
let bondtrollerProxyAddress = BondtrollerProxy;

let jumpRateModelLogicAddress = JumpRateModelLogic;
let jumpRateModelProxyAddress = JumpRateModelProxy;

let primaryIndexTokenLogicAddress = PrimaryIndexTokenLogic;
let primaryIndexTokenProxyAddress = PrimaryIndexTokenProxy;

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
    let admin = deployMaster.address;
    console.log("DeployMaster: " + deployMaster.address);

    //ABIs
    let BLendingToken = await hre.ethers.getContractFactory("BLendingToken");
    let TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
    let Bondtroller = await hre.ethers.getContractFactory("Bondtroller");
    let JumpRateModel = await hre.ethers.getContractFactory("JumpRateModelV2Upgradeable");
    let PrimaryIndexToken = await hre.ethers.getContractFactory("PrimaryIndexToken");

    // console.log("----------------------------------1. Deploy Bondtroller contract -------------------------------------")

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

    // console.log("Verify Bondtroller masterCopy")
    // await verify(bondtrollerLogicAddress, []);

    // console.log("Verify Bondtroller proxy")
    // await verify(bondtrollerProxyAddress, [bondtrollerLogicAddress, proxyAdmingAddress, "0x"]);

    console.log("----------------------------------2. Deploy JumRate Model -------------------------------------")

    if(!jumpRateModelLogicAddress) {
        let jumpRateModelV2 = await JumpRateModel.connect(deployMaster).deploy();
        await jumpRateModelV2.deployed();
        jumpRateModelLogicAddress = jumpRateModelV2.address;
        config.JumpRateModelLogic = jumpRateModelLogicAddress;
        fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
    }
    console.log("JumpRateModel masterCopy address: " + jumpRateModelLogicAddress);
    
    if(!jumpRateModelProxyAddress) {
        let jumpRateModelProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            jumpRateModelLogicAddress,
            proxyAdmingAddress,
            "0x"
        );
        await jumpRateModelProxy.deployed().then(function(instance){
            jumpRateModelProxyAddress = instance.address;
            config.JumpRateModelProxy = jumpRateModelProxyAddress;
            fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
        });
    }
    console.log("JumpRateModel proxy address: " + jumpRateModelProxyAddress);

    // console.log("Verify JumpRateModel masterCopy")
    // await verify(jumpRateModelLogicAddress, []);

    // console.log("Verify JumpRateModel proxy")
    // await verify(jumpRateModelProxyAddress, [jumpRateModelLogicAddress, proxyAdmingAddress, "0x"]);
  
    console.log("----------------------------------3. Deploy BleningToken contract -------------------------------------")

    if(!blendingTokenLogicAddress) {
        let blendingToken = await BLendingToken.connect(deployMaster).deploy();
        await blendingToken.deployed();
        blendingTokenLogicAddress = blendingToken.address;
        config.BLendingTokenLogic = blendingTokenLogicAddress;
        fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
    }
    console.log("blendingToken masterCopy address: " + blendingTokenLogicAddress);
    
    if(!blendingTokenProxyAddress) {
        let BLendingTokenProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            blendingTokenLogicAddress,
            proxyAdmingAddress,
            "0x"
        );
        await BLendingTokenProxy.deployed().then(function(instance){
            blendingTokenProxyAddress = instance.address;
            config.BLendingTokenProxy = blendingTokenProxyAddress;
            fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
        });
    }
    console.log("blendingToken proxy address: " + blendingTokenProxyAddress);

    // if(!usbBlendingTokenProxyAddress) {
    //     let BLendingTokenProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
    //         blendingTokenLogicAddress,
    //         proxyAdmingAddress,
    //         "0x"
    //     );
    //     await BLendingTokenProxy.deployed().then(function(instance){
    //         usbBlendingTokenProxyAddress = instance.address;
    //         config.USBBLendingTokenLogic = usbBlendingTokenProxyAddress;
    //         fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
    //     });
    // }
    // console.log("blendingToken proxy address: " + blendingTokenProxyAddress);

    // console.log("Verify BlendingToken masterCopy")
    // await verify(blendingTokenLogicAddress, []);

    console.log("Verify BlendingToken proxy")
    await verify(blendingTokenProxyAddress, [blendingTokenLogicAddress, proxyAdmingAddress, "0x"]);

    // console.log("Verify BlendingToken proxy")
    // await verify(usbBlendingTokenProxyAddress, [blendingTokenLogicAddress, proxyAdmingAddress, "0x"]);

    console.log("----------------------------------4. Deploy PrimaryIndexToken contract -------------------------------------")

    if(!primaryIndexTokenLogicAddress) {
        let primaryIndexToken = await PrimaryIndexToken.connect(deployMaster).deploy();
        await primaryIndexToken.deployed();
        primaryIndexTokenLogicAddress = primaryIndexToken.address;
        config.PrimaryIndexTokenLogic = primaryIndexTokenLogicAddress;
        fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
    }
    console.log("primaryIndexToken masterCopy address: " + primaryIndexTokenLogicAddress);
    
    if(!primaryIndexTokenProxyAddress) {
        let primaryIndexTokenProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            primaryIndexTokenLogicAddress,
            proxyAdmingAddress,
            "0x"
        );
        await primaryIndexTokenProxy.deployed().then(function(instance){
            primaryIndexTokenProxyAddress = instance.address;
            config.PrimaryIndexTokenProxy = primaryIndexTokenProxyAddress;
            fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
        });
    }
    console.log("primaryIndexToken proxy address: " + primaryIndexTokenProxyAddress);

    // console.log("Verify BlendingToken masterCopy")
    // await verify(primaryIndexTokenLogicAddress, []);

    // console.log("Verify PrimaryIndexToken proxy")
    // await verify(primaryIndexTokenProxyAddress, [primaryIndexTokenLogicAddress, proxyAdmingAddress, "0x"]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});