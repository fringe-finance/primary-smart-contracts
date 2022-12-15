require('dotenv').config();
const { Wallet, Provider } = require("zksync-web3");
const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");

module.exports = async function () {
  try {
    const provider = new Provider('https://zksync2-testnet.zksync.dev');
    const wallet = new Wallet(process.env.OPERATOR_PRIVATE_KEY).connect(provider);
    const deployer = new Deployer(hre, wallet);
    const artifact = await deployer.loadArtifact("MockToken");
    const projectToken1 = await deployer.deploy(artifact, ["ProjectToken1", "PJ1", 18]);
    console.log(`ProjectToken1 was deployed to ${projectToken1.address}`);

    const projectToken12 = await deployer.deploy(artifact, ["ProjectToken2", "PJ2", 18]);
    console.log(`ProjectToken2 was deployed to ${projectToken12.address}`);

    const projectToken3 = await deployer.deploy(artifact, ["ProjectToken3", "PJ3", 18]);
    console.log(`ProjectToken3 was deployed to ${projectToken3.address}`);

    const projectToken4 = await deployer.deploy(artifact, ["ProjectToken4", "PJ4", 18]);
    console.log(`ProjectToken4 was deployed to ${projectToken4.address}`);

    const usdcTest = await deployer.deploy(artifact, ["USDCTest", "USDC", 6]);
    console.log(`USDCTest was deployed to ${usdcTest.address}`);

    const usb = await deployer.deploy(artifact, ["USB Stablecoin", "USB", 18]);
    console.log(`USB Stablecoin was deployed to ${usb.address}`);
  } catch (err) {
    console.log(err);
  }
};
