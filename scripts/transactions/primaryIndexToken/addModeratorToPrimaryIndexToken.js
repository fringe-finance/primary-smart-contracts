
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../../config/config.json';
const config = require(configFile);
let {PrimaryIndexTokenProxy, ModeratorAddress} = config;

let primaryIndexTokenProxyAddress = PrimaryIndexTokenProxy;
let moderatorAddress = ModeratorAddress;

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let PrimaryIndexToken = await hre.ethers.getContractFactory("PrimaryIndexToken");
    
    let primaryIndexToken = await PrimaryIndexToken.attach(primaryIndexTokenProxyAddress).connect(deployMaster);
    let tx = await primaryIndexToken.grandModerator(moderatorAddress)
    .then(function(instance){
        console.log("PrimaryIndexToken set moderator " + moderatorAddress);
        return instance;
    });
    console.log(tx);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
