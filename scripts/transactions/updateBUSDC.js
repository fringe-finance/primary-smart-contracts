
const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let proxyAdmingAddress = '0xdb1322bfC303A3431f31eDf01360CF556eFAAB0E';
let busdcProxyAddress = '0xe137572e83f93aE50F3C1F4762135E2D9A8f384A';

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
    let BUSDC = await hre.ethers.getContractFactory("BUSDC");
    
    let bondtroller = await BUSDC.connect(deployMaster).deploy();
    await bondtroller.deployed();
    let bondtrollerMasterCopyAddress = bondtroller.address;
    console.log("BUSDC masterCopy address: " + bondtrollerMasterCopyAddress);
  
    let proxyAdmin = await ProxyAdmin.attach(proxyAdmingAddress).connect(deployMaster);
    await proxyAdmin.upgrade(busdcProxyAddress, bondtrollerMasterCopyAddress)
    .then(function(instance){
        console.log("ProxyAdmin upgraded " + busdcProxyAddress + " to " + bondtrollerMasterCopyAddress);
        return instance;
    });


}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
