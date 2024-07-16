require("dotenv").config();

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configGeneralFile = path.join(__dirname, `../config/hardhat_zksync_on_polygon_mainnet/config_general.json`);
const configGeneral = require(configGeneralFile);

module.exports = {
    deploymentMockToken: async function () {

        let signers = await hre.ethers.getSigners();
        let deployMaster = signers[0];

        const MockToken = await hre.ethers.getContractFactory("MockToken");
        let MockPRJ = await hre.ethers.getContractFactory("PRJ");
        let MockWstETH = await hre.ethers.getContractFactory("MockWstETH");

        let tokensUsePyth = [];
        let tokensAddress = [];
        let lendingTokensAddress = [];
        const WETHAddress = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270"; // Address WMatic token on Polygon mainnet

        const projectToken1 = await MockPRJ.connect(deployMaster).deploy();
        await projectToken1.deployed();
        await projectToken1.init("ProjectToken1", "PJ1");
        const projectToken2 = await MockPRJ.connect(deployMaster).deploy();
        await projectToken2.deployed();
        await projectToken2.init("projectToken2", "PJ2");
        const projectToken3 = await MockPRJ.connect(deployMaster).deploy();
        await projectToken3.deployed();
        await projectToken3.init("projectToken3", "PJ3");

        const usdcTest = await MockToken.connect(deployMaster).deploy("USDCTest", "USDC", 6);
        await usdcTest.deployed();
        const usb = await MockToken.connect(deployMaster).deploy("USB Stablecoin", "USB", 18);
        await usb.deployed();
        const wstETH = await MockWstETH.connect(deployMaster).deploy("Wrapped liquid staked Ether 2.0", "wstETH", 18);
        await wstETH.deployed();

        tokensUsePyth.push(projectToken1.address);
        tokensUsePyth.push(projectToken2.address);
        tokensUsePyth.push(projectToken3.address);
        tokensUsePyth.push(wstETH.address);
        tokensUsePyth.push(usdcTest.address);
        tokensUsePyth.push(usb.address);
        tokensUsePyth.push(WETHAddress);

        lendingTokensAddress.push(usdcTest.address);
        lendingTokensAddress.push(usb.address);
        lendingTokensAddress.push(WETHAddress);

        tokensAddress.push(projectToken1.address);
        tokensAddress.push(projectToken2.address);
        tokensAddress.push(projectToken3.address);
        tokensAddress.push(WETHAddress);


        {
            configGeneral.priceOracle.Pyth.tokensUsePyth = tokensUsePyth;
            configGeneral.priceOracle.wstETH = wstETH.address;
            configGeneral.priceOracle.WETH = WETHAddress;
            configGeneral.priceOracle.usdc = usdcTest.address;
            configGeneral.plpModeratorParams.projectTokens = tokensAddress;
            configGeneral.blendingToken.lendingTokens = lendingTokensAddress;
            fs.writeFileSync(path.join(configGeneralFile), JSON.stringify(configGeneral, null, 2));
        }
        let mockTokenAddress = {
            projectToken1: projectToken1.address,
            projectToken2: projectToken2.address,
            projectToken3: projectToken3.address,
            usdcTest: usdcTest.address,
            usb: usb.address,
            wstETH: wstETH.address,
            WETH: WETHAddress,
        }
        return mockTokenAddress;

    }
}
