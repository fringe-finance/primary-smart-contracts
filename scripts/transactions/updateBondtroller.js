
const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let proxyAdmingAddress = '0xdb1322bfC303A3431f31eDf01360CF556eFAAB0E';
let bondtrollerProxyAddress = '0x34C227E897e8C039ecD8e38a2921786C73cFaD64';

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
    let Bondtroller = await hre.ethers.getContractFactory("Bondtroller");
    
    let bondtroller = await Bondtroller.connect(deployMaster).deploy();
    await bondtroller.deployed();
    let bondtrollerMasterCopyAddress = bondtroller.address;
    console.log("Bondtroller masterCopy address: " + bondtrollerMasterCopyAddress);
  
    let proxyAdmin = await ProxyAdmin.attach(proxyAdmingAddress).connect(deployMaster);
    await proxyAdmin.upgrade(bondtrollerProxyAddress, bondtrollerMasterCopyAddress)
    .then(function(instance){
        console.log("ProxyAdmin upgraded " + bondtrollerProxyAddress + " to " + bondtrollerMasterCopyAddress);
        return instance;
    });


}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
