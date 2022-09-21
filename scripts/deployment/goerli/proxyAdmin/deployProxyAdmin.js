
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../../config/config.json';
const config = require(configFile);
const BN = hre.ethers.BigNumber;

async function verify(contractAddress, constructor) {
    await run("verify:verify", {
        address: contractAddress,
        constructorArguments: constructor,
    }).catch((err) => console.log(err.message));
    console.log("Contract verified at: ", contractAddress);
}

async function main() {
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
    console.log("***** Proxy Admin Contract Deployment *****");
    if(!proxyAdminAddress){
        proxyAdminInstances = await proxyAdminAbi.connect(deployMaster).deploy();
        await proxyAdminInstances.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash)
            proxyAdminAddress = instance.address
            config.PRIMARY_PROXY_ADMIN = proxyAdminAddress;
            fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
        });
        await verify (proxyAdminAddress, []);
    }
    console.log("Proxy Admin contract deployed at: ", proxyAdminAddress);
};

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

