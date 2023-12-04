require("dotenv").config();
const hre = require("hardhat");
const network = hre.hardhatArguments.network;
let chain = process.env.CHAIN && network == 'hardhat' ? "_" + process.env.CHAIN : "";

const fs = require("fs");
const path = require("path");
const configGeneralFile = path.join(__dirname, `../../config/${network}${chain}/config_general.json`);
const configGeneral = require(configGeneralFile);
const configFile = path.join(__dirname, `../../config/${network}${chain}/config.json`);
let config = require(configFile);
const verifyFilePath = path.join(__dirname, `../../config/${network}${chain}/verify.json`);
const verifyFile = require(verifyFilePath);

const verify = async (address, constructorArguments, keyInConfig) => {
    console.log("Verifying " + address);
    if (!verifyFile[keyInConfig]) {
        await hre.run(`verify:verify`, {
            address,
            constructorArguments ,
        });
        verifyFile[keyInConfig] = true;
        fs.writeFileSync(path.join(verifyFilePath), JSON.stringify(verifyFile, null, 2));
    }
    console.log("Verified " + address);
}

module.exports = {
   
    deploymentPairFlash : async function () {
        let network = await hre.network;
        console.log("Network name: "+network.name);
       
        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];
        let deployMasterAddress = deployMaster.address;
        console.log("DeployMaster: " + deployMasterAddress);

        // Contracts ABI
        let PairFlashABI = await hre.ethers.getContractFactory("PairFlash");

        const {
            liquidationBot
        } = configGeneral;

        const {
            PrimaryLendingPlatformV2Proxy,
            PrimaryLendingPlatformLiquidationProxy,
            PairFlash
        } = config;

        let pairFlashAddress = PairFlash;
        let uniswapV2FactoryAddress = liquidationBot.uniswapV2Factory;
        let plpAddress = PrimaryLendingPlatformV2Proxy;
        let plpLiquidationAddress = PrimaryLendingPlatformLiquidationProxy;

    //====================================================
    //deploy PairFlash

        console.log();
        console.log("***** LIQUIDATION BOT DEPLOYMENT *****");
        if(!pairFlashAddress){
            let pairFlash = await PairFlashABI.connect(deployMaster).deploy(
                uniswapV2FactoryAddress,
                plpAddress,
                plpLiquidationAddress
            );
            await pairFlash.deployed().then(function(instance){
                pairFlashAddress = instance.address;
                config.PairFlash = pairFlashAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        
        console.log("PairFlash deployed at: " + pairFlashAddress);
        await verify(
            pairFlashAddress, [                
            uniswapV2FactoryAddress,
            plpAddress,
            plpLiquidationAddress
        ], "PairFlash");
    }
};