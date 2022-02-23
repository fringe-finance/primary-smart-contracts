
const hre = require("hardhat");
const BN = hre.ethers.BigNumber;

const toBN = (num) => BN.from(num);

let proxyAdmingAddress = '0x6D618b0d22EE3ff6e7DB5040A61b69f46Fb6A4e6';
let busdcProxyAddress = '0xA1Eb44f5BF7356577C20aF744Dcc2f16632EcdB7';

async function main() {
   
    let signers = await hre.ethers.getSigners();
    let deployMaster = signers[0];
    console.log("DeployMaster: " + deployMaster.address);

    let ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
    let BUSDC = await hre.ethers.getContractFactory("BLendingToken");
    
    // let busdc = await BUSDC.connect(deployMaster).deploy();
    // await busdc.deployed();
    // let busdcMasterCopyAddress = busdc.address;
    // console.log("BUSDC masterCopy address: " + busdcMasterCopyAddress);
  
    // let proxyAdmin = await ProxyAdmin.attach(proxyAdmingAddress).connect(deployMaster);
    // await proxyAdmin.upgrade(busdcProxyAddress, busdcMasterCopyAddress)
    // .then(function(instance){
    //     console.log("ProxyAdmin upgraded " + busdcProxyAddress + " to " + busdcMasterCopyAddress);
    //     return instance;
    // });


}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
