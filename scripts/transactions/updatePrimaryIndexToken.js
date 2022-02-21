
const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let proxyAdmingAddress = '0xa9D799AF1c4B0aF6a927bC864ffbf35Aef42177a';
let primaryIndexTokenProxyAddress = '0xD83125995B2D8d04556894C528e10e99473751cc';

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
