require("dotenv").config();
const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const { Wallet, Provider } = require("zksync-web3");
const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const configFile = path.join(__dirname, `./config_${network}/config_erc4626.json`);
let config = require(configFile);

let {
    tokenVault,
    info
} = config;

let tokenVaultAddresses = tokenVault;

const verify = async (address, constructorArguments) => {
    try {
        await hre.run(`verify:verify`, {
            address,
            constructorArguments,
        });
    } catch (error) {
        console.log("Verify error:", error);
    }
};

const main = async function () {

    let provider;
    switch (network) {
        case "goerli":
            provider = new Provider("https://zksync2-testnet.zksync.dev");
            break;
        case "mainnet":
            provider = new Provider("https://mainnet.era.zksync.io");
            break;
        default:
            provider = new Provider("http://127.0.0.1:8011");
            break;
    }

    const wallet = new Wallet(process.env.PRIVATE_KEY).connect(provider);
    const deployer = new Deployer(hre, wallet);
    const TokenVault = await deployer.loadArtifact("TokenVault");
    const tokenVaultInterface = new ethers.utils.Interface(TokenVault.abi);

    const assets = info?.assets;
    const names = info?.names;
    const symbols = info?.symbols;
    const interestPercents = info?.interestPercents;

    for (var i = 0; i < assets.length; i++) {
        if (tokenVaultAddresses[i] == "" || tokenVaultAddresses[i] == null || tokenVaultAddresses[i] == undefined) {
            console.log("\nDeploying ERC4626 TokenVault:");
            console.log("   Asset:", assets[i]);
            console.log("   Name:", names[i]);
            console.log("   Symbol:", symbols[i]);
            console.log("   Interest percent:", interestPercents[i]);
            const proxy = await deployer.deploy(
                TokenVault,
                [assets[i], names[i], symbols[i], interestPercents[i]]
            );
            const tx = await proxy.deployed();
            console.log("Tx hash:", tx.deployTransaction.hash);
            console.log("TokenVault deployed:", proxy.address);
            await verify(proxy.address, [assets[i], names[i], symbols[i], interestPercents[i]]);
            tokenVaultAddresses[i] = proxy.address;
        } else {
            const implementation = new ethers.Contract(tokenVaultAddresses[i], tokenVaultInterface, wallet);
            const asset = await implementation.asset();
            if (asset == assets[i]) {
                const interestPercent = await implementation.interestPercent();
                if (interestPercent != interestPercents[i]) {
                    const tx = await implementation.setInterestPercent(interestPercents[i]);
                    await tx.wait(2);
                    console.log("Tx hash:", tx.hash);
                    console.log("Updating interest percent for TokenVault ", tokenVaultAddresses[i] + " with interest percent:", interestPercents[i]);
                }
            } else {
                console.log("Asset mismatch for TokenVault at address:", tokenVaultAddresses[i]);
                console.log("Config asset:", assets[i]);
                console.log("Actual asset:", asset);
                break;
            }
        }
    }
    config.tokenVault = tokenVaultAddresses;
    fs.writeFileSync(
        path.join(configFile),
        JSON.stringify(config, null, 2)
    );
}

module.exports = async function () {
    await main();
}