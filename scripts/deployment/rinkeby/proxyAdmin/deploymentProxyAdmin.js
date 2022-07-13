
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../config/config_rinkeby.json';
const config = require(configFile);
const BN = hre.ethers.BigNumber;

module.exports = {
    deploymentProxyAdmin : async function () {
        let {PRIMARY_PROXY_ADMIN} = config;

        let network = await hre.network;
        console.log("Network name: "+network.name);
       
        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];
        console.log("DeployMaster: "+ deployMaster.address);

        let deployMasterAddress = deployMaster.address;

        // Contracts ABI
        let proxyAdminAbi; 
 
        //instances of contracts
        let proxyAdminInstances;

        //contracts addresses
        let proxyAdminAddress = PRIMARY_PROXY_ADMIN;

        //====================================================
        //initialize deploy parametrs

        proxyAdminAbi = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
        //====================================================
        //deploy delay contract

        console.log();
        console.log("***** Intermediary Time Delay Contract Deployment *****");
        if(!proxyAdminAddress){
            proxyAdminInstances = await proxyAdminAbi.connect(deployMaster).deploy(DELAY_PERIOD);
            await proxyAdminInstances.deployed().then(function(instance){
                console.log("\nTransaction hash: " + instance.deployTransaction.hash)
                proxyAdminAddress = instance.address
                config.PRIMARY_PROXY_ADMIN = proxyAdminAddress;
                fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("Intermediary Time Delay Contract deployed at: ", proxyAdminAddress);
    }
};
