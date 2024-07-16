require("dotenv").config();

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const configGeneralFile = path.join(__dirname, `./config_fork_mainnet/config_general.json`);
const configGeneral = require(configGeneralFile);
const { Wallet, Provider } = require("zksync-web3");
const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");

module.exports = {
    deploymentMockToken: async function () {

        // const provider = new Provider("https://zksync2-testnet.zksync.dev");
        const provider = new Provider('http://127.0.0.1:8011');
        const wallet = new Wallet(process.env.PRIVATE_KEY).connect(provider);
        const deployer = new Deployer(hre, wallet);

        const MockToken = await deployer.loadArtifact("MockToken");
        let MockPRJ = await deployer.loadArtifact("PRJ");
        let MockWstETH = await deployer.loadArtifact("MockWstETH");

        let tokensUsePyth = [];
        let tokensAddress = [];
        let lendingTokensAddress = [];
        const WETHAddress = "0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91";

        const projectToken1 = await deployer.deploy(MockPRJ, []);
        await projectToken1.init("ProjectToken1", "PJ1");
        const projectToken2 = await deployer.deploy(MockPRJ, []);
        await projectToken2.init("projectToken2", "PJ2");
        const projectToken3 = await deployer.deploy(MockPRJ, []);
        await projectToken3.init("projectToken3", "PJ3");

        const usdcTest = await deployer.deploy(MockToken, ["USDCTest", "USDC", 6]);
        const usb = await deployer.deploy(MockToken, ["USB Stablecoin", "USB", 18]);
        const wstETH = await deployer.deploy(MockWstETH, ["Wrapped liquid staked Ether 2.0", "wstETH", 18]);

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
            configGeneral.plpModeratorParams.tokens = tokensAddress;
            configGeneral.plpModeratorParams.usdc = usdcTest.address;
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
