const hre = require("hardhat");
const network = hre.hardhatArguments.network;
const fs = require("fs");
const path = require("path");
const configFile = path.join(__dirname, `../../config/${network}/config_erc4626.json`);
const config = require(configFile);

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

async function main() {
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];

    const TokenVault = await hre.ethers.getContractFactory("TokenVault")
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
            const proxy = await TokenVault.connect(deployMaster).deploy(
                assets[i],
                names[i],
                symbols[i],
                interestPercents[i]
            );
            const tx = await proxy.deployed();
            console.log("Tx hash:", tx.deployTransaction.hash);
            console.log("TokenVault deployed:", proxy.address);
            tokenVaultAddresses[i] = proxy.address;
            verify(proxy.address, [assets[i], names[i], symbols[i], interestPercents[i]]);
        } else {
            const implementation = TokenVault.attach(tokenVaultAddresses[i]).connect(deployMaster);
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

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});