
const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let proxyAdmingAddress = '0xdb1322bfC303A3431f31eDf01360CF556eFAAB0E';
let primaryIndexTokenProxyAddress = '0x8D492475D2136Ae64b172b23F519840d5775C8Cd';

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
