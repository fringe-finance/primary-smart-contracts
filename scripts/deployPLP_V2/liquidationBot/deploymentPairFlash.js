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

const upgrade = async (proxyAdmin, implementationInstance, proxyInstance) => {
    const currentImplementation = await proxyAdmin.getProxyImplementation(proxyInstance.address);
    console.log("Current proxy: " + proxyInstance.address);
    console.log("Current implementation: " + currentImplementation);
    console.log("Expected implementation: " + implementationInstance.address);
    console.log();
    if (currentImplementation != implementationInstance.address) {
        const upgradeData = await proxyAdmin.upgradeData(proxyInstance.address);
        const appendTimestamp = Number(upgradeData.appendTimestamp);
        if (appendTimestamp == 0) {
            await proxyAdmin.appendUpgrade(proxyInstance.address, implementationInstance.address)
                .then(function (instance) {
                    console.log("[Appending upgrade] ");
                    console.log("Transaction hash: " + instance.hash);
                    console.log("ProxyAdmin appendUpgrade implementation " + implementationInstance.address + " to proxy " + proxyInstance.address);
                });
        } else {
            let timeStamp = (await hre.ethers.provider.getBlock("latest")).timestamp;
            let delayPeriod = Number(upgradeData.delayPeriod);
            if (timeStamp >= appendTimestamp + delayPeriod) {
                await proxyAdmin.upgrade(proxyInstance.address, implementationInstance.address)
                    .then(function (instance) {
                        if (upgradeData.newImplementation != implementationInstance.address) {
                            console.log("[Canceling upgrade]");
                            console.log("Upgrade implementation in queue " + upgradeData.newImplementation + " is different from expected implementation " + implementationInstance.address);
                            console.log("Transaction hash: " + instance.hash);
                            console.log("ProxyAdmin canceled upgrade implementation " + upgradeData.newImplementation + " to proxy " + proxyInstance.address);
                        } else {
                            console.log("[Upgrading] ");
                            console.log("ProxyAdmin upgraded implementation " + upgradeData.newImplementation + " to proxy " + proxyInstance.address);
                        }
                    });
            } else {
                console.log("[Delaying upgrade]");
                console.log("In delay period to upgrade implementation " + upgradeData.newImplementation + " to proxy " + proxyInstance.address);
                console.log("AppendTimestamp: ", appendTimestamp);
                console.log("Delay time: ", delayPeriod);
                console.log("Current: ", timeStamp);
                console.log("Can upgrade at: ", appendTimestamp + delayPeriod);
                console.log("Need to wait another: " + (appendTimestamp + delayPeriod - timeStamp) + " seconds");
                console.log();
            }
        }
    } else {
        console.log("Current implementation is synced with expected implementation " + implementationInstance.address);
    }
};

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
        //deploy PairFlash
        console.log();
        console.log("***** PAIR FLASH LIQUIDATION DEPLOYMENT *****");
        if (!pairFlashLogicAddress) {
            const pairFlashLogic = await PairFlash.connect(deployMaster).deploy();
            await pairFlashLogic.deployed().then(function (instance) {
                pairFlashLogicAddress = instance.address;
                config.PairFlashLogic = pairFlashLogicAddress;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }
        console.log("PairFlash masterCopy address: " + pairFlashLogicAddress);
        await verify(pairFlashLogicAddress, [], "PairFlashLogic");

        if (!pairFlashProxyAddress) {
            const pairFlashProxy = await TransparentUpgradeableProxy.connect(deployMaster).deploy(
                pairFlashLogicAddress,
                proxyAdminAddress,
                "0x"
            );
            await pairFlashProxy.deployed().then(function (instance) {
                config.PairFlashProxy = pairFlashProxyAddress = instance.address;
                fs.writeFileSync(path.join(configFile), JSON.stringify(config, null, 2));
            });
        }

        console.log("PairFlash proxy address: " + pairFlashLogicAddress);
        await verify(pairFlashProxyAddress, [
            pairFlashLogicAddress,
            proxyAdminAddress,
            "0x"
        ], "PairFlashProxy");

        //====================================================
        //setting params

        let proxyAdmin = ProxyAdmin.attach(proxyAdminAddress).connect(deployMaster);
        let pairFlash = PairFlash.attach(pairFlashProxyAddress).connect(deployMaster);

        let pairFlashImplementation = PairFlash.attach(pairFlashLogicAddress).connect(deployMaster);

        //==============================
        // ====================== upgrade PairFlash =============================
        if (pairFlashProxyAddress) {
            console.log();
            console.log("***** UPGRADING PAIR FLASH LIQUIDATION *****");
            await upgrade(proxyAdmin, pairFlashImplementation, pairFlash);
        }

        //==============================
        // ====================== setting PairFlash =============================
        console.log();
        console.log("***** SETTING PAIR FLASH LIQUIDATION *****");

        // Initialize
        {
            let plp = await pairFlashImplementation.plp();
            if (plp == hre.ethers.constants.AddressZero) {
                await pairFlashImplementation.initialize(
                    uniswapV2FactoryAddress,
                    plpAddress,
                    plpLiquidationAddress
                ).then(function (instance) {
                    console.log("Transaction hash: " + instance.hash);
                    console.log("PairFlash Implementation call initialize at " + pairFlashImplementation.address);
                });
            }
        }

        {
            let plp = await pairFlash.plp();
            if (plp == hre.ethers.constants.AddressZero) {
                await pairFlash.initialize(
                    uniswapV2FactoryAddress,
                    plpAddress,
                    plpLiquidationAddress
                ).then(function (instance) {
                    console.log("Transaction hash: " + instance.hash);
                    console.log("PairFlash call initialize at " + pairFlash.address);
                });
            }
        }

        // Update uniswap v2 address
        {
            const uniswapFactory = await pairFlash.uniswapFactory();
            if (uniswapFactory != hre.ethers.utils.getAddress(uniswapV2FactoryAddress)) {
                await pairFlash.setUniswapFactory(uniswapV2FactoryAddress).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PairFlash set UniswapFactory " + uniswapV2FactoryAddress + " at " + pairFlashProxyAddress);
                });
            }
        }

        // Update plp address
        {
            const plp = await pairFlash.plp();
            if (plp != hre.ethers.utils.getAddress(plpAddress)) {
                await pairFlash.setPlp(plpAddress).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PairFlash set Plp " + plpAddress + " at " + pairFlashProxyAddress);
                });
            }
        }

        // Update plp liquidation
        {
            const plpLiquidation = await pairFlash.plpLiquidation();
            if (plpLiquidation != hre.ethers.utils.getAddress(plpLiquidationAddress)) {
                await pairFlash.setPlpLiquidation(plpLiquidationAddress).then(function (instance) {
                    console.log("\nTransaction hash: " + instance.hash);
                    console.log("PairFlash set PlpLiquidation " + plpLiquidationAddress + " at " + pairFlashProxyAddress);
                });
            }
        }
    }
};