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
            constructorArguments,
        });
        verifyFile[keyInConfig] = true;
        fs.writeFileSync(path.join(verifyFilePath), JSON.stringify(verifyFile, null, 2));
    }
    console.log("Verified " + address);
}

module.exports = {

    deploymentPairFlash: async function () {
        let network = await hre.network;
        console.log("Network name: " + network.name);

        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];
        let deployMasterAddress = deployMaster.address;
        console.log("DeployMaster: " + deployMasterAddress);

        let ProxyAdmin = await hre.ethers.getContractFactory("PrimaryLendingPlatformProxyAdmin");
        let TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
        let PairFlash = await hre.ethers.getContractFactory("PairFlash");

        const {
            liquidationBot
        } = configGeneral;

        const {
            PRIMARY_PROXY_ADMIN,
            PrimaryLendingPlatformV2Proxy,
            PrimaryLendingPlatformLiquidationProxy,
            PairFlashLogic,
            PairFlashProxy
        } = config;

        let proxyAdminAddress = PRIMARY_PROXY_ADMIN;
        let pairFlashLogicAddress = PairFlashLogic;
        let pairFlashProxyAddress = PairFlashProxy;
        let uniswapV2FactoryAddress = liquidationBot.uniswapV2Factory;
        let plpAddress = PrimaryLendingPlatformV2Proxy;
        let plpLiquidationAddress = PrimaryLendingPlatformLiquidationProxy;

        //====================================================
        //deploy proxy admin

        console.log();
        console.log("***** PROXY ADMIN DEPLOYMENT *****");
        if (!proxyAdminAddress) {
            const proxyAdmin = await ProxyAdmin.connect(deployMaster).deploy();
            await proxyAdmin.deployed().then(function (instance) {
                console.log("\nTransaction hash: " + instance.deployTransaction.hash);
                proxyAdminAddress = instance.address;
                config.PRIMARY_PROXY_ADMIN = proxyAdminAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("ProxyAdmin deployed at: " + proxyAdminAddress);
        await verify(proxyAdminAddress, [], "PRIMARY_PROXY_ADMIN");
        //====================================================
        //deploy PairFlash

        console.log();
        console.log("***** LIQUIDATION BOT DEPLOYMENT *****");
        if (!pairFlashLogicAddress) {
            const pairFlashLogic = await PairFlash.connect(deployMaster).deploy();
            await pairFlashLogic.deployed().then(function (instance) {
                pairFlashLogicAddress = instance.address;
                config.PairFlashLogic = pairFlashLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        await verify(pairFlashLogicAddress, [], "PairFlashLogic");

        if (!pairFlashProxyAddress) {
            const pairFlashProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                pairFlashLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await pairFlashProxy.deployed().then(function (instance) {
                console.log("\nTransaction hash: " + instance.deployTransaction.hash);
                config.PairFlashProxy = pairFlashProxyAddress = instance.address;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PairFlash deployed at: " + pairFlashLogicAddress);
        await verify(pairFlashProxyAddress, [
            pairFlashLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PairFlashProxy");

        let pairFlash = PairFlash.attach(pairFlashProxyAddress).connect(deployMaster);

        console.log();
        console.log("*****SETTING LIQUIDATION BOT *****");

        // Initialize
        {
            let plp = await pairFlash.plp();
            if (plp == hre.ethers.constants.AddressZero) {
                await pairFlash.initialize(
                    uniswapV2FactoryAddress,
                    plpAddress,
                    plpLiquidationAddress
                ).then(function (instance) {
                    console.log("PairFlash initialized at " + pairFlashProxyAddress + " at tx hash " + instance.hash);
                    console.log("uniswapV2FactoryAddress: " + uniswapV2FactoryAddress);
                    console.log("plpAddress: " + plpAddress);
                    console.log("plpLiquidationAddress: " + plpLiquidationAddress);
                });
            }
        }
        console.log();
        // Update uniswap v2 address
        {
            const uniswapFactory = await pairFlash.uniswapFactory();
            if (uniswapFactory != hre.ethers.utils.getAddress(uniswapV2FactoryAddress)) {
                await pairFlash.setUniswapFactory(uniswapV2FactoryAddress).then(function (instance) {
                    console.log("PairFlash setUniswapFactory at " + pairFlashProxyAddress + " at tx hash " + instance.hash);
                    console.log("uniswapV2FactoryAddress: " + uniswapV2FactoryAddress);
                });
            }
        }
        console.log();
        // Update plp address
        {
            const plp = await pairFlash.plp();
            if (plp != hre.ethers.utils.getAddress(plpAddress)) {
                await pairFlash.setPlp(plpAddress).then(function (instance) {
                    console.log("PairFlash setPlp at " + pairFlashProxyAddress + " at tx hash " + instance.hash);
                    console.log("plpAddress: " + plpAddress);
                });
            }
        }
        console.log();
        // Update plp liquidation
        {
            const plpLiquidation = await pairFlash.plpLiquidation();
            if (plpLiquidation != hre.ethers.utils.getAddress(plpLiquidationAddress)) {
                await pairFlash.setPlpLiquidation(plpLiquidationAddress).then(function (instance) {
                    console.log("PairFlash setPlpLiquidation at " + pairFlashProxyAddress + " at tx hash " + instance.hash);
                    console.log("plpLiquidationAddress: " + plpLiquidationAddress);
                });
            }
        }
    }
};