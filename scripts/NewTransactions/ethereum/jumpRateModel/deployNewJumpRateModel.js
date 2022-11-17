const hre = require("hardhat");
const BN = hre.ethers.BigNumber;
const fs = require("fs");
const path = require("path");
const configFile = '../../../config/ethereum/config.json';
const config = require(configFile);
const configGeneralFile = '../../../config/ethereum/config_general.json';
const configGeneral = require(configGeneralFile);

let {jumRateModel} = configGeneral;
let {PRIMARY_PROXY_ADMIN, JumpRateModelLogic, JumpRateModelProxy, BLendingTokenProxies, ZERO_ADDRESS} = config;

//Address
let proxyAdminAddress = PRIMARY_PROXY_ADMIN;
let jumpRateModelLogicAddress = JumpRateModelLogic;
let jumpRateModelProxyAddress = JumpRateModelProxy;


async function main() {
    let network = await hre.network;
    console.log("Network name: "+network.name);
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    let deployMasterAddress = deployMaster.address;

    console.log("DeployMaster: " + deployMasterAddress);

    // Contracts ABI
    let TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
    let JumpRateModel = await hre.ethers.getContractFactory("JumpRateModelV3");
    let BLendingToken = await hre.ethers.getContractFactory("BLendingToken");

    let jumpRateModel;
    let blending;

    //====================================================
    //deploy jump rate model v2 upgradeable admin

    console.log();
    console.log("***** JUMP RATE MODEL UPGRADEABLE DEPLOYMENT *****");

    if(!jumpRateModelLogicAddress) {
        let jumpRateModelLogic = await JumpRateModel.connect(deployMaster).deploy();
        await jumpRateModelLogic.deployed();
        jumpRateModelLogicAddress = jumpRateModelLogic.address;
        config.JumpRateModelLogic = jumpRateModelLogicAddress;
        fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
    }
    console.log("JumpRateModel masterCopy address: " + jumpRateModelLogicAddress);
    
    if(!jumpRateModelProxyAddress) {
        let jumpRateModelProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
            jumpRateModelLogicAddress,
            proxyAdminAddress,
            "0x"
        );
        await jumpRateModelProxy.deployed().then(function(instance){
            jumpRateModelProxyAddress = instance.address;
            config.JumpRateModelProxy = jumpRateModelProxyAddress;
            fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
        });
    }
    console.log("JumpRateModel proxy address: " + jumpRateModelProxyAddress);
    console.log();
    console.log("***** Seting JUMP RATE MODEL *****");
    //instances of contracts
    jumpRateModel = await JumpRateModel.attach(jumpRateModelProxyAddress).connect(deployMaster);

    let gainPerYear = jumRateModel.gainPerYear;
    let jumGainPerYear = jumRateModel.jumGainPerYear;
    let targetUtil = jumRateModel.targetUtil;
    let newMaxBorrow = jumRateModel.newMaxBorrow;
    let owner = deployMasterAddress;

    console.log("gainPerYear", gainPerYear);
    console.log("jumGainPerYear", jumGainPerYear);
    console.log("targetUtil", targetUtil);
    let ownerJumRateModel = await jumpRateModel.owner();
    if (ownerJumRateModel == ZERO_ADDRESS) { 
        await jumpRateModel.initialize(
            gainPerYear,
            jumGainPerYear,
            targetUtil,
            owner
        ).then(function(instance){ 
            console.log("JumpRateModel " + jumpRateModelProxyAddress + " call initialize at tx hash " + instance.hash);
        })
    }
    for(var i=0; i < BLendingTokenProxies.length; i++) {
        await jumpRateModel.addBLendingTokenSuport(BLendingTokenProxies[i]).then(function(instance){
            console.log("JumpRateModel " + jumpRateModelProxyAddress + " add BLendingToken Suport " + BLendingTokenProxies[i] + " at tx hash " + instance.hash);
        })

        await jumpRateModel.setMaxBorrowRate(BLendingTokenProxies[i], newMaxBorrow[i]).then(function(instance){
            console.log("JumpRateModel " + jumpRateModelProxyAddress + " set MaxBorrowRate " + newMaxBorrow[i] + " at tx hash " + instance.hash);
        })

        blending = await BLendingToken.attach(BLendingTokenProxies[i]).connect(deployMaster);
        await blending.connect(deployMaster)._setInterestRateModel(jumpRateModelProxyAddress).then(function(instance){
            console.log("Blending token " + BLendingTokenProxies[i] + " set interestRateModel " + jumpRateModelProxyAddress + " at tx hash " + instance.hash);
        });
    }

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
