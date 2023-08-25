require("dotenv").config();
const chain = process.env.CHAIN ? "_" + process.env.CHAIN : process.env.CHAIN;
const isTesting = Object.keys(process.env).includes('TESTING');


const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const BN = hre.ethers.BigNumber;
const fs = require("fs");
const path = require("path");
const configGeneralFile = path.join(__dirname, `../config/${network}${chain}/config_general.json`);
const configGeneral = require(configGeneralFile);


module.exports = {
    deployMockToken: async function () {

        if (isTesting) {
            console.log = function () { };
        }
        let network = hre.network;
        console.log("Network name: " + network.name);

        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];
        let deployMasterAddress = deployMaster.address;
        console.log("DeployMaster: " + deployMasterAddress);


        let tokensUseChainlinkAddress = [];
        let tokensAddress = [];
        let lendingTokensAddress = [];
        const WETHAddress = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
        
        let MockToken = await hre.ethers.getContractFactory("MockToken");
        let MockWstETH = await hre.ethers.getContractFactory("MockWstETH");
        console.log();
        console.log("***** MOCK TOKEN DEPLOYMENT *****");
        console.log();
        projectToken1 = await MockToken.connect(deployMaster).deploy("ProjectToken1", "PJ1", 18);
        projectToken2 = await MockToken.connect(deployMaster).deploy("ProjectToken2", "PJ2", 18);
        projectToken3 = await MockToken.connect(deployMaster).deploy("ProjectToken3", "PJ3", 18);
        projectToken4 = await MockToken.connect(deployMaster).deploy("ProjectToken4", "PJ4", 18);
        usdcTest = await MockToken.connect(deployMaster).deploy("USDCTest", "USDC", 6);
        usb = await MockToken.connect(deployMaster).deploy("USB Stablecoin", "USB", 18);
        wstETH = await MockWstETH.connect(deployMaster).deploy("Wrapped liquid staked Ether 2.0", "wstETH", 18);


        await projectToken1.deployed();
        await projectToken2.deployed();
        await projectToken3.deployed();
        await projectToken4.deployed();
        await usdcTest.deployed();
        await usb.deployed();
        await wstETH.deployed();

        tokensUseChainlinkAddress.push(projectToken1.address);
        tokensAddress.push(projectToken1.address);
        console.log(`ProjectToken1 was deployed to ${projectToken1.address}`);

        tokensUseChainlinkAddress.push(projectToken2.address);
        tokensAddress.push(projectToken2.address);
        console.log(`ProjectToken2 was deployed to ${projectToken2.address}`);

        tokensUseChainlinkAddress.push(projectToken3.address);
        tokensAddress.push(projectToken3.address);
        console.log(`ProjectToken3 was deployed to ${projectToken3.address}`);

        tokensUseChainlinkAddress.push(projectToken4.address);
        tokensAddress.push(projectToken4.address);
        console.log(`ProjectToken4 was deployed to ${projectToken4.address}`);

        tokensUseChainlinkAddress.push(usdcTest.address);
        lendingTokensAddress.push(usdcTest.address);
        console.log(`USDCTest was deployed to ${usdcTest.address}`);

        tokensUseChainlinkAddress.push(usb.address);
        lendingTokensAddress.push(usb.address);
        console.log(`USB Stablecoin was deployed to ${usb.address}`);

        console.log(`Wrapped liquid staked Ether 2.0 was deployed to ${wstETH.address}`);
        
        tokensUseChainlinkAddress.push(WETHAddress);
        lendingTokensAddress.push(WETHAddress);
        
        {
            configGeneral.priceOracle.Chainlink.tokensUseChainlink = tokensUseChainlinkAddress;
            configGeneral.priceOracle.wstETH = wstETH.address;
            configGeneral.priceOracle.WETH = WETHAddress;
            configGeneral.priceOracle.usdc = usdcTest.address;
            configGeneral.plpModeratorParams.tokens = tokensAddress;
            configGeneral.plpModeratorParams.usdc = usdcTest.address;
            configGeneral.blendingToken.lendingTokens = lendingTokensAddress;
            fs.writeFileSync(path.join(configGeneralFile), JSON.stringify(configGeneral, null, 2));
        }
        let mockTokenAddress = {
            projectToken1: projectToken1.address,
            projectToken2: projectToken2.address,
            projectToken3: projectToken3.address,
            projectToken4: projectToken4.address,
            usdcTest: usdcTest.address,
            usb: usb.address,
            wstETH: wstETH.address,
            WETH: WETHAddress,
        }
        return mockTokenAddress;

    }
}