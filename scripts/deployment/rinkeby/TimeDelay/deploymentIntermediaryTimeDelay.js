
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../config/config_rinkeby.json';
const config = require(configFile);
const BN = hre.ethers.BigNumber;
const toBN = (num) => BN.from(num);
const { ethers, run} = require('hardhat');

module.exports = {
    
    deploymentDelayContract : async function () {
        let {DELAY_CONTRACT, DELAY_PERIOD} = config;
        console.log(config[Object.keys(config)[1]]);
        let network = await hre.network;
        console.log("Network name: "+network.name);
       
        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];
        console.log("DeployMaster: "+ deployMaster.address);

        let deployMasterAddress = deployMaster.address;

        // Contracts ABI
        let delayContractAbi; 
 
        //instances of contracts
        let delayContractInstances;

        //contracts addresses
        let delayContractAddress = DELAY_CONTRACT;

        //====================================================
        //initialize deploy parametrs

        delayContractAbi = await hre.ethers.getContractFactory("IntermediaryTimeDelay");
        //====================================================
        //deploy delay contract

        console.log();
        console.log("***** Intermediary Time Delay Contract Deployment *****");
        if(!delayContractAddress){
            delayContractInstances = await delayContractAbi.connect(deployMaster).deploy(DELAY_PERIOD);
            await delayContractInstances.deployed().then(async function(instance){
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                delayContractAddress = instance.address
                config.DELAY_CONTRACT = delayContractAddress;
                fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
                console.log("Verified Intermediary Time Delay");
            });
        }
        // await sleep(30000);
        await run("verify:verify", {
            address: delayContractAddress,
            constructorArguments: [DELAY_PERIOD],
        }).catch((err) => console.log(err.message));
        console.log("Intermediary Time Delay Contract deployed at: ", delayContractAddress);
    }
};
