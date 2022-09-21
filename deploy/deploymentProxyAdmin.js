
const hre = require("hardhat");
const ethers = require('ethers');
const fs = require("fs");
const path = require("path");
const configFile = '../scripts/config/config.json';
const config = require(configFile);
const Deployer = require("@matterlabs/hardhat-zksync-deploy");
const zkWeb3 = require("zksync-web3")

async function main() {
    let {PRIMARY_PROXY_ADMIN} = config;
    // let mnemonic = "glide vital bean feed enrich clerk oak plunge ticket march source poverty";
    // let mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic);
    // let provider = ethers.getDefaultProvider();
    // let deployMaster = new ethers.Wallet(mnemonicWallet, provider);
    // console.log(mnemonicWallet);
    const mnemonicWallet = new zkWeb3.Wallet("0xe5fdde82360d1b2274901f3ebe49824d93a1303cd4ccea21d768565ed7440123");
    console.log(mnemonicWallet);

    // let deployMasterAddress = deployMaster.address;

    // Contracts ABI
    // let proxyAdminAbi; 

    //instances of contracts
    let proxyAdminInstances;

    // //contracts addresses
    let proxyAdminAddress = PRIMARY_PROXY_ADMIN;

    //====================================================
    //initialize deploy parametrs
    const deployer = new Deployer.Deployer(hre, mnemonicWallet);
    console.log(deployer);
    const proxyAdminAbi = await deployer.loadArtifact('PrimaryLendingPlatformProxyAdmin');
    console.log(proxyAdminAbi);
    //====================================================
    //deploy delay contract

    console.log();
    console.log("***** Proxy Admin Contract Deployment *****");
    if(!proxyAdminAddress){
        proxyAdminInstances = await deployer.deploy(proxyAdminAbi);
        await proxyAdminInstances.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash)
            proxyAdminAddress = instance.address
            config.PRIMARY_PROXY_ADMIN = proxyAdminAddress;
            fs.writeFileSync(path.join(__dirname,  configFile), JSON.stringify(config, null, 2));
        });
    }
    console.log("Proxy Admin contract deployed at: ", proxyAdminAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });