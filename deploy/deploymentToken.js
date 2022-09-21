const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configFile = '../../../config/config_rinkeby.json';
const config = require(configFile);
const Deployer = require("@matterlabs/hardhat-zksync-deploy");

async function main() {
        //====================================================
    //declare parametrs

    let network = await hre.network;
    console.log("Network name: "+network.name);
    let {USDCTest, LINK, MATIC, WBTC, prjTokenLogicAddress, prj1Address, prj2Address, prj3Address, prj4Address, prj5Address, prj6Address} = config;
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];

    console.log("DeployMaster: "+deployMaster.address);

    let deployMasterAddress = deployMaster.address;

    // Contracts ABI
    let ProxyAdmin;
    let MockToken;
    let PRJToken;


    //instances of contracts
    let proxyAdmin;
    let mockToken;
    let prjToken;




//====================================================
//initialize deploy parametrs
    
    ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
    MockToken = await hre.ethers.getContractFactory("MockToken");
    PRJToken = await hre.ethers.getContractFactory("PRJ");
    TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");

    const {
        nameUSD, 
        symbolUSD,
        decimalUSD,
    
        namePRJ1,
        symboPRJ1,
    
        namePRJ2,
        symboPRJ2,
    
        namePRJ3,
        symboPRJ3,
    
        namePRJ4,
        symboPRJ4,
    
        namePRJ5,
        symboPRJ5,
    
        namePRJ6,
        symboPRJ6,
        
        nameLINK,
        symbolLINK,
        decimalLINK,
    
        nameMatic,
        symbolMatic,
        decimalMatic,

        nameWbtc,
        symbolWbtc,
        decimalWbtc,
    
        admin
    
    } = require('../config.js.js');


//====================================================
//deploy proxy admin

    console.log();
    console.log("***** PROXY ADMIN DEPLOYMENT *****");
    if(input_proxyAdminAddress == undefined){
        proxyAdmin = await ProxyAdmin.connect(deployMaster).deploy();
        await proxyAdmin.deployed().then(function(instance){
            console.log("\nTransaction hash: " + instance.deployTransaction.hash)
            console.log("ProxyAdmin deployed at: " + instance.address);
        });
        proxyAdminAddress = proxyAdmin.address;
    }else{
        console.log("ProxyAdmin is deployed at: " + input_proxyAdminAddress);
        proxyAdminAddress = input_proxyAdminAddress;
    }

// //====================================================
// //deploy chainlinkPriceProvider
//     console.log();
//     console.log("***** USDC TOKEN DEPLOYMENT *****");

//     mockToken = await MockToken.connect(deployMaster).deploy(nameUSD, symbolUSD, decimalUSD);
//     await mockToken.deployed().then(function(instance){
//         console.log("\nTransaction hash: " + instance.deployTransaction.hash)
//         console.log("usdc: " + instance.address)
//         USDCTest = instance.address;
//     });

//     console.log();
//     console.log("***** LINK TOKEN DEPLOYMENT *****");

//     mockToken = await MockToken.connect(deployMaster).deploy(nameLINK, symbolLINK, decimalLINK);
//     await mockToken.deployed().then(function(instance){
//         console.log("\nTransaction hash: " + instance.deployTransaction.hash)
//         console.log("link: " + instance.address)
//         LINK = instance.address;
//     });

//     console.log();
//     console.log("***** MATIC TOKEN DEPLOYMENT *****");

//     mockToken = await MockToken.connect(deployMaster).deploy(nameMatic, symbolMatic, decimalMatic);
//     await mockToken.deployed().then(function(instance){
//         console.log("\nTransaction hash: " + instance.deployTransaction.hash)
//         console.log("matic: " + instance.address)
//         MATIC = instance.address;
//     });

//     console.log();
//     console.log("***** WBTC TOKEN DEPLOYMENT *****");

//     mockToken = await MockToken.connect(deployMaster).deploy(nameWbtc, symbolWbtc, decimalWbtc);
//     await mockToken.deployed().then(function(instance){
//         console.log("\nTransaction hash: " + instance.deployTransaction.hash)
//         console.log("Wbtc: " + instance.address)
//         WBTC = instance.address;
//     });


//     console.log();
//     console.log("***** PRJ1 TOKEN DEPLOYMENT *****");

//     prjToken = await PRJToken.connect(deployMaster).deploy();
//     await prjToken.deployed().then(function(instance){
//         console.log("\nTransaction hash: " + instance.deployTransaction.hash)
//         console.log("PRJ logic: " + instance.address)
//         prjTokenLogicAddress = instance.address;
//     });

//     let prjContractLogic = prjToken.address;
    
//     let prjToken1Proxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
//         prjContractLogic,
//         proxyAdminAddress,
//         "0x"
//     );
//     await prjToken1Proxy.deployed().then(function(instance){
//         console.log("\nTransaction hash: " + instance.deployTransaction.hash)
//         console.log("prjToken 1 proxy address: " + instance.address);

//     });
//     let prjToken1ProxyAddress = prjToken1Proxy.address;
//     prj1Address = prjToken1ProxyAddress;

//     prjToken = await PRJToken.attach(prj1Address).connect(deployMaster);
//     await prjToken.init(namePRJ1, symboPRJ1)
//     .then(function(instance){
//         console.log("\nTransaction hash: " + instance.hash)
//         console.log("prjToken initd at " + prj1Address);
//     });


//     console.log("***** PRJ2 LOGIC TOKEN DEPLOYMENT *****");

//     let prjToken2Proxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
//         prjContractLogic,
//         proxyAdminAddress,
//         "0x"
//     );
//     await prjToken2Proxy.deployed().then(function(instance){
//         console.log("\nTransaction hash: " + instance.deployTransaction.hash)
//         console.log("prjToken 2 proxy address: " + instance.address);

//     });
//     let prjToken2ProxyAddress = prjToken2Proxy.address;
//     prj2Address = prjToken2ProxyAddress;

//     prjToken = await PRJToken.attach(prj2Address).connect(deployMaster);
//     await prjToken.init(namePRJ2, symboPRJ2)
//     .then(function(instance){
//         console.log("\nTransaction hash: " + instance.hash)
//         console.log("prjToken 2 initd at " + prj2Address);
//     });

//     console.log("***** PRJ3 LOGIC TOKEN DEPLOYMENT *****");
    
//     let prjToken3Proxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
//         prjContractLogic,
//         proxyAdminAddress,
//         "0x"
//     );
//     await prjToken3Proxy.deployed().then(function(instance){
//         console.log("\nTransaction hash: " + instance.deployTransaction.hash)
//         console.log("prjToken 3 proxy address: " + instance.address);

//     });
//     let prjToken3ProxyAddress = prjToken3Proxy.address;
//     prj3Address = prjToken3ProxyAddress;

//     prjToken = await PRJToken.attach(prj3Address).connect(deployMaster);
//     await prjToken.init(namePRJ3, symboPRJ3)
//     .then(function(instance){
//         console.log("\nTransaction hash: " + instance.hash)
//         console.log("prjToken 3 initd at " + prj3Address);
//     });

//     console.log("***** PRJ4 LOGIC TOKEN DEPLOYMENT *****");
    
//     let prjToken4Proxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
//         prjContractLogic,
//         proxyAdminAddress,
//         "0x"
//     );
//     await prjToken4Proxy.deployed().then(function(instance){
//         console.log("\nTransaction hash: " + instance.deployTransaction.hash)
//         console.log("prjToken 4 proxy address: " + instance.address);

//     });
//     let prjToken4ProxyAddress = prjToken4Proxy.address;
//     prj4Address = prjToken4ProxyAddress;

//     prjToken = await PRJToken.attach(prj4Address).connect(deployMaster);
//     await prjToken.init(namePRJ4, symboPRJ4)
//     .then(function(instance){
//         console.log("\nTransaction hash: " + instance.hash)
//         console.log("prjToken 4 initd at " + prj4Address);
//     });

//     console.log("***** PRJ5 LOGIC TOKEN DEPLOYMENT *****");
    
//     let prjToken5Proxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
//         prjContractLogic,
//         proxyAdminAddress,
//         "0x"
//     );
//     await prjToken5Proxy.deployed().then(function(instance){
//         console.log("\nTransaction hash: " + instance.deployTransaction.hash)
//         console.log("prjToken 5 proxy address: " + instance.address);

//     });
//     let prjToken5ProxyAddress = prjToken5Proxy.address;
//     prj5Address = prjToken5ProxyAddress;

//     prjToken = await PRJToken.attach(prj5Address).connect(deployMaster);
//     await prjToken.init(namePRJ5, symboPRJ5)
//     .then(function(instance){
//         console.log("\nTransaction hash: " + instance.hash)
//         console.log("prjToken 5 initd at " + prj5Address);
//     });

//     console.log("***** PRJ6 LOGIC TOKEN DEPLOYMENT *****");
    
//     let prjToken6Proxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
//         prjContractLogic,
//         proxyAdminAddress,
//         "0x"
//     );
//     await prjToken6Proxy.deployed().then(function(instance){
//         console.log("\nTransaction hash: " + instance.deployTransaction.hash)
//         console.log("prjToken 6 proxy address: " + instance.address);

//     });
//     let prjToken6ProxyAddress = prjToken6Proxy.address;
//     prj6Address = prjToken6ProxyAddress;

//     prjToken = await PRJToken.attach(prj6Address).connect(deployMaster);
//     await prjToken.init(namePRJ6, symboPRJ6)
//     .then(function(instance){
//         console.log("\nTransaction hash: " + instance.hash)
//         console.log("prjToken 6 initialized at " + prj6Address);
//     });

//       //====================================================

//     let addresses = {
//         proxyAdminAddress : proxyAdminAddress,
//         USDCTest: USDCTest,
//         LINK: LINK,
//         MATIC: MATIC,
//         WBTC: WBTC,
//         prjTokenLogicAddress: prjTokenLogicAddress,
//         prj1Address: prj1Address,
//         prj2Address: prj2Address,
//         prj3Address: prj3Address,
//         prj4Address: prj4Address,
//         prj5Address: prj5Address,
//         prj6Address: prj6Address
//     }

//     console.log(addresses);

//     return addresses;
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });