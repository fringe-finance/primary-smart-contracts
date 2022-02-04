
const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let proxyAdmingAddress = '0x6D618b0d22EE3ff6e7DB5040A61b69f46Fb6A4e6';
let primaryIndexTokenProxyAddress = '0xD012072051ebD1A086F17C5fAF5893832312FB81';

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
    let PrimaryIndexToken = await hre.ethers.getContractFactory("PrimaryIndexToken");
    
    let primaryIndexToken = await PrimaryIndexToken.connect(deployMaster).deploy();
    await primaryIndexToken.deployed();
    let primaryIndexTokenMasterCopyAddress = primaryIndexToken.address;
    console.log("PrimaryIndexToken masterCopy address: " + primaryIndexTokenMasterCopyAddress);
  
    let proxyAdmin = await ProxyAdmin.attach(proxyAdmingAddress).connect(deployMaster);
    await proxyAdmin.upgrade(primaryIndexTokenProxyAddress, primaryIndexTokenMasterCopyAddress)
    .then(function(instance){
        console.log("ProxyAdmin upgraded " + primaryIndexTokenProxyAddress + " to " + primaryIndexTokenMasterCopyAddress);
        return instance;
    });


}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
